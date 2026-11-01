import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'hourly-reservations-tests-only-not-for-production';
process.env.SESSION_SECRET = 'hourly-reservations-session-only-not-for-production';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { createHourlyReservation, modifyHourlyReservation } = await import('../services/hourlyReservations.js');
const { createHotelBooking } = await import('../controllers/bookingsController.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');

const base = { hotel_id: 8, room_id: 7, check_in: '2099-12-20', check_out: '2099-12-20', check_in_time: '09:00',
  stay_duration_hours: 3, rooms: 1, guests: 2, payment_option: 'full', payment_method: 'pay_at_property', policy_agreed: true };

const setup = (t, options = {}) => {
  const hotel = { hotel_id: 8, name: 'Fixture Hotel', location: 'Naujan', rooms_total: 2, currency: 'PHP', is_active: 1,
    allowed_payment_methods: 'pay_at_property,card', allowed_payment_options: '["half","full"]', reservation_fee: 100, ...options.hotel };
  const room = { room_id: 7, room_type_name: 'Economy', capacity: 2, quantity_available: 2, price_per_night: 1200,
    currency: 'PHP', is_active: 1, hourly_rates: '{"3":300,"12":900,"24":1500}', ...options.room };
  const calls = [];
  let stored, committed = 0, rolledBack = 0, released = 0;
  const execute = async (sql, params = []) => {
    assert.equal((sql.match(/\?/g) || []).length, params.length, 'placeholder/value count must match');
    calls.push({ sql, params });
    if (sql.includes('SELECT * FROM hotels')) return [[hotel]];
    if (sql.includes('SELECT * FROM rooms')) return [[room]];
    if (sql.includes('AS reservation_expired FROM hotel_bookings')) return [[options.booking || stored]];
    if (sql.includes('FROM hotel_bookings')) return [options.overlaps || []];
    if (sql.includes('FROM hotel_availability') || sql.includes('FROM room_inventory')) return [[]];
    if (sql.includes('SUM(CASE WHEN status')) return [[{ amount_paid: options.paid ?? 0 }]];
    if (sql.includes('INSERT INTO hotel_bookings')) {
      const columns = sql.match(/hotel_bookings\s*\(([\s\S]*?)\)\s*VALUES/)[1].split(',').map(value => value.trim());
      const tokens = sql.match(/VALUES\s*\(([\s\S]*)\)/)[1].split(',').map(value => value.trim());
      let cursor = 0;
      stored = Object.fromEntries(columns.map((column, index) => [column, tokens[index] === '?' ? params[cursor++] : tokens[index].replaceAll("'", '')]));
      stored.booking_id = 10;
      return [{ insertId: 10 }];
    }
    if (sql.includes('UPDATE hotel_bookings SET booking_reference')) return [{ affectedRows: 1 }];
    if (sql.includes('INSERT INTO hotel_payments')) return [{ insertId: 20 }];
    if (sql.includes('UPDATE hotel_bookings SET check_in')) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected query ${sql}`);
  };
  const connection = { execute, beginTransaction: async () => {}, commit: async () => { committed++; },
    rollback: async () => { rolledBack++; }, release: () => { released++; } };
  t.mock.method(db, 'promise', () => ({ getConnection: async () => connection }));
  return { calls, hotel, room, connection, row: () => stored, committed: () => committed, rolledBack: () => rolledBack, released: () => released };
};

for (const [hours, checkout, total] of [[3, '2099-12-20 12:00:00', 300], [12, '2099-12-20 21:00:00', 900], [24, '2099-12-21 09:00:00', 1500]]) {
  test(`creates a ${hours}-hour reservation using the stored rate and computed checkout`, async t => {
    const fixture = setup(t);
    const id = await createHourlyReservation(5, { ...base, stay_duration_hours: hours,
      price_per_night: 1, total_amount: 1, currency: 'USD', pay_now: true, check_out: '2099-12-25' });
    assert.equal(id, 10);
    assert.equal(fixture.row().check_out_at, checkout);
    assert.equal(fixture.row().total_amount, total);
    assert.equal(fixture.row().stay_rate, total);
    assert.equal(fixture.row().currency, 'PHP');
    assert.equal(fixture.row().payment_status, 'unpaid');
    assert.equal(fixture.committed(), 1);
    assert.equal(fixture.released(), 1);
    assert.equal(fixture.rolledBack(), 0);
    const snapshot = JSON.parse(fixture.row().policy_snapshot);
    assert.equal(snapshot.timezone, 'Asia/Manila');
    assert.equal(snapshot.stay_duration_hours, hours);
    assert.deepEqual(snapshot.allowed_payment_options, ['half', 'full']);
    const payment = fixture.calls.find(call => call.sql.includes('INSERT INTO hotel_payments'));
    assert.equal(payment.params[1], total);
    assert.match(payment.sql, /'pending'/);
  });
}

test('the authenticated booking handler accepts same-day hourly dates and returns timed receipt details', async t => {
  const fixture = setup(t);
  t.mock.method(db, 'promise', () => ({
    getConnection: async () => fixture.connection,
    execute: async () => [[{ hotel_id: 8, permit: 1, dot: 1, philgeps: 0 }]],
    query: async () => [[{ ...fixture.row(), username: 'Fixture Guest', email: 'guest@example.test' }]]
  }));
  const response = { statusCode: null, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await createHotelBooking({ body: { ...base, hotel_name: 'Fixture Hotel' },
    headers: { authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` } }, response);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.booking.check_in, response.body.booking.check_out);
  assert.equal(response.body.receipt.nights, 0);
  assert.equal(response.body.receipt.stay_duration_hours, 3);
  assert.equal(response.body.receipt.check_out_at, '2099-12-20 12:00:00');
  assert.equal(response.body.receipt.amount_due_now, 300);
});

test('half-payment and reservation-fee plans calculate the correct first instalment', async t => {
  const fixture = setup(t, { hotel: { allowed_payment_options: '["reservation","half","full"]' } });
  await createHourlyReservation(5, { ...base, payment_option: 'half', rooms: 2 });
  assert.equal(fixture.row().total_amount, 600);
  assert.equal(fixture.calls.find(call => call.sql.includes('INSERT INTO hotel_payments')).params[1], 300);
  fixture.calls.length = 0;
  await createHourlyReservation(5, { ...base, payment_option: 'reservation' });
  assert.equal(fixture.calls.find(call => call.sql.includes('INSERT INTO hotel_payments')).params[1], 100);
});

for (const [name, options, change] of [
  ['disabled plan', {}, { payment_option: 'reservation' }],
  ['unconfigured package', { room: { hourly_rates: '{}' } }, {}],
  ['disabled method', {}, { payment_method: 'paypal' }],
  ['too many guests', {}, { guests: 3 }],
  ['unavailable room quantity', {}, { rooms: 3 }],
  ['invalid fractional room quantity', {}, { rooms: 1.5 }],
  ['missing policy agreement', {}, { policy_agreed: false }],
  ['closed room type', { room: { is_active: 0 } }, {}]
]) {
  test(`rejects ${name} without committing a booking or payment`, async t => {
    const fixture = setup(t, options);
    await assert.rejects(createHourlyReservation(5, { ...base, ...change }));
    assert.equal(fixture.committed(), 0);
    assert.equal(fixture.calls.some(call => call.sql.includes('INSERT INTO')), false);
  });
}

test('modification retains the original duration and rate even after owner settings change', async t => {
  const booking = { ...base, booking_id: 10, user_id: 5, status: 'confirmed', archived: 0, payment_status: 'partial',
    stay_rate: 300, total_amount: 300, check_in_at: '2099-12-20 09:00:00', check_out_at: '2099-12-20 12:00:00',
    policy_snapshot: '{"reservation_fee":100,"balance_due_days":1,"payment_option":"reservation"}' };
  const fixture = setup(t, { booking, paid: 100, hotel: { allowed_payment_options: '["full"]', reservation_fee: 500 }, room: { hourly_rates: '{"3":999}' } });
  await modifyHourlyReservation(5, booking, { ...base, check_in: '2099-12-21', check_in_time: '10:00', stay_duration_hours: 24 });
  const update = fixture.calls.find(call => call.sql.includes('UPDATE hotel_bookings SET check_in'));
  assert.deepEqual(update.params.slice(0, 4), ['2099-12-21', '2099-12-21', '2099-12-21 10:00:00', '2099-12-21 13:00:00']);
  assert.equal(update.params[7], 300);
  assert.equal(JSON.parse(update.params[9]).reservation_fee, 100);
  assert.equal(fixture.committed(), 1);
});

test('modification cannot lower a total below money already received', async t => {
  const booking = { ...base, booking_id: 10, user_id: 5, status: 'confirmed', archived: 0, payment_status: 'partial',
    stay_rate: 300, check_in_at: '2099-12-20 09:00:00', check_out_at: '2099-12-20 12:00:00' };
  const fixture = setup(t, { booking, paid: 400 });
  await assert.rejects(modifyHourlyReservation(5, booking, base), /lower than the amount already paid/);
  assert.equal(fixture.committed(), 0);
  assert.equal(fixture.rolledBack(), 1);
});

test('nightly bookings also reject an owner-disabled payment plan', async t => {
  t.mock.method(db, 'promise', () => ({
    execute: async () => [[{ hotel_id: 8, permit: 1, dot: 1, philgeps: 0 }]],
    getConnection: async () => ({ beginTransaction: async () => {}, rollback: async () => {}, release: () => {}, query: async sql => {
      if (sql.includes('SELECT booking_id')) return [[]];
      if (sql.includes('FROM hotels')) return [[{ hotel_id: 8, allowed_payment_options: '["full"]' }]];
      throw new Error('Disabled plan must stop before any other query');
    } })
  }));
  const response = { statusCode: null, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  await createHotelBooking({ body: { ...base, stay_duration_hours: null, hotel_name: 'Fixture', check_out: '2099-12-21', price_per_night: 1200, payment_option: 'half' },
    headers: { authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` } }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /disabled/);
});

test('owner payment plans are authenticated, scoped to the hotel, and cannot all be disabled', async t => {
  clearUserColumnCache();
  const writes = [];
  let plans = '["half","full"]', fee = 100;
  t.mock.method(db, 'promise', () => ({
    query: async (sql, params = []) => {
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{ user_id: params[0], role: 'owner', email_verified: 1, archived: 0 }]];
      if (sql.includes('FROM hotel_owners')) return [Number(params[1]) === 8 ? [{ hotel_id: 8 }] : []];
      if (sql.startsWith('UPDATE hotels')) { writes.push({ sql, params }); plans = params[1]; fee = params[0]; return [{ affectedRows: 1 }]; }
      throw new Error(`Unexpected query: ${sql}`);
    },
    execute: async () => [[{ reservation_fee: fee, allowed_payment_options: plans }]]
  }));
  const app = express(); app.use(express.json()); app.use('/owner', ownerRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (id, body, auth = true) => fetch(`http://127.0.0.1:${server.address().port}/owner/hotels/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` } : {}) },
    body: JSON.stringify(body)
  });
  assert.equal((await request(8, { allowed_payment_options: [] })).status, 400);
  assert.equal((await request(8, { allowed_payment_options: ['reservation'], reservation_fee: 0 })).status, 400);
  assert.equal((await request(9, { allowed_payment_options: ['full'] })).status, 403);
  assert.equal((await request(8, { allowed_payment_options: ['full'] }, false)).status, 401);
  const response = await request(8, { allowed_payment_options: ['half'], reservation_fee: 100 });
  assert.equal(response.status, 200);
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0].params[1]), ['half']);
  assert.equal(writes[0].params.at(-1), '8');
});
