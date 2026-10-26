import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchBookingPaymentDetails, getBookingPaymentFields } from '../utils/bookingPayments.js';

const fakeDb = (rows, customerReferenceAvailable = true) => {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SHOW COLUMNS')) return [customerReferenceAvailable ? [{ Field: 'customer_reference_number' }] : []];
      assert.match(sql, /WHERE booking_id IN \(\?\)/);
      assert.doesNotMatch(sql, /provider_response|SELECT \*/);
      return [rows];
    }
  };
};

test('payment display lookup does not query an empty booking list', async () => {
  const db = fakeDb([]);
  assert.equal((await fetchBookingPaymentDetails(db, [])).size, 0);
  assert.equal(db.calls.length, 0);
});

test('prefers the latest success over a more recent failed or pending attempt', async () => {
  const db = fakeDb([
    { payment_id: 15, booking_id: 1, status: 'succeeded', method: 'qrph', transaction_reference: 'cs_paid' },
    { payment_id: 22, booking_id: 1, status: 'failed', method: 'paypal', transaction_reference: 'failed_attempt' },
    { payment_id: 10, booking_id: 1, status: 'succeeded', method: 'card', transaction_reference: 'older_paid' },
    { payment_id: 23, booking_id: 1, status: 'pending', transaction_reference: 'pending_attempt' }
  ]);
  const details = await fetchBookingPaymentDetails(db, [1]);
  assert.equal(details.get(1).payment_id, 15);
  assert.equal(details.get(1).method, 'qrph');
  assert.equal(details.get(1).transaction_reference, 'cs_paid');
});

test('falls back to the latest attempt when no payment succeeded', async () => {
  const db = fakeDb([
    { payment_id: 11, booking_id: 2, status: 'failed', transaction_reference: 'old' },
    { payment_id: 25, booking_id: 2, status: 'pending', transaction_reference: 'latest' }
  ]);
  assert.equal((await fetchBookingPaymentDetails(db, [2])).get(2).transaction_reference, 'latest');
});

test('uses a bounded batch lookup of authorized IDs, not per-booking queries', async () => {
  const db = fakeDb([
    { payment_id: 1, booking_id: '1', status: 'succeeded', transaction_reference: 'one' },
    { payment_id: 2, booking_id: 2, status: 'succeeded', transaction_reference: 'two' },
    { payment_id: 3, booking_id: 99, status: 'succeeded', transaction_reference: 'other-owner' }
  ]);
  const details = await fetchBookingPaymentDetails(db, [1, '1', 2, null, -1, '2) OR 1=1']);
  assert.deepEqual(db.calls[1].params, [[1, 2]]);
  assert.equal(db.calls.length, 2);
  assert.equal(details.size, 2);
  assert.equal(details.has(99), false);
});

test('older schemas use the transaction reference without requiring a customer-reference migration', async () => {
  const db = fakeDb([{ payment_id: 1, booking_id: 1, status: 'succeeded', transaction_reference: 'legacy-tx' }], false);
  const details = await fetchBookingPaymentDetails(db, [1]);
  assert.match(db.calls[1].sql, /NULL AS customer_reference_number/);
  assert.equal(details.get(1).transaction_reference, 'legacy-tx');
});

test('exposes only selected display fields without changing booking data or paid totals', async () => {
  const booking = Object.freeze({ booking_id: 1, payment_method: 'paypal', amount_paid: 500, payment_reference: 'old-booking-ref' });
  const db = fakeDb([{
    payment_id: 8, booking_id: 1, status: 'succeeded', method: 'qrph', provider: 'paymongo',
    transaction_reference: 'cs_paid', customer_reference_number: 'CUSTOMER-123',
    provider_response: { secret: 'MUST-NOT-BE-EXPOSED' }
  }]);
  const details = await fetchBookingPaymentDetails(db, [1]);
  assert.deepEqual(getBookingPaymentFields(booking, details), {
    display_payment_method: 'qrph', payment_record_id: 8, payment_record_status: 'succeeded',
    payment_provider: 'paymongo', payment_customer_reference: 'CUSTOMER-123', payment_transaction_reference: 'cs_paid'
  });
  assert.equal(JSON.stringify([...details.values()]).includes('MUST-NOT-BE-EXPOSED'), false);
  assert.equal(booking.payment_method, 'paypal');
  assert.equal(booking.amount_paid, 500);
});

test('bookings without payment records retain their chosen method and legacy payment reference', () => {
  assert.deepEqual(getBookingPaymentFields({ booking_id: 1, payment_method: 'pay_at_property', payment_reference: ' legacy ' }, new Map()), {
    display_payment_method: 'pay_at_property', payment_record_id: null, payment_record_status: null,
    payment_provider: null, payment_customer_reference: null, payment_transaction_reference: 'legacy'
  });
});

test('does not relabel a booking or receipt number as a payment reference', () => {
  const fields = getBookingPaymentFields({ booking_id: 1, booking_reference: 'HB000001', receipt_number: 'RECEIPT-1' }, new Map());
  assert.equal(fields.payment_transaction_reference, null);
  assert.equal(fields.payment_customer_reference, null);
});

test('a selected payment without a reference does not inherit an older attempt reference', () => {
  const details = new Map([[1, { payment_id: 2, method: 'gcash', transaction_reference: null }]]);
  assert.equal(getBookingPaymentFields({ booking_id: 1, payment_reference: 'old-card-ref' }, details).payment_transaction_reference, null);
});
