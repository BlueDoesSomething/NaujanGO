-- Migration 035: Restore enhanced itinerary_attractions columns for timeline, budget, and map features
-- Safe to run multiple times.

SET @db_name = DATABASE();

-- day_number
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'day_number'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `day_number` INT DEFAULT 1 AFTER `order_sequence`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- estimated_cost
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'estimated_cost'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `estimated_cost` DECIMAL(10,2) DEFAULT 0.00 AFTER `estimated_duration`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- duration_minutes
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'duration_minutes'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `duration_minutes` INT DEFAULT 120 AFTER `estimated_cost`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- item_type
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'item_type'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `item_type` VARCHAR(50) DEFAULT ''attraction'' AFTER `day_number`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- custom_name
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'custom_name'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `custom_name` VARCHAR(255) DEFAULT NULL AFTER `item_type`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- custom_location
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'custom_location'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `custom_location` VARCHAR(255) DEFAULT NULL AFTER `custom_name`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- latitude
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'latitude'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `latitude` FLOAT DEFAULT NULL AFTER `custom_location`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- longitude
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'longitude'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `longitude` FLOAT DEFAULT NULL AFTER `latitude`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- priority
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'priority'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `priority` VARCHAR(20) DEFAULT ''medium'' AFTER `longitude`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- weather_dependent
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'weather_dependent'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `weather_dependent` TINYINT(1) DEFAULT 0 AFTER `priority`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- start_time
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'start_time'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `start_time` TIME NULL AFTER `duration_minutes`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- notes
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'notes'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `notes` TEXT NULL AFTER `custom_location`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- cost_category
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'cost_category'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `cost_category` VARCHAR(50) NULL AFTER `estimated_cost`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- actual_cost
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'actual_cost'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `actual_cost` DECIMAL(10,2) DEFAULT 0.00 AFTER `cost_category`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- completed
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'completed'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD COLUMN `completed` TINYINT(1) DEFAULT 0 AFTER `actual_cost`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill defaults for existing rows
UPDATE `itinerary_attractions`
SET `day_number` = COALESCE(`day_number`, 1),
    `duration_minutes` = COALESCE(`duration_minutes`, `estimated_duration`, 120),
    `estimated_cost` = COALESCE(`estimated_cost`, 0.00),
    `priority` = COALESCE(NULLIF(`priority`, ''), 'medium'),
    `weather_dependent` = COALESCE(`weather_dependent`, 0),
    `actual_cost` = COALESCE(`actual_cost`, 0.00),
    `completed` = COALESCE(`completed`, 0);

UPDATE `itinerary_attractions` ia
JOIN `attractions` a ON ia.`attraction_id` = a.`id`
SET ia.`latitude` = COALESCE(ia.`latitude`, a.`latitude`),
    ia.`longitude` = COALESCE(ia.`longitude`, a.`longitude`)
WHERE (ia.`latitude` IS NULL OR ia.`longitude` IS NULL)
  AND a.`latitude` IS NOT NULL
  AND a.`longitude` IS NOT NULL;

-- Add helpful indexes if missing
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND index_name = 'idx_itinerary_day_order'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `idx_itinerary_day_order` ON `itinerary_attractions` (`itinerary_id`, `day_number`, `order_sequence`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND index_name = 'idx_itinerary_cost_category'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `idx_itinerary_cost_category` ON `itinerary_attractions` (`itinerary_id`, `cost_category`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND index_name = 'idx_itinerary_coordinates'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `idx_itinerary_coordinates` ON `itinerary_attractions` (`latitude`, `longitude`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 035 applied successfully' AS message;
