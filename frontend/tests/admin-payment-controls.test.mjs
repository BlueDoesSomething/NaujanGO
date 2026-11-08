import test from 'node:test';
import assert from 'node:assert/strict';
import { isExternalPaymentBooking, PAY_AT_PROPERTY_NOTICE, isManualGCashBooking, externalPaymentLabel, externalPaymentNotice } from '../src/utils/bookingPaymentPolicy.js';
import { canResumeBookingPayment, paymentReturnPresentation } from '../src/utils/paymentRecovery.js';
import { ownerRecordReport } from '../src/utils/reportExports.js';
import { ownerTodayTasks } from '../src/utils/ownerDashboard.js';

const booking = { booking_id: 1, status: 'confirmed', payment_status: 'unpaid', amount_paid: 0, balance_due: 500, total_amount: 500, currency: 'PHP', payment_method: 'pay_at_property', check_in: '2099-12-20', check_out: '2099-12-21', policy_snapshot: { payment_handling: 'external' } };
test('external payment identity survives serialization without changing the booking lifecycle', () => {
  assert.equal(isExternalPaymentBooking(booking), true); assert.equal(isExternalPaymentBooking({ ...booking, policy_snapshot: JSON.stringify(booking.policy_snapshot) }), true);
  assert.equal(isExternalPaymentBooking({ policy_snapshot: 'bad JSON' }), false);
  assert.equal(canResumeBookingPayment(booking), false);
  assert.match(PAY_AT_PROPERTY_NOTICE, /No advance deposit/);
});
test('external and globally disabled payment return pages do not imply payment or encourage repayment', () => {
  assert.equal(paymentReturnPresentation({ state: 'external' }).title, 'Pay at property');
  assert.equal(paymentReturnPresentation({ state: 'pending', online_payments_enabled: false }).title, 'Online payments disabled');
  assert.equal(paymentReturnPresentation({ state: 'succeeded', online_payments_enabled: false, booking: {} }).title, 'Payment received', 'real earlier payments retain truthful results');
});
test('normal booking exports and daily tasks do not imply a verified external balance or platform bill', () => {
  const report = ownerRecordReport('bookings', [booking]);
  assert.equal(report.rows[0].paid, ''); assert.equal(report.rows[0].balance, ''); assert.match(report.rows[0].paymentStatus, /not verified/);
  const tasks = ownerTodayTasks([booking], '2099-12-20');
  assert.equal(tasks.arrivals.length, 1); assert.equal(tasks.unpaid.length, 0);
});

test('manual GCash is distinct from historical online GCash and never exposes an online payment retry', () => {
  const gcash = { ...booking, payment_method: 'gcash', policy_snapshot: JSON.stringify({ payment_handling: 'external', payment_arrangement: 'gcash' }) };
  assert.equal(isManualGCashBooking(gcash), true);
  assert.equal(isManualGCashBooking({ ...gcash, policy_snapshot: null }), false, 'historical gateway payments are not relabelled');
  assert.equal(isManualGCashBooking(booking), false);
  assert.equal(externalPaymentLabel(gcash), 'GCash · direct to owner');
  assert.match(externalPaymentNotice(gcash), /QR code or number/);
  assert.match(externalPaymentNotice(gcash), /does not collect or verify/);
  assert.equal(canResumeBookingPayment(gcash), false);
  assert.equal(paymentReturnPresentation({ state: 'external', booking: gcash }).title, 'GCash · direct to owner');
  const report = ownerRecordReport('bookings', [gcash]);
  assert.equal(report.rows[0].method, 'GCash'); assert.match(report.rows[0].paymentStatus, /GCash.*not verified/);
  assert.equal(report.rows[0].paid, ''); assert.equal(report.rows[0].balance, '');
});
