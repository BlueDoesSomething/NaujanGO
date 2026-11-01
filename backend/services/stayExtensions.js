import db from '../db.js';
import { statusAfterPayment } from '../utils/paymentAmounts.js';
import { bookingInterval, DAY_MS, HOUR_MS, MANILA_OFFSET_MS, parseHourlyRates, readJson, serializeStay, sqlDateTime, STAY_HOURS, stayError } from '../utils/stayOptions.js';
import { validateStayInventory } from './stayInventory.js';

const idFor = value => {
  const id = Number(value);
  if (!['number', 'string'].includes(typeof value) || !Number.isSafeInteger(id) || id < 1) throw stayError('Invalid booking ID.');
  return id;
};
const requireStaff = actor => {
  if (!actor || !['owner', 'admin'].includes(actor.role)) throw stayError('Only authorized hotel staff can extend a stay.', 403);
  idFor(actor.user_id);
};
const authorizedBooking = async (dbLike, actor, id, lock = false) => {
  const [rows] = await dbLike.execute(
    `SELECT b.* FROM hotel_bookings b WHERE b.booking_id = ?
     AND (? = 'admin' OR EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = b.hotel_id AND ho.user_id = ?))${lock ? ' FOR UPDATE' : ''}`,
    [id, actor.role, actor.user_id]);
  if (!rows.length) throw stayError('Booking not found or access denied.', 404);
  return rows[0];
};
const historyFor = booking => {
  const snapshot = readJson(booking.policy_snapshot);
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)
      || (snapshot.stay_extensions != null && (!Array.isArray(snapshot.stay_extensions)
        || snapshot.stay_extensions.some(item => !item || typeof item !== 'object' || Array.isArray(item))))) {
    throw stayError('Cannot verify the original stay policy and extension history.', 409);
  }
  return { snapshot, history: snapshot.stay_extensions || [] };
};
const assertActive = (booking, now) => {
  if (!booking.stay_duration_hours || !booking.room_id || booking.status !== 'confirmed' || Number(booking.archived) === 1
      || ['refunded', 'refund_pending', 'disputed'].includes(booking.payment_status)) {
    throw stayError('Only confirmed, unarchived hourly stays can be extended.', 409);
  }
  const interval = bookingInterval(booking);
  if (!Number.isFinite(interval.start) || !Number.isFinite(interval.end)) throw stayError('The original stay times are unavailable.', 409);
  if (interval.start > now + MANILA_OFFSET_MS) throw stayError('Extensions are available after check-in time. Reschedule an upcoming booking instead.', 409);
  return interval;
};
const roomFor = async (dbLike, booking, lock = false) => {
  const [rows] = await dbLike.execute(
    `SELECT room_id, room_type_name, capacity, quantity_available, hourly_rates, currency FROM rooms
     WHERE room_id = ? AND hotel_id = ? AND is_active = 1${lock ? ' FOR UPDATE' : ''}`,
    [booking.room_id, booking.hotel_id]);
  if (!rows.length) throw stayError('This room type is no longer available for extensions.', 409);
  if (rows[0].currency && booking.currency && rows[0].currency !== booking.currency) throw stayError('Room currency changed. Confirm the extension price with an administrator.', 409);
  if (!Number.isSafeInteger(Number(booking.guests)) || Number(booking.guests) < 1
      || !(Number(rows[0].capacity) >= Number(booking.guests))) {
    throw stayError('The room type cannot accommodate the reserved guests.', 409);
  }
  return rows[0];
};

export const getStayExtensionOptions = async (actor, value, now = Date.now()) => {
  requireStaff(actor);
  const booking = await authorizedBooking(db.promise(), actor, idFor(value));
  assertActive(booking, now);
  historyFor(booking);
  const room = await roomFor(db.promise(), booking);
  const rates = parseHourlyRates(room.hourly_rates);
  return {
    booking: serializeStay(booking),
    packages: STAY_HOURS.filter(hours => rates[hours]).map(hours => ({
      hours, rate: rates[hours], additional_amount: Math.round(rates[hours] * Number(booking.rooms) * 100) / 100
    }))
  };
};

export const extendHourlyStay = async (actor, value, input, now = Date.now()) => {
  requireStaff(actor);
  const id = idFor(value);
  const hours = Number(input.hours);
  if (!['number', 'string'].includes(typeof input.hours) || !STAY_HOURS.includes(hours)) throw stayError('Choose a 3, 12, or 24-hour extension.');
  if (input.guest_agreed !== true) throw stayError('Confirm that the guest agreed to the extension and additional charge.');
  if (typeof input.request_key !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(input.request_key)) throw stayError('A valid extension request key is required.');
  const requestKey = input.request_key.toLowerCase();
  const initial = await authorizedBooking(db.promise(), actor, id);
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    // Same lock order as new hourly reservations: property, booking, room.
    const [hotels] = await connection.execute('SELECT hotel_id, rooms_total FROM hotels WHERE hotel_id = ? FOR UPDATE', [initial.hotel_id]);
    if (!hotels.length) throw stayError('Hotel not found.', 404);
    const booking = await authorizedBooking(connection, actor, id, true);
    if (Number(booking.hotel_id) !== Number(initial.hotel_id)) throw stayError('Booking changed. Reload before extending.', 409);
    const { snapshot, history } = historyFor(booking);
    const previous = history.find(item => item.request_key === requestKey);
    if (previous) {
      if (previous.hours !== hours || previous.from !== input.expected_checkout_at || previous.rate !== Number(input.expected_rate)) {
        throw stayError('That request key was already used for another extension.', 409);
      }
      await connection.commit();
      return { success: true, replayed: true, booking: serializeStay(booking), extension: previous };
    }
    const interval = assertActive(booking, now);
    if (typeof input.expected_checkout_at !== 'string' || input.expected_checkout_at !== sqlDateTime(booking.check_out_at)) {
      throw stayError('Checkout changed. Reload the extension details before confirming.', 409);
    }
    const room = await roomFor(connection, booking, true);
    const rate = parseHourlyRates(room.hourly_rates)[hours];
    if (!rate) throw stayError('That extension package is not offered for this room.');
    if (!['number', 'string'].includes(typeof input.expected_rate) || Number(input.expected_rate) !== rate) {
      throw stayError('The extension price changed. Reload and obtain guest approval again.', 409);
    }
    const end = interval.end + hours * HOUR_MS;
    if (end <= now + MANILA_OFFSET_MS) throw stayError('Choose an extension long enough to cover the current time.');
    if (end - interval.start > 90 * DAY_MS) throw stayError('The total stay cannot exceed 90 days.');
    const stamp = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
    const stay = { start: interval.end, end, checkIn: stamp(interval.end).slice(0, 10), checkOut: stamp(end).slice(0, 10), lastOccupiedDate: stamp(end - 1).slice(0, 10) };
    const rooms = Number(booking.rooms);
    if (!Number.isSafeInteger(rooms) || rooms < 1) throw stayError('Cannot verify the reserved room quantity.', 409);
    await validateStayInventory(connection, hotels[0], room, stay, rooms, booking.user_id, booking.booking_id);
    const amount = Math.round(rate * rooms * 100) / 100;
    const total = Math.round((Number(booking.total_amount) + amount) * 100) / 100;
    if (!Number.isFinite(total) || total <= amount || total > 99999999.99) throw stayError('The extended booking amount is invalid.');
    const [paidRows] = await connection.execute(
      "SELECT COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount END), 0) AS amount_paid FROM hotel_payments WHERE booking_id = ?", [id]);
    const paid = Number(paidRows[0]?.amount_paid) || 0;
    if (booking.payment_status === 'paid' && paid + 0.01 < Number(booking.total_amount)) {
      throw stayError('Payment history needs reconciliation before this paid booking can be extended.', 409);
    }
    const extension = {
      request_key: requestKey, hours, rate, rooms, amount, currency: booking.currency,
      from: stamp(interval.end), to: stamp(end), actor_id: actor.user_id,
      recorded_at: new Date(now).toISOString(), guest_agreed: true
    };
    // Append explicit approvals while preserving the original package, rate,
    // check-in, agreed payment plans and original checkout in the snapshot.
    const policy = JSON.stringify({ ...snapshot, stay_extensions: [...history, extension] });
    if (Buffer.byteLength(policy, 'utf8') > 65535) throw stayError('Extension history storage is full. Contact an administrator.', 409);
    const duration = Math.round((end - interval.start) / HOUR_MS);
    const nights = Math.floor((end - Date.parse(`${stamp(interval.start).slice(0, 10)}T00:00:00Z`)) / DAY_MS);
    const paymentStatus = statusAfterPayment(total, paid, booking.payment_status);
    await connection.execute(
      `UPDATE hotel_bookings SET check_out = ?, check_out_at = ?, stay_duration_hours = ?, nights = ?,
       total_amount = ?, payment_status = ?, policy_snapshot = ?, expires_at = NULL, updated_at = NOW() WHERE booking_id = ?`,
      [stay.checkOut, stamp(end), duration, nights, total, paymentStatus, policy, id]);
    await connection.commit();
    return { success: true, replayed: false, extension, booking: serializeStay({ ...booking,
      check_out: stay.checkOut, check_out_at: stamp(end), stay_duration_hours: duration, nights,
      total_amount: total, payment_status: paymentStatus, policy_snapshot: policy, expires_at: null }) };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};
