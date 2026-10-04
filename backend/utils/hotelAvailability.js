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
// options.roomId (optional): also compute the room-type layer —
//   typeCapacity(d) = room_inventory.available_count override (when set) else rooms.quantity_available;
//   typeBooked(d)   = the same booked rule restricted to bookings naming that room type;
//   available(d)    = max(0, min(hotelLevel, typeLevel)) so the calendar can never show more
//                     than either the hotel or the type can sell (legacy bookings without a
//                     room_id keep counting at the hotel level). closed = hotel OR type closed;
//   price(d)        = room_inventory.price_override ?? hotel price_override ?? null.
// Shared by the public calendar endpoint, createHotelBooking and
// modifyHotelBooking so display and enforcement can never disagree.
// Accepts db.promise() or an open transaction connection.
// options.excludeBookingId (optional): don't count this booking's own rooms —
//   used when validating a modification so a booking never blocks itself.
export const fetchHotelAvailabilityDays = async (dbLike, hotelId, startKey, endKey, roomsTotal, options = {}) => {
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

  // options.excludeBookingId: ignore one booking's own rooms — used when a
  // guest modifies an existing booking so it never counts against itself.
  const excludeBookingId = Number(options.excludeBookingId) > 0 ? Number(options.excludeBookingId) : null;
  const excludeClause = excludeBookingId ? ' AND booking_id <> ?' : '';
  const excludeParams = excludeBookingId ? [excludeBookingId] : [];

  let bookingRows = [];
  try {
    [bookingRows] = await dbLike.query(
      `SELECT check_in, check_out, rooms
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status IN ('confirmed', 'pending')
         AND check_in < ?
         AND check_out > ?
         AND (archived = 0 AND (expires_at IS NULL OR expires_at > NOW()))${excludeClause}
         FOR UPDATE`,
      [hotelId, endPlusOne, start, ...excludeParams]
    );
  } catch (error) {
    // Older databases may lack archived/expires_at columns.
    [bookingRows] = await dbLike.query(
      `SELECT check_in, check_out, rooms
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status IN ('confirmed', 'pending')
         AND check_in < ?
         AND check_out > ?${excludeClause}`,
      [hotelId, endPlusOne, start, ...excludeParams]
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

  // Optional room-type layer. Unknown room ids degrade to hotel-level only
  // (callers validate the room separately and return their own error).
  const roomId = Number(options.roomId) > 0 ? Number(options.roomId) : null;
  let roomRow = null;
  const inventoryByDate = {};
  let typeBookedByDate = null;

  if (roomId) {
    try {
      const [roomRows] = await dbLike.query(
        'SELECT room_id, quantity_available FROM rooms WHERE room_id = ? AND hotel_id = ?',
        [roomId, hotelId]
      );
      roomRow = roomRows[0] || null;
    } catch (error) {
      console.error('Error reading room type:', error.message);
    }

    if (roomRow) {
      try {
        const [inventoryRows] = await dbLike.query(
          `SELECT availability_date, available_count, price_override, is_closed
           FROM room_inventory
           WHERE room_id = ? AND availability_date >= ? AND availability_date <= ?`,
          [roomId, start, end]
        );
        inventoryRows.forEach((row) => {
          const key = toDateOnlyKey(row.availability_date);
          if (key) inventoryByDate[key] = row;
        });
      } catch (error) {
        // Older databases may lack the room_inventory table.
      }

      let typeBookingRows = [];
      try {
        [typeBookingRows] = await dbLike.query(
          `SELECT check_in, check_out, rooms
           FROM hotel_bookings
           WHERE hotel_id = ?
             AND room_id = ?
             AND status IN ('confirmed', 'pending')
             AND check_in < ?
             AND check_out > ?
             AND (archived = 0 AND (expires_at IS NULL OR expires_at > NOW()))${excludeClause}
             FOR UPDATE`,
          [hotelId, roomId, endPlusOne, start, ...excludeParams]
        );
      } catch (error) {
        // Older databases may lack archived/expires_at columns.
        [typeBookingRows] = await dbLike.query(
          `SELECT check_in, check_out, rooms
           FROM hotel_bookings
           WHERE hotel_id = ?
             AND room_id = ?
             AND status IN ('confirmed', 'pending')
             AND check_in < ?
             AND check_out > ?${excludeClause}`,
          [hotelId, roomId, endPlusOne, start, ...excludeParams]
        );
      }

      typeBookedByDate = {};
      dates.forEach((key) => {
        typeBookedByDate[key] = 0;
      });
      typeBookingRows.forEach((booking) => {
        const checkInKey = toDateOnlyKey(booking.check_in);
        const checkOutKey = toDateOnlyKey(booking.check_out);
        if (!checkInKey || !checkOutKey) return;
        listDateKeys(checkInKey, checkOutKey).slice(0, -1).forEach((dateKey) => {
          if (typeBookedByDate[dateKey] !== undefined) {
            typeBookedByDate[dateKey] += Number(booking.rooms || 0);
          }
        });
      });
    }
  }

  return dates.map((dateKey) => {
    const override = availabilityByDate[dateKey];
    const hasOverride = override
      && override.rooms_available !== null
      && override.rooms_available !== undefined;
    const capacity = hasOverride ? Number(override.rooms_available) : Number(roomsTotal) || 0;
    const booked = bookedByDate[dateKey] || 0;
    const hotelAvailable = Math.max(0, capacity - booked);
    const hotelClosed = override && override.is_closed ? 1 : 0;
    const hotelPrice = override && override.price_override !== null && override.price_override !== undefined
      ? Number(override.price_override)
      : null;

    if (!typeBookedByDate || !roomRow) {
      return {
        date: dateKey,
        booked,
        available: hotelAvailable,
        closed: hotelClosed,
        price: hotelPrice
      };
    }

    const inventory = inventoryByDate[dateKey];
    const hasTypeOverride = inventory
      && inventory.available_count !== null
      && inventory.available_count !== undefined;
    const typeCapacity = hasTypeOverride
      ? Number(inventory.available_count)
      : Number(roomRow.quantity_available) || 0;
    const typeBooked = typeBookedByDate[dateKey] || 0;
    const typeAvailable = Math.max(0, typeCapacity - typeBooked);

    return {
      date: dateKey,
      booked: typeBooked,
      available: Math.min(hotelAvailable, typeAvailable),
      closed: hotelClosed || (inventory && inventory.is_closed ? 1 : 0),
      price: inventory && inventory.price_override !== null && inventory.price_override !== undefined
        ? Number(inventory.price_override)
        : hotelPrice
    };
  });
};
