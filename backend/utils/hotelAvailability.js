let availabilityTableCache = null;

const hasAvailabilityTable = async (dbLike) => {
  if (availabilityTableCache !== null) return availabilityTableCache;
  try {
    const [rows] = await dbLike.query("SHOW TABLES LIKE 'hotel_availability'");
    availabilityTableCache = rows.length > 0;
  } catch (error) {
    availabilityTableCache = false;
  }
  return availabilityTableCache;
};

// Canonical YYYY-MM-DD from a string ('YYYY-MM-DD[...]' prefix) or Date (local components).
export const toDateOnlyKey = (value) => {
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
};

const parseDateKey = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const listDateKeys = (startKey, endKey) => {
  const dates = [];
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return dates;
  }
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(toDateOnlyKey(current));
  }
  return dates;
};

export const subtractOneDay = (dateKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey))) return null;
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - 1);
  return toDateOnlyKey(date);
};

// Per-date availability for a hotel over an inclusive [startKey, endKey] range.
// capacity(d) = hotel_availability.rooms_available override (when set) else hotels.rooms_total;
// booked(d)  = SUM(rooms) of non-cancelled, non-archived, non-expired bookings covering night d;
// closed(d)  = hotel_availability.is_closed; price(d) = price_override when set.
// Shared by the public calendar endpoint and createHotelBooking so display and
// enforcement can never disagree. Accepts db.promise() or an open transaction connection.
export const fetchHotelAvailabilityDays = async (dbLike, hotelId, startKey, endKey, roomsTotal) => {
  const start = toDateOnlyKey(startKey);
  const end = toDateOnlyKey(endKey);
  if (!start || !end || start > end) return [];

  const dates = listDateKeys(start, end);
  if (dates.length === 0) return [];

  const availabilityByDate = {};
  if (await hasAvailabilityTable(dbLike)) {
    try {
      const [rows] = await dbLike.query(
        `SELECT availability_date, rooms_available, price_override, is_closed
         FROM hotel_availability
         WHERE hotel_id = ? AND availability_date >= ? AND availability_date <= ?`,
        [hotelId, start, end]
      );
      rows.forEach((row) => {
        const key = toDateOnlyKey(row.availability_date);
        if (key) availabilityByDate[key] = row;
      });
    } catch (error) {
      console.error('Error reading hotel_availability:', error.message);
    }
  }

  const endPlusOneDate = parseDateKey(end);
  endPlusOneDate.setDate(endPlusOneDate.getDate() + 1);
  const endPlusOne = toDateOnlyKey(endPlusOneDate);

  let bookingRows = [];
  try {
    [bookingRows] = await dbLike.query(
      `SELECT check_in, check_out, rooms
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status IN ('confirmed', 'pending')
         AND check_in < ?
         AND check_out > ?
         AND (archived = 0 AND (expires_at IS NULL OR expires_at > NOW()))
         FOR UPDATE`,
      [hotelId, endPlusOne, start]
    );
  } catch (error) {
    // Older databases may lack archived/expires_at columns.
    [bookingRows] = await dbLike.query(
      `SELECT check_in, check_out, rooms
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status IN ('confirmed', 'pending')
         AND check_in < ?
         AND check_out > ?`,
      [hotelId, endPlusOne, start]
    );
  }

  const bookedByDate = {};
  dates.forEach((key) => {
    bookedByDate[key] = 0;
  });

  bookingRows.forEach((booking) => {
    const checkInKey = toDateOnlyKey(booking.check_in);
    const checkOutKey = toDateOnlyKey(booking.check_out);
    if (!checkInKey || !checkOutKey) return;
    // Checkout night is not occupied by the guest.
    listDateKeys(checkInKey, checkOutKey).slice(0, -1).forEach((dateKey) => {
      if (bookedByDate[dateKey] !== undefined) {
        bookedByDate[dateKey] += Number(booking.rooms || 0);
      }
    });
  });

  return dates.map((dateKey) => {
    const override = availabilityByDate[dateKey];
    const hasOverride = override
      && override.rooms_available !== null
      && override.rooms_available !== undefined;
    const capacity = hasOverride ? Number(override.rooms_available) : Number(roomsTotal) || 0;
    const booked = bookedByDate[dateKey] || 0;
    return {
      date: dateKey,
      booked,
      available: Math.max(0, capacity - booked),
      closed: override && override.is_closed ? 1 : 0,
      price: override && override.price_override !== null && override.price_override !== undefined
        ? Number(override.price_override)
        : null
    };
  });
};
