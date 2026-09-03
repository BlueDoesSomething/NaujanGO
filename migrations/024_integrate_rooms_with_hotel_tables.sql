-- Update existing hotel tables to work with the new rooms system
-- This migration links hotel_bookings and reviews to specific room types

-- Add room_id to hotel_bookings to track which room type was booked
ALTER TABLE hotel_bookings
ADD COLUMN IF NOT EXISTS room_id int(11) DEFAULT NULL AFTER hotel_id,
ADD COLUMN IF NOT EXISTS room_type_name varchar(100) DEFAULT NULL AFTER hotel_name;

-- Add foreign key constraint (will skip if already exists)
-- Using DROP IF EXISTS + ADD pattern for maximum compatibility
ALTER TABLE hotel_bookings DROP FOREIGN KEY IF EXISTS fk_hotel_bookings_room;
ALTER TABLE hotel_bookings ADD CONSTRAINT fk_hotel_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE SET NULL;

-- Add room_id to reviews to specify which room was reviewed
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS room_id int(11) DEFAULT NULL AFTER hotel_id;

-- Add foreign key constraint (will skip if already exists)
ALTER TABLE reviews DROP FOREIGN KEY IF EXISTS fk_reviews_room;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_room FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE SET NULL;

-- Create index for faster queries on room by hotel
CREATE INDEX IF NOT EXISTS idx_rooms_by_hotel ON rooms(hotel_id, is_active);

-- Create index for booking queries by date range and room
CREATE INDEX IF NOT EXISTS idx_bookings_by_room_date ON hotel_bookings(room_id, check_in, check_out);

-- Note: hotel_availability table is now supplemented by room_inventory table
-- You may want to migrate data from hotel_availability to room_inventory for specific rooms
-- For now, both tables can coexist:
-- - hotel_availability: General hotel-level availability (deprecated)
-- - room_inventory: Room-type-specific availability (new, preferred)

-- Optional: Update hotel_bookings.rooms column metadata (currently just counts, now can reference specific rooms)
-- The 'rooms' column now represents quantity of rooms booked of the specific room type
