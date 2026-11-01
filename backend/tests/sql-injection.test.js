import test from 'node:test';
import assert from 'node:assert/strict';
import db, { execute } from '../db.js';
import { normalizeSqlParams, sqlPlaceholders } from '../utils/sqlParams.js';
import { getHotelLegitimacy } from '../utils/legitimacy.js';

test('runtime pool disables stacked statements and object-to-assignment expansion', () => {
  assert.equal(db.config.connectionConfig.multipleStatements, false);
  assert.equal(db.config.connectionConfig.stringifyObjects, true);
  // Use the real driver's formatter, without opening a database connection.
  assert.equal(db.format('SELECT user_id FROM users WHERE user_id = ?', [{ user_id: 1 }]),
    "SELECT user_id FROM users WHERE user_id = '[object Object]'");
});

for (const value of ["' OR '1'='1", "'; DROP TABLE users; --", "O'Connor", 'Back\\slash; ? café 日本語']) {
  test(`prepared helper keeps text separate from SQL (${JSON.stringify(value)})`, async t => {
    const calls = [];
    t.mock.method(db, 'promise', () => ({ execute: async (sql, params) => {
      calls.push({ sql, params });
      return [[{ name: params[0] }], []];
    } }));
    const sql = 'SELECT name FROM attractions WHERE name = ?';
    const [rows] = await execute(sql, [value]);
    assert.deepEqual(calls, [{ sql, params: [value] }]);
    assert.equal(rows[0].name, value);
  });
}

test('optional undefined values become NULL without altering valid parameter types', async t => {
  const date = new Date('2026-11-01T12:00:00Z');
  const binary = Buffer.from('image');
  const params = [undefined, null, '', 0, false, 1n, date, binary];
  t.mock.method(db, 'promise', () => ({ execute: async (sql, values) => {
    assert.deepEqual(values, [null, null, '', 0, false, 1n, date, binary]);
    return [{ affectedRows: 1 }, []];
  } }));
  assert.equal((await execute('INSERT INTO example VALUES (?, ?, ?, ?, ?, ?, ?, ?)', params))[0].affectedRows, 1);
  assert.equal(params[0], undefined, 'normalization must not modify the caller array');
});

test('objects, nested lists, raw-SQL objects, and invalid numbers never reach prepared execution', async t => {
  let calls = 0;
  t.mock.method(db, 'promise', () => ({ execute: async () => { calls++; } }));
  for (const value of [{ user_id: 1 }, { toSqlString: () => '1 OR 1=1' }, [1, 2], NaN, Infinity, new Date('invalid'), () => 'SQL']) {
    await assert.rejects(execute('SELECT * FROM users WHERE user_id = ?', [value]), { status: 400 });
  }
  assert.equal(calls, 0);
  assert.throws(() => normalizeSqlParams({ id: 1 }), /must be an array/);
});

test('list expansion interpolates only placeholder counts and handles empty input explicitly', () => {
  assert.equal(sqlPlaceholders([1]), '?');
  assert.equal(sqlPlaceholders([1, "2) OR 1=1 --", 3]), '?, ?, ?');
  assert.throws(() => sqlPlaceholders([]), /must not be empty/);
  assert.throws(() => sqlPlaceholders('1, 2'), /must not be empty/);
});

test('hotel legitimacy badges retain per-hotel booking eligibility with a bound ID list', async t => {
  const calls = [];
  t.mock.method(db, 'promise', () => ({ execute: async (sql, params) => {
    calls.push({ sql, params });
    return [[
      { hotel_id: 8, permit: 1, dot: 1, philgeps: 0 },
      { hotel_id: 9, permit: 1, dot: 0, philgeps: 0 }
    ]];
  } }));
  const result = await getHotelLegitimacy([8, '9', 8, '1) OR 1=1 --', null, -1, 1.5]);
  assert.equal(result.ok, true);
  assert.equal(result.map.get(8).booking_enabled, true);
  assert.equal(result.map.get(9).booking_enabled, false);
  assert.match(calls[0].sql, /WHERE ho.hotel_id IN \(\?, \?\)/);
  assert.deepEqual(calls[0].params, [8, 9]);
  assert.doesNotMatch(calls[0].sql, /OR 1=1/);
  await getHotelLegitimacy([]);
  assert.equal(calls.length, 1, 'empty hotel lists must not issue SQL');
});
