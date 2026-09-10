import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import db from '../db.js';
import { authenticateToken, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

let availabilityTableCache = null;

const hasAvailabilityTable = async () => {
  if (availabilityTableCache !== null) return availabilityTableCache;
  try {
    const [rows] = await db.promise().query("SHOW TABLES LIKE 'hotel_availability'");
    availabilityTableCache = rows.length > 0;
  } catch (error) {
    availabilityTableCache = false;
  }
  return availabilityTableCache;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'hotels');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    return cb(null, true);
  }
});

const parseAmenitiesInput = (amenities) => {
  if (amenities === null || amenities === undefined) return null;
  if (Array.isArray(amenities)) return JSON.stringify(amenities);
  if (typeof amenities === 'string') {
    const trimmed = amenities.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed);
      } catch (error) {
        const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
        return JSON.stringify(list);
      }
    }
    const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
    return JSON.stringify(list);
  }
  return JSON.stringify([String(amenities)]);
};

const parseImageUrlsInput = (imageUrls) => {
  if (imageUrls === null || imageUrls === undefined) return null;
  if (Array.isArray(imageUrls)) return JSON.stringify(imageUrls.filter(Boolean));
  if (typeof imageUrls === 'string') {
    const trimmed = imageUrls.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return JSON.stringify(parsed.filter(Boolean));
      } catch (error) {
        const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
        return JSON.stringify(list);
      }
    }
    const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
    return JSON.stringify(list);
  }
  return JSON.stringify([String(imageUrls)]);
};

const DEFAULT_PAYMENT_METHODS = ['card', 'gcash', 'grabpay', 'qrph', 'paypal', 'bank_transfer', 'pay_at_property'];
const PAYMENT_METHOD_SET = new Set(DEFAULT_PAYMENT_METHODS);

const parsePaymentMethodsInput = (methods) => {
  if (methods === null || methods === undefined) return DEFAULT_PAYMENT_METHODS.join(',');
  let parsed = [];

  if (Array.isArray(methods)) {
    parsed = methods;
  } else if (typeof methods === 'string') {
    const trimmed = methods.trim();
    if (!trimmed) return DEFAULT_PAYMENT_METHODS.join(',');
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          parsed = arr;
        }
      } catch (error) {
        parsed = trimmed.split(',');
      }
    } else {
      parsed = trimmed.split(',');
    }
  } else {
    parsed = [String(methods)];
  }

  const normalized = parsed
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => PAYMENT_METHOD_SET.has(item));

  const unique = [...new Set(normalized)];
  return (unique.length ? unique : DEFAULT_PAYMENT_METHODS).join(',');
};

const parseStoredPaymentMethods = (value) => {
  const parsed = parsePaymentMethodsInput(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_PAYMENT_METHODS;
};

const toDateKey = (value) => {
  if (typeof value === 'string') return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return new Date(year, month - 1, day);
};

const listDateKeys = (startKey, endKey) => {
  const dates = [];
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(toDateKey(current));
  }
  return dates;
};

// All owner routes require authentication and owner or admin role
router.use(authenticateToken);
router.use(requireOwnerOrAdmin);

// Get owner's hotels
router.get('/hotels', async (req, res) => {
  const userId = req.user.user_id;

  try {
    const query = `
      SELECT h.* 
      FROM hotels h
      INNER JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id
      WHERE ho.user_id = ?
      ORDER BY h.name
    `;

    const [hotels] = await db.promise().query(query, [userId]);
    const formatted = hotels.map(hotel => {
      let amenities = [];
      let image_urls = [];

      if (hotel.amenities) {
        try {
          amenities = JSON.parse(hotel.amenities);
        } catch (error) {
          amenities = [];
        }
      }

      if (hotel.image_urls) {
        try {
          image_urls = JSON.parse(hotel.image_urls);
        } catch (error) {
          image_urls = [];
        }
      }

      const allowed_payment_methods = parseStoredPaymentMethods(hotel.allowed_payment_methods);

      return { ...hotel, amenities, image_urls, allowed_payment_methods };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Get owner hotels error:', error);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});

// Upload hotel images (owner)
router.post('/hotels/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const url = `${req.protocol}://${req.get('host')}/uploads/hotels/${req.file.filename}`;
  res.json({ url });
});

// Create a new hotel listing for owner
router.post('/hotels', async (req, res) => {
  const userId = req.user.user_id;
  const {
    name,
    location,
    description,
    price_per_night,
    currency = 'PHP',
    rating,
    amenities,
    image_url,
    image_urls,
    allowed_payment_methods,
    map_url,
    contact_phone,
    contact_email
  } = req.body;

  const [existing] = await db.promise().query(
    'SELECT hotel_id FROM hotel_owners WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (existing.length > 0) {
    return res.status(409).json({ error: 'Owners can only manage one hotel' });
  }

  if (!name || !location) {
    return res.status(400).json({ error: 'Hotel name and location are required' });
  }

  const price = Number(price_per_night);
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Price per night must be a valid number' });
  }

  const amenitiesJSON = parseAmenitiesInput(amenities);
  const imageUrlsJSON = parseImageUrlsInput(image_urls);
  const paymentMethodsCSV = parsePaymentMethodsInput(allowed_payment_methods);
  const primaryImage = image_url || (imageUrlsJSON ? JSON.parse(imageUrlsJSON)[0] : null);

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO hotels
        (name, location, description, price_per_night, currency, rating, amenities, image_url, image_urls, allowed_payment_methods, map_url, contact_phone, contact_email, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name,
        location,
        description || null,
        price,
        currency || 'PHP',
        rating ?? null,
        amenitiesJSON,
        primaryImage || null,
        imageUrlsJSON,
        paymentMethodsCSV,
        map_url || null,
        contact_phone || null,
        contact_email || null
      ]
    );

    const hotelId = result.insertId;
    await connection.query(
      'INSERT INTO hotel_owners (user_id, hotel_id) VALUES (?, ?)',
      [userId, hotelId]
    );

    await connection.commit();
    res.status(201).json({ hotel_id: hotelId, message: 'Hotel created successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Create hotel error:', error);
    res.status(500).json({ error: 'Failed to create hotel' });
  } finally {
    connection.release();
  }
});

// Get archived bookings for owner's hotels
router.get('/bookings/archived', async (req, res) => {
  const userId = req.user.user_id;

  try {
    const query = `
      SELECT 
        b.*,
        u.username,
        u.email,
        u.phone,
        b.hotel_name,
        b.check_in as check_in_date,
        b.check_out as check_out_date,
        b.guests as number_of_guests,
        b.created_at as booking_date
      FROM hotel_bookings b
      JOIN users u ON b.user_id = u.user_id
      INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
      WHERE ho.user_id = ? AND b.archived = 1
      ORDER BY b.archived_at DESC
    `;
    const [bookings] = await db.promise().query(query, [userId]);
    res.json(bookings);
  } catch (error) {
    console.error('Get archived bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch archived bookings' });
  }
});

// Get bookings for owner's hotels
router.get('/bookings', async (req, res) => {
  const userId = req.user.user_id;

  try {
    const query = `
      SELECT 
        b.*,
        u.username,
        u.email,
        u.phone,
        b.hotel_name,
        b.check_in as check_in_date,
        b.check_out as check_out_date,
        b.guests as number_of_guests,
        b.created_at as booking_date
      FROM hotel_bookings b
      JOIN users u ON b.user_id = u.user_id
      INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
      WHERE ho.user_id = ? AND b.archived = 0
      ORDER BY b.created_at DESC
    `;
    const params = [userId];

    const [bookings] = await db.promise().query(query, params);
    res.json(bookings);
  } catch (error) {
    console.error('Get owner bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get all rooms for owner's hotels
router.get('/rooms', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query = `
      SELECT r.*
      FROM rooms r
      INNER JOIN hotels h ON r.hotel_id = h.hotel_id
    `;
    let params = [];

    if (!isAdmin) {
      query += ` INNER JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id WHERE ho.user_id = ? `;
      params.push(userId);
    }

    query += ` ORDER BY r.hotel_id, r.room_type_name `;
    
    const [rooms] = await db.promise().query(query, params);
    res.json(rooms);
  } catch (error) {
    console.error('Get owner rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get dashboard statistics for owner
router.get('/dashboard/stats', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    let hotelCondition = '';
    let params = [];

    if (!isAdmin) {
      hotelCondition = `
        AND h.hotel_id IN (
          SELECT hotel_id FROM hotel_owners WHERE user_id = ?
        )
      `;
      params = [userId, userId, userId];
    }

    // Get hotel count
    const hotelQuery = isAdmin 
      ? 'SELECT COUNT(*) as count FROM hotels'
      : 'SELECT COUNT(*) as count FROM hotel_owners WHERE user_id = ?';
    const [hotelCount] = await db.promise().query(hotelQuery, isAdmin ? [] : [userId]);

    // Get booking statistics
    const bookingQuery = isAdmin
      ? `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM hotel_bookings
      `
      : `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM hotel_bookings b
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        WHERE ho.user_id = ?
      `;
    const [bookingStats] = await db.promise().query(bookingQuery, isAdmin ? [] : [userId]);

    // Get recent bookings
    const recentBookingsQuery = isAdmin
      ? `
        SELECT b.*, b.hotel_name, u.username,
        b.check_in as check_in_date,
        b.check_out as check_out_date,
        b.guests as number_of_guests,
        b.created_at as booking_date
        FROM hotel_bookings b
        JOIN users u ON b.user_id = u.user_id
        ORDER BY b.created_at DESC
        LIMIT 5
      `
      : `
        SELECT b.*, b.hotel_name, u.username,
        b.check_in as check_in_date,
        b.check_out as check_out_date,
        b.guests as number_of_guests,
        b.created_at as booking_date
        FROM hotel_bookings b
        JOIN users u ON b.user_id = u.user_id
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        WHERE ho.user_id = ?
        ORDER BY b.created_at DESC
        LIMIT 5
      `;
    const [recentBookings] = await db.promise().query(recentBookingsQuery, isAdmin ? [] : [userId]);

    res.json({
      hotelCount: hotelCount[0].count,
      bookingStats: bookingStats[0],
      recentBookings
    });
  } catch (error) {
    console.error('Owner dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Update hotel details (owner can only update their own hotels)
router.put('/hotels/:hotelId', async (req, res) => {
  const { hotelId } = req.params;
  const userId = req.user.user_id;
  const {
    name,
    location,
    description,
    price_per_night,
    currency,
    rating,
    rooms_total,
    rooms_available,
    amenities,
    image_url,
    image_urls,
    allowed_payment_methods,
    map_url,
    contact_phone,
    contact_email
  } = req.body;

  try {
    // Verify owner has permission to edit this hotel
    const [ownership] = await db.promise().query(
      'SELECT hotel_id FROM hotel_owners WHERE user_id = ? AND hotel_id = ?',
      [userId, hotelId]
    );

    if (ownership.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to edit this hotel' });
    }

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    // Note: Hotel pricing is now managed at the room level, not hotel level
    if (currency !== undefined) { fields.push('currency = ?'); values.push(currency); }
    if (rating !== undefined) { fields.push('rating = ?'); values.push(rating); }
    if (rooms_total !== undefined) { fields.push('rooms_total = ?'); values.push(rooms_total); }
    if (rooms_available !== undefined) { fields.push('rooms_available = ?'); values.push(rooms_available); }
    if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
    // Note: image_urls is for rooms only, not hotels. Hotels use image_url (singular)
    if (map_url !== undefined) { fields.push('map_url = ?'); values.push(map_url); }
    if (contact_phone !== undefined) { fields.push('contact_phone = ?'); values.push(contact_phone); }
    if (contact_email !== undefined) { fields.push('contact_email = ?'); values.push(contact_email); }
    if (allowed_payment_methods !== undefined) {
      fields.push('allowed_payment_methods = ?');
      values.push(parsePaymentMethodsInput(allowed_payment_methods));
    }

    // Handle amenities (convert to JSON if needed)
    if (amenities !== undefined) {
      let amenitiesJSON = null;
      if (amenities === null || amenities === '') {
        amenitiesJSON = null;
      } else if (Array.isArray(amenities)) {
        amenitiesJSON = JSON.stringify(amenities);
      } else if (typeof amenities === 'string') {
        const trimmed = amenities.trim();
        if (!trimmed) {
          amenitiesJSON = null;
        } else if (trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) amenitiesJSON = JSON.stringify(parsed);
          } catch (error) {
            const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
            amenitiesJSON = JSON.stringify(list);
          }
        } else {
          const list = trimmed.split(',').map(item => item.trim()).filter(Boolean);
          amenitiesJSON = JSON.stringify(list);
        }
      } else {
        amenitiesJSON = JSON.stringify([String(amenities)]);
      }
      fields.push('amenities = ?');
      values.push(amenitiesJSON);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    values.push(hotelId);

    await db.promise().query(
      `UPDATE hotels SET ${fields.join(', ')} WHERE hotel_id = ?`,
      values
    );

    res.json({ success: true, message: 'Hotel updated successfully' });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({ error: 'Failed to update hotel' });
  }
});

const getBookedRoomsByDate = (bookings, startDate, endDate) => {
  const bookedByDate = {};
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  const keys = listDateKeys(startKey, endKey);
  keys.forEach((key) => {
    bookedByDate[key] = 0;
  });

  bookings.forEach((booking) => {
    const checkIn = toDateKey(new Date(booking.check_in));
    const checkOut = toDateKey(new Date(booking.check_out));
    const bookingDates = listDateKeys(checkIn, checkOut)
      .slice(0, -1);
    bookingDates.forEach((dateKey) => {
      if (bookedByDate[dateKey] !== undefined) {
        bookedByDate[dateKey] += Number(booking.rooms || 0);
      }
    });
  });

  return bookedByDate;
};

// Get hotel availability calendar
router.get('/hotels/:hotelId/availability', async (req, res) => {
  const { hotelId } = req.params;
  const { start, end } = req.query;
  const userId = req.user.user_id;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  try {
    const availabilityEnabled = await hasAvailabilityTable();
    if (!availabilityEnabled) {
      return res.json([]);
    }

    if (req.user.role !== 'admin') {
      const [ownership] = await db.promise().query(
        'SELECT hotel_id FROM hotel_owners WHERE user_id = ? AND hotel_id = ?'
        , [userId, hotelId]
      );
      if (ownership.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to view availability' });
      }
    }

    const [availabilityRows] = await db.promise().query(
      `SELECT availability_date, rooms_available, price_override, is_closed
       FROM hotel_availability
       WHERE hotel_id = ? AND availability_date BETWEEN ? AND ?`,
      [hotelId, start, end]
    );
    const availabilityByDate = {};
    availabilityRows.forEach((row) => {
      availabilityByDate[toDateKey(row.availability_date)] = row;
    });

    const endPlusOne = parseDateKey(end);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    const [bookingRows] = await db.promise().query(
      `SELECT booking_id, check_in, check_out, rooms, status
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status != 'cancelled'
         AND check_in < ?
         AND check_out > ?`,
      [hotelId, toDateKey(endPlusOne), start]
    );

    const bookedRoomsByDate = getBookedRoomsByDate(bookingRows, parseDateKey(start), parseDateKey(end));
    const dates = listDateKeys(start, end);
    const response = dates.map((dateKey) => ({
      date: dateKey,
      rooms_available: availabilityByDate[dateKey]?.rooms_available ?? null,
      price_override: availabilityByDate[dateKey]?.price_override ?? null,
      is_closed: availabilityByDate[dateKey]?.is_closed ? 1 : 0,
      booked_rooms: bookedRoomsByDate[dateKey] ?? 0
    }));

    return res.json(response);
  } catch (error) {
    console.error('Get availability error:', error);
    return res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update hotel availability calendar
router.post('/hotels/:hotelId/availability', async (req, res) => {
  const { hotelId } = req.params;
  const { start_date, end_date, rooms_available, price_override, is_closed } = req.body;
  const userId = req.user.user_id;

  if (!start_date) {
    return res.status(400).json({ error: 'Start date is required' });
  }
  const endDate = end_date || start_date;

  try {
    const availabilityEnabled = await hasAvailabilityTable();
    if (!availabilityEnabled) {
      return res.status(400).json({ error: 'Availability calendar is not configured.' });
    }

    if (req.user.role !== 'admin') {
      const [ownership] = await db.promise().query(
        'SELECT hotel_id FROM hotel_owners WHERE user_id = ? AND hotel_id = ?'
        , [userId, hotelId]
      );
      if (ownership.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to update availability' });
      }
    }

    const endPlusOne = parseDateKey(endDate);
    endPlusOne.setDate(endPlusOne.getDate() + 1);
    const [bookingRows] = await db.promise().query(
      `SELECT booking_id, check_in, check_out, rooms, status
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status != 'cancelled'
         AND check_in < ?
         AND check_out > ?`,
      [hotelId, toDateKey(endPlusOne), start_date]
    );

    const bookedRoomsByDate = getBookedRoomsByDate(bookingRows, parseDateKey(start_date), parseDateKey(endDate));
    const dateKeys = listDateKeys(start_date, endDate);
    const normalizedRooms = rooms_available === '' || rooms_available === undefined ? null : Number(rooms_available);
    const normalizedPrice = price_override === '' || price_override === undefined ? null : Number(price_override);
    const normalizedClosed = is_closed ? 1 : 0;

    if (normalizedRooms !== null) {
      const invalidDate = dateKeys.find((dateKey) => normalizedRooms < (bookedRoomsByDate[dateKey] || 0));
      if (invalidDate) {
        return res.status(400).json({
          error: `Rooms available cannot be less than booked rooms for ${invalidDate}`
        });
      }
    }

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();
      for (const dateKey of dateKeys) {
        await connection.query(
          `INSERT INTO hotel_availability
            (hotel_id, availability_date, rooms_available, price_override, is_closed)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            rooms_available = VALUES(rooms_available),
            price_override = VALUES(price_override),
            is_closed = VALUES(is_closed)`,
          [hotelId, dateKey, normalizedRooms, normalizedPrice, normalizedClosed]
        );
      }
      await connection.commit();
      return res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update availability error:', error);
    return res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Update booking status
router.put('/bookings/:bookingId/status', async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check if owner has permission to update this booking
    if (!isAdmin) {
      const [booking] = await db.promise().query(`
        SELECT b.booking_id
        FROM hotel_bookings b
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        WHERE b.booking_id = ? AND ho.user_id = ?
      `, [bookingId, userId]);

      if (booking.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to update this booking' });
      }
    }

    const [existing] = await db.promise().query(
      'SELECT booking_id, status, rooms, hotel_id FROM hotel_bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const current = existing[0];

    // Update booking status
    await db.promise().query(
      'UPDATE hotel_bookings SET status = ? WHERE booking_id = ?',
      [status, bookingId]
    );

    if (current.hotel_id && current.status !== status) {
      const roomDelta = Number(current.rooms) || 0;
      if (roomDelta > 0) {
        try {
          if (status === 'confirmed' && current.status !== 'confirmed') {
            await db.promise().query(
              'UPDATE hotels SET rooms_available = GREATEST(rooms_available - ?, 0) WHERE hotel_id = ? AND rooms_available IS NOT NULL',
              [roomDelta, current.hotel_id]
            );
          }

          if (status === 'cancelled' && current.status === 'confirmed') {
            await db.promise().query(
              'UPDATE hotels SET rooms_available = rooms_available + ? WHERE hotel_id = ? AND rooms_available IS NOT NULL',
              [roomDelta, current.hotel_id]
            );
          }
        } catch (availabilityError) {
          if (availabilityError.code !== 'ER_BAD_FIELD_ERROR') {
            throw availabilityError;
          }
        }
      }
    }

    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Archive/unarchive booking
router.put('/bookings/:bookingId/archive', async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    // Check if owner has permission to update this booking
    if (!isAdmin) {
      const [booking] = await db.promise().query(`
        SELECT b.booking_id
        FROM hotel_bookings b
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        WHERE b.booking_id = ? AND ho.user_id = ?
      `, [bookingId, userId]);

      if (booking.length === 0) {
        return res.status(403).json({ error: 'You do not have permission to archive this booking' });
      }
    }

    // Get current archive status
    const [existing] = await db.promise().query(
      'SELECT booking_id, archived FROM hotel_bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const currentArchived = existing[0].archived;
    const newArchived = currentArchived ? 0 : 1;

    // Toggle archive status
    await db.promise().query(
      'UPDATE hotel_bookings SET archived = ?, archived_at = ? WHERE booking_id = ?',
      [newArchived, newArchived ? new Date() : null, bookingId]
    );

    res.json({ 
      success: true, 
      message: newArchived ? 'Booking archived successfully' : 'Booking restored from archive' 
    });
  } catch (error) {
    console.error('Archive booking error:', error);
    res.status(500).json({ error: 'Failed to archive booking' });
  }
});

// Assign hotel to owner (admin only)
router.post('/assign-hotel', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can assign hotels to owners' });
  }

  const { userId: targetUserId, hotelId } = req.body;

  if (!targetUserId || !hotelId) {
    return res.status(400).json({ error: 'User ID and Hotel ID are required' });
  }

  try {
    // Check if user has owner or admin role
    const [user] = await db.promise().query(
      'SELECT role FROM users WHERE user_id = ?',
      [targetUserId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!['owner', 'admin'].includes(user[0].role)) {
      return res.status(400).json({ error: 'User must have owner or admin role' });
    }

    // Check if hotel exists
    const [hotel] = await db.promise().query(
      'SELECT hotel_id FROM hotels WHERE hotel_id = ?',
      [hotelId]
    );

    if (hotel.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    // Assign hotel to owner
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Ensure each owner has only one hotel
      await connection.query('DELETE FROM hotel_owners WHERE user_id = ?', [targetUserId]);
      await connection.query(
        'INSERT INTO hotel_owners (user_id, hotel_id) VALUES (?, ?)',
        [targetUserId, hotelId]
      );

      await connection.commit();
      res.json({ success: true, message: 'Hotel assigned to owner successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Assign hotel error:', error);
    res.status(500).json({ error: 'Failed to assign hotel' });
  }
});

// Get reviews for owner's hotels
router.get('/reviews', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query;
    let params;

    if (isAdmin) {
      query = `
        SELECT 
          r.*,
          h.name as hotel_name,
          u.username,
          u.email
        FROM reviews r
        INNER JOIN hotels h ON r.hotel_id = h.hotel_id
        LEFT JOIN users u ON r.user_id = u.user_id
        ORDER BY r.review_date DESC
      `;
      params = [];
    } else {
      query = `
        SELECT 
          r.*,
          h.name as hotel_name,
          u.username,
          u.email
        FROM reviews r
        INNER JOIN hotels h ON r.hotel_id = h.hotel_id
        INNER JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE ho.user_id = ?
        ORDER BY r.review_date DESC
      `;
      params = [userId];
    }

    const [reviews] = await db.promise().query(query, params);
    res.json(reviews);
  } catch (error) {
    console.error('Get owner reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /owner/reviews/:reviewId/reply - owner replies to a review
router.post('/reviews/:reviewId/reply', async (req, res) => {
  const { reviewId } = req.params;
  const { reply } = req.body;
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  if (!reply || !reply.trim()) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  try {
    // Verify the review belongs to a hotel owned by this user (or admin)
    let ownershipCheck;
    if (isAdmin) {
      [ownershipCheck] = await db.promise().query(
        'SELECT r.review_id FROM reviews r WHERE r.review_id = ?',
        [reviewId]
      );
    } else {
      [ownershipCheck] = await db.promise().query(
        `SELECT r.review_id 
         FROM reviews r 
         INNER JOIN hotels h ON r.hotel_id = h.hotel_id 
         INNER JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id 
         WHERE r.review_id = ? AND ho.user_id = ?`,
        [reviewId, userId]
      );
    }

    if (ownershipCheck.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to reply to this review' });
    }

    await db.promise().query(
      'UPDATE reviews SET owner_reply = ?, owner_reply_date = NOW() WHERE review_id = ?',
      [reply.trim(), reviewId]
    );

    res.json({ success: true, message: 'Reply posted successfully' });
  } catch (error) {
    console.error('Post review reply error:', error);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// Get analytics data for owner
router.get('/analytics', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    const paymentRevenueJoin = `
      LEFT JOIN (
        SELECT
          booking_id,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) AS revenue
        FROM hotel_payments
        GROUP BY booking_id
      ) hp_revenue ON hp_revenue.booking_id = b.booking_id
    `;

    // Monthly booking trends
    const monthlyQuery = isAdmin
      ? `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as bookings,
          COALESCE(SUM(COALESCE(hp_revenue.revenue, 0)), 0) as revenue
        FROM hotel_bookings
        LEFT JOIN (
          SELECT
            booking_id,
            SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) AS revenue
          FROM hotel_payments
          GROUP BY booking_id
        ) hp_revenue ON hp_revenue.booking_id = hotel_bookings.booking_id
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
      `
      : `
        SELECT 
          DATE_FORMAT(b.created_at, '%Y-%m') as month,
          COUNT(*) as bookings,
          COALESCE(SUM(COALESCE(hp_revenue.revenue, 0)), 0) as revenue
        FROM hotel_bookings b
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        ${paymentRevenueJoin}
        WHERE ho.user_id = ? AND b.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
        ORDER BY month ASC
      `;
    const [monthlyData] = await db.promise().query(monthlyQuery, isAdmin ? [] : [userId]);

    const dailyQuery = isAdmin
      ? `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as day,
          COUNT(*) as bookings,
          COALESCE(SUM(COALESCE(hp_revenue.revenue, 0)), 0) as revenue
        FROM hotel_bookings
        LEFT JOIN (
          SELECT
            booking_id,
            SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) AS revenue
          FROM hotel_payments
          GROUP BY booking_id
        ) hp_revenue ON hp_revenue.booking_id = hotel_bookings.booking_id
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY day ASC
      `
      : `
        SELECT 
          DATE_FORMAT(b.created_at, '%Y-%m-%d') as day,
          COUNT(*) as bookings,
          COALESCE(SUM(COALESCE(hp_revenue.revenue, 0)), 0) as revenue
        FROM hotel_bookings b
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        ${paymentRevenueJoin}
        WHERE ho.user_id = ? AND b.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE_FORMAT(b.created_at, '%Y-%m-%d')
        ORDER BY day ASC
      `;
    const [dailyData] = await db.promise().query(dailyQuery, isAdmin ? [] : [userId]);

    const capacityQuery = isAdmin
      ? `SELECT COALESCE(SUM(rooms_total), 0) AS total_rooms FROM hotels`
      : `
        SELECT COALESCE(SUM(h.rooms_total), 0) AS total_rooms
        FROM hotels h
        INNER JOIN hotel_owners ho ON ho.hotel_id = h.hotel_id
        WHERE ho.user_id = ?
      `;
    const [capacityRows] = await db.promise().query(capacityQuery, isAdmin ? [] : [userId]);
    const totalRooms = Number(capacityRows[0]?.total_rooms || 0);

    const occupancyStart = new Date();
    occupancyStart.setMonth(occupancyStart.getMonth() - 6);
    occupancyStart.setDate(1);
    occupancyStart.setHours(0, 0, 0, 0);

    const occupancyEnd = new Date();
    occupancyEnd.setHours(23, 59, 59, 999);

    const bookingRangeQuery = isAdmin
      ? `
        SELECT check_in, check_out, rooms
        FROM hotel_bookings
        WHERE status != 'cancelled'
          AND check_in < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          AND check_out > ?
      `
      : `
        SELECT b.check_in, b.check_out, b.rooms
        FROM hotel_bookings b
        INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
        WHERE ho.user_id = ?
          AND b.status != 'cancelled'
          AND b.check_in < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          AND b.check_out > ?
      `;
    const [bookingRangeRows] = await db.promise().query(
      bookingRangeQuery,
      isAdmin ? [toDateKey(occupancyStart)] : [userId, toDateKey(occupancyStart)]
    );

    const bookedRoomsByDate = getBookedRoomsByDate(bookingRangeRows, occupancyStart, occupancyEnd);

    const dailyTrendMap = new Map(dailyData.map((row) => [row.day, row]));
    const dailyTrendStart = new Date(occupancyEnd);
    dailyTrendStart.setDate(dailyTrendStart.getDate() - 6);
    dailyTrendStart.setHours(0, 0, 0, 0);
    const dailyDates = listDateKeys(toDateKey(dailyTrendStart), toDateKey(occupancyEnd));
    const dailyTrends = dailyDates.map((day) => {
      const row = dailyTrendMap.get(day) || { day, bookings: 0, revenue: 0 };
      const utilization = totalRooms > 0 ? ((bookedRoomsByDate[day] || 0) / totalRooms) * 100 : 0;
      return {
        day,
        bookings: Number(row.bookings || 0),
        revenue: Number(row.revenue || 0),
        occupancy: Number(utilization.toFixed(2))
      };
    });

    const monthlyTrendMap = new Map(monthlyData.map((row) => [row.month, row]));
    const monthlyOccupancyMap = new Map();
    const occupancyCursor = new Date(occupancyStart);
    while (occupancyCursor <= occupancyEnd) {
      const dateKey = toDateKey(occupancyCursor);
      const monthKey = dateKey.slice(0, 7);
      const current = monthlyOccupancyMap.get(monthKey) || { bookedRooms: 0, days: 0 };
      current.bookedRooms += Number(bookedRoomsByDate[dateKey] || 0);
      current.days += 1;
      monthlyOccupancyMap.set(monthKey, current);
      occupancyCursor.setDate(occupancyCursor.getDate() + 1);
    }

    const monthlyKeys = [];
    const monthlyCursor = new Date(occupancyStart.getFullYear(), occupancyStart.getMonth(), 1);
    const currentMonth = new Date(occupancyEnd.getFullYear(), occupancyEnd.getMonth(), 1);
    while (monthlyCursor <= currentMonth) {
      monthlyKeys.push(`${monthlyCursor.getFullYear()}-${String(monthlyCursor.getMonth() + 1).padStart(2, '0')}`);
      monthlyCursor.setMonth(monthlyCursor.getMonth() + 1);
    }
    const monthlyTrends = monthlyKeys.map((monthKey) => {
      const row = monthlyTrendMap.get(monthKey) || { month: monthKey, bookings: 0, revenue: 0 };
      const occupancy = monthlyOccupancyMap.get(monthKey) || { bookedRooms: 0, days: 0 };
      const utilization = totalRooms > 0 && occupancy.days > 0
        ? (occupancy.bookedRooms / (totalRooms * occupancy.days)) * 100
        : 0;
      return {
        month: monthKey,
        bookings: Number(row.bookings || 0),
        revenue: Number(row.revenue || 0),
        occupancy: Number(utilization.toFixed(2))
      };
    });

    // Hotel performance
    const hotelQuery = isAdmin
      ? `
        SELECT 
          h.name,
          COUNT(b.booking_id) as bookings,
          AVG(r.rating) as avg_rating,
          COALESCE(SUM(COALESCE(hp_revenue.revenue, 0)), 0) as revenue
        FROM hotels h
        LEFT JOIN hotel_bookings b ON h.hotel_id = b.hotel_id
        ${paymentRevenueJoin}
        LEFT JOIN reviews r ON h.hotel_id = r.hotel_id AND r.moderated = 1
        GROUP BY h.hotel_id, h.name
        ORDER BY bookings DESC
      `
      : `
        SELECT 
          h.name,
          COUNT(b.booking_id) as bookings,
          AVG(r.rating) as avg_rating,
          COALESCE(SUM(COALESCE(hp_revenue.revenue, 0)), 0) as revenue
        FROM hotels h
        INNER JOIN hotel_owners ho ON h.hotel_id = ho.hotel_id
        LEFT JOIN hotel_bookings b ON h.hotel_id = b.hotel_id
        ${paymentRevenueJoin}
        LEFT JOIN reviews r ON h.hotel_id = r.hotel_id AND r.moderated = 1
        WHERE ho.user_id = ?
        GROUP BY h.hotel_id, h.name
        ORDER BY bookings DESC
      `;
    const [hotelData] = await db.promise().query(hotelQuery, isAdmin ? [] : [userId]);

    res.json({
      monthlyTrends,
      dailyTrends,
      hotelPerformance: hotelData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get owner profile (includes business profile)
router.get('/profile', async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Get user basic info
    const [users] = await db.promise().query(
      'SELECT user_id, username, email, first_name, last_name, phone, date_of_birth FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get business profile
    const [businessProfiles] = await db.promise().query(
      'SELECT id, business_name, business_email, business_phone, business_address, tax_id, bank_name, verification_status FROM business_profiles WHERE owner_id = ?',
      [userId]
    );

    const businessProfile = businessProfiles.length > 0 ? businessProfiles[0] : null;

    res.json({
      ...users[0],
      businessProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update owner profile and business profile
router.put('/profile', async (req, res) => {
  const userId = req.user.user_id;
  const { first_name, last_name, phone, email, businessName, businessEmail, businessPhone, businessAddress, taxId, bankAccount, bankName } = req.body;

  try {
    // Update user basic info
    if (first_name || last_name || phone || email) {
      await db.promise().query(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, email = ? WHERE user_id = ?',
        [first_name, last_name, phone, email, userId]
      );
    }

    // Check if business profile exists
    const [existingProfiles] = await db.promise().query(
      'SELECT id FROM business_profiles WHERE owner_id = ?',
      [userId]
    );

    if (existingProfiles.length > 0) {
      // Update existing business profile
      await db.promise().query(
        `UPDATE business_profiles 
         SET business_name = ?, business_email = ?, business_phone = ?, business_address = ?, tax_id = ?, bank_name = ?, updated_at = NOW()
         WHERE owner_id = ?`,
        [businessName, businessEmail, businessPhone, businessAddress, taxId, bankName, userId]
      );
    } else {
      // Create new business profile
      await db.promise().query(
        `INSERT INTO business_profiles (owner_id, business_name, business_email, business_phone, business_address, tax_id, bank_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, businessName, businessEmail, businessPhone, businessAddress, taxId, bankName]
      );
    }

    // Note: Bank account should be encrypted before storage in production
    // For now, we're not storing it via API. Should implement encryption service.

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get payment statistics
router.get('/payments/stats', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query, params;

    if (isAdmin) {
      // Admin sees all payments
      query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount,
          SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as refunded_amount,
          AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) as avg_transaction,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_transactions,
          COUNT(CASE WHEN DATE(paid_at) = CURDATE() THEN 1 END) as today_transactions,
          SUM(CASE WHEN DATE(paid_at) = CURDATE() AND status = 'succeeded' THEN amount ELSE 0 END) as today_revenue
        FROM hotel_payments
      `;
      params = [];
    } else {
      // Owner sees only their hotel payments
      query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN hp.status = 'succeeded' THEN hp.amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN hp.status = 'pending' THEN hp.amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN hp.status = 'failed' THEN hp.amount ELSE 0 END) as failed_amount,
          SUM(CASE WHEN hp.status = 'refunded' THEN hp.amount ELSE 0 END) as refunded_amount,
          AVG(CASE WHEN hp.status = 'succeeded' THEN hp.amount ELSE NULL END) as avg_transaction,
          COUNT(CASE WHEN hp.status = 'succeeded' THEN 1 END) as successful_transactions,
          COUNT(CASE WHEN DATE(hp.paid_at) = CURDATE() THEN 1 END) as today_transactions,
          SUM(CASE WHEN DATE(hp.paid_at) = CURDATE() AND hp.status = 'succeeded' THEN hp.amount ELSE 0 END) as today_revenue
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
        WHERE ho.user_id = ?
      `;
      params = [userId];
    }

    const [stats] = await db.promise().query(query, params);

    // Get payment method breakdown
    const methodQuery = isAdmin
      ? `
        SELECT 
          method,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as total
        FROM hotel_payments
        GROUP BY method
      `
      : `
        SELECT 
          hp.method,
          COUNT(*) as count,
          SUM(CASE WHEN hp.status = 'succeeded' THEN hp.amount ELSE 0 END) as total
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
        WHERE ho.user_id = ?
        GROUP BY hp.method
      `;
    const [methodBreakdown] = await db.promise().query(methodQuery, isAdmin ? [] : [userId]);

    res.json({
      ...stats[0],
      methodBreakdown
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

// Get payment transactions
router.get('/payments', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';
  const { status, method, limit = 100, startDate, endDate, search } = req.query;

  try {
    let query, params;

    const filters = [];
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);

    if (status) {
      filters.push({ clause: 'hp.status = ?', value: status });
    }
    if (method) {
      filters.push({ clause: 'hp.method = ?', value: method });
    }
    if (startDate) {
      filters.push({ clause: 'DATE(hp.created_at) >= ?', value: startDate });
    }
    if (endDate) {
      filters.push({ clause: 'DATE(hp.created_at) <= ?', value: endDate });
    }
    if (search) {
      const searchLike = `%${String(search).trim()}%`;
      if (searchLike !== '%%') {
        filters.push({
          clause: '(hp.transaction_reference LIKE ? OR hb.receipt_number LIKE ? OR hb.customer_name LIKE ? OR hb.customer_email LIKE ?)',
          value: [searchLike, searchLike, searchLike, searchLike]
        });
      }
    }

    const additionalWhere = filters.length ? ` AND ${filters.map((f) => f.clause).join(' AND ')}` : '';

    if (isAdmin) {
      query = `
        SELECT 
          hp.*,
          hb.hotel_name,
          hb.customer_name,
          hb.customer_email,
          hb.check_in,
          hb.check_out,
          hb.receipt_number,
          hb.room_type_name,
          hb.rooms,
          hb.booking_reference
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        WHERE hp.archived = 0${additionalWhere}
        ORDER BY hp.created_at DESC
        LIMIT ?
      `;
      params = [];
      filters.forEach((f) => {
        if (Array.isArray(f.value)) {
          params.push(...f.value);
        } else {
          params.push(f.value);
        }
      });
      params.push(safeLimit);
    } else {
      query = `
        SELECT 
          hp.*,
          hb.hotel_name,
          hb.customer_name,
          hb.customer_email,
          hb.check_in,
          hb.check_out,
          hb.receipt_number,
          hb.room_type_name,
          hb.rooms,
          hb.booking_reference
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
        WHERE ho.user_id = ? AND hp.archived = 0${additionalWhere}
        ORDER BY hp.created_at DESC
        LIMIT ?
      `;
      params = [userId];
      filters.forEach((f) => {
        if (Array.isArray(f.value)) {
          params.push(...f.value);
        } else {
          params.push(f.value);
        }
      });
      params.push(safeLimit);
    }

    const [payments] = await db.promise().query(query, params);
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get monthly revenue chart data
router.get('/payments/monthly-revenue', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query, params;

    if (isAdmin) {
      query = `
        SELECT 
          DATE_FORMAT(paid_at, '%Y-%m') as month,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as revenue,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as transactions
        FROM hotel_payments
        WHERE paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(paid_at, '%Y-%m')
        ORDER BY month ASC
      `;
      params = [];
    } else {
      query = `
        SELECT 
          DATE_FORMAT(hp.paid_at, '%Y-%m') as month,
          SUM(CASE WHEN hp.status = 'succeeded' THEN hp.amount ELSE 0 END) as revenue,
          COUNT(CASE WHEN hp.status = 'succeeded' THEN 1 END) as transactions
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
        WHERE ho.user_id = ? AND hp.paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(hp.paid_at, '%Y-%m')
        ORDER BY month ASC
      `;
      params = [userId];
    }

    const [monthlyData] = await db.promise().query(query, params);
    res.json(monthlyData);
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly revenue' });
  }
});

// Confirm pending payment
router.put('/payments/:paymentId/confirm', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';
  const { paymentId } = req.params;

  try {
    let query, params;
    
    if (isAdmin) {
      query = `SELECT p.*, hb.hotel_id
               FROM hotel_payments p
               INNER JOIN hotel_bookings hb ON p.booking_id = hb.booking_id
               WHERE p.payment_id = ?`;
      params = [paymentId];
    } else {
      query = `SELECT p.*, hb.hotel_id
               FROM hotel_payments p
               INNER JOIN hotel_bookings hb ON p.booking_id = hb.booking_id
               INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
               WHERE p.payment_id = ? AND ho.user_id = ?`;
      params = [paymentId, userId];
    }

    const [payments] = await db.promise().query(query, params);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    const payment = payments[0];

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Can only confirm pending payments' });
    }

    await db.promise().query(
      `UPDATE hotel_payments SET status = 'succeeded', paid_at = NOW(), updated_at = NOW() WHERE payment_id = ?`,
      [paymentId]
    );

    await db.promise().query(
      `UPDATE hotel_bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW() WHERE booking_id = ?`,
      [payment.booking_id]
    );

    res.json({ success: true, message: 'Payment confirmed successfully' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Cancel pending payment
router.put('/payments/:paymentId/cancel', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';
  const { paymentId } = req.params;

  try {
    let query, params;
    
    if (isAdmin) {
      query = `SELECT p.*, hb.hotel_id
               FROM hotel_payments p
               INNER JOIN hotel_bookings hb ON p.booking_id = hb.booking_id
               WHERE p.payment_id = ?`;
      params = [paymentId];
    } else {
      query = `SELECT p.*, hb.hotel_id
               FROM hotel_payments p
               INNER JOIN hotel_bookings hb ON p.booking_id = hb.booking_id
               INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
               WHERE p.payment_id = ? AND ho.user_id = ?`;
      params = [paymentId, userId];
    }

    const [payments] = await db.promise().query(query, params);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    const payment = payments[0];

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending payments' });
    }

    await db.promise().query(
      `UPDATE hotel_payments SET status = 'failed', updated_at = NOW() WHERE payment_id = ?`,
      [paymentId]
    );

    await db.promise().query(
      `UPDATE hotel_bookings SET payment_status = 'failed', updated_at = NOW() WHERE booking_id = ?`,
      [payment.booking_id]
    );

    res.json({ success: true, message: 'Payment cancelled' });
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
});

// Archive payment
router.put('/payments/:paymentId/archive', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';
  const { paymentId } = req.params;

  try {
    let query, params;
    
    if (isAdmin) {
      query = `SELECT p.payment_id FROM hotel_payments p WHERE p.payment_id = ?`;
      params = [paymentId];
    } else {
      query = `SELECT p.payment_id
               FROM hotel_payments p
               INNER JOIN hotel_bookings hb ON p.booking_id = hb.booking_id
               INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
               WHERE p.payment_id = ? AND ho.user_id = ?`;
      params = [paymentId, userId];
    }

    const [payments] = await db.promise().query(query, params);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    await db.promise().query(
      `UPDATE hotel_payments SET archived = 1, archived_at = NOW() WHERE payment_id = ?`,
      [paymentId]
    );

    res.json({ success: true, message: 'Payment archived successfully' });
  } catch (error) {
    console.error('Archive payment error:', error);
    res.status(500).json({ error: 'Failed to archive payment' });
  }
});

// Get archived payments
router.get('/payments/archived', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query, params;

    if (isAdmin) {
      query = `
        SELECT 
          hp.*,
          hb.hotel_name,
          hb.customer_name,
          hb.customer_email
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        WHERE hp.archived = 1
        ORDER BY hp.archived_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT 
          hp.*,
          hb.hotel_name,
          hb.customer_name,
          hb.customer_email
        FROM hotel_payments hp
        INNER JOIN hotel_bookings hb ON hp.booking_id = hb.booking_id
        INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
        WHERE ho.user_id = ? AND hp.archived = 1
        ORDER BY hp.archived_at DESC
      `;
      params = [userId];
    }

    const [payments] = await db.promise().query(query, params);
    res.json(payments);
  } catch (error) {
    console.error('Get archived payments error:', error);
    res.status(500).json({ error: 'Failed to fetch archived payments' });
  }
});

// Restore archived payment
router.put('/payments/:paymentId/restore', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';
  const { paymentId } = req.params;

  try {
    let query, params;
    
    if (isAdmin) {
      query = `SELECT p.payment_id FROM hotel_payments p WHERE p.payment_id = ?`;
      params = [paymentId];
    } else {
      query = `SELECT p.payment_id
               FROM hotel_payments p
               INNER JOIN hotel_bookings hb ON p.booking_id = hb.booking_id
               INNER JOIN hotel_owners ho ON hb.hotel_id = ho.hotel_id
               WHERE p.payment_id = ? AND ho.user_id = ?`;
      params = [paymentId, userId];
    }

    const [payments] = await db.promise().query(query, params);

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found or access denied' });
    }

    await db.promise().query(
      `UPDATE hotel_payments SET archived = 0, archived_at = NULL WHERE payment_id = ?`,
      [paymentId]
    );

    res.json({ success: true, message: 'Payment restored successfully' });
  } catch (error) {
    console.error('Restore payment error:', error);
    res.status(500).json({ error: 'Failed to restore payment' });
  }
});

// Restore archived booking
router.put('/bookings/:bookingId/restore', async (req, res) => {
  const userId = req.user.user_id;
  const isAdmin = req.user.role === 'admin';
  const { bookingId } = req.params;

  try {
    let query, params;
    
    if (isAdmin) {
      query = `SELECT b.booking_id FROM hotel_bookings b WHERE b.booking_id = ?`;
      params = [bookingId];
    } else {
      query = `SELECT b.booking_id
               FROM hotel_bookings b
               INNER JOIN hotel_owners ho ON b.hotel_id = ho.hotel_id
               WHERE b.booking_id = ? AND ho.user_id = ?`;
      params = [bookingId, userId];
    }

    const [bookings] = await db.promise().query(query, params);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }

    await db.promise().query(
      `UPDATE hotel_bookings SET archived = 0, archived_at = NULL WHERE booking_id = ?`,
      [bookingId]
    );

    res.json({ success: true, message: 'Booking restored successfully' });
  } catch (error) {
    console.error('Restore booking error:', error);
    res.status(500).json({ error: 'Failed to restore booking' });
  }
});

// ==================== ROOM MANAGEMENT ENDPOINTS ====================

// Get all rooms for a specific hotel
router.get('/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.user_id;

    // Verify ownership
    const [ownerCheck] = await db.promise().query(
      'SELECT 1 FROM hotel_owners WHERE hotel_id = ? AND user_id = ?',
      [hotelId, userId]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rooms] = await db.promise().query(
      `SELECT room_id, hotel_id, room_type_name, description, capacity, room_size_sqm, 
              price_per_night, currency, quantity_available, amenities, image_urls, 
              primary_image_url, is_active, created_at, updated_at
       FROM rooms
       WHERE hotel_id = ?
       ORDER BY room_type_name`,
      [hotelId]
    );

    const formatted = rooms.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      image_urls: room.image_urls ? JSON.parse(room.image_urls) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new room type
router.post('/hotels/:hotelId/rooms', upload.array('images', 10), async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { room_type_name, description, capacity, room_size_sqm, price_per_night, 
            currency, quantity_available, amenities, image_urls } = req.body;
    const userId = req.user.user_id;

    // Verify ownership
    const [ownerCheck] = await db.promise().query(
      'SELECT 1 FROM hotel_owners WHERE hotel_id = ? AND user_id = ?',
      [hotelId, userId]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate required fields
    if (!room_type_name || !capacity || !price_per_night || !quantity_available) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse amenities
    let amenitiesJson = null;
    if (amenities) {
      try {
        amenitiesJson = JSON.stringify(
          Array.isArray(amenities) ? amenities : 
          typeof amenities === 'string' ? amenities.split(',').map(a => a.trim()) : []
        );
      } catch (e) {
        amenitiesJson = null;
      }
    }

    // Parse image URLs
    let imageUrlsJson = null;
    if (image_urls) {
      try {
        imageUrlsJson = JSON.stringify(
          Array.isArray(image_urls) ? image_urls.filter(Boolean) : 
          typeof image_urls === 'string' ? image_urls.split(',').map(u => u.trim()).filter(Boolean) : []
        );
      } catch (e) {
        imageUrlsJson = null;
      }
    }

    // Add uploaded images to image_urls if provided
    let primaryImage = null;
    if (req.files && req.files.length > 0) {
      const imageArray = imageUrlsJson ? JSON.parse(imageUrlsJson) : [];
      req.files.forEach(file => {
        const imageUrl = `/uploads/hotels/${file.filename}`;
        imageArray.push(imageUrl);
        if (!primaryImage) primaryImage = imageUrl;
      });
      imageUrlsJson = JSON.stringify(imageArray);
    }

    const [result] = await db.promise().query(
      `INSERT INTO rooms (hotel_id, room_type_name, description, capacity, room_size_sqm, 
                         price_per_night, currency, quantity_available, amenities, image_urls, 
                         primary_image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [hotelId, room_type_name, description || null, capacity, room_size_sqm || null, 
       price_per_night, currency || 'PHP', quantity_available, amenitiesJson, imageUrlsJson, primaryImage]
    );

    res.status(201).json({
      success: true,
      room_id: result.insertId,
      message: 'Room type created successfully'
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update an existing room type
router.put('/hotels/:hotelId/rooms/:roomId', upload.array('images', 10), async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { room_type_name, description, capacity, room_size_sqm, price_per_night, 
            currency, quantity_available, amenities, image_urls, is_active } = req.body;
    const userId = req.user.user_id;

    // Verify ownership
    const [ownerCheck] = await db.promise().query(
      `SELECT r.room_id FROM rooms r
       INNER JOIN hotel_owners ho ON r.hotel_id = ho.hotel_id
       WHERE r.room_id = ? AND r.hotel_id = ? AND ho.user_id = ?`,
      [roomId, hotelId, userId]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Parse amenities
    let amenitiesJson = null;
    if (amenities) {
      try {
        amenitiesJson = JSON.stringify(
          Array.isArray(amenities) ? amenities : 
          typeof amenities === 'string' ? amenities.split(',').map(a => a.trim()) : []
        );
      } catch (e) {
        amenitiesJson = null;
      }
    }

    // Parse image URLs
    let imageUrlsJson = null;
    if (image_urls) {
      try {
        imageUrlsJson = JSON.stringify(
          Array.isArray(image_urls) ? image_urls.filter(Boolean) : 
          typeof image_urls === 'string' ? image_urls.split(',').map(u => u.trim()).filter(Boolean) : []
        );
      } catch (e) {
        imageUrlsJson = null;
      }
    }

    // Add uploaded images if provided
    let primaryImage = null;
    if (req.files && req.files.length > 0) {
      const imageArray = imageUrlsJson ? JSON.parse(imageUrlsJson) : [];
      req.files.forEach(file => {
        const imageUrl = `/uploads/hotels/${file.filename}`;
        imageArray.push(imageUrl);
        if (!primaryImage) primaryImage = imageUrl;
      });
      imageUrlsJson = JSON.stringify(imageArray);
    }

    const updates = [];
    const params = [];

    if (room_type_name !== undefined) {
      updates.push('room_type_name = ?');
      params.push(room_type_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description || null);
    }
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(capacity);
    }
    if (room_size_sqm !== undefined) {
      updates.push('room_size_sqm = ?');
      params.push(room_size_sqm || null);
    }
    if (price_per_night !== undefined) {
      updates.push('price_per_night = ?');
      params.push(price_per_night);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      params.push(currency || 'PHP');
    }
    if (quantity_available !== undefined) {
      updates.push('quantity_available = ?');
      params.push(quantity_available);
    }
    if (amenitiesJson !== null) {
      updates.push('amenities = ?');
      params.push(amenitiesJson);
    }
    if (imageUrlsJson !== null) {
      updates.push('image_urls = ?');
      params.push(imageUrlsJson);
    }
    if (primaryImage !== null) {
      updates.push('primary_image_url = ?');
      params.push(primaryImage);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(roomId);
    const query = `UPDATE rooms SET ${updates.join(', ')} WHERE room_id = ?`;

    await db.promise().query(query, params);

    res.json({ success: true, message: 'Room type updated successfully' });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete a room type
router.delete('/hotels/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const userId = req.user.user_id;

    // Verify ownership
    const [ownerCheck] = await db.promise().query(
      `SELECT r.room_id FROM rooms r
       INNER JOIN hotel_owners ho ON r.hotel_id = ho.hotel_id
       WHERE r.room_id = ? AND r.hotel_id = ? AND ho.user_id = ?`,
      [roomId, hotelId, userId]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.promise().query('DELETE FROM rooms WHERE room_id = ?', [roomId]);

    res.json({ success: true, message: 'Room type deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Get room availability for date range
router.get('/hotels/:hotelId/rooms/:roomId/availability', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { start_date, end_date } = req.query;
    const userId = req.user.user_id;

    // Verify ownership
    const [ownerCheck] = await db.promise().query(
      `SELECT r.room_id FROM rooms r
       INNER JOIN hotel_owners ho ON r.hotel_id = ho.hotel_id
       WHERE r.room_id = ? AND r.hotel_id = ? AND ho.user_id = ?`,
      [roomId, hotelId, userId]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = 'SELECT * FROM room_inventory WHERE room_id = ?';
    const params = [roomId];

    if (start_date && end_date) {
      query += ' AND availability_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY availability_date';

    const [inventory] = await db.promise().query(query, params);
    res.json(inventory);
  } catch (error) {
    console.error('Get room availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update room availability for specific dates
router.post('/hotels/:hotelId/rooms/:roomId/availability', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { availability_date, available_count, price_override, is_closed } = req.body;
    const userId = req.user.user_id;

    // Verify ownership
    const [ownerCheck] = await db.promise().query(
      `SELECT r.room_id FROM rooms r
       INNER JOIN hotel_owners ho ON r.hotel_id = ho.hotel_id
       WHERE r.room_id = ? AND r.hotel_id = ? AND ho.user_id = ?`,
      [roomId, hotelId, userId]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!availability_date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Upsert inventory
    await db.promise().query(
      `INSERT INTO room_inventory (room_id, availability_date, available_count, price_override, is_closed)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       available_count = VALUES(available_count),
       price_override = VALUES(price_override),
       is_closed = VALUES(is_closed),
       updated_at = NOW()`,
      [roomId, availability_date, available_count, price_override || null, is_closed ? 1 : 0]
    );

    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Public endpoint: Get all active rooms for a hotel (no auth required)
router.get('/public/hotels/:hotelId/rooms', async (req, res) => {
  try {
    const { hotelId } = req.params;

    const [rooms] = await db.promise().query(
      `SELECT room_id, room_type_name, description, capacity, room_size_sqm, 
              price_per_night, currency, quantity_available, amenities, image_urls, 
              primary_image_url
       FROM rooms
       WHERE hotel_id = ? AND is_active = 1
       ORDER BY price_per_night`,
      [hotelId]
    );

    const formatted = rooms.map(room => ({
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      image_urls: room.image_urls ? JSON.parse(room.image_urls) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// NEW: Get room revenue reports for a hotel
router.get('/hotels/:hotelId/reports/rooms', authenticateToken, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.decoded.user_id;

    // Verify ownership
    const [ownerRows] = await db.promise().query(
      'SELECT owner_id FROM hotel_owners WHERE hotel_id = ? AND owner_id = ?',
      [hotelId, userId]
    );

    if (ownerRows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get revenue statistics grouped by room type
    const [revenueData] = await db.promise().query(
      `SELECT 
        r.room_id,
        r.room_type_name,
        r.price_per_night,
        r.quantity_available,
        COUNT(DISTINCT hb.booking_id) as total_bookings,
        SUM(CASE WHEN hb.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN hb.status IN ('confirmed', 'pending') THEN hb.nights ELSE 0 END) as total_nights,
        SUM(CASE WHEN hb.status = 'confirmed' THEN hb.total_amount ELSE 0 END) as confirmed_revenue,
        AVG(CASE WHEN hb.status = 'confirmed' AND r.room_id IS NOT NULL THEN rev.rating ELSE NULL END) as average_rating,
        COUNT(CASE WHEN hb.status = 'confirmed' AND r.room_id IS NOT NULL THEN rev.review_id ELSE NULL END) as review_count
      FROM rooms r
      LEFT JOIN hotel_bookings hb ON r.room_id = hb.room_id
      LEFT JOIN reviews rev ON hb.booking_id = rev.booking_id
      WHERE r.hotel_id = ?
      GROUP BY r.room_id, r.room_type_name, r.price_per_night
      ORDER BY confirmed_revenue DESC`,
      [hotelId]
    );

    // Calculate totals
    const totals = {
      total_bookings: 0,
      confirmed_bookings: 0,
      total_nights: 0,
      confirmed_revenue: 0,
      average_occupancy_rate: 0
    };

    const rooms_data = revenueData.map(room => {
      totals.total_bookings += room.total_bookings || 0;
      totals.confirmed_bookings += room.confirmed_bookings || 0;
      totals.total_nights += room.total_nights || 0;
      totals.confirmed_revenue += room.confirmed_revenue || 0;

      const occupancy_nights = room.total_nights || 0;
      const occupancy_rate = (occupancy_nights / (room.quantity_available * 365)) * 100;

      return {
        room_id: room.room_id,
        room_type_name: room.room_type_name,
        price_per_night: room.price_per_night,
        quantity_available: room.quantity_available,
        total_bookings: room.total_bookings || 0,
        confirmed_bookings: room.confirmed_bookings || 0,
        total_nights: room.total_nights || 0,
        confirmed_revenue: parseFloat(room.confirmed_revenue || 0),
        average_rating: room.average_rating ? parseFloat(room.average_rating).toFixed(2) : null,
        review_count: room.review_count || 0,
        occupancy_rate: occupancy_rate.toFixed(2)
      };
    });

    // Calculate average occupancy
    if (revenueData.length > 0) {
      const total_possible_nights = revenueData.reduce((sum, r) => sum + (r.quantity_available * 365), 0);
      totals.average_occupancy_rate = ((totals.total_nights / total_possible_nights) * 100).toFixed(2);
    }

    res.json({
      rooms: rooms_data,
      totals: {
        ...totals,
        confirmed_revenue: parseFloat(totals.confirmed_revenue)
      }
    });
  } catch (error) {
    console.error('Get room revenue reports error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue reports' });
  }
});

export default router;
