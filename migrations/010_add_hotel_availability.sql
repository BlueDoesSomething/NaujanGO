-- Migration 010: Add room availability tracking to hotels
ALTER TABLE `hotels`
ADD COLUMN IF NOT EXISTS `rooms_total` int(11) DEFAULT 10 AFTER `rating`,
ADD COLUMN IF NOT EXISTS `rooms_available` int(11) DEFAULT 10 AFTER `rooms_total`;

UPDATE `hotels`
SET rooms_total = COALESCE(rooms_total, 10),
    rooms_available = COALESCE(rooms_available, rooms_total, 10)
WHERE rooms_total IS NULL OR rooms_available IS NULL;

ALTER TABLE `hotels`
ADD INDEX IF NOT EXISTS `idx_rooms_available` (`rooms_available`);
