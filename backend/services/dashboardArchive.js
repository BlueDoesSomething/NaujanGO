import db from '../db.js';
import { balanceOf } from '../utils/paymentAmounts.js';

export const archiveFailure = (message, status = 409, details) => Object.assign(new Error(message), { status, details });
export const archiveId = value => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw archiveFailure('Invalid record ID.', 400);
  return id;
};

// All interpolated values are validated IDs or fixed internal identifiers.
// An explicit personal restore (0) overrides a legacy shared archive (1).
export const archiveSql = (type, alias, userId, date = false) => {
  if (!['booking', 'payment'].includes(type) || !/^[a-z][a-z0-9_]*$/i.test(alias)) throw new Error('Invalid archive query');
  const id = archiveId(userId);
  const key = type === 'booking' ? 'booking_id' : 'payment_id';
  const column = date ? 'archived_at' : 'archived';
  const lookup = `SELECT da.${column} FROM dashboard_record_archives da
    WHERE da.user_id = ${id} AND da.record_type = '${type}' AND da.record_id = ${alias}.${key}`;
  if (date) return `CASE WHEN EXISTS (SELECT 1 FROM dashboard_record_archives da WHERE da.user_id = ${id}
    AND da.record_type = '${type}' AND da.record_id = ${alias}.${key}) THEN (${lookup}) ELSE ${alias}.archived_at END`;
  return `COALESCE((${lookup}), ${alias}.archived, 0)`;
};

// Keep in sync with migrations/049_dashboard_archives.sql. Inline DDL also
// works when the hosting service deploys backend/ without the repository root.
export const dashboardArchiveSchema = `
CREATE TABLE IF NOT EXISTS dashboard_record_archives (
  user_id INT NOT NULL,
  record_type ENUM('booking', 'payment') NOT NULL,
  record_id INT NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 1,
  archived_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, record_type, record_id),
  KEY idx_archive_record (record_type, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS dashboard_archive_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  record_type VARCHAR(20) NOT NULL,
  record_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_archive_audit_record (record_type, record_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
export const ensureDashboardArchiveSchema = () => db.promise().query(dashboardArchiveSchema);

export const archiveTransaction = async work => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const auditArchive = (connection, user, type, id, action, reason = null) => connection.query(
  `INSERT INTO dashboard_archive_audit (actor_id, actor_role, record_type, record_id, action, reason)
   VALUES (?, ?, ?, ?, ?, ?)`, [user.user_id, user.role, type, id, action, reason]
);

export const bookingArchiveBlocker = (booking, payments = []) => {
  if (payments.some(payment => ['pending', 'refund_pending', 'disputed'].includes(payment.status))) {
    return 'Resolve pending payments, refunds, or disputes before archiving this booking.';
  }
  if (['refund_pending', 'disputed'].includes(booking.payment_status)) return 'Resolve the refund or dispute first.';
  if (booking.status === 'pending') return 'Resolve or cancel the pending booking before archiving it.';
  if (['confirmed', 'completed'].includes(booking.status)) {
    if (booking.status === 'confirmed' && !Number(booking.stay_ended)) return 'An upcoming or ongoing stay cannot be archived.';
    const paid = payments.filter(payment => payment.status === 'succeeded').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    if (balanceOf(booking.total_amount, paid, booking.payment_status) > 0) return 'Settle the outstanding balance before archiving this booking.';
  } else if (booking.status !== 'cancelled') return 'This booking is not ready to archive.';
  return null;
};

export const setPersonalArchive = async (user, type, value, archived, reason = null) => {
  const id = archiveId(value);
  archiveId(user.user_id);
  if (!['owner', 'admin'].includes(user.role)) throw archiveFailure('Access denied.', 403);
  if (!['booking', 'payment'].includes(type)) throw archiveFailure('Unsupported archive record.', 400);
  if (typeof archived !== 'boolean') throw archiveFailure('Archive state must be explicit.', 400);
  if (reason != null && (typeof reason !== 'string' || reason.length > 500)) throw archiveFailure('Archive reason must be at most 500 characters.', 400);
  return archiveTransaction(async connection => {
    const payment = type === 'payment';
    const [rows] = await connection.query(
      `SELECT b.*, (b.check_out < CURDATE()) AS stay_ended${payment ? ', p.payment_id, p.status AS target_payment_status' : ''}
       FROM hotel_bookings b ${payment ? 'INNER JOIN hotel_payments p ON p.booking_id = b.booking_id' : ''}
       WHERE ${payment ? 'p.payment_id' : 'b.booking_id'} = ?
       ${user.role === 'admin' ? '' : 'AND EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = b.hotel_id AND ho.user_id = ?)'}
       FOR UPDATE`, user.role === 'admin' ? [id] : [id, user.user_id]
    );
    if (!rows.length) throw archiveFailure('Record not found or access denied.', 404);
    const booking = rows[0];
    if (archived) {
      if (payment && !['succeeded', 'failed', 'refunded'].includes(booking.target_payment_status)) {
        throw archiveFailure('Pending payments, refunds, and disputes cannot be archived.');
      }
      // Failed/refunded attempts are terminal. A succeeded payment must remain
      // visible while its stay/balance still needs operational attention.
      if (!payment || booking.target_payment_status === 'succeeded') {
        const [payments] = await connection.query(
          'SELECT payment_id, status, amount FROM hotel_payments WHERE booking_id = ? ORDER BY payment_id FOR UPDATE', [booking.booking_id]
        );
        const blocker = bookingArchiveBlocker(booking, payments);
        if (blocker) throw archiveFailure(blocker);
      }
    }
    const [current] = await connection.query(
      'SELECT archived FROM dashboard_record_archives WHERE user_id = ? AND record_type = ? AND record_id = ? FOR UPDATE',
      [user.user_id, type, id]
    );
    await connection.query(
      `INSERT INTO dashboard_record_archives (user_id, record_type, record_id, archived, archived_at)
       VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE archived = VALUES(archived), archived_at = VALUES(archived_at)`,
      [user.user_id, type, id, archived ? 1 : 0, archived ? new Date() : null]
    );
    // Audit every explicit action; an idempotent retry never changes statuses.
    await auditArchive(connection, user, type, id, archived ? 'archive' : 'restore', reason);
    return { success: true, archived, scope: 'personal', previous_archived: current[0]?.archived ?? null,
      message: `${payment ? 'Payment' : 'Booking'} ${archived ? 'archived in' : 'restored to'} your dashboard only.` };
  });
};

export const respondArchiveError = (res, error, fallback = 'Archive operation failed.') => {
  if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) {
    return res.status(409).json({ error: 'This record is being changed by another request. Nothing was deleted; please retry.' });
  }
  if (['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'].includes(error.code)) {
    return res.status(409).json({ error: 'Linked records prevent permanent deletion. The record has been retained.' });
  }
  if (['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code)) {
    return res.status(503).json({ error: 'Archive storage needs an update. Run migrations/049_dashboard_archives.sql on the backend database.', code: 'ARCHIVE_SCHEMA_MISSING' });
  }
  return res.status(error.status || 500).json({ error: error.status ? error.message : fallback,
    ...(error.details ? { details: error.details } : {}) });
};
