-- Migration 031: Add booking_id to reviews for per-booking review tracking
-- Allows users to review the same hotel multiple times for different bookings

ALTER TABLE `reviews` 
ADD COLUMN `booking_id` INT(11) NULL DEFAULT NULL AFTER `hotel_id`,
ADD FOREIGN KEY (`booking_id`) REFERENCES `hotel_bookings`(`booking_id`) ON DELETE SET NULL,
ADD INDEX `idx_reviews_booking_id` (`booking_id`);

-- Create a unique constraint on booking_id per user (only for non-null booking_id)
-- This prevents duplicate reviews for the same booking by the same user
-- Note: This is enforced at the application level for NULL booking_ids

-- Update comment
ALTER TABLE `reviews` COMMENT = 'Hotel reviews. Users can review the same hotel multiple times but only once per booking. booking_id tracks which booking the review is for.';
