import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { getAuthEmailConfiguration, sendAuthEmail, verifyAuthEmailTransport } from '../services/authMailer.js';

// Every transport is mocked. These tests never connect to SMTP or send email.
let fixtureId = 0;
const envNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'MAIL_FROM', 'SMTP_FROM'];
const setup = t => {
  const original = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  t.after(() => {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  for (const name of envNames) delete process.env[name];
  Object.assign(process.env, { SMTP_HOST: 'smtp.example.test', SMTP_USER: `mailer${++fixtureId}@example.test`, SMTP_PASS: 'fixture-only-password' });
  const logs = [], options = [], messages = [];
  for (const method of ['log', 'warn', 'error']) t.mock.method(console, method, (...args) => logs.push(args));
  const transport = { sendMail: async message => {
    messages.push(message);
    return { accepted: [message.to], rejected: [], messageId: 'fixture-message-id' };
  }, verify: async () => true };
  t.mock.method(nodemailer, 'createTransport', config => { options.push(config); return transport; });
  return { logs, options, messages, transport };
};
const message = { to: 'guest@example.test', subject: 'Fixture verification', text: 'private-fixture-code-and-token', html: '<p>private-fixture-code-and-token</p>' };

test('missing SMTP fails without logging message contents and does not poison later configuration', async t => {
  const fixture = setup(t);
  delete process.env.SMTP_HOST;
  assert.equal((await sendAuthEmail(message)).reason, 'SMTP_NOT_CONFIGURED');
  assert.deepEqual(getAuthEmailConfiguration().missing, ['SMTP_HOST']);
  assert.equal((await verifyAuthEmailTransport()).smtpConnectionStatus, 'not_configured');
  assert.equal(fixture.options.length, 0);
  assert.doesNotMatch(JSON.stringify(fixture.logs), /private-fixture|guest@example/);
  process.env.SMTP_HOST = 'smtp.example.test';
  assert.equal((await sendAuthEmail(message)).delivered, true);
  assert.equal(fixture.options.length, 1);
});

test('SMTP uses bounded timeouts, STARTTLS, trimmed public settings and the unmodified password', async t => {
  const fixture = setup(t);
  Object.assign(process.env, { SMTP_HOST: ' smtp.example.test ', SMTP_USER: ' sender@example.test ', SMTP_PORT: ' 587 ',
    SMTP_PASS: ' fixture-password-with-spaces ', SMTP_FROM: 'NaujanGO <noreply@example.test>' });
  assert.equal((await sendAuthEmail(message)).delivered, true);
  const config = fixture.options[0];
  assert.equal(config.host, 'smtp.example.test'); assert.equal(config.port, 587);
  assert.equal(config.auth.user, 'sender@example.test'); assert.equal(config.auth.pass, ' fixture-password-with-spaces ');
  assert.equal(config.secure, false); assert.equal(config.requireTLS, true);
  for (const key of ['connectionTimeout', 'greetingTimeout', 'socketTimeout', 'dnsTimeout']) assert.ok(config[key] > 0 && config[key] <= 15000);
  assert.equal(config.logger, false); assert.equal(config.debug, false);
  assert.equal(fixture.messages[0].from, process.env.SMTP_FROM);
  assert.doesNotMatch(JSON.stringify(getAuthEmailConfiguration()), /fixture-password|sender@|smtp.example/);
});

test('port 465 enables TLS; MAIL_FROM overrides SMTP_FROM; SMTP_USER is the final sender fallback', async t => {
  const fixture = setup(t);
  Object.assign(process.env, { SMTP_PORT: '465', MAIL_FROM: 'Primary <primary@example.test>', SMTP_FROM: 'alias@example.test' });
  await sendAuthEmail(message);
  assert.equal(fixture.options[0].secure, true); assert.equal(fixture.options[0].requireTLS, false);
  assert.equal(fixture.messages[0].from, process.env.MAIL_FROM);
  delete process.env.MAIL_FROM; delete process.env.SMTP_FROM;
  await sendAuthEmail(message);
  assert.equal(fixture.messages[1].from, process.env.SMTP_USER);
});

test('transports are reused only while the SMTP configuration matches', async t => {
  const fixture = setup(t);
  await sendAuthEmail(message); await sendAuthEmail(message);
  assert.equal(fixture.options.length, 1);
  process.env.SMTP_PASS = 'replacement-fixture-password';
  await sendAuthEmail(message);
  assert.equal(fixture.options.length, 2);
  assert.equal(fixture.options[1].auth.pass, 'replacement-fixture-password');
});

test('invalid port, TLS settings and newline-bearing senders fail before contacting SMTP', async t => {
  const fixture = setup(t);
  for (const port of ['bad-port', '-1', '0', '65536', '587.5']) {
    process.env.SMTP_PORT = port;
    assert.equal((await sendAuthEmail(message)).reason, 'SMTP_CONFIG_INVALID');
  }
  process.env.SMTP_PORT = '587'; process.env.SMTP_SECURE = 'yes';
  assert.equal((await sendAuthEmail(message)).reason, 'SMTP_CONFIG_INVALID');
  process.env.SMTP_SECURE = 'false'; process.env.MAIL_FROM = 'sender@example.test\r\nBcc: someone@example.test';
  assert.equal((await sendAuthEmail(message)).reason, 'SMTP_CONFIG_INVALID');
  assert.equal(fixture.options.length, 0);
});

test('resolved sendMail promises require acceptance of the actual recipient', async t => {
  const fixture = setup(t);
  for (const info of [{ accepted: [], rejected: [message.to] }, { accepted: ['other@example.test'] }, {},
    { accepted: [message.to], rejected: [message.to] }]) {
    fixture.transport.sendMail = async () => info;
    const result = await sendAuthEmail(message);
    assert.equal(result.delivered, false); assert.equal(result.reason, 'RECIPIENT_NOT_ACCEPTED');
  }
  fixture.transport.sendMail = async () => ({ accepted: [{ address: 'GUEST@example.test' }], rejected: [], messageId: 'accepted' });
  assert.equal((await sendAuthEmail(message)).delivered, true);
});

test('authentication and network failures expose fixed codes, never provider messages or AUTH data', async t => {
  const fixture = setup(t);
  for (const code of ['EAUTH', 'ETIMEDOUT', 'ESOCKET', 'EDNS', 'untrusted-private-fixture']) {
    fixture.transport.sendMail = async () => { throw Object.assign(new Error('private-fixture-code-and-token SMTP_PASS fixture-only-password'), {
      code, responseCode: code === 'EAUTH' ? 535 : undefined, response: 'AUTH private-fixture-code-and-token'
    }); };
    const result = await sendAuthEmail(message);
    assert.equal(result.delivered, false);
    assert.equal(result.code, code.startsWith('untrusted') ? 'UNKNOWN' : code);
    if (code === 'EAUTH') { assert.equal(result.responseCode, 535); assert.match(result.hint, /App Password/); }
    assert.doesNotMatch(JSON.stringify(result), /private-fixture|fixture-only-password|AUTH private/);
  }
  assert.doesNotMatch(JSON.stringify(fixture.logs), /private-fixture|fixture-only-password|AUTH private/);
});

test('transport construction errors are handled as safe delivery failures', async t => {
  setup(t);
  t.mock.method(nodemailer, 'createTransport', () => { throw new Error('private-fixture-code-and-token'); });
  assert.equal((await sendAuthEmail(message)).code, 'UNKNOWN');
});

test('the SMTP diagnostic reuses sending configuration and never sends a message', async t => {
  const fixture = setup(t);
  let verified = 0;
  fixture.transport.verify = async () => { verified++; return true; };
  assert.equal((await verifyAuthEmailTransport()).smtpConnectionStatus, 'connected');
  assert.equal(verified, 1); assert.equal(fixture.messages.length, 0);
  fixture.transport.verify = async () => { throw Object.assign(new Error('private-fixture-token'), { code: 'EAUTH', responseCode: 535 }); };
  const failure = await verifyAuthEmailTransport();
  assert.equal(failure.smtpConnectionStatus, 'failed'); assert.equal(failure.smtpError, 'EAUTH');
  assert.doesNotMatch(JSON.stringify(failure), /private-fixture/);
  assert.equal(fixture.messages.length, 0);
});
