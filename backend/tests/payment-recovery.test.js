import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
process.env.JWT_SECRET = 'payment-recovery-tests-only-not-production';
process.env.SESSION_SECRET = 'payment-recovery-session-tests-only';
process.env.PAYMONGO_SECRET_KEY = 'sk_test_recovery_fixture';
process.env.PAYMONGO_WEBHOOK_SECRET = 'recovery-webhook-secret-fixture';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: router } = await import('../controllers/paymentsController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { capturePaymentWebhookBody, getBookingPaymentStatus, handlePaymongoWebhook, inspectPaymongoSession,
  startOrResumeQrCheckout, verifyPaymongoSignature } = await import('../services/paymongoCheckout.js');

const input = { booking_id: 10, payment_method: 'qrph', amount: 350, currency: 'PHP' };
const session = (id = 'cs_existing', paid = false) => ({ id, type: 'checkout_session', attributes: {
  status: 'active', livemode: false, metadata: { booking_id: '10' }, checkout_url: `https://checkout.paymongo.com/${id}`,
  payments: paid ? [{ id: 'pay_real', attributes: { status: 'paid', amount: 35000, currency: 'PHP' } }] : []
} });
const payment = (extra = {}) => ({ payment_id: 2, booking_id: 10, amount: 350, currency: 'PHP', method: 'qrph',
  provider: 'qrph', transaction_reference: 'cs_existing', status: 'pending', provider_response: '{}', ...extra });
const setup = (t, options = {}) => {
  clearUserColumnCache();
  t.mock.method(console, 'log', () => {}); t.mock.method(console, 'error', () => {});
  let booking = { booking_id: 10, user_id: 5, hotel_id: 8, hotel_name: 'Fixture hotel', status: 'pending', payment_status: 'unpaid',
    total_amount: 350, currency: 'PHP', payment_option: 'full', payment_method: 'qrph', check_in: '2099-12-20',
    check_out: '2099-12-21', reservation_expired: 0, archived: 0, ...options.booking };
  let payments = options.payments || [{ payment_id: 1, booking_id: 10, amount: 350, currency: 'PHP', method: 'qrph', provider: 'pending', status: 'pending', transaction_reference: 'PAY-fixture' }];
  const sessions = new Map([['cs_existing', options.session || session()]]);
  const calls = [], events = [], posts = [], gets = [];
  let before, nextId = 20;
  const execute = async (sql, params = []) => {
    calls.push({ sql, params });
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (sql.includes('FROM booking_payment_policy')) return [[{ online_payments_enabled: 1, lock_version: 1 }]];
    if (sql.startsWith('SELECT policy_snapshot FROM hotel_bookings')) return [[{ policy_snapshot: booking.policy_snapshot }]];
    if (sql.includes('AS reservation_expired')) return [Number(params[0]) === 10 && Number(params[1]) === 5 ? [structuredClone(booking)] : []];
    if (sql.startsWith('SELECT reservation_fee')) return [[{ reservation_fee: 50, allowed_payment_methods: '["qrph","pay_at_property"]' }]];
    if (sql.startsWith('SELECT * FROM hotel_payments')) return [structuredClone(payments).sort((a, b) => b.payment_id - a.payment_id)];
    if (sql.startsWith('SELECT p.*')) return [payments.filter(row => row.transaction_reference === params[0]).map(row => ({ ...row, user_id: 5 }))];
    if (sql.startsWith('SELECT p.payment_id')) return [payments.filter(row => row.provider === 'qrph' && ['pending', 'processing'].includes(row.status))];
    if (sql.startsWith('INSERT INTO hotel_payments')) {
      const row = { payment_id: nextId++, booking_id: params[0], amount: params[1], currency: params[2], method: 'qrph', provider: 'qrph',
        status: 'processing', transaction_reference: params[3], provider_response: params[4], paid_at: null };
      payments.push(row); return [{ insertId: row.payment_id }];
    }
    if (sql.startsWith('UPDATE hotel_payments')) {
      const row = payments.find(item => item.payment_id === params.at(-1));
      assert.ok(row, 'an existing attempt is updated');
      if (sql.startsWith("UPDATE hotel_payments SET status = 'succeeded'")) {
        if (options.writeFailure) throw Object.assign(new Error('Fixture database failure'), { code: 'ER_LOCK_DEADLOCK' });
        row.status = 'succeeded'; row.paid_at = 'fixture'; row.provider_response = params[0];
      } else if (sql.includes("status = 'cancelled'")) { row.status = 'cancelled'; row.provider_response = params[0]; }
      else if (sql.includes('SET transaction_reference')) { row.transaction_reference = params[0]; row.provider_response = params[1]; row.status = 'pending'; }
      else if (sql.includes('SET provider_response')) row.provider_response = params[0];
      else { row.status = params[0]; row.provider_response = params[1]; }
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('UPDATE hotel_bookings')) {
      if (sql.includes('SET payment_status = ?')) {
        booking.payment_status = params[0]; booking.status = params[1];
        if (params[2] === 1) { booking.expires_at = null; booking.reservation_expired = 0; }
      } else if (['unpaid', 'failed'].includes(booking.payment_status)) booking.payment_status = 'pending';
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
  const connection = { execute,
    beginTransaction: async () => { before = structuredClone({ booking, payments }); events.push('begin'); },
    commit: async () => { events.push('commit'); }, rollback: async () => { ({ booking, payments } = before); events.push('rollback'); },
    release: () => { events.push('release'); } };
  t.mock.method(db, 'promise', () => ({ execute, getConnection: async () => connection, query: async (sql, params = []) => {
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: 'user', email_verified: 1, archived: 0 }]];
    if (sql.includes('provider_response LIKE')) return [[payment({ booking_id: 10 })]];
    throw new Error(`Unexpected text query: ${sql}`);
  } }));
  t.mock.method(axios, 'get', async (url, config) => {
    gets.push({ url, config });
    assert.match(url, /^https:\/\/api.paymongo.com\/v1\/checkout_sessions\/cs_/);
    assert.equal(Buffer.from(config.headers.Authorization.slice(6), 'base64').toString(), `${process.env.PAYMONGO_SECRET_KEY}:`);
    if (options.gatewayUnavailable) throw new Error('Fixture network outage');
    const value = sessions.get(url.split('/').at(-1));
    if (!value) throw new Error('Fixture missing session');
    return { data: { data: value } };
  });
  t.mock.method(axios, 'post', async (url, body, config) => {
    posts.push({ url, body, config });
    assert.ok(events.includes('commit'), 'the attempt is durable before gateway I/O');
    assert.match(config.headers['Idempotency-Key'], /^[a-f0-9-]{36}$/);
    if (options.create) return options.create(url, body, config);
    const created = session(`cs_new${posts.length}`); sessions.set(created.id, created);
    return { data: { data: created } };
  });
  return { calls, events, posts, gets, sessions, booking: () => booking, payments: () => payments };
};

test('a new checkout persists an unpaid attempt and safe return URLs before contacting PayMongo', async t => {
  const fixture = setup(t);
  const result = await startOrResumeQrCheckout(5, input);
  assert.equal(result.status, 'pending'); assert.equal(result.success, false);
  assert.equal(fixture.posts.length, 1);
  assert.equal(fixture.payments().at(-1).paid_at, null);
  assert.equal(fixture.booking().status, 'pending');
  const attrs = fixture.posts[0].body.data.attributes;
  assert.equal(attrs.line_items[0].amount, 35000);
  assert.match(attrs.cancel_url, /booking_id=10.*status=cancelled/);
  assert.match(attrs.success_url, /payment_id=20/);
});

test('a lost browser response resumes the existing active session and never creates a second payment attempt', async t => {
  const fixture = setup(t);
  const first = await startOrResumeQrCheckout(5, input);
  const retry = await startOrResumeQrCheckout(5, input);
  assert.equal(retry.resumed, true); assert.equal(retry.checkout_url, first.checkout_url);
  assert.equal(fixture.posts.length, 1);
  assert.equal(fixture.calls.filter(call => call.sql.startsWith('INSERT INTO hotel_payments')).length, 1);
});

test('an API timeout retries the same recorded body and idempotency key, not a new attempt', async t => {
  let attempts = 0;
  const fixture = setup(t, { create: async () => {
    if (++attempts === 1) throw Object.assign(new Error('Fixture timeout'), { code: 'ETIMEDOUT' });
    return { data: { data: session('cs_recovered') } };
  } });
  await assert.rejects(startOrResumeQrCheckout(5, input), { status: 503 });
  assert.equal(fixture.payments().at(-1).status, 'processing');
  await startOrResumeQrCheckout(5, input);
  assert.equal(fixture.posts[0].config.headers['Idempotency-Key'], fixture.posts[1].config.headers['Idempotency-Key']);
  assert.deepEqual(fixture.posts[0].body, fixture.posts[1].body);
  assert.equal(fixture.calls.filter(call => call.sql.startsWith('INSERT')).length, 1);
});

test('concurrent clicks during creation cannot open a second checkout', async t => {
  let entered, complete;
  const ready = new Promise(resolve => { entered = resolve; });
  const wait = new Promise(resolve => { complete = resolve; });
  const fixture = setup(t, { create: async () => { entered(); await wait; return { data: { data: session('cs_once') } }; } });
  const first = startOrResumeQrCheckout(5, input);
  await ready;
  await assert.rejects(startOrResumeQrCheckout(5, input), { code: 'CHECKOUT_IN_PROGRESS' });
  complete(); await first;
  assert.equal(fixture.posts.length, 1);
});

test('provider-confirmed payment is recorded once, confirms the booking, and blocks repayment', async t => {
  const fixture = setup(t, { payments: [payment()], session: session('cs_existing', true) });
  const result = await getBookingPaymentStatus(5, 10);
  assert.equal(result.state, 'succeeded'); assert.equal(result.can_retry, false);
  assert.equal(result.booking.amount_paid, 350); assert.equal(result.booking.balance_due, 0);
  assert.equal(fixture.booking().status, 'confirmed');
  await startOrResumeQrCheckout(5, input);
  assert.equal(fixture.posts.length, 0);
  assert.equal(fixture.payments().length, 1);
});

test('a late payment is recorded but never resurrects an expired reservation on later checks', async t => {
  const fixture = setup(t, { payments: [payment()], session: session('cs_existing', true),
    booking: { reservation_expired: 1, expires_at: '2020-01-01 00:00:00' } });
  for (let count = 0; count < 2; count++) {
    const result = await getBookingPaymentStatus(5, 10);
    assert.equal(result.needs_staff_review, true); assert.equal(result.can_retry, false);
    assert.equal(fixture.booking().status, 'pending');
    assert.equal(fixture.booking().expires_at, '2020-01-01 00:00:00', 'a late payment must not restore released room inventory');
  }
  assert.equal(fixture.payments()[0].status, 'succeeded');
});

test('active unpaid checkout is pending, even if the browser claims success', async t => {
  setup(t, { payments: [payment()] });
  const result = await getBookingPaymentStatus(5, 10);
  assert.equal(result.state, 'pending'); assert.equal(result.booking.amount_paid, 0);
});

test('unknown gateway status fails closed and cannot start another charge', async t => {
  const fixture = setup(t, { payments: [payment()], gatewayUnavailable: true });
  const result = await getBookingPaymentStatus(5, 10);
  assert.equal(result.state, 'checking'); assert.equal(result.can_retry, false);
  await assert.rejects(startOrResumeQrCheckout(5, input), { status: 503 });
  assert.equal(fixture.posts.length, 0);
});

test('legacy falsely-paid records require reconciliation instead of being rewritten or charged again', async t => {
  const fixture = setup(t, { payments: [payment({ status: 'succeeded' })], booking: { payment_status: 'paid', status: 'confirmed' } });
  const result = await getBookingPaymentStatus(5, 10);
  assert.equal(result.state, 'review'); assert.equal(result.can_retry, false);
  await assert.rejects(startOrResumeQrCheckout(5, input), { status: 409 });
  assert.equal(fixture.payments()[0].status, 'succeeded'); assert.equal(fixture.posts.length, 0);
});

test('expired provider sessions may be replaced, without removing the old payment history', async t => {
  const expired = session(); expired.attributes.status = 'expired';
  const fixture = setup(t, { payments: [payment()], session: expired });
  await startOrResumeQrCheckout(5, input);
  assert.equal(fixture.payments().length, 2);
  assert.equal(fixture.payments()[0].status, 'cancelled');
});

for (const [name, changes] of [['cancelled', { status: 'cancelled' }], ['expired', { reservation_expired: 1 }], ['archived', { archived: 1 }]]) {
  test(`${name} unpaid reservations cannot be paid through a retry`, async t => {
    const fixture = setup(t, { booking: changes });
    await assert.rejects(startOrResumeQrCheckout(5, input), { status: 409 });
    assert.equal(fixture.posts.length, 0);
  });
}

test('submitted references awaiting merchant review block an accidental second payment', async t => {
  setup(t, { payments: [payment({ customer_reference_number: '[GCASH] ABC1234567890', reference_status: 'pending' })] });
  assert.equal((await getBookingPaymentStatus(5, 10)).state, 'review');
  await assert.rejects(startOrResumeQrCheckout(5, input), /awaiting hotel review/);
});

test('an interrupted creation older than the provider idempotency window is not blindly retried', async t => {
  const fixture = setup(t, { payments: [payment({ transaction_reference: 'QR-old-attempt', status: 'processing', provider_response: JSON.stringify({
    request_key: '01234567-89ab-4cde-8fab-0123456789ab', request_created_at: '2020-01-01T00:00:00Z',
    checkout_state: 'unknown', creation_body: { data: {} }
  }) })] });
  await assert.rejects(startOrResumeQrCheckout(5, input), /staff reconciliation/);
  assert.equal(fixture.posts.length, 0);
});

test('duplicate legacy active checkouts are flagged rather than choosing one and risking a second charge', async t => {
  const fixture = setup(t, { payments: [payment(), payment({ payment_id: 3, transaction_reference: 'cs_second' })] });
  fixture.sessions.set('cs_second', session('cs_second'));
  await assert.rejects(startOrResumeQrCheckout(5, input), /More than one earlier checkout/);
  assert.equal(fixture.posts.length, 0);
});

test('a changed client quote or currency never starts a provider request', async t => {
  const fixture = setup(t);
  await assert.rejects(startOrResumeQrCheckout(5, { ...input, amount: 1 }), { status: 409 });
  await assert.rejects(startOrResumeQrCheckout(5, { ...input, currency: 'USD' }), { status: 400 });
  assert.equal(fixture.posts.length, 0);
});

test('unsupported paid flags with no succeeded history require review, not a success screen', async t => {
  const fixture = setup(t, { booking: { payment_status: 'paid' } });
  assert.equal((await getBookingPaymentStatus(5, 10)).state, 'review');
  await assert.rejects(startOrResumeQrCheckout(5, input), /reconciliation/);
  assert.equal(fixture.posts.length, 0);
});

test('amount, currency, mode, and booking mismatches cannot prove receipt of money', () => {
  for (const change of [attrs => { attrs.payments[0].attributes.amount = 1; }, attrs => { attrs.payments[0].attributes.currency = 'USD'; },
    attrs => { attrs.livemode = true; }, attrs => { attrs.metadata.booking_id = '99'; }]) {
    const value = session('cs_existing', true); change(value.attributes);
    assert.throws(() => inspectPaymongoSession(value, payment(), process.env.PAYMONGO_SECRET_KEY), { status: 409 });
  }
  const value = session(); value.attributes.payment_intent = { attributes: { status: 'succeeded' } };
  assert.equal(inspectPaymongoSession(value, payment(), process.env.PAYMONGO_SECRET_KEY).state, 'pending');
});

test('database failures roll back rather than silently committing partial reconciliation', async t => {
  const fixture = setup(t, { payments: [payment()], session: session('cs_existing', true), writeFailure: true });
  await assert.rejects(getBookingPaymentStatus(5, 10), /Fixture database failure/);
  assert.equal(fixture.payments()[0].status, 'pending');
  assert.ok(fixture.events.includes('rollback'));
});

const signed = payload => {
  const raw = Buffer.from(JSON.stringify(payload));
  const timestamp = Math.floor(Date.now() / 1000);
  const digest = crypto.createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET).update(`${timestamp}.`).update(raw).digest('hex');
  return { raw, signature: `t=${timestamp},te=${digest},li=` };
};
const event = type => ({ data: { id: 'evt_fixture', attributes: { type, livemode: false, data: { id: 'cs_existing' } } } });

test('signed webhooks and duplicate/delayed failure events use current provider truth without double-credit', async t => {
  const fixture = setup(t, { payments: [payment()], session: session('cs_existing', true) });
  for (const type of ['checkout_session.payment.paid', 'checkout_session.payment.paid', 'checkout_session.payment.failed']) {
    const { raw, signature } = signed(event(type));
    await handlePaymongoWebhook(raw, signature);
  }
  assert.equal(fixture.payments().length, 1); assert.equal(fixture.payments()[0].status, 'succeeded');
  assert.equal((await getBookingPaymentStatus(5, 10)).booking.amount_paid, 350);
});

test('webhook signatures reject tampering, missing signatures, replay timestamps and wrong modes', () => {
  const { raw, signature } = signed(event('checkout_session.payment.paid'));
  assert.equal(verifyPaymongoSignature(raw, signature, process.env.PAYMONGO_WEBHOOK_SECRET, false), true);
  assert.equal(verifyPaymongoSignature(Buffer.from('{}'), signature, process.env.PAYMONGO_WEBHOOK_SECRET, false), false);
  assert.equal(verifyPaymongoSignature(raw, '', process.env.PAYMONGO_WEBHOOK_SECRET, false), false);
  assert.equal(verifyPaymongoSignature(raw, signature, process.env.PAYMONGO_WEBHOOK_SECRET, true), false);
  assert.equal(verifyPaymongoSignature(raw, signature, process.env.PAYMONGO_WEBHOOK_SECRET, false, Date.now() + 600000), false);
});

test('a chargeable source is not credited as a paid checkout', async t => {
  const fixture = setup(t);
  const { raw, signature } = signed(event('source.chargeable'));
  assert.equal((await handlePaymongoWebhook(raw, signature)).ignored, true);
  assert.equal(fixture.calls.length, 0);
});

test('real HTTP routes preserve raw webhook bytes, reject forged callbacks and scope status to the guest', async t => {
  const fixture = setup(t, { payments: [payment()], session: session('cs_existing', true) });
  const app = express(); app.use(express.json({ verify: capturePaymentWebhookBody })); app.use('/api/payments', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (url, userId, init = {}) => fetch(`http://127.0.0.1:${server.address().port}/api/payments${url}`, {
    ...init, redirect: 'manual', headers: { ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET)}` } : {}), ...init.headers }
  });
  assert.equal((await request('/booking/10/status')).status, 401);
  assert.equal((await request('/booking/10/status', 6)).status, 404);
  for (const callbackUrl of ['/qrph/success?session_id=cs_existing', '/qrph/failed?session_id=cs_existing',
    '/gcash/success?source_id=src_test', '/gcash/failed?source_id=src_test',
    '/grabpay/success?source_id=src_test', '/grabpay/failed?source_id=src_test']) {
    assert.equal((await request(callbackUrl)).status, 302);
  }
  assert.equal(fixture.calls.some(call => call.sql.startsWith('UPDATE')), false, 'a browser callback never records payment');
  assert.equal((await request('/checkout', null, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })).status, 401);
  assert.equal((await request('/webhook/paymongo', null, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: 10, status: 'succeeded' }) })).status, 400);
  const { raw, signature } = signed(event('checkout_session.payment.paid'));
  const response = await request('/webhook/paymongo', null, { method: 'POST', headers: { 'Content-Type': 'application/json', 'paymongo-signature': signature }, body: raw });
  assert.equal(response.status, 200);
  assert.equal(fixture.booking().payment_status, 'paid');
});
