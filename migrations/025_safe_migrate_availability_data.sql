-- SAFE DATA MIGRATION: hotel_availability → room_inventory
-- This migration creates default room entries for each hotel and migrates availability data
-- ⚠️ BACKWARD COMPATIBLE - Keeps existing hotel_availability table intact

-- Step 1: For each hotel, create a default "Standard" room if no rooms exist
-- This ensures existing bookings still work
INSERT IGNORE INTO rooms (hotel_id, room_type_name, description, capacity, room_size_sqm, price_per_night, currency, quantity_available, is_active)
SELECT 
  h.hotel_id,
  'Standard Room' as room_type_name,
  CONCAT('Default room at ', h.name) as description,
  2 as capacity,
  NULL as room_size_sqm,
  h.price_per_night,
  h.currency,
  h.rooms_available as quantity_available,
  CASE WHEN h.is_active = 1 THEN 1 ELSE 0 END as is_active
FROM hotels h
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.hotel_id = h.hotel_id)
  AND h.hotel_id IS NOT NULL;

-- Step 2: Migrate availability data from hotel_availability → room_inventory
-- This preserves all historical availability data
INSERT IGNORE INTO room_inventory (room_id, availability_date, available_count, price_override, is_closed)
SELECT 
  r.room_id,
  ha.availability_date,
  COALESCE(ha.rooms_available, r.quantity_available) as available_count,
  ha.price_override,
  COALESCE(ha.is_closed, 0) as is_closed
FROM hotel_availability ha
INNER JOIN rooms r ON r.hotel_id = ha.hotel_id
WHERE ha.hotel_id IN (SELECT hotel_id FROM hotels);

-- Step 3: Update existing hotel_bookings to point to the default room (backward compatibility)
-- This ensures old bookings still work without room_id
UPDATE hotel_bookings hb
SET hb.room_id = (
  SELECT r.room_id FROM rooms r 
  WHERE r.hotel_id = hb.hotel_id 
  LIMIT 1
)
WHERE hb.room_id IS NULL 
  AND hb.hotel_id IS NOT NULL;

-- Step 4: Update room_type_name in hotel_bookings for reference
UPDATE hotel_bookings hb
SET hb.room_type_name = (
  SELECT r.room_type_name FROM rooms r 
  WHERE r.room_id = hb.room_id 
  LIMIT 1
)
WHERE hb.room_type_name IS NULL 
  AND hb.room_id IS NOT NULL;

-- ✅ RESULT: 
-- - Existing bookings still work (backward compatible)
-- - All hotels now have at least one room type (Standard)
-- - Availability data preserved in room_inventory
-- - Old hotel_availability table remains untouched (view only)
