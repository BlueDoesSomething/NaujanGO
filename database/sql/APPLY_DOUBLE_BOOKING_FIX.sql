-- Run this SQL in phpMyAdmin or your MySQL client to prevent double-booking

USE naujango;

-- Add composite index for optimized concurrent booking queries
ALTER TABLE hotel_bookings 
ADD INDEX idx_hotel_dates_status (hotel_id, check_in, check_out, status);

-- Verify the index was created
SHOW INDEX FROM hotel_bookings WHERE Key_name = 'idx_hotel_dates_status';
