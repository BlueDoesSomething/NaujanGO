import db from './db.js';

async function checkReviews() {
  try {
    // Check all reviews
    const [allReviews] = await db.promise().query(
      `SELECT review_id, user_id, hotel_id, rating, comment FROM reviews ORDER BY review_id DESC LIMIT 10`
    );

    console.log('All recent reviews:');
    console.log(JSON.stringify(allReviews, null, 2));

    // Check reviews for user 1
    const [userReviews] = await db.promise().query(
      `SELECT review_id, user_id, hotel_id, rating, comment FROM reviews WHERE user_id = 1`
    );

    console.log('\nReviews by user 1:');
    console.log(JSON.stringify(userReviews, null, 2));

    // Check if there are duplicate reviews
    const [duplicates] = await db.promise().query(
      `SELECT user_id, hotel_id, COUNT(*) as count FROM reviews GROUP BY user_id, hotel_id HAVING count > 1`
    );

    console.log('\nDuplicate reviews (same user/hotel):');
    console.log(JSON.stringify(duplicates, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkReviews();
