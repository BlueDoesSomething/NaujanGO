-- Migration 009: Add booking_reference to hotel_bookings
ALTER TABLE `hotel_bookings`
ADD COLUMN IF NOT EXISTS `booking_reference` varchar(20) DEFAULT NULL AFTER `booking_id`;

UPDATE `hotel_bookings`
SET `booking_reference` = CONCAT('HB', LPAD(`booking_id`, 6, '0'))
WHERE `booking_reference` IS NULL;

ALTER TABLE `hotel_bookings`
ADD UNIQUE KEY `uniq_booking_reference` (`booking_reference`);
