import db from '../db.js';
import { execute } from '../db.js';
import { getTranslationsForEntities } from '../services/translations.js';
import { getTranslationWithFallback } from '../services/machineTranslate.js';

let hotelsHasImageUrls;
let hotelsHasAllowedPaymentMethods;

const hasImageUrlsColumn = async () => {
  if (hotelsHasImageUrls !== undefined) return hotelsHasImageUrls;
  try {
    const [rows] = await db.promise().query("SHOW COLUMNS FROM hotels LIKE 'image_urls'");
    hotelsHasImageUrls = rows.length > 0;
  } catch (error) {
    hotelsHasImageUrls = false;
  }
  return hotelsHasImageUrls;
};

const hasAllowedPaymentMethodsColumn = async () => {
  if (hotelsHasAllowedPaymentMethods !== undefined) return hotelsHasAllowedPaymentMethods;
  try {
    const [rows] = await db.promise().query("SHOW COLUMNS FROM hotels LIKE 'allowed_payment_methods'");
    hotelsHasAllowedPaymentMethods = rows.length > 0;
  } catch (error) {
    hotelsHasAllowedPaymentMethods = false;
  }
  return hotelsHasAllowedPaymentMethods;
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

// Robust server-side parsing for messy amenity values
const parseAmenitiesServer = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  let v = raw;
  if (typeof v === 'string') {
    // normalize smart quotes
    v = v.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  }

  // Try iterative parse
  for (let i = 0; i < 4; i++) {
    try {
      if (typeof v === 'string') {
        const t = v.trim();
        if (t.startsWith('[') || t.startsWith('{') || t.startsWith('"')) {
          v = JSON.parse(t);
          continue;
        }
      }
      break;
    } catch (e) {
      if (typeof v === 'string') {
        v = v.replace(/\\+/g, '\\').replace(/\"/g, '"').replace(/\\'/g, "'");
        continue;
      }
      break;
    }
  }

  if (Array.isArray(v)) return v;
  if (typeof v === 'object' && v !== null) {
    if (v.name) return [String(v.name)];
    try {
      return Object.values(v).map(x => (typeof x === 'string' ? x : JSON.stringify(x)));
    } catch (e) {
      return [JSON.stringify(v)];
    }
  }

  if (typeof v === 'string') {
    const cleaned = v.replace(/^\[|\]$/g, '').replace(/^['"]+|['"]+$/g, '').trim();
    if (cleaned.includes(',')) return cleaned.split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
    return cleaned ? [cleaned] : [];
  }

  return [];
};

const mapHotelRows = (rows) => rows.map(hotel => {
  let amenities = [];
  let images = [];

  if (hotel.amenities) {
    try {
      amenities = JSON.parse(hotel.amenities);
    } catch (error) {
      amenities = [];
    }
  }

  if (hotel.image_urls) {
    try {
      images = JSON.parse(hotel.image_urls);
    } catch (error) {
      images = [];
    }
  }

  const primaryImage = hotel.image_url || images[0] || null;

  return {
    ...hotel,
    amenities,
    images,
    allowed_payment_methods: parseAllowedPaymentMethods(hotel.allowed_payment_methods),
    image: primaryImage,
    reviewCount: Number(hotel.reviewCount) || 0,
    pricePerNight: (() => {
      const basePrice = parseFloat(hotel.pricePerNight);
      if (Number.isFinite(basePrice) && basePrice > 0) return basePrice;

      const derivedPrice = parseFloat(hotel.derivedPricePerNight);
      return Number.isFinite(derivedPrice) && derivedPrice > 0 ? derivedPrice : 0;
    })(),
    rooms_available: Number(hotel.rooms_available) || 0,
    rooms_total: Number(hotel.rooms_total) || 0,
    rating: parseFloat(hotel.rating) || 0
  };
});

const getHotelPriceExpression = () => `
  COALESCE(
    NULLIF(h.price_per_night, 0),
    (
      SELECT MIN(r.price_per_night)
      FROM rooms r
      WHERE r.hotel_id = h.hotel_id
        AND r.is_active = 1
        AND r.price_per_night IS NOT NULL
    ),
    0
  )
`;

export const getHotels = async (req, res) => {
  let rows = [];
  const language = req.language || 'en';
  try {
    const includeImageUrls = await hasImageUrlsColumn();
    const includeAllowedPaymentMethods = await hasAllowedPaymentMethodsColumn();
    const imageUrlsSelect = includeImageUrls ? 'h.image_urls' : 'NULL as image_urls';
    const paymentMethodsSelect = includeAllowedPaymentMethods ? 'h.allowed_payment_methods' : 'NULL as allowed_payment_methods';
    [rows] = await db.promise().query(
      `SELECT h.hotel_id as id, h.name, h.location, h.description, h.price_per_night as pricePerNight,
              ${getHotelPriceExpression()} as derivedPricePerNight,
              h.currency, h.rating, h.rooms_total, h.rooms_available, h.amenities, h.image_url as image_url, ${imageUrlsSelect}, ${paymentMethodsSelect}, h.map_url as map,
              h.latitude, h.longitude, h.contact_phone as phone, h.contact_email as email,
              COUNT(r.review_id) as reviewCount
       FROM hotels h
       LEFT JOIN reviews r ON h.hotel_id = r.hotel_id AND r.moderated = 1
       WHERE (h.is_active = 1 OR h.is_active IS NULL)
       GROUP BY h.hotel_id
       ORDER BY h.rating DESC, h.name ASC`
    );
    
    // Map rows first to get aliased field names and numeric conversions
    const mappedRows = mapHotelRows(rows);
    
    return res.json({
      success: true,
      data: mappedRows || [],
      language: language
    });
  } catch (error) {
    console.error('Error fetching hotels (primary query):', error);
    try {
      [rows] = await db.promise().query(
        `SELECT hotel_id as id, name, location, description, price_per_night as pricePerNight,
            ${getHotelPriceExpression()} as derivedPricePerNight,
            currency, rating, rooms_total, rooms_available, amenities, image_url as image_url, map_url as map,
                latitude, longitude, contact_phone as phone, contact_email as email
         FROM hotels
         ORDER BY rating DESC, name ASC`
      );
      rows = mapHotelRows(rows);
    } catch (fallbackError) {
      console.error('Error fetching hotels (fallback query):', fallbackError);
      if (fallbackError.code === 'ER_BAD_FIELD_ERROR') {
        try {
          [rows] = await db.promise().query(
            `SELECT hotel_id as id, name, location, description, price_per_night as pricePerNight,
              ${getHotelPriceExpression()} as derivedPricePerNight,
              currency, rating, amenities, image_url as image_url, map_url as map,
                    latitude, longitude, contact_phone as phone, contact_email as email
             FROM hotels
             ORDER BY rating DESC, name ASC`
          );
          rows = mapHotelRows(rows);
        } catch (finalError) {
          console.error('Error fetching hotels (final fallback query):', finalError);
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }
  }

  // Apply translations if non-English locale requested
  let finalData = rows || [];
  if (language && language !== 'en' && finalData.length > 0) {
    const ids = finalData.map(h => h.id);
    const translationsMap = await getTranslationsForEntities('hotels', ids, ['name', 'description'], language);
    
    // Try MT fallback for missing translations
    finalData = await Promise.all(finalData.map(async h => {
      const tr = translationsMap[String(h.id)] || {}; // Convert ID to string for map lookup
      let name = tr.name || await getTranslationWithFallback('hotels', h.id, 'name', language) || h.name;
      let description = tr.description || await getTranslationWithFallback('hotels', h.id, 'description', language) || h.description;
      return {
        ...h,
        name,
        description
      };
    }));
  }

  res.json({
    success: true,
    data: finalData,
    language: language
  });
};

export const getHotelById = async (req, res) => {
  try {
    const language = req.language || 'en';
    const includeImageUrls = await hasImageUrlsColumn();
    const includeAllowedPaymentMethods = await hasAllowedPaymentMethodsColumn();
    const imageUrlsSelect = includeImageUrls ? 'image_urls' : 'NULL as image_urls';
    const paymentMethodsSelect = includeAllowedPaymentMethods ? 'allowed_payment_methods' : 'NULL as allowed_payment_methods';
    const [rows] = await db.promise().query(
      `SELECT hotel_id as id, name, location, description, price_per_night as pricePerNight,
              ${getHotelPriceExpression()} as derivedPricePerNight,
              currency, rating, rooms_total, rooms_available, amenities, image_url as image_url, ${imageUrlsSelect}, ${paymentMethodsSelect}, map_url as map,
              latitude, longitude, contact_phone as phone, contact_email as email
       FROM hotels
       WHERE hotel_id = ? AND (is_active = 1 OR is_active IS NULL)`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    let hotel = mapHotelRows(rows)[0];
    
    // Apply translations if non-English locale requested
    if (language && language !== 'en') {
      const tr = (await getTranslationsForEntities('hotels', [hotel.id], ['name', 'description'], language))[String(hotel.id)] || {}; // Convert ID to string for map lookup
      hotel.name = tr.name || await getTranslationWithFallback('hotels', hotel.id, 'name', language) || hotel.name;
      hotel.description = tr.description || await getTranslationWithFallback('hotels', hotel.id, 'description', language) || hotel.description;
    }

    return res.json(hotel);
  } catch (error) {
    console.error('Error fetching hotel (primary query):', error);
    try {
      const [rows] = await db.promise().query(
        `SELECT hotel_id as id, name, location, description, price_per_night as pricePerNight,
          ${getHotelPriceExpression()} as derivedPricePerNight,
          currency, rating, rooms_total, rooms_available, amenities, image_url as image_url, map_url as map,
                latitude, longitude, contact_phone as phone, contact_email as email
         FROM hotels
         WHERE hotel_id = ?`,
        [req.params.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Hotel not found' });
      }

      return res.json(mapHotelRows(rows)[0]);
    } catch (fallbackError) {
      console.error('Error fetching hotel (fallback query):', fallbackError);
      if (fallbackError.code === 'ER_BAD_FIELD_ERROR') {
        try {
          const [rows] = await db.promise().query(
            `SELECT hotel_id as id, name, location, description, price_per_night as pricePerNight,
              ${getHotelPriceExpression()} as derivedPricePerNight,
              currency, rating, amenities, image_url as image_url, map_url as map,
                    latitude, longitude, contact_phone as phone, contact_email as email
             FROM hotels
             WHERE hotel_id = ?`,
            [req.params.id]
          );

          if (rows.length === 0) {
            return res.status(404).json({ error: 'Hotel not found' });
          }

          return res.json(mapHotelRows(rows)[0]);
        } catch (finalError) {
          console.error('Error fetching hotel (final fallback query):', finalError);
          return res.status(500).json({ error: 'Failed to fetch hotel' });
        }
      }
      return res.status(500).json({ error: 'Failed to fetch hotel' });
    }
  }
};

export const getHotelAvailability = async (req, res) => {
  const { id } = req.params;
  const { check_in, check_out, rooms = 1 } = req.query;

  if (!check_in || !check_out) {
    return res.status(400).json({ error: 'check_in and check_out dates are required' });
  }

  try {
    const [hotel] = await db.promise().query(
      'SELECT rooms_total FROM hotels WHERE hotel_id = ?',
      [id]
    );

    if (hotel.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    const totalRooms = hotel[0].rooms_total || 0;

    const [bookings] = await db.promise().query(
      `SELECT SUM(rooms) as booked_rooms
       FROM hotel_bookings
       WHERE hotel_id = ?
         AND status IN ('confirmed', 'pending')
         AND check_in < ?
         AND check_out > ?`,
      [id, check_out, check_in]
    );

    const bookedRooms = bookings[0]?.booked_rooms || 0;
    const availableRooms = totalRooms - bookedRooms;
    const isAvailable = availableRooms >= parseInt(rooms, 10);

    res.json({
      available: isAvailable,
      total_rooms: totalRooms,
      booked_rooms: bookedRooms,
      available_rooms: availableRooms,
      requested_rooms: parseInt(rooms, 10)
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

export const getHotelReviews = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT r.*, u.username, u.first_name, u.last_name
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.user_id
       WHERE r.hotel_id = ? AND r.moderated = 1
       ORDER BY r.review_date DESC`,
      [req.params.id]
    );
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching hotel reviews:', error);
    res.json([]);
  }
};

export const getCanReviewHotel = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const hotelId = req.params.id;
    const bookingId = req.query.booking_id;

    if (!userId) {
      return res.json({ canReview: false, reason: 'Not logged in' });
    }

    if (!hotelId) {
      return res.status(400).json({ canReview: false, reason: 'Hotel ID is required' });
    }

    if (!bookingId) {
      return res.status(400).json({ canReview: false, reason: 'Booking ID is required to review' });
    }

    const [hotels] = await db.promise().query(
      'SELECT name FROM hotels WHERE hotel_id = ?',
      [hotelId]
    );

    if (!hotels || hotels.length === 0) {
      return res.json({ canReview: false, reason: 'Hotel not found' });
    }

    // Verify the booking belongs to this user and hotel
    const [bookings] = await db.promise().query(
      `SELECT booking_id FROM hotel_bookings
       WHERE booking_id = ?
       AND user_id = ?
       AND hotel_id = ?
       AND check_out < CURDATE()
       AND status IN ('confirmed', 'completed')
       LIMIT 1`,
      [bookingId, userId, hotelId]
    );

    if (!bookings || bookings.length === 0) {
      return res.json({
        canReview: false,
        reason: 'You must have a completed booking at this hotel to review it'
      });
    }

    // Check if review already exists for THIS specific booking
    const [existingReviews] = await db.promise().query(
      'SELECT review_id FROM reviews WHERE user_id = ? AND booking_id = ?',
      [userId, bookingId]
    );

    if (existingReviews && existingReviews.length > 0) {
      return res.json({ canReview: false, reason: 'You have already reviewed this booking' });
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ canReview: false, reason: 'Error checking eligibility', error: error.message });
  }
};

export const createHotelReview = async (req, res) => {
  try {
    const { rating, comment, booking_id } = req.body;
    const user_id = req.user.user_id;
    const hotelId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!booking_id) {
      return res.status(400).json({ message: 'Booking ID is required to submit a review' });
    }

    // Verify the booking belongs to this user and hotel
    const [bookings] = await db.promise().query(
      `SELECT booking_id FROM hotel_bookings
       WHERE booking_id = ?
       AND user_id = ?
       AND hotel_id = ?
       AND check_out < CURDATE()
       AND status IN ('confirmed', 'completed')
       LIMIT 1`,
      [booking_id, user_id, hotelId]
    );

    if (!bookings || bookings.length === 0) {
      return res.status(403).json({
        message: 'You can only review hotels you have stayed at. Please complete a booking first.',
        requiresBooking: true
      });
    }

    // Check if review already exists for this specific booking
    const [existingReviews] = await db.promise().query(
      'SELECT review_id FROM reviews WHERE user_id = ? AND booking_id = ?',
      [user_id, booking_id]
    );

    if (existingReviews && existingReviews.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    const inappropriateWords = ['spam', 'fake', 'scam', 'hate', 'awful', 'terrible', 'worst'];
    const isInappropriate = comment && inappropriateWords.some(word =>
      comment.toLowerCase().includes(word)
    );

    const moderated = isInappropriate ? 0 : 1;

    await db.promise().query(
      `INSERT INTO reviews (user_id, hotel_id, booking_id, rating, comment, review_date, moderated)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [user_id, hotelId, booking_id, rating, comment, moderated]
    );

    const message = moderated ? 'Review submitted successfully' : 'Review submitted for moderation';
    res.status(201).json({ message, moderated });
  } catch (error) {
    console.error('Error submitting hotel review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getHotelAverageRating = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT AVG(rating) as average, COUNT(*) as total
       FROM reviews
       WHERE hotel_id = ? AND moderated = 1`,
      [req.params.id]
    );
    res.json({
      average: parseFloat(rows[0].average || 0).toFixed(1),
      total: rows[0].total
    });
  } catch (error) {
    console.error('Error calculating hotel average rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markHotelReviewHelpful = async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE reviews SET helpful_count = helpful_count + 1
       WHERE review_id = ? AND hotel_id = ?`,
      [req.params.reviewId, req.params.id]
    );
    res.json({ message: 'Review marked as helpful' });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all active rooms for a hotel (public endpoint - no auth required)
export const getHotelRooms = async (req, res) => {
  try {
    const language = req.language || 'en';
    const { id } = req.params;

    const [rooms] = await db.promise().query(
      `SELECT room_id, room_type_name, description, capacity, room_size_sqm, 
              price_per_night, currency, quantity_available, amenities, image_urls, 
              primary_image_url, is_active
       FROM rooms
       WHERE hotel_id = ? AND is_active = 1
       ORDER BY price_per_night`,
      [id]
    );

    let formatted = rooms.map(room => ({
      ...room,
      amenities: parseAmenitiesServer(room.amenities),
      image_urls: (() => {
        try {
          if (!room.image_urls) return [];
          if (Array.isArray(room.image_urls)) return room.image_urls;
          if (typeof room.image_urls === 'string') return JSON.parse(room.image_urls);
          return [];
        } catch (e) {
          return [];
        }
      })()
    }));
    
    // Apply translations if non-English locale requested
    if (language && language !== 'en' && formatted && formatted.length > 0) {
      const ids = formatted.map(r => r.room_id);
      const translationsMap = await getTranslationsForEntities('rooms', ids, ['room_type_name', 'description'], language);
      
      formatted = await Promise.all((formatted || []).map(async r => {
        const tr = translationsMap[String(r.room_id)] || {};
        return {
          ...r,
          room_type_name: tr.room_type_name || await getTranslationWithFallback('rooms', r.room_id, 'room_type_name', language) || r.room_type_name,
          description: tr.description || await getTranslationWithFallback('rooms', r.room_id, 'description', language) || r.description
        };
      }));
    }

    res.json(formatted);
  } catch (error) {
    console.error('Get hotel rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};
