-- Migration 037: Ensure itinerary_attractions.id is AUTO_INCREMENT
-- Fixes "Field 'id' doesn't have a default value" on legacy databases where the
-- primary key / AUTO_INCREMENT attribute on id was lost. Safe to run multiple times.

SET @db_name = DATABASE();

-- Step 1: ensure id is the leading column of some index (required by AUTO_INCREMENT)
SET @key_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'id'
    AND seq_in_index = 1
);
SET @sql = IF(@key_exists = 0,
  'ALTER TABLE `itinerary_attractions` ADD UNIQUE KEY `uq_itinerary_attractions_id` (`id`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Step 2: make id AUTO_INCREMENT when it is not already
SET @is_auto = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'itinerary_attractions'
    AND column_name = 'id'
    AND LOWER(EXTRA) LIKE '%auto_increment%'
);
SET @sql = IF(@is_auto = 0,
  'ALTER TABLE `itinerary_attractions` MODIFY `id` INT(11) NOT NULL AUTO_INCREMENT',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 037 applied successfully' AS message;
