import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Local HTTP, fake database and fake SMTP only. No real credentials are used.
process.env.JWT_SECRET = 'auth-verification-tests-only-not-production';
process.env.SESSION_SECRET = 'auth-verification-session-tests-only';
process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://site.example.test';
const { default: db } = await import('../db.js');
const { default: router } = await import('../controllers/authController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { JWT_SECRET } = await import('../config/security.js');
const { issueSecurityToken, hashOpaqueToken } = await import('../services/securityTokens.js');

let fixtureId = 0;
const setup = async (t, options = {}) => {
  clearUserColumnCache();
  global.tempRegistrations = {};
  const envNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'MAIL_FROM', 'SMTP_FROM'];
  const oldEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];
  Object.assign(process.env, { SMTP_HOST: 'smtp.example.test', SMTP_USER: `fixture${++fixtureId}@example.test`, SMTP_PASS: 'fixture-only-password' });
  t.after(() => {
    global.tempRegistrations = {};
    for (const [name, value] of Object.entries(oldEnv)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  const logs = [], calls = [], messages = [], tokens = [];
  for (const method of ['log', 'warn', 'error']) t.mock.method(console, method, (...args) => logs.push(args));
  const state = { mode: 'accepted', verifies: 0, users: options.users || [], wait: null };
  t.mock.method(crypto, 'randomInt', () => 562941);
  t.mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async message => {
      messages.push(message);
      if (state.wait) await state.wait();
      if (state.mode === 'failed') throw Object.assign(new Error(`private-fixture-provider-response ${message.text}`), { code: 'EAUTH', responseCode: 535 });
      return { accepted: state.mode === 'rejected' ? [] : [message.to], rejected: state.mode === 'rejected' ? [message.to] : [], messageId: 'fixture-id' };
    },
    verify: async () => {
      state.verifies++;
      if (state.mode === 'failed') throw Object.assign(new Error('private-fixture-provider-response'), { code: 'ETIMEDOUT' });
      return true;
    }
  }));
  const execute = async (sql, params = []) => {
    calls.push({ sql, params });
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (sql.startsWith('SELECT user_id FROM users WHERE email')) return [state.users.filter(user => user.email === params[0])];
    if (sql.startsWith('SELECT user_id FROM users WHERE username')) return [state.users.filter(user => user.username === params[0])];
    if (sql.includes('WHERE LOWER(email)')) return [state.users.filter(user => user.email === params[0] || user.username === params[1])];
    if (sql.includes('INSERT INTO auth_tokens')) {
      const record = { id: tokens.length + 1, user_id: params[0], token_hash: params[1], token_type: params[2], expires_at: params[3], used_at: null };
      tokens.push(record); return [{ insertId: record.id }];
    }
    if (sql.includes('FROM auth_tokens')) return [tokens.filter(token => token.token_hash === params[0] && token.token_type === params[1])];
    if (sql.startsWith('UPDATE auth_tokens')) {
      for (const token of tokens) {
        if (sql.includes('WHERE id = ?') ? token.id === params[0] : token.user_id === params[0] && token.token_type === params[1]) token.used_at = new Date();
      }
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT INTO users')) {
      const columns = sql.match(/INSERT INTO users \(([^)]+)\)/)[1].split(', ');
      const user = Object.fromEntries(columns.map((name, index) => [name, params[index]]));
      user.user_id = 20; state.users.push(user); return [{ insertId: user.user_id }];
    }
    if (sql.startsWith('UPDATE users SET email_verified')) {
      state.users.find(user => user.user_id === params[0]).email_verified = 1;
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected fixture query: ${sql}`);
  };
  t.mock.method(db, 'promise', () => ({ execute, query: async (sql, params = []) => {
    if (sql.includes('information_schema.columns')) return [['email_verified', 'email_verified_at', 'preferred_language', 'phone'].map(column_name => ({ column_name }))];
    if (sql.includes('FROM users')) return [state.users.filter(user => user.user_id === params[0])];
    throw new Error(`Unexpected fixture query: ${sql}`);
  } }));
  const app = express(); app.set('trust proxy', 'loopback'); app.use(express.json()); app.use('/auth', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const ip = `192.0.2.${fixtureId}`;
  const request = async (path, body, userId) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip,
        ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET)}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
  return { state, calls, messages, logs, tokens, request };
};
const registration = { username: 'newguest', email: 'newguest@example.test', password: 'ValidFixturePassword!123', first_name: 'New', last_name: 'Guest' };
const pending = () => ({ ...registration, password_hash: 'fixture-hash', code: '102938', expiresAt: Date.now() + 300000 });
const unverified = () => ({ user_id: 5, username: 'existingguest', email: 'existing@example.test', email_verified: 0, role: 'user' });

test('registration sends to the normalized address and creates an account only after code verification', async t => {
  const fixture = await setup(t);
  const sent = await fixture.request('/register-send-code', { ...registration, email: ' NEWGUEST@example.test ' });
  assert.equal(sent.status, 200); assert.equal(fixture.messages.length, 1);
  assert.equal(fixture.messages[0].to, registration.email);
  assert.equal(fixture.state.users.length, 0);
  const cached = global.tempRegistrations[registration.email];
  assert.notEqual(cached.password_hash, registration.password);
  assert.equal(await bcrypt.compare(registration.password, cached.password_hash), true);
  assert.match(fixture.messages[0].text, new RegExp(cached.code));
  assert.equal(sent.body.devVerificationCode, undefined);
  assert.doesNotMatch(JSON.stringify(fixture.logs), /562941|ValidFixturePassword|private-fixture/);
  assert.equal((await fixture.request('/register-verify-code', { ...registration, code: 'wrong-code' })).status, 400);
  const verified = await fixture.request('/register-verify-code', { username: registration.username, email: registration.email, code: cached.code });
  assert.equal(verified.status, 201); assert.equal(fixture.state.users[0].email_verified, 1);
  assert.equal(global.tempRegistrations[registration.email], undefined);
});

for (const mode of ['failed', 'rejected', 'missing']) {
  test(`initial registration reports ${mode} SMTP without leaving an unusable pending code`, async t => {
    const fixture = await setup(t);
    fixture.state.mode = mode;
    if (mode === 'missing') delete process.env.SMTP_PASS;
    const response = await fixture.request('/register-send-code', registration);
    assert.equal(response.status, 503); assert.equal(response.body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
    assert.equal(global.tempRegistrations[registration.email], undefined);
    assert.equal(fixture.state.users.length, 0);
    assert.doesNotMatch(JSON.stringify([fixture.logs, response.body]), /562941|ValidFixturePassword|private-fixture/);
  });
}

test('failed repeated registration preserves the previously sent registration and code', async t => {
  const fixture = await setup(t);
  const previous = pending(); global.tempRegistrations[registration.email] = previous;
  fixture.state.mode = 'failed';
  assert.equal((await fixture.request('/register-send-code', registration)).status, 503);
  assert.equal(global.tempRegistrations[registration.email], previous);
  fixture.state.mode = 'accepted';
  assert.equal((await fixture.request('/register-send-code', registration)).status, 200, 'the in-flight guard is released after failure');
});

test('failed registration resend keeps the old code and expiration valid', async t => {
  const fixture = await setup(t);
  const previous = pending(); global.tempRegistrations[registration.email] = previous;
  fixture.state.mode = 'failed';
  assert.equal((await fixture.request('/register-resend-code', { email: registration.email })).status, 503);
  assert.equal(global.tempRegistrations[registration.email], previous);
  assert.equal(previous.code, '102938');
  assert.equal((await fixture.request('/register-verify-code', { ...registration, code: previous.code })).status, 201);
});

test('successful registration resend activates the replacement only after SMTP acceptance', async t => {
  const fixture = await setup(t);
  const previous = pending(); global.tempRegistrations[registration.email] = previous;
  let release, entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  t.after(() => release());
  fixture.state.wait = async () => { entered(); await wait; };
  const sending = fixture.request('/register-resend-code', { email: registration.email });
  await ready;
  assert.equal(global.tempRegistrations[registration.email], previous);
  assert.equal((await fixture.request('/register-resend-code', { email: registration.email })).body.code, 'REGISTRATION_EMAIL_IN_PROGRESS');
  assert.equal((await fixture.request('/register-send-code', registration)).body.code, 'REGISTRATION_EMAIL_IN_PROGRESS');
  release();
  assert.equal((await sending).status, 200);
  const updated = global.tempRegistrations[registration.email];
  assert.notEqual(updated, previous); assert.equal(updated.code, '562941');
  assert.ok(updated.expiresAt > previous.expiresAt);
  assert.equal((await fixture.request('/register-verify-code', { ...registration, code: previous.code })).status, 400);
  assert.equal((await fixture.request('/register-verify-code', { ...registration, code: updated.code })).status, 201);
});

test('a resend cannot resurrect a session consumed while SMTP was in flight', async t => {
  const fixture = await setup(t);
  const previous = pending(); global.tempRegistrations[registration.email] = previous;
  let release, entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  t.after(() => release()); fixture.state.wait = async () => { entered(); await wait; };
  const sending = fixture.request('/register-resend-code', { email: registration.email });
  await ready;
  assert.equal((await fixture.request('/register-verify-code', { ...registration, code: previous.code })).status, 201);
  release(); await sending;
  assert.equal(global.tempRegistrations[registration.email], undefined);
  assert.equal(fixture.state.users.length, 1);
});

test('registration resends are limited per email and expired sessions never trigger SMTP', async t => {
  const fixture = await setup(t);
  global.tempRegistrations[registration.email] = pending();
  for (let count = 0; count < 4; count++) assert.equal((await fixture.request('/register-resend-code', { email: registration.email })).status, 200);
  const limited = await fixture.request('/register-resend-code', { email: registration.email });
  assert.equal(limited.status, 429); assert.equal(limited.body.code, 'RESEND_RATE_LIMITED');
  assert.equal(fixture.messages.length, 4);
  global.tempRegistrations['expired@example.test'] = { ...pending(), expiresAt: Date.now() - 1000 };
  assert.equal((await fixture.request('/register-resend-code', { email: 'expired@example.test' })).status, 400);
  assert.equal(fixture.messages.length, 4);
});

test('login resend issues a private link, sends it, and verifies it using the existing token route', async t => {
  const fixture = await setup(t, { users: [unverified()] });
  const response = await fixture.request('/resend-verification', { emailOrUsername: 'EXISTINGGUEST' });
  assert.equal(response.status, 200); assert.equal(fixture.messages.length, 1);
  const url = new URL(fixture.messages[0].text.match(/https:\/\/\S+/)[0]);
  assert.equal(url.pathname, '/verify-email');
  const token = url.searchParams.get('token');
  assert.equal(fixture.tokens[0].token_hash, hashOpaqueToken(token));
  assert.equal(response.body.devVerificationUrl, undefined);
  assert.ok(!JSON.stringify([response.body, fixture.logs]).includes(token));
  const verified = await fixture.request('/verify-email', { token });
  assert.equal(verified.status, 200); assert.equal(fixture.state.users[0].email_verified, 1);
  assert.ok(fixture.tokens[0].used_at);
  assert.equal((await fixture.request('/verify-email', { token })).status, 400);
});

test('login resend failures preserve previous links and cannot enumerate account state', async t => {
  const fixture = await setup(t, { users: [unverified(), { ...unverified(), user_id: 6, username: 'verifiedguest', email_verified: 1 }] });
  const oldToken = await issueSecurityToken({ userId: 5, tokenType: 'email_verification', expiresInMinutes: 30, invalidateExisting: false });
  fixture.state.mode = 'failed';
  const failed = await fixture.request('/resend-verification', { emailOrUsername: 'existingguest' });
  const unknown = await fixture.request('/resend-verification', { emailOrUsername: 'notregistered' });
  const verified = await fixture.request('/resend-verification', { emailOrUsername: 'verifiedguest' });
  assert.deepEqual(failed.body, unknown.body); assert.deepEqual(failed.body, verified.body);
  assert.equal(fixture.messages.length, 1);
  assert.equal(fixture.tokens.find(token => token.id === oldToken.id).used_at, null);
  assert.ok(fixture.tokens.at(-1).used_at, 'the undelivered candidate is retired');
  assert.doesNotMatch(JSON.stringify([failed.body, fixture.logs]), /has been sent|private-fixture|Fallback link/);
  assert.equal((await fixture.request('/verify-email', { token: oldToken.token })).status, 200);
});

test('password reset token issuance keeps its existing invalidate-previous default', async t => {
  const fixture = await setup(t);
  const first = await issueSecurityToken({ userId: 5, tokenType: 'password_reset', expiresInMinutes: 30 });
  await issueSecurityToken({ userId: 5, tokenType: 'password_reset', expiresInMinutes: 30 });
  assert.ok(fixture.tokens.find(token => token.id === first.id).used_at);
  assert.equal(fixture.tokens.at(-1).used_at, null);
});

test('SMTP diagnostics require a production admin, never send, and return only sanitized status', async t => {
  const fixture = await setup(t, { users: [{ ...unverified(), email_verified: 1 }, { ...unverified(), user_id: 6, email_verified: 1, role: 'admin' }] });
  assert.equal((await fixture.request('/test-smtp')).status, 401);
  assert.equal((await fixture.request('/test-smtp', undefined, 5)).status, 403);
  assert.equal(fixture.state.verifies, 0);
  const result = await fixture.request('/test-smtp', undefined, 6);
  assert.equal(result.body.smtpConnectionStatus, 'connected');
  assert.match(result.headers.get('cache-control'), /no-store/);
  assert.doesNotMatch(JSON.stringify(result.body), /fixture-only-password|fixture\d+@|smtp.example.test/);
  fixture.state.mode = 'failed';
  const failure = await fixture.request('/test-smtp', undefined, 6);
  assert.equal(failure.body.smtpError, 'ETIMEDOUT');
  assert.doesNotMatch(JSON.stringify(failure.body), /private-fixture/);
  assert.equal(fixture.messages.length, 0);
});
