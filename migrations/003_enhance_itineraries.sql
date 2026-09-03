-- Add missing columns to itineraries table

ALTER TABLE `itineraries`
ADD COLUMN `description` TEXT DEFAULT NULL AFTER `name`,
ADD COLUMN `start_date` DATE DEFAULT NULL AFTER `total_time`,
ADD COLUMN `end_date` DATE DEFAULT NULL AFTER `start_date`,
ADD COLUMN `status` VARCHAR(20) DEFAULT 'planning' AFTER `end_date`,
ADD COLUMN `total_budget` DECIMAL(10,2) DEFAULT 0.00 AFTER `total_time`;

-- Update existing records to have default status
UPDATE `itineraries` SET `status` = 'planning' WHERE `status` IS NULL;
