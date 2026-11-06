import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { readFile } from 'node:fs/promises';

process.env.JWT_SECRET = 'payment-controls-tests-not-a-production-secret';
process.env.SESSION_SECRET = 'payment-controls-tests-session-only';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { default: bookingsRouter } = await import('../routes/bookings.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { default: adminRouter } = await import('../controllers/adminController.js');
const { default: paymentsRouter } = await import('../controllers/paymentsController.js');
const input = { payment_handling: 'external', hotel_id: 8, room_id: 9, check_in: '2099-12-20', check_out: '2099-12-21', rooms: 1, guests: 2, policy_agreed: true, customer_name: 'Fixture Guest', customer_email: 'guest@example.test', customer_phone: '+639123456789', booking_key: 'fixture-key', quoted_total: 500 };
const json = value => { try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return {}; } };

async function setup(t, options = {}) {
  clearUserColumnCache();
  let state = { policy: { online_payments_enabled: 0, lock_version: 1 }, messages: [], bookings: [], notifications: [], audit: [] }, tail = Promise.resolve();
  const hotel = { hotel_id: 8, name: 'Fixture Inn', location: 'Naujan', rooms_total: 1, is_active: 1, currency: 'PHP', check_in_time: '14:00', check_out_time: '12:00', payment_terms_text: 'Old deposit instruction', ...options.hotel };
  const room = { room_id: 9, hotel_id: 8, room_type_name: 'Queen', quantity_available: 1, is_active: 1, capacity: 2, price_per_night: 500, hourly_rates: '{"3":200}', ...options.room };
  const calls = [], transactions = [];
  const insert = (sql, params, table, idName) => {
    const columns = sql.match(/\(([^)]+)\) (?:VALUES|SELECT)/)[1].split(/,\s*/);
    const values = sql.match(/VALUES \((.*)\)$/)?.[1]?.split(/,\s*/) || [];
    let i = 0;
    const row = Object.fromEntries(columns.map((column, index) => [column, values[index] === '?' ? params[i++] : values[index] === 'NULL' ? null : values[index]?.replace(/^'|'$/g, '')]));
    for (const field of ['user_id', 'hotel_id', 'room_id', 'sender_id']) if (row[field] != null) row[field] = Number(row[field]);
    row[idName] = state[table].length + 1; state[table].push(row); return [{ insertId: row[idName] }];
  };
  const execute = async (sql, params = [], transactional = false) => {
    calls.push({ sql, params, transactional });
    assert.equal((sql.match(/\?/g) || []).length, params.length, sql);
    assert.ok(params.every(value => value !== undefined && (value === null || ['string', 'number'].includes(typeof value))));
    assert.doesNotMatch(sql, /booking_requests|booking_request_events/);
    if (sql.includes('FROM booking_payment_policy')) {
      if (options.missingPolicy) throw Object.assign(new Error('Missing table'), { code: 'ER_NO_SUCH_TABLE' });
      if (options.policyFailure) throw new Error('Fixture policy outage');
      return [[{ ...state.policy }]];
    }
    if (sql.startsWith('UPDATE booking_payment_policy')) { Object.assign(state.policy, { online_payments_enabled: params[0], lock_version: state.policy.lock_version + 1 }); return [{ affectedRows: 1 }]; }
    if (sql.startsWith('INSERT INTO booking_payment_policy_audit')) { state.audit.push(params); return [{ insertId: state.audit.length }]; }
    if (sql.includes('MAX(CASE WHEN bp.verification_status')) return [[{ hotel_id: 8, permit: options.unverified ? 0 : 1, dot: 1, philgeps: 0 }]];
    if (sql.includes('FROM hotels')) return [Number(params[0]) === 8 ? [{ ...hotel }] : []];
    if (sql.includes('FROM rooms')) return [Number(params[0]) === 9 ? [{ ...room }] : []];
    if (sql.includes('FROM hotel_availability') || sql.includes('FROM room_inventory')) return [[]];
    if (sql.startsWith('SELECT booking_id FROM hotel_payments')) return [[{ booking_id: 1 }]];
    if (sql.includes('FROM hotel_payments')) return [[]];
    if (sql.includes('FROM hotel_bookings')) {
      let rows = state.bookings;
      if (sql.includes('JSON_UNQUOTE')) rows = rows.filter(row => row.user_id === Number(params[0]) && row.hotel_id === Number(params[1]) && json(row.policy_snapshot)?.submission_key === params[2]);
      else if (sql.includes("status IN ('pending', 'confirmed')")) rows = rows.filter(row => ['pending', 'confirmed'].includes(row.status) && Number(row.archived || 0) === 0 && (!row.expires_at || row.expires_at > '2099-01-01') && (params[3] == null || row.booking_id !== Number(params[3])));
      else {
        rows = rows.filter(row => row.booking_id === Number(params[0]));
        if (sql.includes('b.user_id = ?')) rows = rows.filter(row => row.user_id === Number(params[1]));
        if (sql.includes('ho.user_id = ?')) rows = rows.filter(row => Number(params[1]) === 5 && row.hotel_id === 8);
      }
      return [rows.map(row => ({ ...row }))];
    }
    if (sql.includes('FROM booking_messages')) {
      if (options.missingMessages) throw Object.assign(new Error('Missing table'), { code: 'ER_NO_SUCH_TABLE' });
      let rows = state.messages.filter(row => row.booking_id === Number(params[0]));
      if (sql.includes('sender_id = ?')) rows = rows.filter(row => row.sender_id === Number(params[1]) && row.client_key === params[2]);
      if (sql.includes('message_id < ?')) rows = rows.filter(row => row.message_id < Number(params[1]));
      if (sql.includes('ORDER BY message_id DESC')) rows = [...rows].sort((a, b) => b.message_id - a.message_id).slice(0, 51);
      return [rows.map(row => ({ ...row }))];
    }
    if (sql.startsWith('INSERT INTO booking_messages')) { assert.ok(transactional); return insert(sql, params, 'messages', 'message_id'); }
    if (sql.startsWith('INSERT INTO notifications')) {
      if (options.failNotification) throw Object.assign(new Error('Fixture write failure'), { code: 'ER_LOCK_DEADLOCK' });
      state.notifications.push(params); return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT INTO hotel_bookings')) { assert.ok(transactional); const result = insert(sql, params, 'bookings', 'booking_id'); state.bookings.at(-1).archived = 0; return result; }
    if (sql.startsWith('UPDATE hotel_bookings')) {
      const row = state.bookings.find(row => row.booking_id === Number(params.at(-1)));
      const updates = sql.match(/ SET (.+) WHERE /)[1].split(', '); let i = 0;
      for (const update of updates) { const [field, value] = update.split(' = '); row[field] = value === '?' ? params[i++] : value === 'NULL' ? null : '2099-01-01 12:00:00'; }
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  t.mock.method(db, 'promise', () => ({ execute, query: async (sql, params = []) => {
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: ({ 1: 'user', 2: 'user', 5: 'owner', 6: 'owner', 7: 'admin' })[params[0]], archived: 0, email_verified: 1 }]];
    if (sql.includes('FROM hotel_bookings')) {
      const rows = sql.includes('WHERE user_id = ?') ? state.bookings.filter(row => row.user_id === Number(params[0])) : state.bookings.filter(row => row.booking_id === Number(params[0]) && (!sql.includes('ho.user_id = ?') || Number(params[1]) === 5));
      return [rows.map(row => ({ ...row }))];
    }
    if (sql.includes('FROM hotel_payments p')) return [[{ payment_id: 1, booking_id: 1, hotel_id: 8, status: 'pending' }]];
    if (sql.includes('FROM business_profiles')) return [[{ verification_status: options.limited ? 'pending' : 'verified', business_permit_no: 'fixture', dot_no: 'fixture' }]];
    throw new Error(`Unexpected auth query: ${sql}`);
  }, getConnection: async () => {
    let unlock, before, lockedHotel = false;
    return { beginTransaction: async () => { const previous = tail; tail = new Promise(resolve => { unlock = resolve; }); await previous; before = structuredClone(state); transactions.push('begin'); },
      execute: (sql, params) => { if (sql.includes('FROM hotels') && sql.endsWith('FOR UPDATE')) lockedHotel = true; if (sql.startsWith('INSERT INTO hotel_bookings')) assert.ok(lockedHotel, 'new bookings lock hotel inventory'); return execute(sql, params, true); },
      commit: async () => { transactions.push('commit'); }, rollback: async () => { state = before; transactions.push('rollback'); }, release: () => { transactions.push('release'); unlock(); } };
  } }));
  t.mock.method(axios, 'post', async () => { throw new Error('No gateway calls allowed while payments are disabled'); });
  const app = express(); app.use(express.json()); app.use('/api/bookings', bookingsRouter); app.use('/api/owner', ownerRouter); app.use('/api/admin', adminRouter); app.use('/api/payments', paymentsRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = async (userId, path, method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId, role: 'admin' }, JWT_SECRET)}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  return { request, state: () => state, calls, transactions, hotel, room, options };
}

test('payments OFF keeps normal bookings: actual pending record, inventory held, no new payment or payment expiry', async t => {
  const { request, state, calls } = await setup(t);
  assert.equal((await request(null, '/bookings/policy')).body.online_payments_enabled, false);
  assert.equal((await request(1, '/bookings/hotels', 'POST', { ...input, payment_handling: undefined })).body.code, 'PAYMENT_MODE_CHANGED');
  const response = await request(1, '/bookings/hotels', 'POST', { ...input, pay_now: true, payment_method: 'card' });
  assert.equal(response.status, 201); assert.equal(response.body.booking.status, 'pending'); assert.equal(response.body.request, undefined); assert.equal(response.body.receipt, undefined);
  assert.equal(response.body.booking.expires_at, null); assert.equal(state().bookings.length, 1);
  assert.equal(response.body.booking.policy_snapshot.payment_handling, 'external');
  assert.doesNotMatch(response.body.booking.policy_snapshot.payment_terms_text, /Old deposit/);
  assert.ok(calls.every(call => !call.sql.startsWith('INSERT INTO hotel_payments')));
  assert.equal((await request(1, '/bookings/hotels', 'POST', input)).body.booking.booking_id, 1, 'lost-response retry returns the same booking');
  const existing = await request(1, '/bookings/hotels');
  assert.equal(existing.body.length, 1); assert.equal(existing.body[0].amount_due_now, null); assert.equal(existing.body[0].balance_due_at, null);
});

test('owners confirm and cancel through existing status endpoint without creating another reservation or fake payment', async t => {
  const { request, state, room, calls } = await setup(t);
  await request(1, '/bookings/hotels', 'POST', input); room.price_per_night = 900;
  for (let i = 0; i < 2; i++) assert.equal((await request(5, '/owner/bookings/1/status', 'PUT', { status: 'confirmed' })).status, 200);
  assert.equal(state().bookings[0].status, 'confirmed'); assert.equal(Number(state().bookings[0].total_amount), 500); assert.equal(state().bookings.length, 1);
  assert.equal((await request(1, '/bookings/hotels/1/receipt')).status, 409);
  assert.equal((await request(6, '/owner/bookings/1/status', 'PUT', { status: 'cancelled' })).status, 403);
  assert.equal((await request(5, '/owner/bookings/1/status', 'PUT', { status: 'cancelled' })).status, 200);
  assert.equal((await request(5, '/owner/bookings/1/status', 'PUT', { status: 'confirmed' })).status, 409, 'cancelled bookings cannot be reopened and overbook inventory');
  assert.ok(calls.every(call => !call.sql.startsWith('UPDATE hotels SET rooms_available')));
});

test('competing standard bookings serialize on the last room; rollback does not leave a partial booking', async t => {
  const { request, state, options, transactions } = await setup(t);
  options.failNotification = true;
  assert.equal((await request(1, '/bookings/hotels', 'POST', input)).status, 409); assert.equal(state().bookings.length, 0);
  options.failNotification = false;
  const results = await Promise.all([request(1, '/bookings/hotels', 'POST', input), request(2, '/bookings/hotels', 'POST', { ...input, booking_key: 'guest-2' })]);
  assert.deepEqual(results.map(row => row.status).sort(), [201, 409]); assert.equal(state().bookings.length, 1);
  assert.equal(transactions.filter(item => item === 'begin').length, transactions.filter(item => item === 'release').length);
});

test('server-derived nightly/hourly rates and normal modifications retain frozen prices and no payment deadline', async t => {
  const { request, state, room } = await setup(t, { hotel: { rooms_total: 4 }, room: { quantity_available: 4 } });
  for (const patch of [{ quoted_total: 1 }, { rooms: -1 }, { guests: 1.5 }, { policy_agreed: false }, { customer_email: 'bad' }]) assert.ok((await request(1, '/bookings/hotels', 'POST', { ...input, ...patch })).status >= 400);
  await request(1, '/bookings/hotels', 'POST', input); room.price_per_night = 1000;
  const modified = await request(1, '/bookings/hotels/1/modify', 'PATCH', { check_in: '2099-12-22', check_out: '2099-12-24', rooms: 1, guests: 2 });
  assert.equal(modified.status, 200); assert.equal(Number(modified.body.booking.total_amount), 1000); assert.equal(modified.body.booking.policy_snapshot.balance_due_at, null); assert.equal(modified.body.booking.expires_at, null);
  const hourly = await request(2, '/bookings/hotels', 'POST', { ...input, stay_duration_hours: 3, check_in_time: '09:00', quoted_total: 200 });
  assert.equal(hourly.status, 201); assert.equal(hourly.body.booking.total_amount, 200); assert.equal(hourly.body.booking.check_out_at, '2099-12-20 12:00:00');
  assert.equal(state().bookings.length, 2);
});

test('booking messages are human communication only, scoped, retry-safe, and never change booking/payment status', async t => {
  const { request, state, options } = await setup(t);
  await request(1, '/bookings/hotels', 'POST', input);
  assert.equal((await request(2, '/bookings/hotels/1/messages')).status, 404);
  assert.equal((await request(6, '/owner/bookings/1/messages')).status, 404);
  assert.equal((await request(1, '/owner/bookings/1/messages')).status, 403);
  assert.equal((await request(null, '/bookings/hotels/1/messages')).status, 401);
  const first = { client_key: 'message-1', message: 'What time should I arrive?' };
  assert.equal((await request(1, '/bookings/hotels/1/messages', 'POST', first)).status, 200);
  assert.equal((await request(1, '/bookings/hotels/1/messages', 'POST', first)).status, 200);
  assert.equal((await request(1, '/bookings/hotels/1/messages', 'POST', { ...first, message: 'Different text' })).status, 409);
  await request(5, '/owner/bookings/1/messages', 'POST', { client_key: 'owner-1', message: 'Check-in is at 2 PM. Pay at the front desk.' });
  const conversation = await request(1, '/bookings/hotels/1/messages');
  assert.deepEqual(conversation.body.messages.map(row => row.sender_role), ['guest', 'owner']);
  assert.equal(state().messages.length, 2); assert.equal(state().bookings[0].status, 'pending'); assert.equal(state().bookings[0].payment_status, 'unpaid');
  assert.equal((await request(1, '/bookings/hotels/1/messages', 'POST', { client_key: 'invalid', message: 'x'.repeat(4001) })).status, 400);
  options.failNotification = true;
  assert.equal((await request(1, '/bookings/hotels/1/messages', 'POST', { client_key: 'failed-send', message: 'Retain this draft.' })).status, 409);
  assert.equal(state().messages.length, 2, 'notification failures roll back the message so the same retry key is safe');
});

test('conversation history paginates without losing earlier messages and reports missing schema honestly', async t => {
  const { request, state, options } = await setup(t);
  await request(1, '/bookings/hotels', 'POST', input);
  state().messages = Array.from({ length: 55 }, (_, i) => ({ message_id: i + 1, booking_id: 1, sender_id: 1, sender_role: 'guest', client_key: `seed-${i}`, message: `Message ${i + 1}` }));
  const latest = (await request(1, '/bookings/hotels/1/messages')).body;
  assert.equal(latest.messages.length, 50); assert.equal(latest.oldest_id, 6); assert.equal(latest.has_more, true);
  const earlier = (await request(1, '/bookings/hotels/1/messages?before=6')).body;
  assert.deepEqual(earlier.messages.map(row => row.message_id), [1, 2, 3, 4, 5]); assert.equal(earlier.has_more, false);
  options.missingMessages = true;
  assert.equal((await request(1, '/bookings/hotels/1/messages')).status, 503);
});

test('admin-only payment switch is audited and cannot retroactively charge pay-at-property bookings', async t => {
  const { request, state } = await setup(t);
  await request(1, '/bookings/hotels', 'POST', input);
  const body = { online_payments_enabled: true, lock_version: 1, reason: 'Client authorized online payments.' };
  assert.equal((await request(5, '/admin/booking-policy', 'PUT', body)).status, 403);
  assert.equal((await request(7, '/admin/booking-policy', 'PUT', body)).status, 400);
  assert.equal((await request(7, '/admin/booking-policy', 'PUT', { ...body, confirm_enable: true })).status, 200);
  assert.equal(state().audit.length, 1);
  assert.equal((await request(1, '/bookings/hotels', 'POST', input)).body.booking.booking_id, 1, 'an interrupted original booking response can still be recovered after a mode change');
  assert.equal((await request(2, '/bookings/hotels', 'POST', { ...input, booking_key: 'new-after-enable' })).body.code, 'PAYMENT_MODE_CHANGED', 'a stale offline form cannot bypass newly enabled property payment terms');
  assert.equal((await request(7, '/admin/booking-policy', 'PUT', { ...body, confirm_enable: true })).status, 409);
  assert.equal((await request(1, '/payments/checkout', 'POST', { booking_id: 1, payment_method: 'qrph' })).status, 409);
  assert.equal((await request(7, '/admin/booking-policy', 'PUT', { online_payments_enabled: false, lock_version: 2, reason: 'Keep online payments off.' })).status, 200);
  assert.equal(state().bookings[0].status, 'pending');
});

test('collection routes fail closed, while earlier refunds/status callbacks and financial history stay available', async t => {
  const { request, options } = await setup(t);
  for (const path of ['/payments/checkout', '/payments/process', '/payments/1/submit-reference', '/payments/1/VERIFY-REFERENCE/', '/payments/1/status']) assert.equal((await request(1, path, 'POST', { booking_id: 1 })).status, 403);
  assert.equal((await request(5, '/owner/payments/1/confirm', 'PUT', {})).status, 403);
  assert.equal((await request(null, '/payments/1/refund', 'POST', {})).status, 401, 'old refunds still reach authentication instead of the collection blocker');
  options.missingPolicy = true;
  assert.equal((await request(null, '/bookings/policy')).body.online_payments_enabled, false);
  assert.equal((await request(1, '/bookings/hotels', 'POST', input)).status, 503);
  options.missingPolicy = false; options.policyFailure = true;
  assert.equal((await request(1, '/payments/checkout', 'POST', { booking_id: 1 })).status, 503);
});

test('ineligible properties, limited owners and foreign booking IDs cannot bypass access checks', async t => {
  const { request, options } = await setup(t);
  options.unverified = true;
  assert.equal((await request(1, '/bookings/hotels', 'POST', input)).status, 403);
  options.unverified = false; await request(1, '/bookings/hotels', 'POST', input);
  options.limited = true;
  assert.equal((await request(5, '/owner/bookings/1/messages')).status, 403);
  assert.equal((await request(5, '/owner/bookings/1/status', 'PUT', { status: 'confirmed' })).status, 403);
  assert.equal((await request(2, '/bookings/hotels/1/modify', 'PATCH', {})).status, 404);
});

test('migration is additive, defaults only payment processing OFF and creates no request workflow tables', async () => {
  const sql = (await readFile(new URL('../../migrations/055_admin_payment_controls.sql', import.meta.url), 'utf8')).replace(/--[^\n]*/g, '');
  assert.match(sql, /VALUES \(1, 0\)/); assert.match(sql, /CREATE TABLE IF NOT EXISTS booking_messages/);
  assert.doesNotMatch(sql, /(?:^|;)\s*(?:DELETE|DROP|ALTER|UPDATE)\b|\b(?:REFERENCES|CASCADE)\b/i);
  assert.doesNotMatch(sql, /booking_requests|booking_request_events|\bhotel_(?:bookings|payments)\b/);
});
