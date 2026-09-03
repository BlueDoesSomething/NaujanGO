-- Add booking_reference column to hotel_bookings table
ALTER TABLE hotel_bookings 
ADD COLUMN booking_reference VARCHAR(20) NULL AFTER booking_id,
ADD INDEX idx_booking_reference (booking_reference);

-- Update existing bookings with booking references
UPDATE hotel_bookings 
SET booking_reference = CONCAT('HB', LPAD(booking_id, 6, '0'))
WHERE booking_reference IS NULL;
