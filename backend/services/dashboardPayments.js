import db from '../db.js';
import { archiveSql } from './dashboardArchive.js';

export const paymentQueryScope = (user, filters = {}, includeArchive = true) => {
  const conditions = [];
  const params = [];
  if (user.role !== 'admin') {
    conditions.push('EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = hb.hotel_id AND ho.user_id = ?)');
    params.push(user.user_id);
  }
  if (includeArchive && filters.archived !== 'all') conditions.push(`${archiveSql('payment', 'hp', user.user_id)} = ${filters.archived === '1' ? 1 : 0}`);
  for (const [name, clause] of Object.entries({ status: 'hp.status = ?', method: 'hp.method = ?', startDate: 'DATE(hp.created_at) >= ?', endDate: 'DATE(hp.created_at) <= ?' })) {
    if (filters[name] && filters[name] !== 'all') { conditions.push(clause); params.push(filters[name]); }
  }
  if (String(filters.search || '').trim()) {
    conditions.push('(hp.transaction_reference LIKE ? OR hb.receipt_number LIKE ? OR hb.customer_name LIKE ? OR hb.customer_email LIKE ?)');
    params.push(...Array(4).fill(`%${String(filters.search).trim()}%`));
  }
  // Retain even legacy/orphan payments in admin totals. Ownership still needs
  // a matching booking, so owners cannot access unattributable payments.
  return { from: 'FROM hotel_payments hp LEFT JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id',
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

const totals = `COUNT(*) AS total_transactions,
  COALESCE(SUM(CASE WHEN hp.status = 'succeeded' THEN hp.amount ELSE 0 END), 0) AS total_revenue,
  COALESCE(SUM(CASE WHEN hp.status = 'pending' THEN hp.amount ELSE 0 END), 0) AS pending_amount,
  COALESCE(SUM(CASE WHEN hp.status = 'failed' THEN hp.amount ELSE 0 END), 0) AS failed_amount,
  COALESCE(SUM(CASE WHEN hp.status = 'failed' THEN 1 ELSE 0 END), 0) AS failed_transactions,
  COALESCE(SUM(CASE WHEN hp.status = 'succeeded' THEN 1 ELSE 0 END), 0) AS successful_transactions,
  COALESCE(SUM(CASE WHEN hp.status = 'refunded' THEN hp.amount ELSE 0 END), 0) AS refunded_amount,
  COALESCE(AVG(CASE WHEN hp.status = 'succeeded' THEN hp.amount END), 0) AS avg_transaction,
  COALESCE(SUM(CASE WHEN DATE(hp.paid_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS today_transactions,
  COALESCE(SUM(CASE WHEN DATE(hp.paid_at) = CURDATE() AND hp.status = 'succeeded' THEN hp.amount ELSE 0 END), 0) AS today_revenue`;

export const dashboardPaymentStats = async (user, filters = {}, dbLike = db.promise()) => {
  const visible = paymentQueryScope(user, filters);
  const history = paymentQueryScope(user, {}, false);
  const [[current]] = await dbLike.query(`SELECT ${totals} ${visible.from} ${visible.where}`, visible.params);
  const [[historical]] = await dbLike.query(`SELECT ${totals} ${history.from} ${history.where}`, history.params);
  const [methodBreakdown] = await dbLike.query(`SELECT hp.method, COUNT(*) AS count,
    SUM(CASE WHEN hp.status = 'succeeded' THEN hp.amount ELSE 0 END) AS total
    ${visible.from} ${visible.where} GROUP BY hp.method`, visible.params);
  return { ...current, total_revenue: historical.total_revenue, historical, methodBreakdown,
    archive_scope: filters.archived === 'all' ? 'including_archived' : filters.archived === '1' ? 'archived_only' : 'unarchived', revenue_scope: 'lifetime_including_archived' };
};

export const dashboardPayments = async (user, filters = {}, dbLike = db.promise()) => {
  const scope = paymentQueryScope(user, filters);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 250, 1), 500);
  // Existing dedicated Archive endpoints return all retained records so old
  // records remain restorable. The regular Payments screen stays bounded.
  const allArchived = filters.archived === '1' && filters.allArchived === true;
  const [rows] = await dbLike.query(`SELECT hp.*, ${archiveSql('payment', 'hp', user.user_id)} AS archived,
    ${archiveSql('payment', 'hp', user.user_id, true)} AS archived_at,
    hb.hotel_name, hb.customer_name, hb.customer_email, hb.check_in, hb.check_out,
    hb.receipt_number, hb.room_type_name, hb.rooms, hb.booking_reference
    ${scope.from} ${scope.where} ORDER BY ${allArchived ? archiveSql('payment', 'hp', user.user_id, true) : 'hp.created_at'} DESC, hp.payment_id DESC
    ${allArchived ? '' : 'LIMIT ?'}`, allArchived ? scope.params : [...scope.params, limit]);
  return rows;
};
