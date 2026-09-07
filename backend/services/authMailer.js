import nodemailer from 'nodemailer';
import { FRONTEND_URL } from '../config/publicUrls.js';

let cachedTransporter;

const getTransporter = () => {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return cachedTransporter;
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
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(`[EMAIL] SMTP not configured. Email would be sent to: ${to}`);
    console.warn(`[EMAIL] Subject: ${subject}`);
    console.warn(`[EMAIL] Verification URL would be in the email. Check console for dev link.`);
    return { delivered: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });

    console.log(`[EMAIL] Successfully sent to ${to}. Message ID: ${info.messageId}`);
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${to}:`, error.message);
    return { delivered: false, reason: 'SEND_FAILED', error: error.message };
  }
};
