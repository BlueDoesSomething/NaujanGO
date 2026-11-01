import { bookingInterval, DAY_MS, dateKey, localTimeMs, peakBookedRooms, stayError } from '../utils/stayOptions.js';

const optionalRows = async (connection, sql, params) => {
  try { return (await connection.execute(sql, params))[0]; }
  catch (error) { if (error.code === 'ER_NO_SUCH_TABLE') return []; throw error; }
};

// The caller holds the hotel row lock. Both nightly and hourly writes use that
// same lock, so two concurrent requests cannot sell the last room twice.
export const validateStayInventory = async (connection, hotel, room, stay, quantity, userId, excludeId = null) => {
  const hotelId = hotel.hotel_id;
  const [bookings] = await connection.execute(
    `SELECT booking_id, user_id, room_id, rooms, check_in, check_out,
            check_in_at, check_out_at, policy_snapshot
     FROM hotel_bookings
     WHERE hotel_id = ? AND status IN ('pending', 'confirmed')
       AND COALESCE(archived, 0) = 0 AND (expires_at IS NULL OR expires_at > NOW())
       AND check_in <= ? AND check_out >= ?
       AND (? IS NULL OR booking_id <> ?) FOR UPDATE`,
    [hotelId, stay.checkOut, stay.checkIn, excludeId, excludeId]
  );
  for (const booking of bookings) {
    const interval = bookingInterval(booking);
    if (!Number.isFinite(interval.start) || !Number.isFinite(interval.end)) throw stayError('Cannot verify existing room availability.', 503);
    if (Number(booking.user_id) === Number(userId) && interval.start < stay.end && interval.end > stay.start) {
      throw stayError('You already have a booking at this hotel during these times.', 409);
    }
  }
  const overrides = await optionalRows(connection,
    'SELECT availability_date, rooms_available, is_closed FROM hotel_availability WHERE hotel_id = ? AND availability_date BETWEEN ? AND ? FOR UPDATE',
    [hotelId, stay.checkIn, stay.lastOccupiedDate]);
  const roomOverrides = room ? await optionalRows(connection,
    'SELECT availability_date, available_count, is_closed FROM room_inventory WHERE room_id = ? AND availability_date BETWEEN ? AND ? FOR UPDATE',
    [room.room_id, stay.checkIn, stay.lastOccupiedDate]) : [];
  const byDay = new Map(overrides.map(row => [dateKey(row.availability_date), row]));
  const byRoomDay = new Map(roomOverrides.map(row => [dateKey(row.availability_date), row]));
  const roomBookings = room ? bookings.filter(booking => Number(booking.room_id) === Number(room.room_id)) : [];
  for (let day = localTimeMs(`${stay.checkIn} 00:00:00`); day < stay.end; day += DAY_MS) {
    const key = new Date(day).toISOString().slice(0, 10);
    const hotelOverride = byDay.get(key), roomOverride = byRoomDay.get(key);
    if (Number(hotelOverride?.is_closed) === 1 || Number(roomOverride?.is_closed) === 1) {
      throw stayError(`This hotel or room type is closed on ${key}.`, 409);
    }
    const start = Math.max(day, stay.start), end = Math.min(day + DAY_MS, stay.end);
    const capacity = Number(hotelOverride?.rooms_available ?? hotel.rooms_total) || 0;
    const available = capacity - peakBookedRooms(bookings, start, end);
    if (available < quantity) throw stayError(`Not enough rooms available during the selected stay on ${key}.`, 409);
    if (room) {
      const typeCapacity = Number(roomOverride?.available_count ?? room.quantity_available) || 0;
      if (typeCapacity - peakBookedRooms(roomBookings, start, end) < quantity) {
        throw stayError(`Not enough units of ${room.room_type_name} available during the selected stay on ${key}.`, 409);
      }
    }
  }
};
