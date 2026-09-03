-- Migration: 033_restore_about_management_tables.sql
-- Purpose: Minimal safe migration to restore the specific About tables
-- This migration focuses only on the missing tables referenced by the
-- controllers: `about_sections`, `about_custom_sections`, and `about_media`.
-- It is safe to run multiple times (uses IF NOT EXISTS / INSERT IGNORE).

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;

-- 1) about_sections: canonical list of section definitions
CREATE TABLE IF NOT EXISTS `about_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_key` VARCHAR(100) NOT NULL UNIQUE,
  `section_name` VARCHAR(150) NOT NULL,
  `section_type` VARCHAR(50) DEFAULT 'text',
  `description` TEXT,
  `display_order` INT DEFAULT 1000,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (section_key),
  INDEX (display_order),
  INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `about_sections` (`section_key`, `section_name`, `section_type`, `description`, `display_order`) VALUES
  ('overview', 'Overview', 'richtext', 'Municipality overview and introduction', 10),
  ('vision_mission', 'Vision & Mission', 'structured_data', 'Vision and mission', 20),
  ('demographics', 'Demographics', 'structured_data', 'Population, area, density', 30);

-- 2) about_custom_sections: legacy, flexible admin sections queried by controller
CREATE TABLE IF NOT EXISTS `about_custom_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_key` VARCHAR(100) NOT NULL UNIQUE,
  `section_name` VARCHAR(255) NOT NULL,
  `section_type` ENUM('text','html','json','markdown') DEFAULT 'html',
  `content` LONGTEXT,
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (section_key),
  INDEX (display_order),
  INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) about_media: media assets attached to sections (references about_sections)
CREATE TABLE IF NOT EXISTS `about_media` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL,
  `media_type` ENUM('image','video','document') DEFAULT 'image',
  `file_url` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255),
  `caption` TEXT,
  `alt_text` VARCHAR(255),
  `display_order` INT DEFAULT 1000,
  `is_active` TINYINT(1) DEFAULT 1,
  `uploaded_by` INT,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (section_id),
  INDEX (display_order),
  FOREIGN KEY (section_id) REFERENCES about_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;

-- End of migration