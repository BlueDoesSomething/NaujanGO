-- Migration 044: backfill reviews.room_id from the reviewed booking
-- The public Room Details modal shows only room-specific guest quotes, but
-- historic reviews never recorded which room was reviewed.
-- NOTE: backend/utils/dbSchema.js applies the same backfill automatically on
-- boot (ensureReviewRoomIdBackfill), so this file is the hand-run reference.

UPDATE `reviews` r
JOIN `hotel_bookings` hb ON r.`booking_id` = hb.`booking_id`
SET r.`room_id` = hb.`room_id`
WHERE r.`room_id` IS NULL
  AND hb.`room_id` IS NOT NULL;
