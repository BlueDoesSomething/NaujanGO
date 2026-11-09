import test from 'node:test';
import assert from 'node:assert/strict';

// The service imports db.js, but every DB-touching path here is exercised
// through an injected in-memory connection, so no live database is needed.
const { normalizeManualReceiptInput, outstandingOf, recordManualReceipt, MANUAL_RECEIPT_METHODS } = await import('../services/manualReceipts.js');

const externalBooking = (overrides = {}) => ({
  booking_id: 7,
  status: 'pending',
  hotel_id: 8,
  total_amount: 500,
  currency: 'PHP',
  payment_method: 'gcash',
  policy_snapshot: JSON.stringify({ payment_handling: 'external', payment_arrangement: 'gcash' }),
  payment_status: 'unpaid',
  expires_at: '2099-01-01 12:00:00',
  ...overrides
});

function fakeConnection(state) {
  const connection = {
    begun: 0, committed: 0, rolledBack: 0, released: 0,
    beginTransaction: async () => { connection.begun += 1; },
    commit: async () => { connection.committed += 1; },
    rollback: async () => { connection.rolledBack += 1; },
    release: () => { connection.released += 1; },
    query: async (sql, params = []) => {
      if (sql.includes('FROM hotel_bookings WHERE booking_id')) {
        const row = state.bookings.find(b => Number(b.booking_id) === Number(params[0]));
        return [row ? [{ ...row }] : []];
      }
      if (sql.includes('FROM hotel_payments WHERE booking_id')) {
        const paid = state.payments
          .filter(p => Number(p.booking_id) === Number(params[0]) && p.status === 'succeeded')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        return [[{ paid }]];
      }
      if (sql.startsWith('INSERT INTO hotel_payments')) {
        const row = {
          payment_id: state.payments.length + 1, booking_id: Number(params[0]),
          amount: Number(params[1]), currency: params[2], method: params[3],
          provider: params[4], status: 'succeeded', transaction_reference: params[5] || null
        };
        state.payments.push(row);
        return [{ insertId: row.payment_id }];
      }
      if (sql.startsWith('UPDATE hotel_bookings SET')) {
        const row = state.bookings.find(b => Number(b.booking_id) === Number(params.at(-1)));
        const assignment = sql.match(/ SET (.+) WHERE /)[1].split(', ');
        let i = 0;
        for (const part of assignment) {
          const field = part.split(' = ')[0];
          const value = part.includes(' = ?') ? params[i++] : part.includes('NULL') ? null : 'confirmed';
          row[field] = value;
        }
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    }
  };
  return connection;
}

test('normalizes amount, method and reference', () => {
  assert.deepEqual(normalizeManualReceiptInput({ amount: '250.5', method: ' GCash ', reference: '  REF-1 ' }),
    { amount: 250.5, method: 'gcash', reference: 'REF-1' });
  assert.deepEqual(normalizeManualReceiptInput({ amount: 500 }), { amount: 500, method: null, reference: null });
  assert.equal(normalizeManualReceiptInput({ amount: 10, method: 'pay_at_property' }).method, 'pay_at_property');
  assert.ok(MANUAL_RECEIPT_METHODS.includes('maya'));
});

test('rejects invalid amounts, unsupported methods and long references', () => {
  for (const amount of [0, -5, 'abc', '', undefined, null, NaN, true]) {
    assert.throws(() => normalizeManualReceiptInput({ amount }), error => error.status === 400, `amount: ${amount}`);
  }
  assert.throws(() => normalizeManualReceiptInput({ amount: 100, method: 'card' }), error => error.status === 400);
  assert.throws(() => normalizeManualReceiptInput({ amount: 100, reference: 'x'.repeat(101) }), error => error.status === 400);
});

test('outstandingOf never goes negative', () => {
  assert.equal(outstandingOf(500, 0), 500);
  assert.equal(outstandingOf(500, 200), 300);
  assert.equal(outstandingOf(500, 500), 0);
  assert.equal(outstandingOf(500, 700), 0);
  assert.equal(outstandingOf(0, 0), 0);
});

test('full receipt for an external booking records a succeeded payment and confirms the booking', async () => {
  const state = { bookings: [externalBooking()], payments: [] };
  const connection = fakeConnection(state);
  const result = await recordManualReceipt(7, { amount: 500, method: null, reference: 'GCASH-REF-1' }, connection);

  assert.equal(result.payment.status, 'succeeded');
  assert.equal(result.payment.provider, 'manual');
  assert.equal(result.payment.method, 'gcash', 'defaults to the agreed arrangement');
  assert.equal(result.payment.transaction_reference, 'GCASH-REF-1');
  assert.equal(result.payment_status, 'paid');
  assert.equal(result.outstanding_after, 0);
  assert.equal(state.payments.length, 1);
  assert.equal(state.bookings[0].status, 'confirmed');
  assert.equal(state.bookings[0].payment_status, 'paid');
  assert.equal(state.bookings[0].expires_at, null, 'receipt clears the expiry so the stay cannot auto-cancel');
  assert.equal(connection.committed, 0, 'caller-owned connection is not committed by the service');
  assert.equal(connection.released, 0, 'caller-owned connection is not released by the service');
});

test('partial receipt keeps an outstanding balance that later receipts can settle', async () => {
  const state = { bookings: [externalBooking()], payments: [] };
  const connection = fakeConnection(state);

  const first = await recordManualReceipt(7, { amount: 200, method: 'gcash', reference: null }, connection);
  assert.equal(first.payment_status, 'partial');
  assert.equal(first.outstanding_after, 300);
  assert.equal(state.bookings[0].status, 'confirmed');
  assert.equal(state.bookings[0].payment_status, 'partial');

  const second = await recordManualReceipt(7, { amount: 300, method: null, reference: null }, connection);
  assert.equal(second.payment_status, 'paid');
  assert.equal(second.outstanding_after, 0);
  assert.equal(state.payments.length, 2);

  await assert.rejects(
    recordManualReceipt(7, { amount: 10, method: null, reference: null }, connection),
    error => error.status === 409 && /outstanding balance/.test(error.message),
    'a settled booking has no outstanding balance'
  );
});

test('amounts above the outstanding balance are rejected without recording anything', async () => {
  const state = { bookings: [externalBooking()], payments: [] };
  const connection = fakeConnection(state);
  await assert.rejects(
    recordManualReceipt(7, { amount: 500.01, method: null, reference: null }, connection),
    error => error.status === 400 && /exceeds the outstanding balance/.test(error.message)
  );
  assert.equal(state.payments.length, 0);
  assert.equal(state.bookings[0].status, 'pending');
});

test('receipts are refused for online (non-external) bookings and for dead bookings', async () => {
  const onlineState = {
    bookings: [externalBooking({ policy_snapshot: undefined, payment_method: 'card' })],
    payments: []
  };
  await assert.rejects(
    recordManualReceipt(7, { amount: 100, method: null, reference: null }, fakeConnection(onlineState)),
    error => error.status === 409 && error.code === 'EXTERNAL_PAYMENT_BOOKING'
  );

  for (const status of ['cancelled', 'completed']) {
    const state = { bookings: [externalBooking({ status })], payments: [] };
    await assert.rejects(
      recordManualReceipt(7, { amount: 100, method: null, reference: null }, fakeConnection(state)),
      error => error.status === 409 && /can no longer accept payments/.test(error.message),
      status
    );
    assert.equal(state.payments.length, 0);
  }

  const missing = { bookings: [], payments: [] };
  await assert.rejects(
    recordManualReceipt(999, { amount: 100, method: null, reference: null }, fakeConnection(missing)),
    error => error.status === 404
  );
});

test('insert failures propagate and leave no payment record behind', async () => {
  const state = { bookings: [externalBooking()], payments: [] };
  const connection = fakeConnection(state);
  const originalQuery = connection.query;
  connection.query = async (sql, params) => {
    if (sql.startsWith('INSERT INTO hotel_payments')) throw new Error('simulated insert failure');
    return originalQuery(sql, params);
  };
  await assert.rejects(
    recordManualReceipt(7, { amount: 100, method: null, reference: null }, connection),
    error => error.message === 'simulated insert failure'
  );
  assert.equal(state.payments.length, 0);
  assert.equal(state.bookings[0].status, 'pending');
  assert.equal(state.bookings[0].payment_status, 'unpaid');
  assert.equal(connection.rolledBack, 0, 'caller-owned connections are left to the caller');
});
