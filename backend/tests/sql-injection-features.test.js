import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Local HTTP servers and fake databases only. No real credentials, databases,
// SMTP services, chatbot model processes, or payment gateways are used.
process.env.JWT_SECRET = 'sql-injection-tests-only-not-a-production-secret';
process.env.SESSION_SECRET = 'sql-injection-tests-only-not-a-production-session';
process.env.ENABLE_MT_FALLBACK = 'true';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: authRouter } = await import('../controllers/authController.js');
const { default: chatbotRouter } = await import('../controllers/chatbotController.js');
const { default: adminRouter } = await import('../controllers/adminController.js');
const { getHotelBookings } = await import('../controllers/bookingsController.js');
const { getAttractionSuggestions, createAttractionReview } = await import('../controllers/attractionsController.js');
const { getTranslationWithFallback } = await import('../services/machineTranslate.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');

const serve = async (t, app) => {
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return (path, options = {}) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    ...options, signal: AbortSignal.timeout(5000)
  });
};

test('real login route binds attack strings, rejects object inputs, and still accepts valid credentials', async t => {
  clearUserColumnCache();
  const calls = [];
  const password = 'ValidTestPassword!123';
  const hash = await bcrypt.hash(password, 4);
  t.mock.method(db, 'promise', () => ({
    query: async sql => {
      assert.match(sql, /information_schema.columns/);
      return [[]];
    },
    execute: async (sql, params) => {
      calls.push({ sql, params });
      assert.match(sql, /WHERE LOWER\(email\) = \? OR LOWER\(username\) = \?/);
      return [params[0] === 'guest' ? [{
        user_id: 1, username: 'guest', email: 'guest@example.test', password_hash: hash,
        role: 'user', email_verified: 1, first_name: "O'Connor"
      }] : []];
    }
  }));
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  const request = await serve(t, app);
  const login = data => request('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  for (const identifier of ["' OR '1'='1", "'; DROP TABLE users; --"]) {
    assert.equal((await login({ emailOrUsername: identifier, password })).status, 401);
    assert.deepEqual(calls.at(-1).params, [identifier.toLowerCase(), identifier.toLowerCase()]);
    assert.ok(!calls.at(-1).sql.includes(identifier));
  }
  const count = calls.length;
  assert.equal((await login({ emailOrUsername: { username: 'guest' }, password })).status, 400);
  assert.equal((await login({ emailOrUsername: 'guest', password: { password_hash: 1 } })).status, 400);
  assert.equal(calls.length, count);
  const response = await login({ emailOrUsername: 'guest', password });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.first_name, "O'Connor");
  assert.match(response.headers.get('set-cookie'), /auth_token=.*HttpOnly/);
});

test('My Bookings preserves separate paid totals, balances, and hotel lookups for multiple bookings', async t => {
  const prepared = [];
  const bookings = [
    { booking_id: 11, hotel_id: 8, total_amount: '1000', payment_status: 'partial', check_in: '2026-12-20' },
    { booking_id: 12, hotel_id: 9, total_amount: '600', payment_status: 'paid', check_in: '2026-12-25' }
  ];
  t.mock.method(db, 'promise', () => ({
    query: async (sql, params) => {
      assert.match(sql, /WHERE user_id = \?/);
      assert.deepEqual(params, [5]);
      return [bookings.map(row => ({ ...row }))];
    },
    execute: async (sql, params) => {
      prepared.push({ sql, params });
      if (sql.includes('FROM hotel_payments')) return [[{ booking_id: 11, amount_paid: 250 }, { booking_id: 12, amount_paid: 600 }]];
      if (sql.includes('FROM hotels')) return [[{ hotel_id: 8, balance_due_days: 3 }, { hotel_id: 9, balance_due_days: 1 }]];
      throw new Error('Unexpected prepared query');
    }
  }));
  const app = express();
  app.get('/bookings', getHotelBookings);
  const request = await serve(t, app);
  const response = await request('/bookings', {
    headers: { Authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` }
  });
  assert.equal(response.status, 200);
  const rows = await response.json();
  assert.deepEqual(rows.map(row => [row.amount_paid, row.balance_due]), [[250, 750], [600, 0]]);
  assert.equal(rows[0].balance_due_at, '2026-12-17');
  assert.equal(rows[0].amount_due_now, 750);
  assert.deepEqual(prepared.map(call => call.params), [[11, 12], [8, 9]]);
  for (const call of prepared) assert.match(call.sql, /IN \(\?, \?\)/);
});

test('chatbot clear-history keeps callback behavior and binds all conversation IDs separately', async t => {
  const calls = [];
  t.mock.method(db, 'query', (sql, params, callback) => {
    calls.push({ sql, params, method: 'query' });
    if (sql.startsWith('SELECT conversation_id')) callback(null, [{ conversation_id: 41 }, { conversation_id: 42 }]);
    else callback(null, { affectedRows: 2 });
  });
  t.mock.method(db, 'execute', (sql, params, callback) => {
    calls.push({ sql, params, method: 'execute' });
    assert.equal(sql, 'DELETE FROM chatbot_messages WHERE conversation_id IN (?, ?)');
    assert.deepEqual(params, [41, 42]);
    callback(null, { affectedRows: 3 });
  });
  const app = express();
  app.use('/chatbot', chatbotRouter);
  const request = await serve(t, app);
  const response = await request('/chatbot/history/5', { method: 'DELETE' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).deleted, 2);
  assert.deepEqual(calls.map(call => call.method), ['query', 'execute', 'query']);
  assert.deepEqual(calls[2].params, ['5']);
});

test('empty booking and chatbot history lists never generate an empty IN clause', async t => {
  t.mock.method(db, 'promise', () => ({ query: async () => [[]] }));
  t.mock.method(db, 'query', (sql, params, callback) => callback(null, []));
  t.mock.method(db, 'execute', () => assert.fail('Empty history must not execute a DELETE'));
  const app = express();
  app.get('/bookings', getHotelBookings);
  app.use('/chatbot', chatbotRouter);
  const request = await serve(t, app);
  const bookings = await request('/bookings', {
    headers: { Authorization: `Bearer ${jwt.sign({ user_id: 5 }, JWT_SECRET)}` }
  });
  assert.equal(bookings.status, 200);
  assert.deepEqual(await bookings.json(), []);
  const history = await request('/chatbot/history/5', { method: 'DELETE' });
  assert.equal(history.status, 200);
  assert.equal((await history.json()).deleted, 0);
});

test('admin log search, pagination, and time windows are bound rather than interpolated', async t => {
  clearUserColumnCache();
  const calls = [];
  t.mock.method(db, 'promise', () => ({
    query: async sql => {
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{ user_id: 1, role: 'admin', archived: 0, email_verified: 1 }]];
      throw new Error('Unexpected unprepared query');
    },
    execute: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT COUNT')) return [[{ total: 0 }]];
      return [[]];
    }
  }));
  const app = express();
  app.use('/admin', adminRouter);
  const request = await serve(t, app);
  const headers = { Authorization: `Bearer ${jwt.sign({ user_id: 1 }, JWT_SECRET)}` };
  const q = "O'Connor'; DROP TABLE system_logs; --";
  const response = await request(`/admin/logs?page=2&limit=10&q=${encodeURIComponent(q)}`, { headers });
  assert.equal(response.status, 200);
  assert.deepEqual(calls[0].params, [`%${q}%`, `%${q}%`]);
  assert.deepEqual(calls[1].params, [`%${q}%`, `%${q}%`, '10', '10']);
  assert.match(calls[1].sql, /LIMIT \? OFFSET \?/);
  assert.ok(calls.every(call => !call.sql.includes(q)));
  assert.equal((await request('/admin/logs/stats?hours=48', { headers })).status, 200);
  for (const call of calls.slice(2)) {
    assert.match(call.sql, /INTERVAL \? HOUR/);
    assert.deepEqual(call.params, [48]);
  }
});

test('attraction search and reviews preserve apostrophes and keep SQL-looking input as bound text', async t => {
  const calls = [];
  const comment = "O'Connor's visit was lovely; SELECT is just text here.";
  t.mock.method(db, 'promise', () => ({ execute: async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('column_count')) return [[{ column_count: 1 }]];
    if (sql.includes('FROM itineraries')) return [[{ itinerary_id: 3, status: 'completed' }]];
    if (sql.includes('SELECT review_id')) return [[]];
    if (sql.includes('INSERT INTO reviews')) return [{ insertId: 20 }];
    if (sql.includes('name LIKE ?')) return [[{ id: 1, name: "O'Connor Falls" }]];
    throw new Error('Unexpected attraction query');
  } }));
  const app = express();
  app.use(express.json());
  app.get('/suggestions', getAttractionSuggestions);
  // Auth is covered separately; inject a fixture user to exercise this handler.
  app.post('/attractions/:id/reviews', (req, res, next) => { req.user = { user_id: 5 }; next(); }, createAttractionReview);
  const request = await serve(t, app);
  const term = "O'Connor'; OR 1=1 --";
  assert.equal((await request(`/suggestions?q=${encodeURIComponent(term)}`)).status, 200);
  assert.deepEqual(calls[0].params, [`%${term}%`, `%${term}%`]);
  assert.ok(!calls[0].sql.includes(term));
  const response = await request('/attractions/1/reviews', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: 5, comment, itinerary_id: 3 })
  });
  assert.equal(response.status, 201);
  const insert = calls.find(call => call.sql.includes('INSERT INTO reviews'));
  assert.equal(insert.params[3], comment);
  assert.ok(!insert.sql.includes(comment));
});

test('translation fallback rejects unapproved identifiers before querying and uses each table primary key', async t => {
  const calls = [];
  t.mock.method(db, 'promise', () => ({ execute: async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('translation_languages')) return [[{ id: 2 }]];
    if (sql.includes('FROM translations')) return [[]];
    return [[{ name: 'Source text' }]];
  } }));
  assert.equal(await getTranslationWithFallback('hotels; DROP TABLE users', 8, 'name', 'es'), null);
  assert.equal(await getTranslationWithFallback('hotels', 8, 'name FROM users --', 'es'), null);
  assert.equal(await getTranslationWithFallback('__proto__', 8, 'name', 'es'), null);
  assert.equal(calls.length, 0);
  // No translation provider key: fetching original text is sufficient to
  // exercise the allowlisted SQL, without making an external HTTP request.
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  delete process.env.GOOGLE_TRANSLATE_API_KEY;
  t.after(() => { if (key !== undefined) process.env.GOOGLE_TRANSLATE_API_KEY = key; });
  for (const [table, field, idColumn] of [
    ['attractions', 'name', 'id'], ['hotels', 'name', 'hotel_id'],
    ['restaurants', 'name', 'restaurant_id'], ['rooms', 'room_type_name', 'room_id']
  ]) {
    await getTranslationWithFallback(table, 8, field, 'es');
    assert.ok(calls.some(call => call.sql === `SELECT ${field} FROM ${table} WHERE ${idColumn} = ? LIMIT 1`));
  }
});
