-- Migration: 007_add_user_roles.sql
-- Description: Add role-based access control with three roles: user, owner, admin
-- Date: 2026-02-04

-- Add role column to users table
ALTER TABLE `users`
ADD COLUMN `role` ENUM('user', 'owner', 'admin') NOT NULL DEFAULT 'user' AFTER `preferred_language`;

-- Add index for better performance on role-based queries
ALTER TABLE `users`
ADD INDEX `idx_role` (`role`);

-- Update existing users to have default 'user' role
UPDATE `users` SET `role` = 'user' WHERE `role` IS NULL;

-- Optional: Set first user as admin (adjust email as needed)
-- UPDATE `users` SET `role` = 'admin' WHERE `email` = 'benedictmadrigal26@gmail.com' LIMIT 1;

-- Create a table to track role changes for audit purposes
CREATE TABLE IF NOT EXISTS `role_changes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `old_role` ENUM('user', 'owner', 'admin'),
  `new_role` ENUM('user', 'owner', 'admin') NOT NULL,
  `changed_by` int(11) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reason` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_changed_by` (`changed_by`),
  CONSTRAINT `fk_role_changes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_changes_changed_by` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create table for hotel ownership (linking owners to hotels)
CREATE TABLE IF NOT EXISTS `hotel_owners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_owner_hotel` (`user_id`, `hotel_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_hotel_id` (`hotel_id`),
  CONSTRAINT `fk_hotel_owners_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hotel_owners_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
