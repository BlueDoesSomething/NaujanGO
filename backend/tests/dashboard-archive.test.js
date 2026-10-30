import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'dashboard-archive-tests-only-not-a-production-secret';
process.env.SESSION_SECRET = 'dashboard-archive-tests-only-not-a-production-session';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { default: adminRouter } = await import('../controllers/adminController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { archiveSql, bookingArchiveBlocker, setPersonalArchive } = await import('../services/dashboardArchive.js');
const { paymentQueryScope } = await import('../services/dashboardPayments.js');

// A stateful transactional fake exercises the real HTTP/auth/service code. No
// production API, database, or payment gateway is contacted.
const setup = async (t, options = {}) => {
  clearUserColumnCache();
  const bookings = new Map([[10, { booking_id: 10, hotel_id: 8, user_id: 100, status: 'cancelled', payment_status: 'failed', total_amount: 500, archived: 0, stay_ended: 1 }],
    [11, { booking_id: 11, hotel_id: 9, user_id: 101, status: 'cancelled', payment_status: 'failed', total_amount: 90, archived: 0, stay_ended: 1 }]]);
  const payments = new Map([[20, { payment_id: 20, booking_id: 10, status: 'failed', amount: 200, archived: 0 }],
    [21, { payment_id: 21, booking_id: 10, status: 'failed', amount: 300, archived: 0 }],
    [22, { payment_id: 22, booking_id: 10, status: 'succeeded', amount: 1000, archived: 0 }],
    [23, { payment_id: 23, booking_id: 11, status: 'failed', amount: 90, archived: 0 }]]);
  const users = new Map([[1, 'admin'], [2, 'admin'], [5, 'owner'], [6, 'owner'], [7, 'user']]);
  const owns = (id, hotel) => (id === 5 && hotel === 8) || (id === 6 && hotel === 9);
  let visibility = new Map();
  const audit = [];
  const calls = [];
  const state = (user, type, record) => visibility.get(`${user}:${type}:${record[`${type}_id`]}`)?.archived ?? record.archived ?? 0;
  const query = async (sql, params = []) => {
    calls.push({ sql, params });
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: users.get(params[0]), archived: 0, email_verified: 1 }]];
    if (sql.includes('FROM business_profiles')) return [[{ verification_status: 'verified', business_permit_no: 'TEST', dot_no: 'TEST', philgeps_no: 'TEST' }]];
    if (sql.startsWith('SELECT booking_id FROM hotel_bookings WHERE user_id')) {
      return [[...bookings.values()].filter(row => row.user_id === Number(params[0]) || owns(Number(params[1]), row.hotel_id))];
    }
    if (options.missingSchema && sql.includes('dashboard_record_archives')) throw Object.assign(new Error('Missing private table details'), { code: 'ER_NO_SUCH_TABLE' });
    if (sql.includes('SELECT b.*, (b.check_out')) {
      const payment = sql.includes('p.status AS target_payment_status') ? payments.get(Number(params[0])) : null;
      const booking = bookings.get(payment ? payment.booking_id : Number(params[0]));
      if (!booking || (params.length > 1 && !owns(params[1], booking.hotel_id))) return [[]];
      return [[{ ...booking, ...(payment ? { payment_id: payment.payment_id, target_payment_status: payment.status } : {}) }]];
    }
    if (sql.startsWith('SELECT payment_id, status, amount')) return [[...payments.values()].filter(row => row.booking_id === params[0])];
    if (sql.startsWith('SELECT archived FROM dashboard_record_archives')) {
      const value = visibility.get(`${params[0]}:${params[1]}:${params[2]}`);
      return [value ? [value] : []];
    }
    if (sql.includes('INSERT INTO dashboard_record_archives')) {
      visibility.set(`${params[0]}:${params[1]}:${params[2]}`, { archived: params[3], archived_at: params[4] });
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('INSERT INTO dashboard_archive_audit')) {
      if (options.auditFailure) throw new Error('Private audit storage error');
      audit.push(params);
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('FROM hotel_payments hp LEFT JOIN hotel_bookings hb')) {
      let rows = [...payments.values()];
      let cursor = 0;
      if (sql.includes('ho.user_id = ?')) {
        const userId = params[cursor++];
        rows = rows.filter(row => owns(userId, bookings.get(row.booking_id)?.hotel_id));
      }
      if (sql.includes('dashboard_record_archives')) {
        const viewer = Number(sql.match(/da.user_id = (\d+)/)[1]);
        const archiveFilter = sql.match(/hp\.archived, 0\)\s*=\s*([01])/);
        if (archiveFilter) rows = rows.filter(row => state(viewer, 'payment', row) === Number(archiveFilter[1]));
        rows = rows.map(row => ({ ...row, archived: state(viewer, 'payment', row) }));
      }
      if (sql.includes('hp.status = ?')) { const status = params[cursor++]; rows = rows.filter(row => row.status === status); }
      if (sql.includes('GROUP BY hp.method')) return [[]];
      if (sql.startsWith('SELECT COUNT(*)')) {
        const sum = status => rows.filter(row => row.status === status).reduce((value, row) => value + row.amount, 0);
        return [[{ total_transactions: rows.length, total_revenue: sum('succeeded'), pending_amount: sum('pending'), failed_amount: sum('failed'),
          successful_transactions: rows.filter(row => row.status === 'succeeded').length, failed_transactions: rows.filter(row => row.status === 'failed').length, refunded_amount: sum('refunded') }]];
      }
      return [rows];
    }
    throw new Error(`Unexpected fixture query: ${sql}`);
  };
  const connection = { query, beginTransaction: async () => {
    connection.snapshot = new Map(visibility); connection.auditLength = audit.length;
  }, commit: async () => {}, rollback: async () => {
    visibility = new Map(connection.snapshot); audit.length = connection.auditLength;
  }, release: () => {} };
  t.mock.method(db, 'promise', () => ({ query, getConnection: async () => connection }));
  t.mock.method(console, 'error', () => {});
  const app = express();
  app.use(express.json());
  app.use('/api/owner', ownerRouter);
  app.use('/api/admin', adminRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (url, userId = 5, method = 'GET', data) => fetch(`http://127.0.0.1:${server.address().port}/api${url}`, {
    method, headers: { 'Content-Type': 'application/json', ...(userId == null ? {} : { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '1m' })}` }) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  const stats = async (userId = 5, query = '', admin = false) => {
    const response = await request(`/${admin ? 'admin' : 'owner'}/payments/stats${query}`, userId);
    assert.equal(response.status, 200);
    return response.json();
  };
  return { request, stats, audit, calls, payments, bookings, state: (userId, type, row) => state(userId, type, row) };
};

test('archiving failed payment reduces only this viewer’s filtered failed amount; restore reverses it', async t => {
  const { request, stats, payments, audit, calls } = await setup(t);
  assert.equal((await stats()).failed_amount, 500);
  assert.equal((await request('/owner/payments/20/archive', 5, 'PUT')).status, 200);
  assert.equal((await stats()).failed_amount, 300);
  assert.equal((await stats()).failed_transactions, 1);
  assert.equal((await stats()).total_revenue, 1000);
  assert.equal((await stats()).historical.failed_amount, 500);
  assert.equal((await stats(5, '?archived=all')).failed_amount, 500);
  assert.equal((await request('/owner/payments/20/restore', 5, 'PUT')).status, 200);
  assert.equal((await stats()).failed_amount, 500);
  assert.equal(payments.get(20).status, 'failed');
  assert.equal(audit.length, 2);
  assert.ok(!calls.some(call => /(?:UPDATE|DELETE FROM) (?:hotel_payments|hotel_bookings|rooms|hotels)/.test(call.sql)));
});

test('owner, other owner, and each admin have independent archives', async t => {
  const { request, stats } = await setup(t);
  await request('/owner/payments/20/archive', 5, 'PUT');
  assert.equal((await stats(5)).failed_amount, 300);
  assert.equal((await stats(6)).failed_amount, 90);
  assert.equal((await stats(1, '', true)).failed_amount, 590);
  assert.equal((await request('/admin/payments/20/archive', 1, 'PUT')).status, 200);
  assert.equal((await stats(1, '', true)).failed_amount, 390);
  assert.equal((await stats(2, '', true)).failed_amount, 590);
  assert.equal((await stats(5)).failed_amount, 300);
});

test('archiving a booking never archives its payment attempts or alters statuses', async t => {
  const { request, stats, bookings, payments, state } = await setup(t);
  const response = await request('/owner/bookings/10/archive', 5, 'PUT');
  assert.equal(response.status, 200);
  assert.equal((await stats()).failed_amount, 500);
  assert.equal(state(5, 'booking', bookings.get(10)), 1);
  assert.equal(state(1, 'booking', bookings.get(10)), 0);
  assert.equal(state(5, 'payment', payments.get(20)), 0);
  assert.equal(bookings.get(10).status, 'cancelled');
  assert.equal(bookings.get(10).archived, 0);
  await request('/owner/bookings/10/archive', 5, 'PUT');
  assert.equal(state(5, 'booking', bookings.get(10)), 1, 'retry must not toggle the state');
});

test('every real attempt is listed, including multiple attempts for the same booking', async t => {
  const { request } = await setup(t);
  let response = await request('/owner/payments');
  assert.deepEqual((await response.json()).map(row => row.payment_id), [20, 21, 22]);
  await request('/owner/payments/20/archive', 5, 'PUT');
  response = await request('/owner/payments');
  assert.deepEqual((await response.json()).map(row => row.payment_id), [21, 22]);
  response = await request('/owner/payments/archived');
  assert.deepEqual((await response.json()).map(row => row.payment_id), [20]);
});

test('admin financial history preserves legacy payments even when their booking is missing', async t => {
  const { payments, stats, request } = await setup(t);
  payments.set(24, { payment_id: 24, booking_id: 999, status: 'failed', amount: 50, archived: 0 });
  assert.equal((await stats(1, '', true)).failed_amount, 640);
  assert.equal((await stats()).failed_amount, 500);
  const response = await request('/admin/payments', 1);
  assert.ok((await response.json()).some(payment => payment.payment_id === 24));
});

test('pending payments, pending/future stays, and unpaid completed stays are protected', async t => {
  const { request, bookings, payments, audit } = await setup(t);
  payments.get(20).status = 'pending';
  assert.equal((await request('/owner/payments/20/archive', 5, 'PUT')).status, 409);
  assert.equal((await request('/owner/bookings/10/archive', 5, 'PUT')).status, 409);
  payments.get(20).status = 'failed';
  bookings.get(10).status = 'pending';
  assert.equal((await request('/owner/bookings/10/archive', 5, 'PUT')).status, 409);
  bookings.get(10).status = 'confirmed'; bookings.get(10).stay_ended = 0;
  assert.equal((await request('/owner/bookings/10/archive', 5, 'PUT')).status, 409);
  bookings.get(10).stay_ended = 1; bookings.get(10).total_amount = 2000; bookings.get(10).payment_status = 'partial';
  assert.equal((await request('/owner/bookings/10/archive', 5, 'PUT')).status, 409);
  assert.equal(audit.length, 0);
});

test('settled past stays can be archived without changing lifetime revenue', async t => {
  const { request, bookings, stats } = await setup(t);
  bookings.get(10).status = 'confirmed'; bookings.get(10).payment_status = 'paid';
  assert.equal((await request('/owner/payments/22/archive', 5, 'PUT')).status, 200);
  assert.equal((await stats()).successful_transactions, 0);
  assert.equal((await stats()).total_revenue, 1000);
  assert.equal((await stats(5, '?archived=all')).successful_transactions, 1);
});

test('audit failure rolls back archive visibility and returns no raw database details', async t => {
  const { request, stats, audit } = await setup(t, { auditFailure: true });
  const response = await request('/owner/payments/20/archive', 5, 'PUT');
  assert.equal(response.status, 500);
  assert.ok(!JSON.stringify(await response.json()).includes('Private audit'));
  assert.equal((await stats()).failed_amount, 500);
  assert.equal(audit.length, 0);
});

test('missing archive schema fails closed with migration guidance', async t => {
  const { request } = await setup(t, { missingSchema: true });
  const response = await request('/owner/payments/stats');
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /049_dashboard_archives.sql/);
});

test('authorization and permanent-deletion restrictions are enforced by the API', async t => {
  const { request } = await setup(t);
  assert.equal((await request('/owner/payments/20/archive', null, 'PUT')).status, 401);
  assert.equal((await request('/owner/payments/20/archive', 7, 'PUT')).status, 403);
  assert.equal((await request('/owner/payments/23/archive', 5, 'PUT')).status, 404);
  assert.equal((await request('/admin/payments/20/archive', 5, 'PUT')).status, 403);
  assert.equal((await request('/owner/payments/20', 5, 'DELETE')).status, 403);
  assert.equal((await request('/owner/bookings/10', 5, 'DELETE')).status, 403);
  assert.equal((await request('/admin/payments/20', 1, 'DELETE')).status, 403);
  assert.equal((await request('/admin/bookings/10?hardDelete=true', 1, 'DELETE')).status, 403);
  assert.equal((await request('/admin/archive/booking/10', 1, 'DELETE', { confirmation: 'DELETE BOOKING 10', reason: 'Financial cleanup' })).status, 403);
});

test('account deletion cannot cascade into guest or owner financial history', async t => {
  const { request, calls } = await setup(t);
  assert.equal((await request('/admin/users/100', 1, 'DELETE')).status, 409);
  assert.equal((await request('/admin/users/5', 1, 'DELETE')).status, 409);
  assert.equal((await request('/admin/users/1', 1, 'DELETE')).status, 400);
  assert.ok(!calls.some(call => call.sql.startsWith('DELETE FROM users')));
});

test('list and statistics share parameterized filters without mixing booking archives into payment scope', () => {
  const user = { user_id: 5, role: 'owner' };
  const scope = paymentQueryScope(user, { archived: '0', status: 'failed', method: 'card', startDate: '2026-10-01', endDate: '2026-10-30', search: "Guest' OR 1=1 --" });
  assert.match(scope.where, /da.user_id = 5/);
  assert.match(scope.where, /record_type = 'payment'/);
  assert.doesNotMatch(scope.where, /hb.archived|Guest'/);
  assert.deepEqual(scope.params.slice(0, 5), [5, 'failed', 'card', '2026-10-01', '2026-10-30']);
  assert.equal(scope.params.length, 9);
  assert.doesNotMatch(paymentQueryScope(user, {}, false).where, /dashboard_record_archives|archived/);
  assert.throws(() => archiveSql('payment', 'hp', '5 OR 1=1'), { status: 400 });
  assert.throws(() => archiveSql('payment', 'hp; DROP TABLE users', 5));
});

test('legacy archives provide defaults but personal restores override them without modifying historical flags', async t => {
  const { payments, stats, request } = await setup(t);
  payments.get(20).archived = 1;
  assert.equal((await stats()).failed_amount, 300);
  assert.equal((await request('/owner/payments/20/restore', 5, 'PUT')).status, 200);
  assert.equal((await stats()).failed_amount, 500);
  assert.equal(payments.get(20).archived, 1);
  assert.equal((await stats(1, '', true)).failed_amount, 390);
});

test('refund/dispute and unknown booking states cannot be hidden', async () => {
  assert.match(bookingArchiveBlocker({ status: 'cancelled', payment_status: 'disputed' }), /dispute/);
  assert.match(bookingArchiveBlocker({ status: 'unknown' }), /not ready/);
  await assert.rejects(setPersonalArchive({ role: 'user', user_id: 7 }, 'payment', 20, true), { status: 403 });
});
