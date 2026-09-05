import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db.js';

import { JWT_SECRET } from '../config/security.js';

const getUserIdFromToken = (req) => {
  // Check for token in HttpOnly cookie FIRST (more secure)
  let token = req.cookies?.auth_token;
  
  // Fall back to Authorization header for backwards compatibility
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.user_id;
  } catch (err) {
    return null;
  }
};

const generateReceiptNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `HB-${datePart}-${rand}`;
};

const generatePaymentReference = () => {
  return `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

const DEFAULT_PAYMENT_METHODS = ['card', 'gcash', 'paypal', 'bank_transfer', 'pay_at_property'];

const parseAllowedPaymentMethods = (value) => {
  if (!value) return DEFAULT_PAYMENT_METHODS;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return DEFAULT_PAYMENT_METHODS;
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (error) {
        // Fall back to CSV parsing
      }
    }
    const csv = trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    return csv.length ? csv : DEFAULT_PAYMENT_METHODS;
  }
  return DEFAULT_PAYMENT_METHODS;
};

const formatBookingReference = (bookingId) => {
  const normalized = Number(bookingId);
  if (!Number.isFinite(normalized) || normalized <= 0) return null;
  return `HB${String(normalized).padStart(6, '0')}`;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const computeNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

const fetchBooking = async (bookingId) => {
  const [rows] = await db.promise().query(
    `SELECT b.*, u.username, u.email
     FROM hotel_bookings b
     JOIN users u ON b.user_id = u.user_id
     WHERE b.booking_id = ?`,
    [bookingId]
  );
  return rows[0] || null;
};

const mapReceipt = (booking, payment) => {
  if (!booking) return null;
  return {
    receipt_number: booking.receipt_number,
    booking_reference: booking.booking_reference || null,
    issued_at: booking.created_at,
    booking_id: booking.booking_id,
    customer_name: booking.customer_name || booking.username,
    customer_email: booking.customer_email || booking.email,
    customer_phone: booking.customer_phone,
    hotel_name: booking.hotel_name,
    hotel_location: booking.hotel_location,
    check_in: booking.check_in,
    check_out: booking.check_out,
    nights: booking.nights,
    rooms: booking.rooms,
    guests: booking.guests,
    price_per_night: booking.price_per_night,
    total_amount: booking.total_amount,
    currency: booking.currency,
    payment_status: booking.payment_status,
    payment_method: booking.payment_method,
    payment_reference: payment?.transaction_reference || null,
    payment_provider: payment?.provider || null,
    card_last4: payment?.card_last4 || null,
    status: booking.status
  };
};

export const createHotelBooking = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    hotel_id,
    hotel_name,
    hotel_location,
    price_per_night,
    currency = 'USD',
    check_in,
    check_out,
    guests = 1,
    rooms = 1,
    special_requests = '',
    payment_method = 'pay_at_property',
    pay_now = true,
    customer_name,
    customer_email,
    customer_phone,
    card_last4,
    room_id = null,           // NEW: Optional room selection
    room_type_name = null     // NEW: Optional room type name
  } = req.body;

  const MAX_GUESTS_PER_BOOKING = 100;

  if (!hotel_name || !check_in || !check_out) {
    return res.status(400).json({ error: 'Hotel, check-in, and check-out are required' });
  }

  const checkInDate = new Date(check_in);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    return res.status(400).json({ error: 'Check-in date cannot be in the past' });
  }

  const nights = computeNights(check_in, check_out);
  if (nights <= 0) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date' });
  }

  if (nights > 90) {
    return res.status(400).json({ error: 'Maximum stay is 90 nights' });
  }

  const price = toNumber(price_per_night, 0);
  const numRooms = Math.max(1, toNumber(rooms, 1));
  const numGuests = Math.max(1, toNumber(guests, 1));

  if (numGuests > MAX_GUESTS_PER_BOOKING) {
    return res.status(400).json({ error: `Maximum guests per booking is ${MAX_GUESTS_PER_BOOKING}` });
  }

  if (price <= 0) {
    return res.status(400).json({ error: 'Invalid price per night' });
  }

  const totalAmount = Number((price * nights * numRooms).toFixed(2));
  const receiptNumber = generateReceiptNumber();

  const bookingStatus = 'pending';
  const paymentStatus = pay_now ? 'paid' : 'unpaid';

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    let selectedRoom = null;  // Store room details for later use

    if (hotel_id) {
      const [duplicates] = await connection.query(
        `SELECT booking_id FROM hotel_bookings
         WHERE user_id = ? AND hotel_id = ?
           AND status IN ('confirmed', 'pending')
           AND check_in < ? AND check_out > ?
           AND (archived = 0 AND (expires_at IS NULL OR expires_at > NOW()))`,
        [userId, hotel_id, check_out, check_in]
      );

      if (duplicates.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: 'You already have a booking for these dates' });
      }

      const [hotel] = await connection.query(
        'SELECT rooms_total, allowed_payment_methods FROM hotels WHERE hotel_id = ? FOR UPDATE',
        [hotel_id]
      );

      if (hotel.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Hotel not found' });
      }

      const totalRooms = hotel[0].rooms_total || 0;
      const allowedMethods = parseAllowedPaymentMethods(hotel[0].allowed_payment_methods);
      if (!allowedMethods.includes(payment_method)) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          error: `Payment method '${payment_method}' is not available for this hotel`,
          allowed_payment_methods: allowedMethods
        });
      }

      // Check if a specific room type was selected
      if (room_id) {
        // Get room details
        const [roomDetails] = await connection.query(
          'SELECT room_id, room_type_name, capacity, quantity_available FROM rooms WHERE room_id = ? AND hotel_id = ? FOR UPDATE',
          [room_id, hotel_id]
        );

        if (roomDetails.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ error: 'Selected room type not found' });
        }

        selectedRoom = roomDetails[0];  // Store for later INSERT

        // Check 1: Room capacity must accommodate guests
        if (selectedRoom.capacity < numGuests) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ 
            error: `This room type can only accommodate ${selectedRoom.capacity} guest(s), but you need ${numGuests}. Please select a larger room or reduce guests.`
          });
        }

        // Check 2: Must have enough quantity of this room type available
        if (selectedRoom.quantity_available < numRooms) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ 
            error: `Only ${selectedRoom.quantity_available} unit(s) of "${selectedRoom.room_type_name}" available, but you requested ${numRooms}. Please select fewer rooms or choose another type.`
          });
        }

        // Check 3: Check how many of this specific room type are already booked for overlapping dates
        const [bookedRoomTypes] = await connection.query(
          `SELECT SUM(rooms) as booked_rooms
           FROM hotel_bookings
           WHERE hotel_id = ?
             AND room_id = ?
             AND status IN ('confirmed', 'pending')
             AND check_in < ?
             AND check_out > ?
             AND (archived = 0 AND (expires_at IS NULL OR expires_at > NOW()))
           FOR UPDATE`,
          [hotel_id, room_id, check_out, check_in]
        );

        const bookedRoomsOfType = bookedRoomTypes[0]?.booked_rooms || 0;
        const availableRoomsOfType = selectedRoom.quantity_available - bookedRoomsOfType;

        if (availableRoomsOfType < numRooms) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ 
            error: `Only ${availableRoomsOfType} unit(s) of "${selectedRoom.room_type_name}" are available for your selected dates. Please select different dates or choose another room type.`
          });
        }
      } else {
        // No specific room selected - use original hotel-level availability check
        const [bookings] = await connection.query(
          `SELECT SUM(rooms) as booked_rooms
           FROM hotel_bookings
           WHERE hotel_id = ?
             AND status IN ('confirmed', 'pending')
             AND check_in < ?
             AND check_out > ?
             AND (archived = 0 AND (expires_at IS NULL OR expires_at > NOW()))
           FOR UPDATE`,
          [hotel_id, check_out, check_in]
        );

        const bookedRooms = bookings[0]?.booked_rooms || 0;
        const availableRooms = totalRooms - bookedRooms;

        if (availableRooms < numRooms) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ error: 'Not enough rooms available for selected dates' });
        }
      }
    }

    const [result] = await connection.query(
      `INSERT INTO hotel_bookings
        (user_id, hotel_id, hotel_name, hotel_location, price_per_night, currency, check_in, check_out, nights, rooms, guests, special_requests, status, payment_status, payment_method, total_amount, receipt_number, customer_name, customer_email, customer_phone, room_id, room_type_name, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        hotel_id || null,
        hotel_name,
        hotel_location || null,
        price,
        currency,
        check_in,
        check_out,
        nights,
        numRooms,
        numGuests,
        special_requests || null,
        bookingStatus,
        paymentStatus,
        payment_method,
        totalAmount,
        receiptNumber,
        customer_name || null,
        customer_email || null,
        customer_phone || null,
        room_id || null,           // NEW: Room selection (optional)
        selectedRoom?.room_type_name || room_type_name || null,    // Use DB value if available, fall back to param
        pay_now ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      ]
    );

    const bookingId = result.insertId;
    const bookingReference = formatBookingReference(bookingId);
    if (bookingReference) {
      await connection.query(
        'UPDATE hotel_bookings SET booking_reference = ? WHERE booking_id = ?',
        [bookingReference, bookingId]
      );
    }

    const paymentRef = generatePaymentReference();
    const isDeferredPayment = ['bank_transfer', 'pay_at_property'].includes(payment_method);
    const paymentProviderStatus = pay_now ? 'succeeded' : (isDeferredPayment ? 'pending' : 'pending');

    await connection.query(
      `INSERT INTO hotel_payments
        (booking_id, amount, currency, method, provider, status, transaction_reference, card_last4, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId,
        totalAmount,
        currency,
        payment_method,
        isDeferredPayment ? 'manual' : 'simulated',
        paymentProviderStatus,
        paymentRef,
        card_last4 || null,
        pay_now ? new Date() : null
      ]
    );

    const [paymentRows] = await connection.query(
      'SELECT * FROM hotel_payments WHERE booking_id = ? ORDER BY payment_id DESC LIMIT 1',
      [bookingId]
    );
    const paymentRecord = paymentRows[0] || null;

    await connection.commit();
    connection.release();

    const booking = await fetchBooking(bookingId);
    const receipt = mapReceipt(booking, paymentRecord);

    res.status(201).json({ booking, receipt });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Hotel booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getHotelBookings = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM hotel_bookings WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch hotel bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const cancelHotelBooking = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booking = await fetchBooking(req.params.bookingId);
    if (!booking || booking.user_id !== userId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    const checkInDate = new Date(booking.check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate <= today) {
      return res.status(400).json({ error: 'Cannot cancel bookings on or after check-in date' });
    }

    await db.promise().query(
      'UPDATE hotel_bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
      ['cancelled', req.params.bookingId]
    );

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

export const getHotelBookingReceipt = async (req, res) => {
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const booking = await fetchBooking(req.params.bookingId);
    if (!booking || booking.user_id !== userId) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (!['confirmed', 'completed'].includes(booking.status)) {
      return res.status(403).json({ error: 'Receipt is available after confirmation.' });
    }

    const [payments] = await db.promise().query(
      'SELECT * FROM hotel_payments WHERE booking_id = ? ORDER BY payment_id DESC LIMIT 1',
      [booking.booking_id]
    );
    const payment = payments[0] || null;

    const receipt = mapReceipt(booking, payment);
    res.json(receipt);
  } catch (err) {
    console.error('Fetch hotel receipt error:', err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
};
