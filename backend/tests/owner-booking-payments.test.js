import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

// Real route/auth middleware with a fake database: no live API or database.
process.env.JWT_SECRET = 'owner-booking-payment-tests-only-not-a-production-key';
process.env.SESSION_SECRET = 'owner-booking-payment-tests-only-not-a-production-session';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: router } = await import('../controllers/ownerController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');

const setup = async (t, options = {}) => {
  clearUserColumnCache();
  const calls = [];
  const booking = Object.freeze({
    booking_id: 155, hotel_id: 8, user_id: 100, username: 'account_name',
    customer_name: 'Guest Full Name', booking_reference: 'HB000155', receipt_number: 'RECEIPT-155',
    payment_method: 'paypal', payment_reference: 'old-attempt', total_amount: '600.00',
    payment_status: 'paid', status: 'confirmed', check_in: '2026-10-22', check_out: '2026-10-23'
  });
  t.mock.method(db, 'promise', () => ({
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{
        user_id: params[0], username: 'Fixture Owner', role: options.role || 'owner',
        email_verified: 1, archived: 0
      }]];
      if (sql.includes('FROM business_profiles')) return [[{
        business_permit_no: 'BP-TEST', dot_no: 'DOT-TEST', philgeps_no: null,
        verification_status: 'verified'
      }]];
      if (sql.includes('FROM hotel_bookings b')) {
        assert.match(sql, /WHERE ho\.user_id = \?/);
        assert.match(sql, /dashboard_record_archives/);
        assert.match(sql, /da\.user_id = (5|999)/);
        return [params[0] === 5 ? [{ ...booking, archived: sql.includes('b.archived, 0) = 1') ? 1 : 0 }] : []];
      }
      if (sql.includes('SUM(CASE WHEN status')) return [[{ booking_id: 155, paid: '600.00' }]];
      if (sql.startsWith('SHOW COLUMNS')) return [options.legacySchema ? [] : [{ Field: 'customer_reference_number' }]];
      if (sql.includes('FROM hotel_payments')) {
        assert.deepEqual(params, [[155]]);
        if (options.legacySchema) assert.match(sql, /NULL AS customer_reference_number/);
        assert.doesNotMatch(sql, /provider_response|SELECT \*/);
        return [[
          { payment_id: 13, booking_id: 155, method: 'card', provider: 'stripe', status: 'failed', transaction_reference: 'newer-failure' },
          { payment_id: 10, booking_id: 155, method: 'qrph', provider: 'paymongo', status: 'succeeded',
            transaction_reference: 'cs_paid', customer_reference_number: options.legacySchema ? null : 'CUSTOMER-155' }
        ]];
      }
      throw new Error(`Unexpected test query: ${sql}`);
    }
  }));
  const app = express();
  app.use('/api/owner', router);
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (pathname = '/bookings', userId = 5) => fetch(
    `http://127.0.0.1:${server.address().port}/api/owner${pathname}`,
    { headers: userId === null ? {} : { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '1m' })}` } }
  );
  return { request, calls, booking };
};

test('Reservations returns both stored booking and selected payment references without changing totals', async (t) => {
  const { request, calls, booking } = await setup(t);
  const response = await request();
  assert.equal(response.status, 200);
  const [row] = await response.json();
  assert.equal(row.booking_reference, 'HB000155');
  assert.equal(row.receipt_number, 'RECEIPT-155');
  assert.equal(row.display_payment_method, 'qrph');
  assert.equal(row.payment_transaction_reference, 'cs_paid');
  assert.equal(row.payment_customer_reference, 'CUSTOMER-155');
  assert.equal(row.payment_record_status, 'succeeded');
  assert.equal(row.amount_paid, 600);
  assert.equal(row.balance_due, 0);
  assert.equal(row.payment_method, booking.payment_method);
  assert.equal(row.payment_status, booking.payment_status);
  assert.equal(row.customer_name, booking.customer_name);
  assert.equal(calls.some(call => /^(UPDATE|INSERT|DELETE|ALTER)/i.test(call.sql.trim())), false);
});

test('archived Reservations gets the same method and reference details', async (t) => {
  const { request } = await setup(t);
  const response = await request('/bookings/archived');
  assert.equal(response.status, 200);
  const [row] = await response.json();
  assert.equal(row.archived, 1);
  assert.equal(row.display_payment_method, 'qrph');
  assert.equal(row.payment_transaction_reference, 'cs_paid');
  assert.equal(row.payment_customer_reference, 'CUSTOMER-155');
});

test('databases without the optional customer reference column still load Reservations', async (t) => {
  const { request } = await setup(t, { legacySchema: true });
  const response = await request();
  assert.equal(response.status, 200);
  const [row] = await response.json();
  assert.equal(row.payment_transaction_reference, 'cs_paid');
  assert.equal(row.payment_customer_reference, null);
});

test('owners without bookings cannot fetch other owners payment references', async (t) => {
  const { request, calls } = await setup(t);
  const response = await request('/bookings', 999);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
  assert.equal(calls.some(call => call.sql.includes('FROM hotel_payments')), false);
});

test('booking/payment metadata remains protected by login and owner/admin permissions', async (t) => {
  const { request, calls } = await setup(t, { role: 'user' });
  assert.equal((await request('/bookings', null)).status, 401);
  assert.equal((await request()).status, 403);
  assert.equal(calls.some(call => call.sql.includes('FROM hotel_bookings') || call.sql.includes('FROM hotel_payments')), false);
});
