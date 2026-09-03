-- Migration: Add gender and user_type fields for visitor analytics
-- Purpose: Track visitor demographics (gender, user type: local/resident/foreigner)

-- Add gender column to users table (SKIP - already exists)
-- ALTER TABLE `users`
-- ADD COLUMN `gender` ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say' AFTER `date_of_birth`;

-- Add user_type column to users table (SKIP - already exists)
-- ALTER TABLE `users`
-- ADD COLUMN `user_type` ENUM('local', 'resident', 'foreigner') DEFAULT 'foreigner' AFTER `gender`;

-- Add visit_count to track number of website visits (SKIP - already exists)
-- ALTER TABLE `users`
-- ADD COLUMN `visit_count` INT DEFAULT 0 AFTER `user_type`;

-- Add last_visited_at to track when user last visited (SKIP - already exists)
-- ALTER TABLE `users`
-- ADD COLUMN `last_visited_at` DATETIME NULL AFTER `visit_count`;

-- Create indexes for analytics queries (use IF NOT EXISTS syntax for safety)
CREATE INDEX IF NOT EXISTS `idx_users_gender` ON `users`(`gender`);
CREATE INDEX IF NOT EXISTS `idx_users_user_type` ON `users`(`user_type`);
CREATE INDEX IF NOT EXISTS `idx_users_visit_count` ON `users`(`visit_count`);

-- Update existing users to have a default user_type based on available data
UPDATE `users` 
SET `user_type` = 'local' 
WHERE `user_type` IS NULL AND (`email` LIKE '%@naujan%' OR `email` LIKE '%@mindoro%');
