-- Add room tracking fields to hotel_bookings table
-- This allows bookings to track which specific room type was booked

ALTER TABLE `hotel_bookings` 
ADD COLUMN `room_id` INT NULL AFTER `hotel_id`,
ADD COLUMN `room_type_name` VARCHAR(100) NULL AFTER `hotel_name`,
ADD CONSTRAINT `fk_bookings_room_id` 
  FOREIGN KEY (`room_id`) 
  REFERENCES `rooms`(`room_id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Create index for faster queries on room_id
CREATE INDEX `idx_bookings_room_id` ON `hotel_bookings`(`room_id`);
CREATE INDEX `idx_bookings_room_type` ON `hotel_bookings`(`room_type_name`);

-- Update existing bookings to populate room_type_name if possible
-- (This is safe since old bookings won't have room_id anyway)
