import db from '../db.js';
import { statusAfterPayment } from './paymentAmounts.js';

// Recomputes a booking's payment_status from succeeded hotel_payments rows
// instead of assuming a single full payment. Called after any payment row is
// flipped to 'succeeded'. Also clears expires_at so a booking that has paid
// anything can never be auto-cancelled by the expiry cleanup.
export const syncBookingPaymentStatus = async (bookingId, options = {}) => {
  // Default calls own a transaction. A supplied dbLike must be the caller's
  // transaction connection, so its booking lock remains held until commit.
  if (options.dbLike) return syncLockedBooking(bookingId, options);
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const result = await syncLockedBooking(bookingId, { ...options, dbLike: connection });
    await connection.commit();
    return result;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};

const syncLockedBooking = async (bookingId, options) => {
  const { confirm = false, paymentMethod = null, dbLike } = options;

  // Serialize with staff extensions: a callback must compare against the latest
  // total, not mark the old package paid after an extension adds a balance.
  const [bookings] = await dbLike.query(
    'SELECT total_amount, payment_status FROM hotel_bookings WHERE booking_id = ? FOR UPDATE',
    [bookingId]
  );
  if (bookings.length === 0) return null;

  const booking = bookings[0];
  const [paidRows] = await dbLike.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0) AS paid
     FROM hotel_payments WHERE booking_id = ?`,
    [bookingId]
  );
  const paid = Number(paidRows[0]?.paid) || 0;
  const nextStatus = statusAfterPayment(booking.total_amount, paid, booking.payment_status);

  const fields = ['payment_status = ?', 'expires_at = NULL', 'updated_at = NOW()'];
  const params = [nextStatus];
  if (paymentMethod) {
    fields.push('payment_method = ?');
    params.push(paymentMethod);
  }
  if (confirm) fields.push("status = 'confirmed'");
  params.push(bookingId);

  await dbLike.query(`UPDATE hotel_bookings SET ${fields.join(', ')} WHERE booking_id = ?`, params);
  return { payment_status: nextStatus, amount_paid: paid, confirmed: confirm };
};

// Amount already settled on a booking (succeeded payments only).
export const fetchAmountPaid = async (bookingId, dbLike = db.promise()) => {
  const [rows] = await dbLike.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0) AS paid
     FROM hotel_payments WHERE booking_id = ?`,
    [bookingId]
  );
  return Number(rows[0]?.paid) || 0;
};
