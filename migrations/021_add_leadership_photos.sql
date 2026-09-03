-- Migration: Add leadership photo URLs to about_settings
-- Description: Adds photo_url fields for mayor and vice mayor photos
-- Date: 2024

ALTER TABLE about_settings 
ADD COLUMN IF NOT EXISTS current_mayor_photo_url VARCHAR(500) NULL DEFAULT NULL AFTER current_mayor_term,
ADD COLUMN IF NOT EXISTS current_vice_mayor_photo_url VARCHAR(500) NULL DEFAULT NULL AFTER current_vice_mayor_term;

-- Add index for faster queries
ALTER TABLE about_settings 
ADD INDEX idx_mayor_photos (current_mayor_photo_url, current_vice_mayor_photo_url);

-- Log the migration
INSERT INTO schema_version (version, description, executed_at) 
VALUES (21, 'Add leadership photo URLs to about_settings', NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();
