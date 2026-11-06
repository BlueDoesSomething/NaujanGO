import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'dashboard-notification-tests-only';
process.env.SESSION_SECRET = 'dashboard-notification-session-tests-only';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { default: router } = await import('../routes/messages.js');

const setup = async t => {
  clearUserColumnCache();
  const records = [{ notification_id: 1, user_id: 7, is_read: 0 }, { notification_id: 2, user_id: 8, is_read: 0 }], calls = [];
  t.mock.method(db, 'promise', () => ({ query: async (sql, params = []) => {
    calls.push({ sql, params });
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: params[0] === 8 ? 'admin' : 'owner', archived: 0, email_verified: 1 }]];
    if (sql.includes('FROM notifications')) {
      assert.match(sql, /WHERE user_id = \? ORDER BY created_at DESC LIMIT 50/);
      return [records.filter(item => item.user_id === params[0]).map(item => ({ ...item }))];
    }
    if (sql.startsWith('UPDATE notifications')) {
      const specific = sql.includes('notification_id = ?');
      assert.match(sql, /user_id = \?/);
      records.forEach(item => { if (item.user_id === params[specific ? 1 : 0] && (!specific || item.notification_id === Number(params[0]))) item.is_read = 1; });
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected notification SQL: ${sql}`);
  } }));
  const app = express(); app.use(express.json()); app.use('/api/messages', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (userId, path = '/notifications', method = 'GET') => fetch(`http://127.0.0.1:${server.address().port}/api/messages${path}`, { method,
    headers: userId == null ? {} : { Authorization: `Bearer ${jwt.sign({ user_id: userId, role: 'admin' }, JWT_SECRET)}` } });
  return { request, records, calls };
};

test('owner and admin notification reads use only the signed-in account, never a requested user id', async t => {
  const { request, calls } = await setup(t);
  for (const userId of [7, 8]) {
    const response = await request(userId, '/notifications?user_id=999');
    assert.equal(response.status, 200); assert.deepEqual((await response.json()).map(item => item.user_id), [userId]);
  }
  assert.ok(calls.every(call => !/^(INSERT|UPDATE|DELETE)/.test(call.sql)));
});

test('single and mark-all read updates remain user-scoped, preserve records and never alter bookings/payments', async t => {
  const { request, records, calls } = await setup(t);
  assert.equal((await request(8, '/notifications/1/read', 'PUT')).status, 200);
  assert.equal(records[0].is_read, 0, 'admin cannot mark another account notification');
  await request(7, '/notifications/1/read', 'PUT'); assert.equal(records[0].is_read, 1); assert.equal(records[1].is_read, 0);
  await request(8, '/notifications/read-all', 'PUT'); assert.equal(records[1].is_read, 1); assert.equal(records.length, 2);
  assert.ok(calls.every(call => !/hotel_bookings|hotel_payments|DELETE|INSERT/.test(call.sql)));
});

test('notification endpoints require authentication for listing and both read actions', async t => {
  const { request } = await setup(t);
  for (const [path, method] of [['/notifications', 'GET'], ['/notifications/1/read', 'PUT'], ['/notifications/read-all', 'PUT']]) assert.equal((await request(null, path, method)).status, 401);
});
