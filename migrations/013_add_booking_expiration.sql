-- Migration: Add booking expiration and auto-cleanup

-- Add expires_at column to track when unpaid bookings expire
ALTER TABLE hotel_bookings 
ADD COLUMN expires_at TIMESTAMP NULL AFTER updated_at;

-- Set expiration for existing pending unpaid bookings (24 hours from creation)
UPDATE hotel_bookings 
SET expires_at = DATE_ADD(created_at, INTERVAL 24 HOUR)
WHERE status = 'pending' AND payment_status = 'unpaid' AND expires_at IS NULL;

-- Create stored procedure to auto-cancel expired bookings
DELIMITER $$

CREATE PROCEDURE cleanup_expired_bookings()
BEGIN
  UPDATE hotel_bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE status = 'pending' 
    AND payment_status = 'unpaid'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END$$

DELIMITER ;

-- Optional: Create event to run cleanup every hour (requires event scheduler enabled)
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS cleanup_expired_bookings_event
-- ON SCHEDULE EVERY 1 HOUR
-- DO CALL cleanup_expired_bookings();
