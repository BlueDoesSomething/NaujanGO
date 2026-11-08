import crypto from 'node:crypto';
import db from '../db.js';
import { dateKey, makeStay, bookingInterval, MANILA_OFFSET_MS, parseHourlyRates, readJson, serializeStay } from '../utils/stayOptions.js';
import { validateStayInventory } from './stayInventory.js';
import { getHotelLegitimacy } from '../utils/legitimacy.js';
import { externalPaymentBooking, getBookingPolicy, policyError } from './bookingPaymentPolicy.js';
import { MANUAL_DIRECT_METHODS, parseStoredPaymentMethods } from '../utils/paymentMethods.js';

export const PAY_AT_PROPERTY_NOTICE = 'Pay at the property. No advance deposit is requested through NaujanGO. NaujanGO does not process or verify this payment.';
const labelFor = method => method === 'maya' ? 'Maya' : 'GCash';
export const manualDirectNotice = method => `Pay the owner directly through ${labelFor(method)}. Use Message property on your booking to ask for the owner’s ${labelFor(method)} QR code or number. Confirm the recipient and amount with the owner before transferring. NaujanGO does not collect or verify this payment.`;
export const MANUAL_GCASH_NOTICE = manualDirectNotice('gcash');
export const bookingId = value => {
  if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw policyError('Invalid record ID.');
  return Number(value);
};
const quantity = value => { const number = bookingId(value); if (number > 100) throw policyError('Rooms and guests must be between 1 and 100.'); return number; };
const text = (value, name, max, required = true) => {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || required && !value.trim()) throw policyError(`${name} is required and must be at most ${max} characters.`);
  return value.trim();
};
export const bookingTransaction = async run => {
  const connection = await db.promise().getConnection();
  try { await connection.beginTransaction(); const result = await run(connection); await connection.commit(); return result; }
  catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};
const bookable = async (hotelId, connection) => {
  const { ok, map } = await getHotelLegitimacy([hotelId], connection);
  if (!ok) throw policyError('Cannot verify whether this property is accepting bookings. Please retry.', 503);
  if (!map.get(Number(hotelId))?.booking_enabled) throw policyError('This property is listed for promotion only and cannot accept bookings.', 403);
};
const activeHotel = hotel => { if (!hotel || Number(hotel.is_active) !== 1 || Number(hotel.archived) === 1) throw policyError('This property is not accepting bookings.', 404); };
const activeRoom = (room, guests) => { if (!room || Number(room.is_active) !== 1 || Number(room.capacity) < guests) throw policyError('Select an active room type that can accommodate these guests.', 409); };
const safeBooking = row => ({ ...serializeStay(row), policy_snapshot: readJson(row.policy_snapshot) });
const load = async (connection, id) => {
  const [rows] = await connection.execute('SELECT * FROM hotel_bookings WHERE booking_id = ?', [id]);
  return safeBooking(rows[0]);
};

// Same /bookings/hotels endpoint, same pending -> confirmed/cancelled lifecycle,
// same hotel_bookings table. Only payment collection is bypassed.
export const createPayAtPropertyBooking = async (user, body) => {
  const method = body.payment_method ?? 'pay_at_property';
  const manualDirect = MANUAL_DIRECT_METHODS.includes(method);
  if (!manualDirect && method !== 'pay_at_property') throw policyError('Choose a direct payment option (GCash, Maya, or pay at property) handled outside NaujanGO.');
  const hotelId = bookingId(body.hotel_id), roomId = bookingId(body.room_id), rooms = quantity(body.rooms ?? 1), guests = quantity(body.guests ?? 1);
  if (body.policy_agreed !== true && body.policy_agreed !== 'true') throw policyError('Please read and agree to the booking policies.');
  const name = text(body.customer_name, 'Guest name', 255), email = text(body.customer_email, 'Email', 255), phone = text(body.customer_phone, 'Phone', 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+?[\d ()-]{7,30}$/.test(phone) || phone.replace(/\D/g, '').length < 7) throw policyError('Provide a valid contact email and phone number.');
  const notes = text(body.special_requests, 'Special requests', 4000, false);
  const submissionKey = body.booking_key == null ? crypto.randomUUID() : text(body.booking_key, 'Booking key', 100);
  // Include the direct arrangement in the fingerprint so a retry cannot change it.
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify({ hotelId, roomId, rooms, guests, name, email, phone, notes, check_in: body.check_in, check_out: body.check_out, check_in_time: body.check_in_time, hours: body.stay_duration_hours, quoted_total: body.quoted_total, ...(manualDirect ? { payment_method: method } : {}) })).digest('hex');
  return bookingTransaction(async connection => {
    const policy = await getBookingPolicy(connection, true);
    if (!policy.storage_ready) throw policyError('Apply migrations/055_admin_payment_controls.sql before accepting direct-to-owner bookings.', 503);
    const [hotels] = await connection.execute('SELECT * FROM hotels WHERE hotel_id = ? FOR UPDATE', [hotelId]);
    const hotel = hotels[0];
    // Hotel locking serializes retries and competing bookings. JSON access is
    // guarded for historical rows containing malformed/non-JSON snapshots.
    const [retry] = await connection.execute("SELECT * FROM hotel_bookings WHERE user_id = ? AND hotel_id = ? AND JSON_UNQUOTE(JSON_EXTRACT(CASE WHEN JSON_VALID(policy_snapshot) THEN policy_snapshot ELSE '{}' END, '$.submission_key')) = ? FOR UPDATE", [user.user_id, hotelId, submissionKey]);
    if (retry.length) {
      if (readJson(retry[0].policy_snapshot)?.submission_fingerprint !== fingerprint) throw policyError('That booking key was already used with different details. Refresh before submitting.', 409);
      return { booking: safeBooking(retry[0]), payment_handling: 'external' };
    }
    if (policy.online_payments_enabled && !manualDirect) throw policyError('Payment settings changed. Reload the property and review the current terms before booking.', 409, 'PAYMENT_MODE_CHANGED');
    activeHotel(hotel);
    if (manualDirect && !parseStoredPaymentMethods(hotel.allowed_payment_methods).includes(method)) throw policyError(`${labelFor(method)} is not accepted by this property. Reload and choose another payment method.`, 409);
    await bookable(hotelId, connection);
    const [roomRows] = await connection.execute('SELECT * FROM rooms WHERE room_id = ? AND hotel_id = ? FOR UPDATE', [roomId, hotelId]);
    const room = roomRows[0]; activeRoom(room, guests);
    const stay = makeStay(body, hotel);
    if (stay.start <= Date.now() + MANILA_OFFSET_MS) throw policyError('The booking arrival must be in the future.');
    const rate = stay.hours ? parseHourlyRates(room.hourly_rates)[stay.hours] : Number(room.price_per_night);
    if (!Number.isFinite(rate) || rate <= 0) throw policyError('This room rate is not available.');
    const total = Math.round(rate * stay.units * rooms * 100) / 100;
    if (total > 99999999.99) throw policyError('The booking total is too large.');
    if (body.quoted_total != null && (!Number.isFinite(Number(body.quoted_total)) || Math.abs(Number(body.quoted_total) - total) > .01)) throw policyError('The room price changed. Reload and review the current total before booking.', 409);
    await validateStayInventory(connection, hotel, room, stay, rooms, user.user_id);
    const snapshot = {
      payment_handling: 'external', payment_arrangement: method, submission_key: submissionKey, submission_fingerprint: fingerprint,
      cancellation_type: hotel.cancellation_type || 'free_until', free_cancellation_days: Number(hotel.free_cancellation_days ?? 1),
      custom_policy_text: hotel.custom_policy_text || null, modification_policy_text: hotel.modification_policy_text || null,
      noshow_policy_text: hotel.noshow_policy_text || null, house_rules: hotel.house_rules || null,
      payment_terms_text: manualDirect ? manualDirectNotice(method) : PAY_AT_PROPERTY_NOTICE, reservation_fee: null, balance_due_days: null, balance_due_at: null,
      check_in_time: stay.checkInAt.slice(11, 16), check_out_time: stay.checkOutAt.slice(11, 16),
      check_in_at: stay.checkInAt, check_out_at: stay.checkOutAt, stay_duration_hours: stay.hours, stay_rate: rate,
      agreed_at: new Date().toISOString()
    };
    const [insert] = await connection.execute("INSERT INTO hotel_bookings (user_id, hotel_id, hotel_name, hotel_location, price_per_night, currency, check_in, check_out, nights, rooms, guests, special_requests, status, payment_status, payment_method, payment_option, total_amount, receipt_number, customer_name, customer_email, customer_phone, room_id, room_type_name, expires_at, policy_snapshot, check_in_at, check_out_at, stay_duration_hours, stay_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, 'full', ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)", [user.user_id, hotelId, hotel.name, hotel.location || null, Number(room.price_per_night) || 0, room.currency || hotel.currency || 'PHP', stay.checkIn, stay.checkOut, stay.nights, rooms, guests, notes || null, method, total, `HB-${crypto.randomUUID()}`, name, email, phone, roomId, room.room_type_name, JSON.stringify(snapshot), stay.checkInAt, stay.checkOutAt, stay.hours, rate]);
    const id = insert.insertId;
    await connection.execute('UPDATE hotel_bookings SET booking_reference = ? WHERE booking_id = ?', [`HB${String(id).padStart(6, '0')}`, id]);
    await connection.execute("INSERT INTO notifications (user_id, type, title, message, related_id) SELECT DISTINCT ho.user_id, 'booking', 'New booking', ?, ? FROM hotel_owners ho WHERE ho.hotel_id = ? AND ho.user_id <> ?", [`Booking #${id} for ${hotel.name} is pending. Review it under Reservations. ${manualDirect ? `The guest chose ${labelFor(method)}; use Message guest to share your ${labelFor(method)} number or QR details.` : 'Payment is at the property.'}`, id, hotelId, user.user_id]);
    if (manualDirect) await connection.execute('INSERT INTO booking_messages (booking_id, sender_id, sender_role, client_key, message) VALUES (?, ?, ?, ?, ?)', [id, user.user_id, 'guest', 'manual-payment-request', `Automated request: I selected ${labelFor(method)} (direct to owner) for booking #${id}. Please send your ${labelFor(method)} QR code or number, recipient name, and the amount to pay. NaujanGO does not collect or verify this payment.`]);
    return { booking: await load(connection, id), payment_handling: 'external' };
  });
};

export const modifyPayAtPropertyBooking = (userId, booking, body) => bookingTransaction(async connection => {
  const [hotels] = await connection.execute('SELECT * FROM hotels WHERE hotel_id = ? FOR UPDATE', [booking.hotel_id]);
  const [rows] = await connection.execute('SELECT * FROM hotel_bookings WHERE booking_id = ? FOR UPDATE', [booking.booking_id]);
  const locked = rows[0], hotel = hotels[0];
  if (!locked || Number(locked.user_id) !== Number(userId) || !externalPaymentBooking(locked) || Number(locked.archived) === 1 || !['pending', 'confirmed'].includes(locked.status)) throw policyError('This booking can no longer be modified.', 409);
  activeHotel(hotel);
  if (bookingInterval(locked).start <= Date.now() + MANILA_OFFSET_MS) throw policyError('A stay that has already started cannot be modified.', 409);
  const rooms = quantity(body.rooms ?? locked.rooms), guests = quantity(body.guests ?? locked.guests);
  const [roomRows] = await connection.execute('SELECT * FROM rooms WHERE room_id = ? AND hotel_id = ? FOR UPDATE', [locked.room_id, locked.hotel_id]);
  const room = roomRows[0]; activeRoom(room, guests);
  const snapshot = readJson(locked.policy_snapshot) || {};
  const stay = makeStay({ ...body, stay_duration_hours: locked.stay_duration_hours || null }, snapshot);
  const rate = Number(locked.stay_duration_hours ? locked.stay_rate : locked.price_per_night), total = Math.round(rate * stay.units * rooms * 100) / 100;
  if (!Number.isFinite(rate) || rate <= 0 || total > 99999999.99) throw policyError('The original booking rate is unavailable or the new total is too large.', 409);
  await validateStayInventory(connection, hotel, room, stay, rooms, userId, locked.booking_id);
  Object.assign(snapshot, { check_in_time: stay.checkInAt.slice(11, 16), check_out_time: stay.checkOutAt.slice(11, 16), check_in_at: stay.checkInAt, check_out_at: stay.checkOutAt, balance_due_at: null });
  await connection.execute('UPDATE hotel_bookings SET check_in = ?, check_out = ?, check_in_at = ?, check_out_at = ?, nights = ?, rooms = ?, guests = ?, total_amount = ?, policy_snapshot = ?, expires_at = NULL, updated_at = NOW() WHERE booking_id = ?', [stay.checkIn, stay.checkOut, stay.checkInAt, stay.checkOutAt, stay.nights, rooms, guests, total, JSON.stringify(snapshot), locked.booking_id]);
  return { booking: await load(connection, locked.booking_id), message: 'Booking modified successfully' };
});

// Use the existing owner status endpoint. Pay-at-property bookings already hold
// inventory while pending; confirming never creates a second booking/payment.
export const updatePayAtPropertyBookingStatus = (user, id, status) => bookingTransaction(async connection => {
  const [visible] = await connection.execute('SELECT * FROM hotel_bookings WHERE booking_id = ?', [bookingId(id)]);
  if (!visible.length || !externalPaymentBooking(visible[0])) return null;
  const [hotels] = await connection.execute('SELECT * FROM hotels WHERE hotel_id = ? FOR UPDATE', [visible[0].hotel_id]);
  const access = user.role === 'admin' ? '' : ' AND EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = b.hotel_id AND ho.user_id = ?)';
  const [rows] = await connection.execute(`SELECT b.* FROM hotel_bookings b WHERE b.booking_id = ?${access} FOR UPDATE`, [bookingId(id), ...(user.role === 'admin' ? [] : [user.user_id])]);
  if (!rows.length) throw policyError('You do not have permission to update this booking.', 403);
  const row = rows[0];
  if (Number(row.archived) === 1) throw policyError('Archived bookings cannot be changed.', 409);
  if (row.status === status) return { success: true, message: 'Booking status is unchanged.' };
  if (!['pending', 'confirmed'].includes(row.status) || !['confirmed', 'cancelled'].includes(status)) throw policyError('Only a pending or confirmed booking can be confirmed or cancelled. Cancelled stays cannot be reopened.', 409);
  if (status === 'confirmed') {
    const hotel = hotels[0]; activeHotel(hotel); await bookable(row.hotel_id, connection);
    const [roomRows] = await connection.execute('SELECT * FROM rooms WHERE room_id = ? AND hotel_id = ? FOR UPDATE', [row.room_id, row.hotel_id]);
    const room = roomRows[0]; activeRoom(room, row.guests);
    const interval = bookingInterval(row);
    if (!Number.isFinite(interval.end) || interval.end <= Date.now() + MANILA_OFFSET_MS) throw policyError('This stay has already ended.', 409);
    const stay = { ...interval, checkIn: dateKey(row.check_in), checkOut: dateKey(row.check_out), lastOccupiedDate: new Date(interval.end - 1).toISOString().slice(0, 10) };
    await validateStayInventory(connection, hotel, room, stay, row.rooms, row.user_id, row.booking_id);
  }
  await connection.execute('UPDATE hotel_bookings SET status = ?, expires_at = NULL, updated_at = NOW() WHERE booking_id = ?', [status, row.booking_id]);
  await connection.execute("INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'booking', 'Booking status updated', ?, ?)", [row.user_id, `Booking #${row.booking_id} is ${status}. Payment is handled directly with the property, not processed or verified by NaujanGO.`, row.booking_id]);
  return { success: true, message: 'Booking status updated successfully' };
});
