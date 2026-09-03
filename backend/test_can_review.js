import db from './db.js';

async function testCanReview() {
  try {
    // Test the can-review endpoint logic directly
    const userId = 1;
    const hotelId = 3;

    // Get hotel
    const [hotels] = await db.promise().query(
      'SELECT name FROM hotels WHERE hotel_id = ?',
      [hotelId]
    );

    console.log('Hotels found:', hotels.length);
    if (hotels.length === 0) {
      console.log('Hotel not found');
      process.exit(0);
    }

    const hotelName = hotels[0].name;
    console.log('Hotel name:', hotelName);

    // Check bookings
    const [bookings] = await db.promise().query(
      `SELECT booking_id FROM hotel_bookings
       WHERE user_id = ?
       AND hotel_name = ?
       AND check_out < CURDATE()
       AND status IN ('confirmed', 'completed')
       LIMIT 1`,
      [userId, hotelName]
    );

    console.log('Bookings found:', bookings.length);
    if (bookings.length === 0) {
      console.log('No completed bookings found');
      
      // Debug: show all bookings for this user
      const [allBookings] = await db.promise().query(
        `SELECT booking_id, hotel_name, check_out, status FROM hotel_bookings WHERE user_id = ?`,
        [userId]
      );
      console.log('All bookings for user:', allBookings);
    }

    // Check existing reviews
    const [existingReviews] = await db.promise().query(
      'SELECT review_id FROM reviews WHERE user_id = ? AND hotel_id = ?',
      [userId, hotelId]
    );

    console.log('Existing reviews:', existingReviews.length);

    if (bookings.length > 0 && existingReviews.length === 0) {
      console.log('User CAN review!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testCanReview();
