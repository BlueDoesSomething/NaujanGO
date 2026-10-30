import db from '../db.js';
import { archiveFailure, archiveId, archiveTransaction, auditArchive } from './dashboardArchive.js';

const content = {
  hotel: { table: 'hotels', key: 'hotel_id', references: [['hotel_bookings', 'hotel_id'], ['rooms', 'hotel_id'], ['hotel_owners', 'hotel_id'], ['reviews', 'hotel_id'], ['hotel_availability', 'hotel_id']] },
  attraction: { table: 'attractions', key: 'id', references: [['itinerary_attractions', 'attraction_id'], ['reviews', 'attraction_id'], ['attraction_reviews', 'attraction_id']] },
  itinerary: { table: 'itineraries', key: 'itinerary_id', references: [['itinerary_attractions', 'itinerary_id'], ['itinerary_items', 'itinerary_id'], ['hotel_bookings', 'itinerary_id']] }
};
const configFor = type => {
  if (!Object.hasOwn(content, type)) throw archiveFailure('Bookings and payments cannot be permanently deleted through the dashboard.', 403);
  return content[type];
};
const identifier = value => {
  if (!/^[a-z0-9_]+$/i.test(value)) throw new Error('Unsafe dependency identifier');
  return `\`${value}\``;
};

// Both declared foreign keys and known logical links are checked. No cascading
// child cleanup is performed: any reference blocks permanent deletion.
const deletionReview = async (connection, type, id, row, lock = false) => {
  const config = configFor(type);
  const blockers = [];
  if (Number(row.archived) !== 1) blockers.push('Archive this content before requesting permanent deletion.');
  if (type === 'hotel' && Number(row.is_active) !== 0) blockers.push('Only inactive hotels can be permanently deleted.');
  if (type === 'itinerary' && !['draft', 'planning'].includes(row.status)) blockers.push('Only unused draft/planning itineraries can be permanently deleted.');
  const [foreignKeys] = await connection.query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name FROM information_schema.KEY_COLUMN_USAGE
     WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = ? AND REFERENCED_COLUMN_NAME = ?`, [config.table, config.key]
  );
  const tables = [...new Set([config.table, ...config.references.map(([table]) => table)])];
  const [columns] = await connection.query(
    'SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)', [tables]
  );
  if (!columns.some(column => column.table_name === config.table && column.column_name === config.key)) {
    throw archiveFailure('Cannot verify database dependencies. Permanent deletion is disabled.', 503);
  }
  const logical = config.references.filter(([table, column]) => columns.some(item => item.table_name === table && item.column_name === column));
  const references = new Map([...foreignKeys.map(item => [item.table_name, item.column_name]), ...logical]
    .map(([table, column]) => [`${table}.${column}`, [table, column]]));
  for (const [table, column] of references.values()) {
    const [rows] = await connection.query(`SELECT ${identifier(column)} FROM ${identifier(table)} WHERE ${identifier(column)} = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`, [id]);
    if (rows.length) blockers.push(`Linked records in ${table} must be retained. Use Archive/Restore instead.`);
  }
  return { can_delete: blockers.length === 0, blockers, confirmation: `DELETE ${type.toUpperCase()} ${id}` };
};

export const reviewContentDeletion = async (user, type, value, dbLike = db.promise()) => {
  if (user.role !== 'admin') throw archiveFailure('Only administrators can review permanent deletion.', 403);
  const config = configFor(type);
  const id = archiveId(value);
  const [rows] = await dbLike.query(`SELECT * FROM ${identifier(config.table)} WHERE ${identifier(config.key)} = ?`, [id]);
  if (!rows.length) throw archiveFailure('Record not found.', 404);
  return deletionReview(dbLike, type, id, rows[0]);
};

export const deleteArchivedContent = async (user, type, value, input = {}) => {
  if (user.role !== 'admin') throw archiveFailure('Only administrators can permanently delete eligible content.', 403);
  const config = configFor(type);
  const id = archiveId(value);
  if (input.confirmation !== `DELETE ${type.toUpperCase()} ${id}` || typeof input.reason !== 'string' || input.reason.trim().length < 10 || input.reason.length > 500) {
    throw archiveFailure('Enter the exact confirmation text and a deletion reason of 10–500 characters.', 400);
  }
  return archiveTransaction(async connection => {
    const [rows] = await connection.query(`SELECT * FROM ${identifier(config.table)} WHERE ${identifier(config.key)} = ? FOR UPDATE`, [id]);
    if (!rows.length) throw archiveFailure('Record not found.', 404);
    const review = await deletionReview(connection, type, id, rows[0], true);
    if (!review.can_delete) throw archiveFailure('Permanent deletion is blocked. The record has been retained.', 409, review.blockers);
    // Audit and DELETE commit together, or neither is persisted.
    await auditArchive(connection, user, type, id, 'permanent_delete', input.reason.trim());
    await connection.query(`DELETE FROM ${identifier(config.table)} WHERE ${identifier(config.key)} = ?`, [id]);
    return { success: true, message: 'Eligible archived content permanently deleted.' };
  });
};

export const setContentArchive = async (user, type, value, archived) => {
  if (user.role !== 'admin') throw archiveFailure('Only administrators can archive this content.', 403);
  const config = configFor(type);
  const id = archiveId(value);
  return archiveTransaction(async connection => {
    const [rows] = await connection.query(`SELECT ${identifier(config.key)} FROM ${identifier(config.table)} WHERE ${identifier(config.key)} = ? FOR UPDATE`, [id]);
    if (!rows.length) throw archiveFailure('Record not found.', 404);
    await connection.query(`UPDATE ${identifier(config.table)} SET archived = ?, archived_at = ? WHERE ${identifier(config.key)} = ?`, [archived ? 1 : 0, archived ? new Date() : null, id]);
    await auditArchive(connection, user, type, id, archived ? 'archive' : 'restore');
    return { success: true, message: `Content ${archived ? 'archived' : 'restored'}.` };
  });
};
