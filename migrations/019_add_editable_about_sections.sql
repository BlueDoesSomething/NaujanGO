-- Migration: 019_add_editable_about_sections.sql
-- Purpose: Create table for admin-editable About page sections (Mayors, Vice Mayors)
-- Allows admins to customize specific About sections with pictures and custom data

CREATE TABLE IF NOT EXISTS `about_editable_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_key` VARCHAR(50) NOT NULL UNIQUE COMMENT 'mayors or viceMayors',
  `section_name` VARCHAR(100) NOT NULL,
  `content` JSON NOT NULL COMMENT 'Array of personnel with name, years, image',
  `updated_by` INT COMMENT 'User ID who last updated',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section_key (section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Admin-editable About page sections';
