import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

// Exercise real HTTP/multipart/auth middleware with a fake database. No real
// database or payment gateway is contacted by these regression tests.
process.env.JWT_SECRET = 'room-management-tests-only-not-a-production-secret';
process.env.SESSION_SECRET = 'room-management-tests-only-not-a-production-session';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: router } = await import('../controllers/ownerController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { getHotelRooms } = await import('../controllers/hotelsController.js');

const setup = async (t, options = {}) => {
  clearUserColumnCache();
  let row = {
    room_id: 7, hotel_id: 8, room_type_name: 'Economy', capacity: 2,
    price_per_night: '349.99', quantity_available: 10,
    amenities: '["Wi-Fi"]', room_features: '[]', image_urls: '[]',
    primary_image_url: null, perfect_for: null, common_questions: null,
    ...options.room
  };
  const writes = [];
  const logs = [];
  t.mock.method(db, 'promise', () => ({
    query: async (sql, params = []) => {
      if (sql.includes('INSERT INTO system_logs')) {
        if (options.logError) throw new Error('Logging unavailable');
        logs.push({ level: params[0], source: params[1], message: params[2], meta: JSON.parse(params[3]), user_id: params[4] });
        return [{ insertId: 1 }];
      }
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{
        user_id: 5, role: options.role || 'owner', email_verified: 1, archived: 0
      }]];
      if (sql.includes('FROM hotel_owners') || sql.includes('INNER JOIN hotel_owners')) {
        return [options.denied ? [] : [{ room_id: 7 }]];
      }
      if (sql.startsWith('UPDATE rooms')) {
        writes.push({ sql, params });
        if (options.sqlError) throw Object.assign(new Error('Test database error'), { code: options.sqlError });
        const fields = sql.match(/SET (.*) WHERE/)[1].split(', ').map(field => field.split(' = ')[0]);
        const update = Object.fromEntries(fields.map((field, i) => [field, params[i]]));
        assert.ok(!update.primary_image_url || update.primary_image_url.length <= 500);
        row = { ...row, ...update };
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('INSERT INTO rooms')) {
        writes.push({ sql, params });
        if (options.sqlError) throw Object.assign(new Error('Test database error'), { code: options.sqlError });
        const fields = sql.match(/INSERT INTO rooms \(([\s\S]*?)\)\s*VALUES/)[1].split(/,\s*/);
        row = { ...row, ...Object.fromEntries(fields.map((field, i) => [field, [...params, 1][i]])), room_id: 9 };
        return [{ insertId: 9 }];
      }
      if (sql.includes('FROM rooms')) return [[row]];
      throw new Error(`Unexpected test query: ${sql}`);
    }
  }));
  const app = express();
  app.use(express.json());
  app.get('/api/hotels/:id/rooms', getHotelRooms);
  app.use('/api/owner', router);
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}/api/owner/hotels/8/rooms`;
  const token = jwt.sign({ user_id: 5 }, JWT_SECRET, { expiresIn: '1m' });
  const request = (path = '/7', fields, method = 'PUT', authenticated = true) => {
    const body = fields ? new FormData() : undefined;
    for (const [field, value] of Object.entries(fields || {})) body.append(field, value);
    return fetch(`${base}${path}`, {
      method, body, headers: authenticated ? { Authorization: `Bearer ${token}` } : {}
    });
  };
  const publicRooms = () => fetch(`http://127.0.0.1:${server.address().port}/api/hotels/8/rooms`);
  return { request, writes, logs, publicRooms, row: () => row };
};

test('multipart updates preserve JSON lists and the cover remains a real URL', async (t) => {
  const { request, row, logs } = await setup(t);
  for (let i = 0; i < 3; i++) {
    const response = await request('/7', {
      room_type_name: 'Economy Couples', price_per_night: '400.00',
      amenities: '["Wi-Fi","Air conditioning"]', room_features: '["Mountain, lake view"]',
      image_urls: '["/uploads/hotels/room.jpg","https://example.test/second.jpg"]',
      check_in_time: '14:00', check_out_time: '11:00',
      smoking_allowed: '0', pets_allowed: '1', events_allowed: '0', is_active: '0'
    });
    assert.equal(response.status, 200);
    assert.equal(row().amenities, '["Wi-Fi","Air conditioning"]');
    assert.equal(row().primary_image_url, '/uploads/hotels/room.jpg');
    assert.equal(row().pets_allowed, 1);
    assert.equal(row().is_active, 0);
    const read = await request('', undefined, 'GET');
    assert.equal(read.status, 200);
    assert.deepEqual((await read.json())[0].room_features, ['Mountain, lake view']);
  }
  assert.equal(logs.length, 0);
});

test('room #7 legacy nested empty gallery no longer overflows the cover', async (t) => {
  const { request, row } = await setup(t);
  let legacy = '[]';
  for (let i = 0; i < 10; i++) legacy = JSON.stringify(legacy.split(','));
  assert.ok(legacy.length > 500);
  const response = await request('/7', { image_urls: legacy, amenities: legacy, room_features: '[]' });
  assert.equal(response.status, 200);
  assert.equal(row().image_urls, '[]');
  assert.equal(row().primary_image_url, null);
});

test('partial updates leave omitted lists alone and empty lists remove the cover', async (t) => {
  const { request, row } = await setup(t);
  assert.equal((await request('/7', { description: 'Updated' })).status, 200);
  assert.equal(row().amenities, '["Wi-Fi"]');
  assert.equal((await request('/7', { image_urls: '[]', amenities: '[]' })).status, 200);
  assert.equal(row().amenities, '[]');
  assert.equal(row().primary_image_url, null);
});

test('create room uses the first existing gallery URL as its cover', async (t) => {
  const { request, writes } = await setup(t);
  const response = await request('', {
    room_type_name: 'New room', capacity: '2', price_per_night: '500', quantity_available: '1',
    image_urls: '["/uploads/hotels/cover.jpg"]', amenities: '["Wi-Fi"]'
  }, 'POST');
  assert.equal(response.status, 201);
  assert.equal(writes[0].params[12], '/uploads/hotels/cover.jpg');
  assert.equal(writes[0].params[9], '["Wi-Fi"]');
});

test('room writes still require login and ownership', async (t) => {
  const { request, writes } = await setup(t, { denied: true });
  assert.equal((await request('/7', { description: 'No access' }, 'PUT', false)).status, 401);
  assert.equal((await request('/7', { description: 'No access' })).status, 403);
  assert.equal(writes.length, 0);
});

test('invalid list input is rejected before an update query', async (t) => {
  const { request, writes, logs } = await setup(t);
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  assert.equal((await request('/7', { amenities: '[broken' })).status, 400);
  assert.equal(writes.length, 0);
  assert.equal(logs[0].level, 'warn');
  assert.equal(logs[0].meta.status, 400);
  assert.equal(logs[0].meta.database_code, undefined);
});

test('missing schema returns an actionable message without leaking SQL', async (t) => {
  const { request, logs } = await setup(t, { sqlError: 'ER_BAD_FIELD_ERROR' });
  t.mock.method(console, 'error', () => {});
  const response = await request('/7', { bed_type: 'Double' });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, 'ROOM_SCHEMA_MISSING');
  assert.match(body.error, /046_repair_room_fields.sql/);
  assert.match(body.error, /048_room_guest_content.sql/);
  assert.ok(!body.error.includes('Test database error'));
  assert.equal(logs.length, 1);
  assert.equal(logs[0].source, 'rooms');
  assert.equal(logs[0].level, 'error');
  assert.match(logs[0].message, /ER_BAD_FIELD_ERROR/);
  assert.deepEqual(logs[0].meta, {
    method: 'PUT', path: '/api/owner/hotels/8/rooms/7',
    hotel_id: '8', room_id: '7', status: 503,
    reason: body.error, database_code: 'ER_BAD_FIELD_ERROR'
  });
  assert.equal(logs[0].user_id, 5);
});

test('oversized field errors become validation errors, not HTTP 500', async (t) => {
  const { request, logs } = await setup(t, { sqlError: 'ER_DATA_TOO_LONG' });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  assert.equal((await request('/7', { bed_type: 'x'.repeat(51) })).status, 400);
  assert.equal(logs[0].level, 'warn');
  assert.equal(logs[0].meta.database_code, 'ER_DATA_TOO_LONG');
});

test('unexpected SQL errors record a safe code without exposing database messages or form data', async (t) => {
  const { request, logs } = await setup(t, { sqlError: 'ER_LOCK_DEADLOCK' });
  t.mock.method(console, 'error', () => {});
  const response = await request('/7?lang=en', { description: 'Private form value' });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to update room' });
  assert.equal(logs[0].meta.database_code, 'ER_LOCK_DEADLOCK');
  assert.equal(logs[0].meta.path, '/api/owner/hotels/8/rooms/7');
  assert.ok(!JSON.stringify(logs).includes('Test database error'));
  assert.ok(!JSON.stringify(logs).includes('Private form value'));
});

test('create errors also record room diagnostics', async (t) => {
  const { request, logs } = await setup(t, { sqlError: 'ER_BAD_FIELD_ERROR' });
  t.mock.method(console, 'error', () => {});
  const response = await request('', {
    room_type_name: 'New room', capacity: '2', price_per_night: '500', quantity_available: '1'
  }, 'POST');
  assert.equal(response.status, 503);
  assert.equal(logs[0].meta.method, 'POST');
  assert.equal(logs[0].meta.path, '/api/owner/hotels/8/rooms');
  assert.equal(logs[0].meta.room_id, undefined);
  assert.equal(logs[0].meta.database_code, 'ER_BAD_FIELD_ERROR');
});

test('a missing logging table does not change the room error response', async (t) => {
  const { request } = await setup(t, { sqlError: 'ER_BAD_FIELD_ERROR', logError: true });
  t.mock.method(console, 'error', () => {});
  const response = await request('/7', { bed_type: 'Double' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'ROOM_SCHEMA_MISSING');
});

const perfectFor = [{ label: 'Family stays', detail: 'Space for up to six guests' }];
const commonQuestions = [{ question: 'Is breakfast included?', answer: 'Breakfast is available at an extra charge.' }];

test('room guest content saves and is returned by owner and unauthenticated public reads', async (t) => {
  const { request, publicRooms, row } = await setup(t);
  const fields = {
    perfect_for: JSON.stringify(perfectFor), common_questions: JSON.stringify(commonQuestions)
  };
  for (let i = 0; i < 3; i++) {
    assert.equal((await request('/7', fields)).status, 200);
    assert.equal(row().perfect_for, fields.perfect_for);
    assert.equal(row().common_questions, fields.common_questions);
    const ownerResponse = await request('', undefined, 'GET');
    assert.equal(ownerResponse.status, 200);
    const ownerRoom = (await ownerResponse.json())[0];
    assert.deepEqual(ownerRoom.perfect_for, perfectFor);
    assert.deepEqual(ownerRoom.common_questions, commonQuestions);
    const publicResponse = await publicRooms();
    assert.equal(publicResponse.status, 200);
    const publicRoom = (await publicResponse.json())[0];
    assert.deepEqual(publicRoom.perfect_for, perfectFor);
    assert.deepEqual(publicRoom.common_questions, commonQuestions);
  }
});

test('new rooms persist configured content in the correct insert columns', async (t) => {
  const { request, writes, publicRooms } = await setup(t);
  const response = await request('', {
    room_type_name: 'Family room', capacity: '6', price_per_night: '2010', quantity_available: '1',
    perfect_for: JSON.stringify(perfectFor), common_questions: JSON.stringify(commonQuestions)
  }, 'POST');
  assert.equal(response.status, 201);
  assert.equal(writes[0].params.length, (writes[0].sql.match(/\?/g) || []).length);
  const room = (await (await publicRooms()).json())[0];
  assert.deepEqual(room.perfect_for, perfectFor);
  assert.deepEqual(room.common_questions, commonQuestions);
});

test('omitted guest content is preserved and explicit empty arrays hide both sections', async (t) => {
  const { request, row, publicRooms } = await setup(t, { room: {
    perfect_for: JSON.stringify(perfectFor), common_questions: JSON.stringify(commonQuestions)
  } });
  assert.equal((await request('/7', { description: 'Unrelated edit' })).status, 200);
  assert.equal(row().perfect_for, JSON.stringify(perfectFor));
  assert.equal(row().common_questions, JSON.stringify(commonQuestions));
  assert.equal((await request('/7', { perfect_for: '[]', common_questions: '[]' })).status, 200);
  const room = (await (await publicRooms()).json())[0];
  assert.deepEqual(room.perfect_for, []);
  assert.deepEqual(room.common_questions, []);
});

test('unconfigured and malformed stored guest content never produces default promises', async (t) => {
  const { publicRooms } = await setup(t, { room: { perfect_for: null, common_questions: '[broken' } });
  const response = await publicRooms();
  assert.equal(response.status, 200);
  const room = (await response.json())[0];
  assert.deepEqual(room.perfect_for, []);
  assert.deepEqual(room.common_questions, []);
});

test('malformed, incomplete, or oversized guest content is rejected before SQL writes', async (t) => {
  const { request, writes } = await setup(t);
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  for (const fields of [
    { perfect_for: '[broken' },
    { perfect_for: JSON.stringify([{ label: '' }]) },
    { common_questions: JSON.stringify([{ question: 'Breakfast?' }]) },
    { common_questions: JSON.stringify([{ question: 'Breakfast?', answer: 'x'.repeat(1001) }]) },
    { perfect_for: JSON.stringify(Array(5).fill(perfectFor[0])) }
  ]) {
    const response = await request('/7', fields);
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
  }
  assert.equal(writes.length, 0);
});

test('guest content cannot be changed without ownership', async (t) => {
  const { request, writes } = await setup(t, { denied: true });
  const fields = { perfect_for: JSON.stringify(perfectFor), common_questions: JSON.stringify(commonQuestions) };
  assert.equal((await request('/7', fields, 'PUT', false)).status, 401);
  assert.equal((await request('/7', fields)).status, 403);
  assert.equal((await request('', { ...fields, room_type_name: 'Room', capacity: '2', price_per_night: '500', quantity_available: '1' }, 'POST')).status, 403);
  assert.equal(writes.length, 0);
});
