import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

// Offline HTTP fixtures only. Never read, clear, or migrate a live log table.
process.env.JWT_SECRET = 'system-logs-tests-only-not-a-production-secret';
process.env.SESSION_SECRET = 'system-logs-session-tests-only';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: adminRouter } = await import('../controllers/adminController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');

const setup = async (t, options = {}) => {
  clearUserColumnCache();
  const logs = Array.from({ length: 120 }, (_, index) => ({
    id: index + 1, level: ['info', 'warn', 'error'][index % 3],
    source: index % 2 ? 'http' : 'app', message: `Fixture event ${index + 1}`,
    meta: JSON.stringify({ status: index % 3 === 2 ? 503 : 200 }),
    user_id: null, ip: '192.0.2.1', created_at: new Date(Date.now() - index * 1000).toISOString()
  }));
  const state = { failList: false, failCount: false };
  const calls = [];
  const users = new Map([[1, 'admin'], [5, 'owner'], [7, 'user']]);
  const filtered = (sql, params) => {
    let rows = [...logs].sort((a, b) => b.id - a.id);
    let cursor = 0;
    if (sql.includes('level = ?')) rows = rows.filter(row => row.level === params[cursor]);
    if (sql.includes('level = ?')) cursor++;
    if (sql.includes('message LIKE ?')) {
      const term = params[cursor].slice(1, -1).toLowerCase();
      rows = rows.filter(row => row.message.toLowerCase().includes(term) || row.source.toLowerCase().includes(term));
    }
    return rows;
  };
  t.mock.method(console, 'error', () => {});
  t.mock.method(db, 'promise', () => ({
    query: async (sql, params = []) => {
      calls.push({ sql, params, method: 'query' });
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{ user_id: params[0], role: users.get(params[0]), archived: 0, email_verified: 1 }]];
      throw new Error(`Unexpected unprepared query: ${sql}`);
    },
    execute: async (sql, params = []) => {
      calls.push({ sql, params, method: 'execute' });
      assert.equal((sql.match(/\?/g) || []).length, params.length);
      if (sql.startsWith('SELECT COUNT(*) AS total')) {
        if (state.failCount) throw Object.assign(new Error('Private fixture database failure'), { code: 'ER_NO_SUCH_TABLE' });
        return [[{ total: String(filtered(sql, params).length) }]];
      }
      if (sql.includes('SELECT id, level, source')) {
        if (state.failList) throw Object.assign(new Error('Private fixture database failure'), { code: options.errorCode || 'ER_BAD_FIELD_ERROR' });
        // Model servers that reject mysql2's DOUBLE-encoded numeric LIMIT
        // bindings. The real query must keep these validated values bound as
        // decimal integer strings, not interpolate raw request values.
        if (params.slice(-2).some(value => typeof value !== 'string' || !/^\d+$/.test(value))) {
          throw Object.assign(new Error('Incorrect arguments to mysqld_stmt_execute'), { code: 'ER_WRONG_ARGUMENTS' });
        }
        const [limit, offset] = params.slice(-2).map(Number);
        return [filtered(sql, params.slice(0, -2)).slice(offset, offset + limit)];
      }
      if (sql.startsWith('SELECT level, COUNT')) {
        return [[...new Set(logs.map(row => row.level))].map(level => ({ level, count: String(logs.filter(row => row.level === level).length) }))];
      }
      if (sql.includes('SELECT message, created_at')) {
        const latest = [...logs].reverse().find(row => row.level === 'error');
        return [latest ? [latest] : []];
      }
      throw new Error(`Unexpected prepared query: ${sql}`);
    }
  }));
  const app = express(); app.use(express.json()); app.use('/api/admin', adminRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = async (path = '/logs', userId = 1) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin${path}`, {
      headers: userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '1m' })}` } : {},
      signal: AbortSignal.timeout(5000)
    });
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
  return { request, calls, state, logs };
};

test('admin log listing returns existing rows newest-first using integer-compatible bound pagination', async t => {
  const fixture = await setup(t);
  const response = await fixture.request('/logs?page=1&limit=50&lang=en');
  assert.equal(response.status, 200);
  assert.equal(response.body.total, 120); assert.equal(response.body.rows.length, 50);
  assert.equal(response.body.rows[0].id, 120); assert.equal(response.body.rows.at(-1).id, 71);
  assert.equal(response.body.page, 1); assert.equal(response.body.limit, 50);
  assert.match(response.headers.get('cache-control'), /private, no-store/);
  const listQuery = fixture.calls.find(call => call.sql.includes('SELECT id, level, source'));
  assert.match(listQuery.sql, /LIMIT \? OFFSET \?/); assert.deepEqual(listQuery.params, ['50', '0']);
  assert.ok(fixture.calls.every(call => /^SELECT/.test(call.sql)), 'viewing logs must not write or clear anything');
});

test('second and out-of-range pages preserve the matching total without losing stored logs', async t => {
  const fixture = await setup(t);
  const original = structuredClone(fixture.logs);
  const second = await fixture.request('/logs?page=2&limit=50');
  assert.equal(second.status, 200); assert.equal(second.body.rows[0].id, 70);
  const beyond = await fixture.request('/logs?page=99&limit=50');
  assert.equal(beyond.status, 200); assert.deepEqual(beyond.body.rows, []); assert.equal(beyond.body.total, 120);
  assert.deepEqual(fixture.logs, original);
});

test('level and search filters use identical predicates for counts and rows', async t => {
  const fixture = await setup(t);
  const response = await fixture.request('/logs?level=error&q=http&page=2&limit=5');
  assert.equal(response.status, 200); assert.equal(response.body.total, 20); assert.equal(response.body.rows.length, 5);
  assert.ok(response.body.rows.every(row => row.level === 'error' && row.source === 'http'));
  const prepared = fixture.calls.filter(call => call.method === 'execute');
  assert.deepEqual(prepared[0].params, ['error', '%http%', '%http%']);
  assert.deepEqual(prepared[1].params, ['error', '%http%', '%http%', '5', '5']);
  const none = await fixture.request('/logs?q=definitely-no-match');
  assert.equal(none.body.total, 0); assert.deepEqual(none.body.rows, []);
});

test('pagination defaults and caps are safe and oversized offsets are rejected before querying logs', async t => {
  const fixture = await setup(t);
  const capped = await fixture.request('/logs?page=-2&limit=99999');
  assert.equal(capped.status, 200); assert.equal(capped.body.page, 1); assert.equal(capped.body.limit, 200);
  const defaults = await fixture.request('/logs?page=invalid&limit=invalid');
  assert.equal(defaults.status, 200); assert.equal(defaults.body.page, 1); assert.equal(defaults.body.limit, 50);
  const count = fixture.calls.filter(call => call.method === 'execute').length;
  for (const page of ['99999999999999999999999999999999999999', '9007199254740991']) {
    const invalid = await fixture.request(`/logs?page=${page}&limit=200`);
    assert.equal(invalid.status, 400); assert.equal(invalid.body.code, 'INVALID_LOG_PAGE');
  }
  assert.equal(fixture.calls.filter(call => call.method === 'execute').length, count);
});

test('search and pagination attack strings never become SQL syntax', async t => {
  const fixture = await setup(t);
  const attack = "O'Connor'; DROP TABLE system_logs; --";
  const response = await fixture.request(`/logs?q=${encodeURIComponent(attack)}&limit=10%3BDELETE%20FROM%20system_logs&page=2`);
  assert.equal(response.status, 200);
  const listQuery = fixture.calls.find(call => call.sql.includes('SELECT id, level, source'));
  assert.deepEqual(listQuery.params, [`%${attack}%`, `%${attack}%`, '10', '10']);
  assert.ok(!listQuery.sql.includes(attack));
  assert.ok(fixture.calls.every(call => !/DELETE FROM|DROP TABLE/.test(call.sql)));
});

test('a list query failure is a non-2xx error even when the stats query succeeds', async t => {
  const fixture = await setup(t);
  fixture.state.failList = true;
  const failed = await fixture.request();
  assert.equal(failed.status, 500); assert.equal(failed.body.code, 'SYSTEM_LOGS_UNAVAILABLE');
  assert.equal(failed.body.rows, undefined); assert.equal(failed.body.total, undefined);
  assert.doesNotMatch(JSON.stringify(failed.body), /Private fixture|ER_BAD_FIELD_ERROR|SELECT/);
  const stats = await fixture.request('/logs/stats?hours=24');
  assert.equal(stats.status, 200);
  assert.equal(stats.body.error, 40); assert.equal(stats.body.warn, 40); assert.equal(stats.body.info, 40);
  assert.match(stats.headers.get('cache-control'), /no-store/);
  fixture.state.failList = false;
  assert.equal((await fixture.request()).body.rows.length, 50, 'the same stored data remains readable after recovery');
});

test('a count query failure is not reported as an empty log table', async t => {
  const fixture = await setup(t);
  fixture.state.failCount = true;
  const failed = await fixture.request();
  assert.equal(failed.status, 500); assert.equal(failed.body.code, 'SYSTEM_LOGS_UNAVAILABLE');
  assert.equal(fixture.logs.length, 120);
});

test('only authenticated admins can read log rows and stats', async t => {
  const fixture = await setup(t);
  for (const path of ['/logs', '/logs/stats']) {
    assert.equal((await fixture.request(path, null)).status, 401);
    assert.equal((await fixture.request(path, 5)).status, 403);
    assert.equal((await fixture.request(path, 7)).status, 403);
  }
  assert.ok(!fixture.calls.some(call => call.sql.includes('FROM system_logs')));
});
