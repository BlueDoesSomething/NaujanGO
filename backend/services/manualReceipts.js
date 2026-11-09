// Manual receipt recording for direct-to-owner (external) bookings.
//
// When online payments are disabled — or when a booking was created with an
// external arrangement (GCash/Maya/pay-at-property) — no gateway interaction
// happens. The owner verifies the off-platform transfer themselves and
// records it here. This does NOT touch the online-payments switch; it only
// writes a succeeded hotel_payments row so balances, stats and archiving
// reconcile with what the owner actually received.
import db from '../db.js';
import { policyError, externalPaymentBooking } from './bookingPaymentPolicy.js';
import { syncBookingPaymentStatus } from '../utils/paymentSync.js';

export const MANUAL_RECEIPT_METHODS = ['gcash', 'maya', 'grabpay', 'qrph', 'bank_transfer', 'instapay', 'pay_at_property'];
export const MANUAL_RECEIPT_PROVIDER = 'manual';

const round2 = value => Math.round(value * 100) / 100;

// Validate and normalize owner-supplied receipt input. Pure: no DB access.
export const normalizeManualReceiptInput = (body = {}) => {
  const amount = body.amount === null || body.amount === undefined || typeof body.amount === 'boolean'
    ? NaN
    : Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw policyError('Enter the amount received (must be greater than zero).', 400);
  }
  const rounded = round2(amount);
  if (rounded <= 0) {
    throw policyError('Enter the amount received (must be greater than zero).', 400);
  }
  let method = typeof body.method === 'string' ? body.method.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
  if (method && !MANUAL_RECEIPT_METHODS.includes(method)) {
    throw policyError(`Unsupported payment method. Use one of: ${MANUAL_RECEIPT_METHODS.join(', ')}.`, 400);
  }
  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
  if (reference.length > 100) {
    throw policyError('Payment reference must be at most 100 characters.', 400);
  }
  return { amount: rounded, method: method || null, reference: reference || null };
};

// Still owed on a booking given succeeded receipts so far (mirrors balanceOf
// without requiring a payment_status argument).
export const outstandingOf = (totalAmount, succeededTotal) => {
  const remaining = round2(Number(totalAmount || 0) - Number(succeededTotal || 0));
  return remaining > 0 ? remaining : 0;
};

// Record a received manual payment for an external booking, locked so
// concurrent receipts for the same booking serialize through the booking row.
// Payment-only: recomputes payment_status from succeeded rows but never
// changes the reservation status — confirming the reservation stays a
// separate owner action. Money confirmation and room confirmation are
// deliberately decoupled.
export const recordManualReceipt = async (bookingId, input, dbLike = null) => {
  const connection = dbLike || (await db.promise().getConnection());
  const ownsTransaction = !dbLike;
  try {
    if (ownsTransaction) await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT booking_id, status, hotel_id, total_amount, currency, payment_method, policy_snapshot
       FROM hotel_bookings WHERE booking_id = ? FOR UPDATE`,
      [bookingId]
    );
    if (rows.length === 0) throw policyError('Booking not found.', 404);
    const booking = rows[0];

    if (!externalPaymentBooking(booking)) {
      throw policyError('Received payments can only be recorded for bookings paid directly to the property.', 409, 'EXTERNAL_PAYMENT_BOOKING');
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw policyError('This booking can no longer accept payments.', 409);
    }

    const [paidRows] = await connection.query(
      `SELECT COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0) AS paid
       FROM hotel_payments WHERE booking_id = ?`,
      [bookingId]
    );
    const succeeded = Number(paidRows[0]?.paid) || 0;
    const outstanding = outstandingOf(booking.total_amount, succeeded);
    if (outstanding <= 0) {
      throw policyError('This booking has no outstanding balance.', 409);
    }
    if (input.amount > outstanding + 0.005) {
      throw policyError(
        `The amount received (${input.amount.toFixed(2)}) exceeds the outstanding balance (${outstanding.toFixed(2)}). Record only what the guest actually paid.`,
        400
      );
    }

    const method = input.method || booking.payment_method || 'pay_at_property';
    const currency = booking.currency || 'PHP';
    const [inserted] = await connection.query(
      `INSERT INTO hotel_payments (booking_id, amount, currency, method, provider, status, transaction_reference, paid_at)
       VALUES (?, ?, ?, ?, ?, 'succeeded', ?, NOW())`,
      [bookingId, input.amount, currency, method, MANUAL_RECEIPT_PROVIDER, input.reference]
    );

    const sync = await syncBookingPaymentStatus(bookingId, { confirm: false, dbLike: connection });
    if (ownsTransaction) await connection.commit();

    return {
      payment: {
        payment_id: inserted.insertId,
        booking_id: Number(bookingId),
        amount: input.amount,
        currency,
        method,
        provider: MANUAL_RECEIPT_PROVIDER,
        status: 'succeeded',
        transaction_reference: input.reference,
        paid_at: new Date().toISOString()
      },
      payment_status: sync?.payment_status ?? null,
      outstanding_after: outstandingOf(booking.total_amount, succeeded + input.amount)
    };
  } catch (error) {
    if (ownsTransaction) await connection.rollback();
    throw error;
  } finally {
    if (ownsTransaction) connection.release();
  }
};
