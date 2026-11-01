import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingInterval, DAY_MS, HOUR_MS, localTimeMs, makeStay, parseHourlyRates, parsePaymentPlans, peakBookedRooms, serializeStay } from '../utils/stayOptions.js';
import { validateStayInventory } from '../services/stayInventory.js';
import { ensureHourlyStaySchema } from '../utils/dbSchema.js';
import { fetchHotelAvailabilityDays } from '../utils/hotelAvailability.js';
import db from '../db.js';

const now = Date.parse('2026-11-01T00:00:00Z'); // 08:00 Philippine time.
const input = { check_in: '2026-11-02', check_in_time: '09:00', stay_duration_hours: 3 };
const reservation = (start, end, extra = {}) => ({
  check_in: start.slice(0, 10), check_out: end.slice(0, 10), check_in_at: start, check_out_at: end,
  rooms: 1, user_id: 99, room_id: 7, ...extra
});

for (const [hours, time, date, checkout, nights] of [
  [3, '09:00', '2026-11-02', '12:00', 0],
  [12, '18:00', '2026-11-03', '06:00', 1],
  [24, '09:00', '2026-11-03', '09:00', 1],
  [3, '23:30', '2026-11-03', '02:30', 1]
]) {
  test(`${hours}-hour package at ${time} calculates its exact automatic checkout`, () => {
    const stay = makeStay({ ...input, stay_duration_hours: hours, check_in_time: time }, {}, now);
    assert.equal(stay.checkOutAt, `${date} ${checkout}:00`);
    assert.equal(stay.end - stay.start, hours * HOUR_MS);
    assert.equal(stay.units, 1);
    assert.equal(stay.nights, nights);
  });
}

test('nightly stays retain per-night billing and hotel check-in/out policy times', () => {
  const stay = makeStay({ check_in: '2026-11-02', check_out: '2026-11-04' }, { check_in_time: '15:00', check_out_time: '11:00' }, now);
  assert.equal(stay.hours, null);
  assert.equal(stay.units, 2);
  assert.equal(stay.checkInAt, '2026-11-02 15:00:00');
  assert.equal(stay.checkOutAt, '2026-11-04 11:00:00');
});

test('invalid dates, invalid durations, and past check-in times are rejected', () => {
  for (const change of [
    { check_in: '2026-02-30' }, { check_in: '2026-13-01' }, { check_in: "2026-11-02' OR 1=1" },
    { stay_duration_hours: 0 }, { stay_duration_hours: 6 }, { stay_duration_hours: -3 },
    { check_in_time: '24:00' }, { check_in_time: '09:60' }, { check_in_time: '' },
    { check_in: '2026-11-01', check_in_time: '07:59' }
  ]) assert.throws(() => makeStay({ ...input, ...change }, {}, now), { status: 400 });
  assert.throws(() => makeStay({ check_in: '2026-11-02', check_out: '2026-11-02' }, {}, now), { status: 400 });
});

test('hourly rates accept multipart JSON, preserve decimal prices, and reject malformed configuration', () => {
  assert.deepEqual(parseHourlyRates('{"3":"349.99","12":"","24":1500}', true), { 3: 349.99, 24: 1500 });
  assert.deepEqual(parseHourlyRates({}, true), {});
  assert.deepEqual(parseHourlyRates(null), {});
  for (const rates of ['not JSON', [], { 6: 100 }, { 3: -1 }, { 3: 0 }, { 3: 1.001 }, { 3: true }, { 3: 'NaN' }]) {
    assert.throws(() => parseHourlyRates(rates, true), { status: 400 });
  }
});

test('payment plan configuration preserves legacy defaults but never re-enables explicitly disabled plans', () => {
  assert.deepEqual(parsePaymentPlans(null), ['reservation', 'half', 'full']);
  assert.deepEqual(parsePaymentPlans('["half"]', true), ['half']);
  assert.deepEqual(parsePaymentPlans('[]'), []);
  assert.deepEqual(parsePaymentPlans('corrupt'), []);
  for (const plans of [[], ['cash'], {}, null, 'half']) assert.throws(() => parsePaymentPlans(plans, true), { status: 400 });
});

test('availability counts peak simultaneous usage, not the sum of non-overlapping stays', () => {
  const rows = [reservation('2026-11-02 09:00:00', '2026-11-02 12:00:00'), reservation('2026-11-02 12:00:00', '2026-11-02 15:00:00')];
  const start = localTimeMs('2026-11-02 08:00:00'), end = start + 12 * HOUR_MS;
  assert.equal(peakBookedRooms(rows, start, end), 1);
  assert.equal(peakBookedRooms(rows, localTimeMs('2026-11-02 15:00:00'), end), 0);
  assert.equal(peakBookedRooms([...rows, reservation('2026-11-02 11:30:00', '2026-11-02 13:00:00')], start, end), 2);
});

test('legacy overnight bookings retain their frozen check-in and checkout times', () => {
  const booking = { check_in: '2026-11-01', check_out: '2026-11-02', rooms: 1,
    policy_snapshot: '{"check_in_time":"16:00","check_out_time":"11:00"}' };
  const interval = bookingInterval(booking);
  assert.equal(interval.end - interval.start, 19 * HOUR_MS);
  assert.equal(peakBookedRooms([booking], localTimeMs('2026-11-02 08:00:00'), localTimeMs('2026-11-02 10:00:00')), 1);
  assert.equal(peakBookedRooms([booking], localTimeMs('2026-11-02 11:00:00'), localTimeMs('2026-11-02 14:00:00')), 0);
  const row = serializeStay({ check_in: new Date(2026, 10, 2), check_out: new Date(2026, 10, 2), check_in_at: new Date(2026, 10, 2, 9), check_out_at: new Date(2026, 10, 2, 12) });
  assert.equal(row.check_in, '2026-11-02');
  assert.equal(row.check_in_at, '2026-11-02 09:00:00');
});

const inventory = (bookings = [], overrides = [], roomOverrides = [], fail = false) => ({
  execute: async (sql, params) => {
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (fail) throw new Error('Database unavailable');
    if (sql.includes('FROM hotel_bookings')) return [bookings.filter(row => Number(row.booking_id) !== params[4])];
    if (sql.includes('FROM hotel_availability')) return [overrides];
    if (sql.includes('FROM room_inventory')) return [roomOverrides];
    throw new Error(`Unexpected query: ${sql}`);
  }
});
const hotel = { hotel_id: 8, rooms_total: 1 };
const room = { room_id: 7, quantity_available: 1, room_type_name: 'Economy' };

test('back-to-back hourly reservations reuse a room but overlapping stays are blocked', async () => {
  const stay = makeStay(input, {}, now);
  const earlier = reservation('2026-11-02 06:00:00', '2026-11-02 09:00:00');
  await validateStayInventory(inventory([earlier]), hotel, room, stay, 1, 5);
  const overlap = reservation('2026-11-02 08:00:00', '2026-11-02 10:00:00');
  await assert.rejects(validateStayInventory(inventory([overlap]), hotel, room, stay, 1, 5), { status: 409 });
});

test('hotel and room-type limits, duplicate bookings, and all occupied closed dates are enforced', async () => {
  const stay = makeStay({ ...input, check_in_time: '23:00' }, {}, now);
  await assert.rejects(validateStayInventory(inventory([], [{ availability_date: '2026-11-03', is_closed: 1 }]), hotel, room, stay, 1, 5), { status: 409 });
  await assert.rejects(validateStayInventory(inventory([], [], [{ availability_date: '2026-11-02', is_closed: 1 }]), hotel, room, stay, 1, 5), { status: 409 });
  await assert.rejects(validateStayInventory(inventory([], [], [{ availability_date: '2026-11-02', available_count: 0 }]), hotel, room, stay, 1, 5), { status: 409 });
  const duplicate = reservation('2026-11-02 22:00:00', '2026-11-03 03:00:00', { user_id: 5 });
  await assert.rejects(validateStayInventory(inventory([duplicate]), { ...hotel, rooms_total: 10 }, { ...room, quantity_available: 10 }, stay, 1, 5), /already have a booking/);
  await assert.rejects(validateStayInventory(inventory([], [], [], true), hotel, room, stay, 1, 5), /Database unavailable/);
});

test('booking modifications exclude their own inventory without excluding other bookings', async () => {
  const stay = makeStay(input, {}, now);
  const current = reservation(stay.checkInAt, stay.checkOutAt, { user_id: 5, booking_id: 10 });
  await validateStayInventory(inventory([current]), hotel, room, stay, 1, 5, 10);
});

test('nightly calendar counts only hourly bookings overlapping the property stay interval', async () => {
  let rows = [reservation('2026-11-02 09:00:00', '2026-11-02 12:00:00')];
  const dbLike = { query: async sql => {
    if (sql.startsWith('SHOW TABLES')) return [[]];
    if (sql.includes('FROM hotel_bookings')) return [rows];
    throw new Error(`Unexpected calendar query: ${sql}`);
  } };
  let days = await fetchHotelAvailabilityDays(dbLike, 8, '2026-11-02', '2026-11-02', 1);
  assert.equal(days[0].available, 1, 'morning hourly use must not block a later nightly check-in');
  rows = [reservation('2026-11-02 18:00:00', '2026-11-02 21:00:00')];
  days = await fetchHotelAvailabilityDays(dbLike, 8, '2026-11-02', '2026-11-02', 1);
  assert.equal(days[0].available, 0, 'evening hourly use overlaps an overnight stay');
});

test('hourly schema setup is additive, idempotent, and never rewrites financial history', async t => {
  const present = new Set(), statements = [];
  t.mock.method(console, 'log', () => {});
  t.mock.method(db, 'promise', () => ({ query: async (sql, params) => {
    if (sql.startsWith('SHOW COLUMNS')) return [present.has(params[0]) ? [{ Field: params[0] }] : []];
    assert.match(sql, /^ALTER TABLE `(hotels|rooms|hotel_bookings)` ADD COLUMN `/);
    present.add(sql.match(/ADD COLUMN `([^`]+)`/)[1]); statements.push(sql); return [{}];
  } }));
  await ensureHourlyStaySchema();
  await ensureHourlyStaySchema();
  assert.equal(statements.length, 6);
  assert.ok(statements.every(sql => !/UPDATE|DELETE|INSERT|MODIFY COLUMN/i.test(sql)));
});
