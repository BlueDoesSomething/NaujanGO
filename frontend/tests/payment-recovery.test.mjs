import test from 'node:test';
import assert from 'node:assert/strict';
import { canResumeBookingPayment, paymentReturnPresentation } from '../src/utils/paymentRecovery.js';
const now = Date.parse('2026-11-01T10:00:00+08:00');
const booking = { status: 'pending', payment_status: 'pending', balance_due: 350, amount_paid: 0,
  check_in: '2026-11-02', check_out: '2026-11-03', expires_at: '2026-11-01T18:00:00+08:00' };

test('cancelled return URLs and pending records never display successful payment', () => {
  assert.equal(paymentReturnPresentation({ state: 'pending' }, true).title, 'Payment not completed');
  assert.equal(paymentReturnPresentation({ state: 'pending' }).kind, 'pending');
  assert.notEqual(paymentReturnPresentation(null).kind, 'success');
  assert.notEqual(paymentReturnPresentation({ state: 'checking', verification_unavailable: true }).kind, 'success');
});

test('only verified server success displays received payment, with accurate booking and balance language', () => {
  assert.equal(paymentReturnPresentation({ state: 'succeeded', booking: { status: 'confirmed', balance_due: 0 } }, true).kind, 'success', 'a cancel URL cannot undo verified money');
  assert.match(paymentReturnPresentation({ state: 'succeeded', booking: { status: 'confirmed', balance_due: 500 } }).text, /remaining balance/);
  assert.doesNotMatch(paymentReturnPresentation({ state: 'succeeded', booking: { status: 'pending' } }).text, /booking is confirmed/);
});

test('late payments and inconsistent legacy paid records require review rather than another charge', () => {
  assert.equal(paymentReturnPresentation({ state: 'succeeded', needs_staff_review: true }).kind, 'review');
  assert.equal(paymentReturnPresentation({ state: 'review' }).kind, 'review');
});

test('Booking History offers resume payment for eligible unpaid reservations and outstanding balances', () => {
  assert.equal(canResumeBookingPayment(booking, now), true);
  assert.equal(canResumeBookingPayment({ ...booking, payment_status: 'unpaid' }, now), true);
  assert.equal(canResumeBookingPayment({ ...booking, payment_status: 'failed' }, now), true);
  assert.equal(canResumeBookingPayment({ ...booking, payment_status: 'partial', amount_paid: 100 }, now), true);
});

test('expired, cancelled, archived, paid and refunded bookings do not offer repayment', () => {
  for (const change of [{ status: 'cancelled' }, { status: 'completed' }, { archived: 1 }, { payment_status: 'paid' },
    { payment_status: 'refunded' }, { balance_due: 0 }, { expires_at: '2026-11-01T09:00:00+08:00' }]) {
    assert.equal(canResumeBookingPayment({ ...booking, ...change }, now), false);
  }
});
