import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { parsePolicyFields } from '../utils/policyFields.js';

process.env.JWT_SECRET = 'hotel-policy-tests-only-not-for-production';
process.env.SESSION_SECRET = 'hotel-policy-session-tests-only-not-for-production';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { getHotels, getHotelById } = await import('../controllers/hotelsController.js');
const { createHotelBooking } = await import('../controllers/bookingsController.js');
const { ensureHotelPolicySchema } = await import('../utils/dbSchema.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');

const wording = {
  payment_terms_text: 'Pay at the property.',
  modification_policy_text: 'One free change.',
  noshow_policy_text: 'Please call if arriving late.'
};

test('policy text writes preserve omitted values and normalize explicit resets', () => {
  assert.deepEqual(parsePolicyFields({}).fields, {});
  assert.deepEqual(parsePolicyFields({ description: 'Unrelated edit' }).fields, {});
  for (const [column, text] of Object.entries(wording)) {
    assert.deepEqual(parsePolicyFields({ [column]: `  ${text}  ` }).fields, { [column]: text });
    for (const blank of ['', ' \n ', null]) {
      assert.deepEqual(parsePolicyFields({ [column]: blank }).fields, { [column]: null });
    }
    for (const invalid of [false, 42, [], {}, 'x'.repeat(4001)]) {
      assert.match(parsePolicyFields({ [column]: invalid }).error, /text with at most 4000/);
    }
    assert.equal(parsePolicyFields({ [column]: 'x'.repeat(4000) }).fields[column].length, 4000);
  }
});

test('startup adds only missing policy text columns and can run again safely', async t => {
  const added = new Set();
  const ddl = [];
  t.mock.method(console, 'log', () => {});
  t.mock.method(db, 'promise', () => ({ query: async (sql, params) => {
    if (sql.startsWith('SHOW COLUMNS')) {
      const column = params[0];
      return [!Object.hasOwn(wording, column) || added.has(column) ? [{ Field: column }] : []];
    }
    assert.match(sql, /^ALTER TABLE `hotels` ADD COLUMN `[a-z_]+` TEXT NULL AFTER/);
    added.add(sql.match(/ADD COLUMN `([^`]+)`/)[1]);
    ddl.push(sql);
    return [{}];
  } }));
  await ensureHotelPolicySchema();
  await ensureHotelPolicySchema();
  assert.deepEqual([...added], Object.keys(wording));
  assert.equal(ddl.length, 3);
});

test('owner policy saves are scoped, parameterized, and do not rewrite bookings', async t => {
  clearUserColumnCache();
  const writes = [];
  const stored = { hotel_id: 8, ...wording };
  const query = async (sql, params = []) => {
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: 5, role: 'owner', email_verified: 1, archived: 0 }]];
    if (sql.includes('FROM hotel_owners')) return [Number(params[1]) === 8 ? [{ hotel_id: 8 }] : []];
    if (sql.startsWith('UPDATE hotels')) {
      writes.push({ sql, params });
      const columns = [...sql.matchAll(/([a-z_]+) = \?/g)].map(match => match[1]);
      columns.pop(); // WHERE hotel_id
      columns.forEach((column, index) => { stored[column] = params[index]; });
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('SELECT h.*')) return [[stored]];
    throw new Error(`Unexpected query: ${sql}`);
  };
  t.mock.method(db, 'promise', () => ({ query, execute: async () => [[{ hotel_id: 8, permit: 1, dot: 1 }]] }));
  const app = express(); app.use(express.json()); app.use('/owner', ownerRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const token = jwt.sign({ user_id: 5 }, JWT_SECRET);
  const request = (id, body, auth = true) => fetch(`http://127.0.0.1:${server.address().port}/owner/hotels/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body)
  });
  assert.equal((await request(9, wording)).status, 403);
  assert.equal((await request(8, wording, false)).status, 401);
  assert.equal((await request(8, { noshow_policy_text: {} })).status, 400);
  const literal = "Owner's wording <b>stays plain text</b>";
  assert.equal((await request(8, { payment_terms_text: literal, noshow_policy_text: '' })).status, 200);
  assert.equal(writes.length, 1);
  assert.doesNotMatch(writes[0].sql, /hotel_bookings|modification_policy_text|Owner's/);
  assert.deepEqual(writes[0].params, [literal, null, '8']);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/owner/hotels`, { headers: { Authorization: `Bearer ${token}` } });
  const [readback] = await response.json();
  assert.equal(readback.payment_terms_text, literal);
  assert.equal(readback.modification_policy_text, wording.modification_policy_text);
  assert.equal(readback.noshow_policy_text, null);
});

test('new owner listings persist all three policy text fields', async t => {
  clearUserColumnCache();
  let inserted;
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {},
    query: async (sql, params) => {
      assert.equal((sql.match(/\?/g) || []).length, params.length);
      if (sql.includes('INSERT INTO hotels')) {
        const columns = sql.match(/hotels\s*\(([^)]+)\)/)[1].split(',').map(column => column.trim());
        inserted = Object.fromEntries(columns.map((column, index) => [column, params[index]]));
        return [{ insertId: 8 }];
      }
      assert.match(sql, /INSERT INTO hotel_owners/);
      return [{ affectedRows: 1 }];
    }
  };
  t.mock.method(db, 'promise', () => ({ getConnection: async () => connection, query: async sql => {
    if (sql.includes('information_schema.columns') || sql.includes('FROM hotel_owners')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: 5, role: 'owner', email_verified: 1, archived: 0 }]];
    throw new Error(`Unexpected query: ${sql}`);
  } }));
  const app = express(); app.use(express.json()); app.use('/owner', ownerRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/owner/hotels`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` },
    body: JSON.stringify({ name: 'Fixture Inn', location: 'Naujan', price_per_night: 260, ...wording })
  });
  assert.equal(response.status, 201, JSON.stringify(await response.json()));
  for (const [column, text] of Object.entries(wording)) assert.equal(inserted[column], text);
});

test('both public hotel endpoints select and expose the stored owner wording', async t => {
  const calls = [];
  t.mock.method(db, 'promise', () => ({
    query: async sql => {
      if (sql.startsWith('SHOW COLUMNS')) return [[{ Field: 'available' }]];
      calls.push(sql);
      for (const column of Object.keys(wording)) assert.ok(sql.includes(column), column);
      return [[{ id: 8, name: 'Fixture Inn', ...wording }]];
    },
    execute: async () => [[{ hotel_id: 8, permit: 1, dot: 1 }]]
  }));
  const response = () => ({ status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
  const listing = response(), detail = response();
  await getHotels({ language: 'en' }, listing);
  await getHotelById({ language: 'en', params: { id: 8 } }, detail);
  for (const [column, text] of Object.entries(wording)) {
    assert.equal(listing.body.data[0][column], text);
    assert.equal(detail.body[column], text);
  }
  assert.equal(calls.length, 2);
});

for (const hourly of [false, true]) {
  test(`${hourly ? 'hourly' : 'nightly'} bookings freeze owner wording from the database, not the guest payload`, async t => {
    const hotel = { hotel_id: 8, name: 'Fixture Inn', location: 'Naujan', is_active: 1, rooms_total: 10,
      currency: 'PHP', allowed_payment_options: '["full"]', allowed_payment_methods: 'pay_at_property', ...wording };
    let stored;
    const run = async (sql, params = []) => {
      assert.equal((sql.match(/\?/g) || []).length, params.length, sql);
      if (sql.includes('FROM hotel_owners ho')) return [[{ hotel_id: 8, permit: 1, dot: 1 }]];
      if (sql.includes('FROM hotels')) {
        if (!hourly) for (const column of Object.keys(wording)) assert.ok(sql.includes(column), column);
        return [[hotel]];
      }
      if (sql.includes('FROM rooms')) return [[{ room_id: 7, room_type_name: 'Queen', capacity: 2, quantity_available: 10,
        is_active: 1, currency: 'PHP', hourly_rates: '{"3":300}' }]];
      if (sql.includes('INSERT INTO hotel_bookings')) {
        const columns = sql.match(/hotel_bookings\s*\(([^)]+)\)/)[1].split(',').map(value => value.trim());
        const tokens = sql.match(/VALUES\s*\(([\s\S]*)\)/)[1].split(',').map(value => value.trim());
        let index = 0;
        stored = Object.fromEntries(columns.map((column, position) => [column, tokens[position] === '?' ? params[index++] : tokens[position].replaceAll("'", '')]));
        stored.booking_id = 10;
        return [{ insertId: 10 }];
      }
      if (sql.includes('FROM hotel_bookings b')) return [[stored]];
      if (sql.includes('FROM hotel_bookings') || sql.includes('FROM hotel_availability') || sql.includes('FROM room_inventory') || sql.startsWith('SHOW TABLES')) return [[]];
      if (sql.includes('SELECT * FROM hotel_payments')) return [[]];
      if (sql.startsWith('UPDATE hotel_bookings SET booking_reference') || sql.includes('INSERT INTO hotel_payments')) return [{ affectedRows: 1 }];
      throw new Error(`Unexpected query: ${sql}`);
    };
    const connection = { query: run, execute: run, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} };
    t.mock.method(db, 'promise', () => ({ query: run, execute: run, getConnection: async () => connection }));
    const response = { status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
    await createHotelBooking({
      headers: { authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` },
      body: { hotel_id: 8, hotel_name: 'Fixture Inn', currency: 'PHP', price_per_night: 300,
        check_in: '2099-12-20', check_out: hourly ? '2099-12-20' : '2099-12-21',
        ...(hourly ? { room_id: 7, stay_duration_hours: 3, check_in_time: '09:00' } : {}),
        guests: 2, rooms: 1, payment_method: 'pay_at_property', payment_option: 'full', policy_agreed: true, pay_now: false,
        payment_terms_text: 'Forged guest wording', policy_snapshot: { noshow_policy_text: 'Forged terms' } }
    }, response);
    assert.equal(response.statusCode, 201, JSON.stringify(response.body));
    const snapshot = JSON.parse(stored.policy_snapshot);
    for (const [column, text] of Object.entries(wording)) {
      assert.equal(snapshot[column], text);
      assert.equal(response.body.receipt.policy_snapshot[column], text);
      hotel[column] = 'Owner edit made after booking';
    }
    assert.deepEqual(JSON.parse(stored.policy_snapshot), snapshot);
  });
}
