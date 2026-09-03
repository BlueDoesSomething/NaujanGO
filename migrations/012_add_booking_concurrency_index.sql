-- Migration: Add composite index to prevent double-booking race conditions
-- This index optimizes the overlapping booking check query

ALTER TABLE hotel_bookings 
ADD INDEX idx_hotel_dates_status (hotel_id, check_in, check_out, status);

-- This composite index improves performance for:
-- 1. Checking room availability by hotel_id
-- 2. Finding overlapping date ranges (check_in, check_out)
-- 3. Filtering by booking status
