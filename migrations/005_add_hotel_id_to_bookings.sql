-- Migration 005: Add hotel_id column to hotel_bookings table
-- This allows direct linking to hotels table and enables easier reviews

-- Add hotel_id column (nullable initially to allow existing records)
ALTER TABLE hotel_bookings 
ADD COLUMN hotel_id INT NULL AFTER user_id;

-- Try to populate hotel_id by matching hotel_name with hotels table
UPDATE hotel_bookings hb
INNER JOIN hotels h ON hb.hotel_name = h.name
SET hb.hotel_id = h.hotel_id
WHERE hb.hotel_id IS NULL;

-- Add index for performance
ALTER TABLE hotel_bookings
ADD INDEX idx_hotel_id (hotel_id);

-- Note: We keep hotel_id nullable because:
-- 1. Some bookings may reference hotels not in the hotels table
-- 2. Existing bookings need backward compatibility
-- 3. hotel_name remains the source of truth for historical records
