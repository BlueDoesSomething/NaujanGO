-- Consolidate attractions and points_of_interest into unified map markers system
-- This eliminates data duplication and simplifies map queries

-- Step 1: Add category column to attractions table if not exists
ALTER TABLE `attractions` 
ADD COLUMN `category` VARCHAR(100) DEFAULT 'attraction' AFTER `municipality`,
ADD COLUMN `poi_id` INT UNIQUE NULL AFTER `id`;

-- Step 2: Migrate POI data that doesn't already exist in attractions
INSERT INTO `attractions` 
  (`poi_id`, `name`, `description`, `category`, `latitude`, `longitude`, `created_at`)
SELECT 
  `poi_id`, 
  `name`, 
  `description`, 
  `category`, 
  `latitude`, 
  `longitude`, 
  `created_at`
FROM `points_of_interest`
WHERE `name` NOT IN 
  (SELECT `name` FROM `attractions` WHERE `name` IS NOT NULL)
ON DUPLICATE KEY UPDATE 
  `poi_id` = VALUES(`poi_id`);

-- Step 3: Update reviews table to use attractions.id instead of poi_id
-- First, map old poi_id to new attractions.id
ALTER TABLE `reviews`
ADD COLUMN `attraction_id` INT NULL AFTER `poi_id`,
ADD CONSTRAINT `fk_reviews_attraction_id` 
  FOREIGN KEY (`attraction_id`) 
  REFERENCES `attractions`(`id`) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- Update attraction_id based on poi_id mapping
UPDATE `reviews` r
LEFT JOIN `attractions` a ON a.`poi_id` = r.`poi_id`
SET r.`attraction_id` = a.`id`
WHERE r.`poi_id` IS NOT NULL AND a.`id` IS NOT NULL;

-- Step 4: Add index for faster lookups
CREATE INDEX `idx_attractions_category` ON `attractions`(`category`);
CREATE INDEX `idx_attractions_coordinates` ON `attractions`(`latitude`, `longitude`);

-- Migration 027 complete - attractions table now contains all attractions and POIs
-- Next: Run migration 028 to clean up and drop the points_of_interest table
