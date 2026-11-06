import db from '../db.js';
import { serializeStay } from '../utils/stayOptions.js';
import { bookingId, bookingTransaction } from './payAtPropertyBookings.js';
import { policyError } from './bookingPaymentPolicy.js';

const load = async (connection, user, id, owner, lock = false) => {
  const scope = owner ? user.role === 'admin' ? { sql: '1 = 1', params: [] } : { sql: 'EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = b.hotel_id AND ho.user_id = ?)', params: [user.user_id] } : { sql: 'b.user_id = ?', params: [user.user_id] };
  const [rows] = await connection.execute(`SELECT b.* FROM hotel_bookings b WHERE b.booking_id = ? AND ${scope.sql}${lock ? ' FOR UPDATE' : ''}`, [bookingId(id), ...scope.params]);
  if (!rows.length) throw policyError('Booking not found or unavailable to this account.', 404);
  return rows[0];
};
export const getBookingMessages = async (user, id, query = {}, owner = false) => {
  const booking = await load(db.promise(), user, id, owner);
  const before = query.before == null ? null : bookingId(query.before);
  const [rows] = await db.promise().execute(`SELECT message_id, sender_role, message, created_at FROM booking_messages WHERE booking_id = ?${before ? ' AND message_id < ?' : ''} ORDER BY message_id DESC LIMIT 51`, [booking.booking_id, ...(before ? [before] : [])]);
  const messages = rows.slice(0, 50).reverse();
  const safe = serializeStay(booking);
  return { booking: { booking_id: safe.booking_id, hotel_name: safe.hotel_name, room_type_name: safe.room_type_name, status: safe.status, check_in: safe.check_in, check_out: safe.check_out, check_in_at: safe.check_in_at, check_out_at: safe.check_out_at }, messages, has_more: rows.length > 50, oldest_id: messages[0]?.message_id ?? null };
};
export const sendBookingMessage = (user, id, body, owner = false) => {
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 4000) throw policyError('Enter a message of at most 4,000 characters.');
  if (typeof body.client_key !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.client_key)) throw policyError('Invalid message retry key. Refresh and try again.');
  return bookingTransaction(async connection => {
    const booking = await load(connection, user, id, owner, true);
    const [retry] = await connection.execute('SELECT message_id, message FROM booking_messages WHERE booking_id = ? AND sender_id = ? AND client_key = ?', [booking.booking_id, user.user_id, body.client_key]);
    if (retry.length) {
      if (retry[0].message !== body.message.trim()) throw policyError('That message key was already used. Refresh and try again.', 409);
      return { message_id: retry[0].message_id };
    }
    const role = owner ? user.role === 'admin' ? 'admin' : 'owner' : 'guest';
    const [insert] = await connection.execute('INSERT INTO booking_messages (booking_id, sender_id, sender_role, client_key, message) VALUES (?, ?, ?, ?, ?)', [booking.booking_id, user.user_id, role, body.client_key, body.message.trim()]);
    if (owner) await connection.execute("INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'booking_message', 'New booking message', ?, ?)", [booking.user_id, `The property sent a message about booking #${booking.booking_id}. Open My Bookings → Message property.`, booking.booking_id]);
    else await connection.execute("INSERT INTO notifications (user_id, type, title, message, related_id) SELECT DISTINCT ho.user_id, 'booking_message', 'New booking message', ?, ? FROM hotel_owners ho WHERE ho.hotel_id = ? AND ho.user_id <> ?", [`A guest sent a message about booking #${booking.booking_id}. Open Reservations → Message guest.`, booking.booking_id, booking.hotel_id, booking.user_id]);
    return { message_id: insert.insertId };
  });
};
