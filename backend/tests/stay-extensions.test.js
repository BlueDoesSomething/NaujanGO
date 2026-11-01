import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'stay-extension-tests-only-not-a-production-secret';
process.env.SESSION_SECRET = 'stay-extension-session-tests-only-not-production';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { extendHourlyStay, getStayExtensionOptions } = await import('../services/stayExtensions.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');

const actor = { user_id: 5, role: 'owner' };
const now = Date.parse('2026-11-01T02:00:00Z'); // 10:00 PHT, during the original 09:00–12:00 stay.
const key = '01234567-89ab-4cde-8fab-0123456789ab';
const body = { hours: 3, expected_checkout_at: '2026-11-01 12:00:00', expected_rate: 250, guest_agreed: true, request_key: key };

const setup = (t, options = {}) => {
  const originalPolicy = { check_in_at: '2026-11-01 09:00:00', check_out_at: '2026-11-01 12:00:00',
    stay_duration_hours: 3, stay_rate: 250, payment_option: 'full', allowed_payment_options: ['full'], reservation_fee: null };
  let booking = { booking_id: 10, hotel_id: 8, room_id: 7, room_type_name: 'Economy Single', user_id: 100,
    status: 'confirmed', archived: 0, payment_status: 'paid', total_amount: 250, currency: 'PHP', rooms: 1, guests: 1,
    check_in: '2026-11-01', check_out: '2026-11-01', check_in_at: '2026-11-01 09:00:00', check_out_at: '2026-11-01 12:00:00',
    stay_duration_hours: 3, stay_rate: 250, policy_snapshot: JSON.stringify(originalPolicy), ...options.booking };
  const room = { room_id: 7, room_type_name: 'Economy Single', currency: 'PHP', quantity_available: 1, capacity: 1,
    hourly_rates: '{"3":250,"12":750,"24":1500}', ...options.room };
  const calls = [];
  let snapshot, commits = 0, rollbacks = 0, releases = 0, connections = 0;
  const execute = async (sql, params = []) => {
    calls.push({ sql, params });
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (sql.includes('SELECT b.* FROM hotel_bookings b')) {
      const allowed = params[0] === 10 && (params[1] === 'admin' || (params[2] === 5 && !options.denied
        && !(options.revokeOwnership && sql.includes('FOR UPDATE'))));
      return [allowed ? [structuredClone(booking)] : []];
    }
    if (sql.includes('SELECT hotel_id, rooms_total FROM hotels')) return [[{ hotel_id: 8, rooms_total: 1 }]];
    if (sql.includes('FROM rooms')) return [options.missingRoom ? [] : [room]];
    if (sql.includes('FROM hotel_bookings')) return [options.overlaps || []];
    if (sql.includes('FROM hotel_availability')) return [options.closedDays || []];
    if (sql.includes('FROM room_inventory')) return [options.roomDays || []];
    if (sql.includes('FROM hotel_payments')) return [[{ amount_paid: options.paid ?? 250 }]];
    if (sql.startsWith('UPDATE hotel_bookings')) {
      booking = { ...booking, check_out: params[0], check_out_at: params[1], stay_duration_hours: params[2], nights: params[3],
        total_amount: params[4], payment_status: params[5], policy_snapshot: params[6], expires_at: null };
      if (options.writeFailure) throw new Error('Fixture storage failure');
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  const connection = { execute, beginTransaction: async () => { snapshot = structuredClone(booking); },
    commit: async () => { commits++; }, rollback: async () => { booking = snapshot; rollbacks++; }, release: () => { releases++; } };
  t.mock.method(db, 'promise', () => ({ execute, getConnection: async () => { connections++; return connection; },
    query: async (sql, params = []) => {
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{ user_id: params[0], role: options.role || 'owner', archived: 0, email_verified: 1 }]];
      if (sql.includes('FROM business_profiles')) return [[{ verification_status: options.limited ? 'pending' : 'verified', business_permit_no: 'TEST', dot_no: 'TEST' }]];
      throw new Error(`Unexpected text query: ${sql}`);
    } }));
  return { calls, row: () => booking, originalPolicy, commits: () => commits, rollbacks: () => rollbacks,
    releases: () => releases, connections: () => connections };
};

test('options expose only configured room packages and never change owner payment settings', async t => {
  const fixture = setup(t, { room: { hourly_rates: '{"12":750,"24":1500}' } });
  const result = await getStayExtensionOptions(actor, 10, now);
  assert.deepEqual(result.packages.map(item => item.hours), [12, 24]);
  assert.equal(result.packages[0].additional_amount, 750);
  assert.equal(fixture.calls.some(call => /^(UPDATE|INSERT|DELETE)/.test(call.sql)), false);
});

for (const [hours, rate, checkout, duration] of [
  [3, 250, '2026-11-01 15:00:00', 6], [12, 750, '2026-11-02 00:00:00', 15], [24, 1500, '2026-11-02 12:00:00', 27]
]) {
  test(`${hours}-hour extension starts at checkout, preserves original terms, and records no received payment`, async t => {
    const fixture = setup(t);
    const result = await extendHourlyStay(actor, 10, { ...body, hours, expected_rate: rate }, now);
    assert.equal(result.booking.check_out_at, checkout);
    assert.equal(result.booking.stay_duration_hours, duration);
    assert.equal(result.booking.total_amount, 250 + rate);
    assert.equal(result.booking.payment_status, 'partial');
    assert.equal(result.extension.actor_id, 5);
    assert.equal(result.extension.amount, rate);
    const policy = JSON.parse(fixture.row().policy_snapshot);
    const { stay_extensions: history, ...original } = policy;
    assert.deepEqual(original, fixture.originalPolicy);
    assert.equal(history.length, 1);
    assert.equal(history[0].from, '2026-11-01 12:00:00');
    assert.equal(history[0].to, checkout);
    assert.ok(fixture.calls.some(call => call.sql.includes('FROM hotels') && call.sql.includes('FOR UPDATE')));
    assert.ok(fixture.calls.some(call => call.sql.includes('SELECT b.*') && call.sql.includes('FOR UPDATE')));
    const writes = fixture.calls.filter(call => /^(UPDATE|INSERT|DELETE)/.test(call.sql));
    assert.equal(writes.length, 1);
    assert.ok(writes[0].sql.startsWith('UPDATE hotel_bookings'));
    assert.equal(fixture.commits(), 1);
    assert.equal(fixture.releases(), 1);
  });
}

test('retrying the same request is idempotent and cannot add the charge twice', async t => {
  const fixture = setup(t);
  const first = await extendHourlyStay(actor, 10, body, now);
  const repeat = await extendHourlyStay(actor, 10, body, now);
  assert.equal(repeat.replayed, true);
  assert.deepEqual(repeat.extension, first.extension);
  assert.equal(fixture.row().total_amount, 500);
  assert.equal(JSON.parse(fixture.row().policy_snapshot).stay_extensions.length, 1);
  assert.equal(fixture.calls.filter(call => call.sql.startsWith('UPDATE')).length, 1);
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, hours: 12, expected_rate: 750 }, now), { status: 409 });
  assert.equal(fixture.row().total_amount, 500);
});

test('stale checkout or changed prices require renewed approval without any write', async t => {
  const fixture = setup(t);
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, expected_checkout_at: '2026-11-01 11:00:00' }, now), { status: 409 });
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, expected_rate: 1 }, now), { status: 409 });
  assert.equal(fixture.calls.some(call => call.sql.startsWith('UPDATE')), false);
});

test('another reservation and closed dates block extensions, even for an authorized owner', async t => {
  const fixture = setup(t, { overlaps: [{ user_id: 200, room_id: 7, rooms: 1, check_in_at: '2026-11-01 14:00:00', check_out_at: '2026-11-01 17:00:00' }] });
  await assert.rejects(extendHourlyStay(actor, 10, body, now), { status: 409 });
  assert.equal(fixture.row().total_amount, 250);
  assert.equal(fixture.commits(), 0);
});

test('an extension crossing into a closed day is rejected', async t => {
  const fixture = setup(t, { closedDays: [{ availability_date: '2026-11-02', is_closed: 1 }] });
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, hours: 24, expected_rate: 1500 }, now), { status: 409 });
  assert.equal(fixture.commits(), 0);
});

for (const [name, booking] of [
  ['nightly', { stay_duration_hours: null }], ['cancelled', { status: 'cancelled' }],
  ['unconfirmed', { status: 'pending' }], ['completed', { status: 'completed' }],
  ['archived', { archived: 1 }], ['refunded', { payment_status: 'refunded' }]
]) {
  test(`${name} bookings cannot be extended`, async t => {
    const fixture = setup(t, { booking });
    await assert.rejects(extendHourlyStay(actor, 10, body, now), { status: 409 });
    assert.equal(fixture.commits(), 0);
  });
}

test('extensions are restricted to checked-in time windows and must cover the current time', async t => {
  const fixture = setup(t);
  await assert.rejects(extendHourlyStay(actor, 10, body, Date.parse('2026-11-01T00:00:00Z')), /after check-in/);
  await assert.rejects(extendHourlyStay(actor, 10, body, Date.parse('2026-11-01T08:00:00Z')), /cover the current time/);
  assert.equal(fixture.commits(), 0);
});

test('missing guest approval, malformed input, and unauthorized users cannot extend a stay', async t => {
  const fixture = setup(t);
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, guest_agreed: false }, now), { status: 400 });
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, hours: '3 OR 1=1' }, now), { status: 400 });
  await assert.rejects(extendHourlyStay(actor, 10, { ...body, request_key: '' }, now), { status: 400 });
  await assert.rejects(extendHourlyStay({ user_id: 100, role: 'user' }, 10, body, now), { status: 403 });
  await assert.rejects(extendHourlyStay({ user_id: 6, role: 'owner' }, 10, body, now), { status: 404 });
  assert.equal(fixture.connections(), 0);
});

test('a storage failure rolls back the checkout, total, status, and audit history together', async t => {
  const fixture = setup(t, { writeFailure: true });
  const original = structuredClone(fixture.row());
  await assert.rejects(extendHourlyStay(actor, 10, body, now), /Fixture storage failure/);
  assert.deepEqual(fixture.row(), original);
  assert.equal(fixture.rollbacks(), 1);
  assert.equal(fixture.releases(), 1);
});

test('inconsistent paid flags do not fabricate payment history or charge the original stay again', async t => {
  const fixture = setup(t, { paid: 0 });
  await assert.rejects(extendHourlyStay(actor, 10, body, now), /reconciliation/);
  assert.equal(fixture.row().payment_status, 'paid');
  assert.equal(fixture.calls.some(call => call.sql.startsWith('UPDATE')), false);
});

test('subsequent approvals append history and extend the latest checkout', async t => {
  const fixture = setup(t);
  await extendHourlyStay(actor, 10, body, now);
  const next = await extendHourlyStay(actor, 10, { ...body, hours: 12, expected_rate: 750,
    expected_checkout_at: '2026-11-01 15:00:00', request_key: '11234567-89ab-4cde-8fab-0123456789ab' }, now);
  assert.equal(next.booking.check_out_at, '2026-11-02 03:00:00');
  assert.equal(next.booking.total_amount, 1250);
  assert.equal(next.booking.stay_duration_hours, 18);
  assert.equal(JSON.parse(fixture.row().policy_snapshot).stay_extensions.length, 2);
  const replay = await extendHourlyStay(actor, 10, body, now);
  assert.equal(replay.replayed, true);
  assert.equal(fixture.row().total_amount, 1250);
});

test('room capacity, missing packages, and currency changes are checked before extension approval', async t => {
  const fixture = setup(t, { room: { capacity: 0 } });
  await assert.rejects(extendHourlyStay(actor, 10, body, now), /accommodate/);
  assert.equal(fixture.commits(), 0);
});

for (const [name, options] of [
  ['unconfigured package', { room: { hourly_rates: '{}' } }],
  ['changed currency', { room: { currency: 'USD' } }],
  ['inactive room', { missingRoom: true }],
  ['closed room inventory', { roomDays: [{ availability_date: '2026-11-01', is_closed: 1 }] }],
  ['corrupt history', { booking: { policy_snapshot: '{"stay_extensions":[null]}' } }]
]) {
  test(`${name} prevents checkout and financial changes`, async t => {
    const fixture = setup(t, options);
    await assert.rejects(extendHourlyStay(actor, 10, body, now));
    assert.equal(fixture.commits(), 0);
    assert.equal(fixture.calls.some(call => call.sql.startsWith('UPDATE')), false);
  });
}

test('ownership is rechecked under the booking lock before any update', async t => {
  const fixture = setup(t, { revokeOwnership: true });
  await assert.rejects(extendHourlyStay(actor, 10, body, now), { status: 404 });
  assert.equal(fixture.connections(), 1);
  assert.equal(fixture.rollbacks(), 1);
  assert.equal(fixture.calls.some(call => call.sql.startsWith('UPDATE')), false);
});

for (const [paid, payment_status] of [[0, 'unpaid'], [100, 'partial'], [1000, 'paid']]) {
  test(`an extension with ${paid} actually received leaves payment status ${payment_status}`, async t => {
    setup(t, { paid, booking: { payment_status: paid ? 'partial' : 'unpaid' } });
    const result = await extendHourlyStay(actor, 10, body, now);
    assert.equal(result.booking.payment_status, payment_status);
    assert.equal(result.booking.total_amount, 500);
  });
}

test('extension endpoints require login, hotel ownership and owner/admin privileges', async t => {
  clearUserColumnCache();
  const fixture = setup(t, { booking: { check_in: '2020-01-01', check_out: '2099-01-01',
    check_in_at: '2020-01-01 09:00:00', check_out_at: '2099-01-01 12:00:00' } });
  const app = express(); app.use(express.json()); app.use('/owner', ownerRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (userId, data) => fetch(`http://127.0.0.1:${server.address().port}/owner/bookings/10/${data ? 'extend' : 'extension-options'}`, {
    method: data ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET)}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  assert.equal((await request(null)).status, 401);
  assert.equal((await request(6)).status, 404);
  const response = await request(5);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).packages.map(item => item.hours), [3, 12, 24]);
  assert.equal((await request(5, { ...body, guest_agreed: false })).status, 400);
  assert.equal(fixture.calls.some(call => call.sql.startsWith('UPDATE')), false);
});

for (const options of [{ role: 'user' }, { limited: true }]) {
  test(`${options.limited ? 'limited owners' : 'guest accounts'} cannot access extension routes`, async t => {
    clearUserColumnCache();
    const fixture = setup(t, options);
    const app = express(); app.use(express.json()); app.use('/owner', ownerRouter);
    const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
    for (const [suffix, method] of [['extension-options', 'GET'], ['extend', 'POST']]) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/owner/bookings/10/${suffix}`, {
        method, headers: { Authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` }
      });
      assert.equal(response.status, 403);
    }
    assert.equal(fixture.connections(), 0);
  });
}
