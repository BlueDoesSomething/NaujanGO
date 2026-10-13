import db from '../db.js';

// Review moderation is a soft hide: `reviews.moderated` = 0 removes a review
// from public listings without destroying the row, the owner's reply or the
// helpful count. `moderated` is base schema, so no migration is required.
//
// Every public review query filters `AND moderated = 1`, so hiding a review
// corrects the public average automatically. The one exception is the stored
// `hotels.rating` column, which is only kept current by an AFTER INSERT
// trigger and is used to ORDER the hotel listings, so it is recomputed here.
//
// Admins may moderate any review. Owners may only moderate reviews on hotels
// they own through `hotel_owners`; attraction reviews have no owner, so they
// are out of reach for owners.

export const setReviewModerated = async ({ reviewId, moderator, moderated }) => {
  const isAdmin = moderator.role === 'admin';

  const [rows] = await db.promise().query(
    'SELECT review_id, hotel_id, attraction_id FROM reviews WHERE review_id = ?',
    [reviewId]
  );

  if (rows.length === 0) {
    return { status: 404, body: { error: 'Review not found' } };
  }

  const review = rows[0];

  if (!isAdmin) {
    if (review.hotel_id == null) {
      return { status: 403, body: { error: 'You do not have permission to moderate this review' } };
    }

    const [owned] = await db.promise().query(
      `SELECT ho.hotel_id
       FROM hotel_owners ho
       WHERE ho.hotel_id = ? AND ho.user_id = ?`,
      [review.hotel_id, moderator.user_id]
    );

    if (owned.length === 0) {
      return { status: 403, body: { error: 'You do not have permission to moderate this review' } };
    }
  }

  await db.promise().query('UPDATE reviews SET moderated = ? WHERE review_id = ?', [
    moderated ? 1 : 0,
    reviewId,
  ]);

  if (review.hotel_id != null) {
    await db.promise().query(
      `UPDATE hotels h
       SET h.rating = (
         SELECT COALESCE(ROUND(AVG(r.rating), 1), 0)
         FROM reviews r
         WHERE r.hotel_id = h.hotel_id AND r.moderated = 1
       )
       WHERE h.hotel_id = ?`,
      [review.hotel_id]
    );
  }

  return {
    status: 200,
    body: {
      success: true,
      review_id: reviewId,
      moderated: !!moderated,
      hotel_id: review.hotel_id,
      attraction_id: review.attraction_id,
    },
  };
};