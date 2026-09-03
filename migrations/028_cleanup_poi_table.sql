-- Clean up and remove the consolidated points_of_interest table
-- Run this AFTER migration 027 to verify data consolidation

-- Step 1: Remove POI records that don't have corresponding attractions
DELETE FROM `points_of_interest` 
WHERE `poi_id` NOT IN (
  SELECT `poi_id` FROM `attractions` WHERE `poi_id` IS NOT NULL
);

-- Step 2: Drop the points_of_interest table entirely (no longer needed)
DROP TABLE IF EXISTS `points_of_interest`;

-- Migration 028 complete - points_of_interest table has been removed
-- All data is now consolidated in the attractions table
