import crypto from 'node:crypto';
import db from '../db.js';
import { dueNow, MIN_GATEWAY_AMOUNT, statusAfterPayment } from '../utils/paymentAmounts.js';
import { bookingInterval, makeStay, MANILA_OFFSET_MS, parseHourlyRates, parsePaymentPlans, readJson, stayError } from '../utils/stayOptions.js';
import { validateStayInventory } from './stayInventory.js';

const onlineMethods = ['card', 'gcash', 'grabpay', 'qrph', 'paypal'];
const methodsFor = value => {
  if (!value) return [...onlineMethods, 'bank_transfer', 'pay_at_property'];
  const parsed = readJson(value);
  return Array.isArray(parsed) ? parsed : String(value).split(',').map(method => method.trim()).filter(Boolean);
};
const quantity = (value, name, max = 100) => {
  const number = Number(value);
  if (!['number', 'string'].includes(typeof value) || !Number.isSafeInteger(number) || number < 1 || number > max) throw stayError(`${name} must be an integer between 1 and ${max}.`);
  return number;
};
const deadline = (date, days) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - Math.max(0, Number(days) || 0));
  return value.toISOString().slice(0, 10);
};

export const createHourlyReservation = async (userId, body) => {
  const roomId = quantity(body.room_id, 'Room ID', Number.MAX_SAFE_INTEGER);
  const hotelId = quantity(body.hotel_id, 'Hotel ID', Number.MAX_SAFE_INTEGER);
  const rooms = quantity(body.rooms ?? 1, 'Rooms');
  const guests = quantity(body.guests ?? 1, 'Guests');
  if (body.policy_agreed !== true && body.policy_agreed !== 'true') throw stayError('Please agree to the booking policies.');
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [hotels] = await connection.execute('SELECT * FROM hotels WHERE hotel_id = ? FOR UPDATE', [hotelId]);
    const hotel = hotels[0];
    if (!hotel || Number(hotel.is_active) === 0 || Number(hotel.archived) === 1) throw stayError('Hotel is not available for booking.', 404);
    const [roomRows] = await connection.execute('SELECT * FROM rooms WHERE room_id = ? AND hotel_id = ? FOR UPDATE', [roomId, hotelId]);
    const room = roomRows[0];
    if (!room || Number(room.is_active) === 0) throw stayError('Selected room type is not available.', 404);
    if (Number(room.capacity) < guests) throw stayError('This room type cannot accommodate the selected number of guests.', 409);
    const stay = makeStay(body, room);
    if (!stay.hours) throw stayError('Choose an hourly package.');
    const rate = parseHourlyRates(room.hourly_rates)[stay.hours];
    if (!rate) throw stayError('That hourly package is not available for this room.');
    const plan = body.payment_option || 'full';
    if (!parsePaymentPlans(hotel.allowed_payment_options).includes(plan)) throw stayError('That payment plan is disabled for this hotel.');
    const method = body.payment_method || 'pay_at_property';
    if (!methodsFor(hotel.allowed_payment_methods).includes(method)) throw stayError('That payment method is disabled for this hotel.');
    const total = Math.round(rate * rooms * 100) / 100;
    const amount = dueNow(plan, total, hotel.reservation_fee);
    if (amount == null) throw stayError('The reservation fee is not available for this booking. Choose another enabled payment plan.');
    if (onlineMethods.includes(method) && amount < MIN_GATEWAY_AMOUNT) throw stayError(`Online payments require at least ${MIN_GATEWAY_AMOUNT}.`);
    await validateStayInventory(connection, hotel, room, stay, rooms, userId);
    const snapshot = {
      cancellation_type: hotel.cancellation_type || 'free_until',
      free_cancellation_days: Number(hotel.free_cancellation_days ?? 1),
      custom_policy_text: hotel.custom_policy_text || null, house_rules: hotel.house_rules || null,
      payment_terms_text: hotel.payment_terms_text || null,
      modification_policy_text: hotel.modification_policy_text || null,
      noshow_policy_text: hotel.noshow_policy_text || null,
      check_in_time: stay.checkInAt.slice(11, 16), check_out_time: stay.checkOutAt.slice(11, 16),
      reservation_fee: hotel.reservation_fee == null ? null : Number(hotel.reservation_fee),
      balance_due_days: Number(hotel.balance_due_days ?? 1),
      balance_due_at: deadline(stay.checkIn, hotel.balance_due_days ?? 1),
      payment_option: plan, allowed_payment_options: parsePaymentPlans(hotel.allowed_payment_options),
      stay_duration_hours: stay.hours, stay_rate: rate,
      check_in_at: stay.checkInAt, check_out_at: stay.checkOutAt, timezone: 'Asia/Manila',
      agreed_at: new Date().toISOString()
    };
    const receiptNumber = `HB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const [result] = await connection.execute(
      `INSERT INTO hotel_bookings
       (user_id, hotel_id, hotel_name, hotel_location, price_per_night, currency,
        check_in, check_out, nights, rooms, guests, special_requests, status,
        payment_status, payment_method, payment_option, total_amount, receipt_number,
        customer_name, customer_email, customer_phone, room_id, room_type_name,
        expires_at, policy_snapshot, check_in_at, check_out_at, stay_duration_hours, stay_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL 24 HOUR, ?, ?, ?, ?, ?)`,
      [userId, hotelId, hotel.name, hotel.location || null, room.price_per_night || 0, room.currency || hotel.currency || 'PHP',
        stay.checkIn, stay.checkOut, stay.nights, rooms, guests, body.special_requests || null,
        method, plan, total, receiptNumber, body.customer_name || null, body.customer_email || null,
        body.customer_phone || null, roomId, room.room_type_name,
        JSON.stringify(snapshot), stay.checkInAt, stay.checkOutAt, stay.hours, rate]
    );
    const bookingId = result.insertId;
    await connection.execute('UPDATE hotel_bookings SET booking_reference = ? WHERE booking_id = ?',
      [`HB${String(bookingId).padStart(6, '0')}`, bookingId]);
    // Creating a reservation never marks money as received; only the existing
    // payment/owner-confirmation flows may settle it (ignore client pay_now).
    await connection.execute(
      `INSERT INTO hotel_payments (booking_id, amount, currency, method, provider, status, transaction_reference)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [bookingId, amount, room.currency || hotel.currency || 'PHP', method,
        onlineMethods.includes(method) ? 'pending' : 'manual', `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`]
    );
    await connection.commit();
    return bookingId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

export const modifyHourlyReservation = async (userId, booking, body) => {
  const rooms = quantity(body.rooms ?? booking.rooms, 'Rooms');
  const guests = quantity(body.guests ?? booking.guests, 'Guests');
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [hotels] = await connection.execute('SELECT * FROM hotels WHERE hotel_id = ? FOR UPDATE', [booking.hotel_id]);
    if (!hotels.length) throw stayError('Hotel not found.', 404);
    const [bookings] = await connection.execute('SELECT *, (expires_at IS NOT NULL AND expires_at <= NOW()) AS reservation_expired FROM hotel_bookings WHERE booking_id = ? FOR UPDATE', [booking.booking_id]);
    const locked = bookings[0];
    if (!locked || Number(locked.user_id) !== Number(userId) || Number(locked.archived) === 1 || !['pending', 'confirmed'].includes(locked.status)) {
      throw stayError('This booking can no longer be modified.', 409);
    }
    if (Number(locked.reservation_expired) === 1 && locked.payment_status === 'unpaid') {
      throw stayError('This unpaid reservation has expired. Please create a new booking.', 409);
    }
    if (bookingInterval(locked).start <= Date.now() + MANILA_OFFSET_MS) throw stayError('A stay that has already started cannot be modified.', 409);
    const [roomRows] = await connection.execute('SELECT * FROM rooms WHERE room_id = ? AND hotel_id = ? FOR UPDATE', [locked.room_id, locked.hotel_id]);
    const room = roomRows[0];
    if (!room || Number(room.capacity) < guests) throw stayError('The selected room cannot accommodate these guests.', 409);
    const stay = makeStay({ ...body, stay_duration_hours: locked.stay_duration_hours }, room);
    const rate = Number(locked.stay_rate);
    if (!Number.isFinite(rate) || rate <= 0) throw stayError('The original package rate is unavailable.', 409);
    const total = Math.round(rate * rooms * 100) / 100;
    await validateStayInventory(connection, hotels[0], room, stay, rooms, userId, locked.booking_id);
    const [paidRows] = await connection.execute(
      "SELECT COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0) AS amount_paid FROM hotel_payments WHERE booking_id = ?", [locked.booking_id]);
    const paid = Number(paidRows[0]?.amount_paid) || 0;
    if (total < paid) throw stayError('The modified total cannot be lower than the amount already paid.', 409);
    const snapshot = { ...(readJson(locked.policy_snapshot) || {}), check_in_at: stay.checkInAt, check_out_at: stay.checkOutAt };
    snapshot.check_in_time = stay.checkInAt.slice(11, 16);
    snapshot.check_out_time = stay.checkOutAt.slice(11, 16);
    snapshot.balance_due_at = deadline(stay.checkIn, snapshot.balance_due_days ?? 1);
    await connection.execute(
      `UPDATE hotel_bookings SET check_in = ?, check_out = ?, check_in_at = ?, check_out_at = ?,
       nights = ?, rooms = ?, guests = ?, total_amount = ?, payment_status = ?, policy_snapshot = ?, updated_at = NOW()
       WHERE booking_id = ?`,
      [stay.checkIn, stay.checkOut, stay.checkInAt, stay.checkOutAt, stay.nights, rooms, guests, total,
        paid > 0 ? statusAfterPayment(total, paid, locked.payment_status) : locked.payment_status,
        JSON.stringify(snapshot), locked.booking_id]);
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};
