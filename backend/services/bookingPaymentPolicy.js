import db from '../db.js';
import { readJson } from '../utils/stayOptions.js';

export const policyError = (message, status = 400, code = 'BOOKING_POLICY_ERROR') => Object.assign(new Error(message), { status, code });
export const externalPaymentBooking = booking => readJson(booking?.policy_snapshot)?.payment_handling === 'external';
export const getBookingPolicy = async (connection = db.promise(), lock = false) => {
  try {
    const [rows] = await connection.execute(`SELECT * FROM booking_payment_policy WHERE policy_id = 1${lock ? ' FOR UPDATE' : ''}`);
    const row = rows[0];
    return { online_payments_enabled: row?.online_payments_enabled === 1, default_payment_arrangement: 'pay_at_property', storage_ready: Boolean(row), lock_version: row?.lock_version ?? 0 };
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return { online_payments_enabled: false, default_payment_arrangement: 'pay_at_property', storage_ready: false, lock_version: 0 };
    throw policyError('Booking policy is unavailable. No new payments can be started; please retry.', 503);
  }
};
export const changeBookingPolicy = async (user, body) => {
  if (user.role !== 'admin') throw policyError('Only an administrator can change the payment policy.', 403);
  if (typeof body.online_payments_enabled !== 'boolean' || !Number.isSafeInteger(body.lock_version)) throw policyError('Select a payment mode and reload the current policy.');
  if (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 1000) throw policyError('Give a reason of at most 1,000 characters.');
  if (body.online_payments_enabled && body.confirm_enable !== true) throw policyError('Explicit confirmation is required to enable online payments.');
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const current = await getBookingPolicy(connection, true);
    if (!current.storage_ready) throw policyError('Apply migrations/055_admin_payment_controls.sql first.', 503);
    if (current.lock_version !== body.lock_version) throw policyError('The policy changed. Reload it before saving.', 409);
    await connection.execute('UPDATE booking_payment_policy SET online_payments_enabled = ?, updated_by = ?, lock_version = lock_version + 1 WHERE policy_id = 1', [body.online_payments_enabled ? 1 : 0, user.user_id]);
    await connection.execute('INSERT INTO booking_payment_policy_audit (online_payments_enabled, changed_by, reason) VALUES (?, ?, ?)', [body.online_payments_enabled ? 1 : 0, user.user_id, body.reason.trim()]);
    await connection.commit();
    return getBookingPolicy();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};
export const assertPaymentAllowed = async bookingId => {
  if (!(await getBookingPolicy()).online_payments_enabled) throw policyError('Online payments are disabled by the administrator. Arrange payment directly with the property; do not send a deposit through NaujanGO.', 403, 'ONLINE_PAYMENTS_DISABLED');
  if (bookingId) {
    if (!/^\d+$/.test(String(bookingId))) throw policyError('Invalid booking ID.');
    const [rows] = await db.promise().execute('SELECT policy_snapshot FROM hotel_bookings WHERE booking_id = ?', [String(bookingId)]);
    if (rows.length && externalPaymentBooking(rows[0])) throw policyError('Payment for this reservation is arranged directly with the property. NaujanGO does not process or verify it.', 409, 'EXTERNAL_PAYMENT_BOOKING');
  }
};
export const respondBookingPolicyError = (res, error) => {
  const missing = ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code);
  const conflict = ['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code);
  return res.status(missing ? 503 : conflict ? 409 : error.status || 500).json({
    error: missing ? 'Payment controls and booking messages need migrations/055_admin_payment_controls.sql. Ask the administrator to apply it.' : conflict ? 'This booking is being updated. Refresh it before retrying.' : error.status ? error.message : 'Could not complete this action. Saved bookings and messages are retained; please retry.',
    code: error.status ? error.code : undefined
  });
};
