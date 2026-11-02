import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import { FRONTEND_URL } from '../config/publicUrls.js';

let cachedTransporter;
let cachedConfigKey;

const readSmtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT?.trim() || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM?.trim() || process.env.SMTP_FROM?.trim() || user;
  const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureSetting ? secureSetting === 'true' : port === 465;
  const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(name => !process.env[name]?.trim());
  const invalid = !Number.isInteger(port) || port < 1 || port > 65535
    || (secureSetting && !['true', 'false'].includes(secureSetting))
    || /[\r\n]/.test(host || '') || /[\r\n]/.test(from || '');
  return { host, port, user, pass, from, secure, missing,
    reason: missing.length ? 'SMTP_NOT_CONFIGURED' : invalid ? 'SMTP_CONFIG_INVALID' : null };
};

export const getAuthEmailConfiguration = () => {
  const config = readSmtpConfig();
  return { configured: !config.reason, reason: config.reason, missing: config.missing,
    port: Number.isInteger(config.port) ? config.port : null, secure: config.secure,
    senderConfigured: Boolean(config.from) };
};

const getTransporter = config => {
  // Do not permanently cache missing settings. Rebuild if credentials/config
  // change, without logging or exposing their values in diagnostic responses.
  const configKey = crypto.createHash('sha256')
    .update(JSON.stringify([config.host, config.port, config.user, config.pass, config.secure])).digest('hex');
  if (cachedTransporter && cachedConfigKey === configKey) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    dnsTimeout: 5000,
    logger: false,
    debug: false
  });
  cachedConfigKey = configKey;
  return cachedTransporter;
};

const safeMailFailure = error => {
  const knownCodes = ['EAUTH', 'ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET',
    'EDNS', 'ENOTFOUND', 'EAI_AGAIN', 'ESOCKET', 'ETLS', 'EENVELOPE', 'EMESSAGE'];
  const code = knownCodes.includes(error?.code) ? error.code : 'UNKNOWN';
  const responseCode = Number(error?.responseCode);
  const hint = code === 'EAUTH' || responseCode === 535
    ? 'Check SMTP authentication. Gmail requires an App Password, not the account password.'
    : 'Check SMTP host/port, TLS, provider limits and outbound network access.';
  // Provider messages/responses may contain addresses, AUTH data or message
  // contents. Only fixed codes and a fixed hint may leave this boundary.
  return { reason: 'SEND_FAILED', code,
    ...(Number.isInteger(responseCode) && responseCode >= 400 && responseCode <= 599 ? { responseCode } : {}), hint };
};

const logMailFailure = failure => {
  console.error('[EMAIL] Delivery unavailable:', failure);
};

export const verifyAuthEmailTransport = async () => {
  const smtpConfig = getAuthEmailConfiguration();
  if (!smtpConfig.configured) return { smtpConfig, smtpConnectionStatus: 'not_configured', smtpError: smtpConfig.reason };
  try {
    await getTransporter(readSmtpConfig()).verify();
    return { smtpConfig, smtpConnectionStatus: 'connected', smtpError: null };
  } catch (error) {
    const failure = safeMailFailure(error);
    logMailFailure(failure);
    return { smtpConfig, smtpConnectionStatus: 'failed', smtpError: failure.code, ...failure };
  }
};

export const buildFrontendUrl = (pathname, params = {}) => {
  const baseUrl = FRONTEND_URL;
  const url = new URL(pathname.startsWith('/') ? pathname : `/${pathname}`, `${baseUrl}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

export const sendAuthEmail = async ({ to, subject, text, html }) => {
  const config = readSmtpConfig();
  if (config.reason) {
    const failure = { reason: config.reason, missing: config.missing };
    logMailFailure(failure);
    return { delivered: false, ...failure };
  }

  try {
    const info = await getTransporter(config).sendMail({
      from: config.from,
      to,
      subject,
      text,
      html
    });

    const addressOf = value => String(typeof value === 'string' ? value : value?.address || '').trim().toLowerCase();
    const recipient = addressOf(to);
    if (!Array.isArray(info.accepted) || !info.accepted.some(value => addressOf(value) === recipient)
        || info.rejected?.some(value => addressOf(value) === recipient)) {
      const failure = { reason: 'RECIPIENT_NOT_ACCEPTED', code: 'EENVELOPE' };
      logMailFailure(failure);
      return { delivered: false, ...failure };
    }
    // Acceptance by SMTP is not a guarantee of arrival in the user's inbox.
    console.log('[EMAIL] Message accepted by SMTP.');
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    const failure = safeMailFailure(error);
    logMailFailure(failure);
    return { delivered: false, ...failure };
  }
};
