-- ═════════════════════════════════════════════════════════════════════════════════
-- Migration: 018_enhance_about_management.sql
-- Purpose: Create comprehensive About page content management system
-- Adds: Sections, versions, languages, and publishing workflow
-- ═════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. ABOUT_SECTIONS - Organize About page into orderable content blocks
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_key` VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique identifier (overview, vision, demographics, etc.)',
  `section_name` VARCHAR(150) NOT NULL COMMENT 'Display name for this section',
  `section_type` ENUM('text', 'richtext', 'structured_data', 'gallery', 'custom') DEFAULT 'text' COMMENT 'Content type for rendering',
  `description` TEXT COMMENT 'Admin description of section purpose',
  `display_order` INT DEFAULT 1000 COMMENT 'Order when displaying sections (lower = first)',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Whether section appears in public view',
  `is_editable` BOOLEAN DEFAULT TRUE COMMENT 'Whether admins can edit this section',
  `icon_name` VARCHAR(50) COMMENT 'Icon identifier for admin UI',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section_key (section_key),
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='About page section definitions';

-- Seed section definitions
INSERT INTO `about_sections` (`section_key`, `section_name`, `section_type`, `description`, `display_order`, `icon_name`) VALUES
('overview', 'Overview', 'richtext', 'Municipality overview and introduction', 10, 'Globe'),
('vision_mission', 'Vision & Mission', 'structured_data', 'Vision statement and mission points', 20, 'Sparkles'),
('demographics', 'Demographics', 'structured_data', 'Population, area, density, barangays', 30, 'User'),
('governance', 'Governance', 'structured_data', 'Mayor, vice mayor, government structure', 40, 'Users'),
('economy', 'Economy', 'richtext', 'Economic overview and industries', 50, 'TrendingUp'),
('tourism', 'Tourism', 'structured_data', 'Visitor stats, attractions, employment', 60, 'MapPin'),
('culture', 'Culture', 'gallery', 'Cultural heritage and traditions', 70, 'Heart'),
('history', 'History', 'richtext', 'Historical timeline and heritage', 80, 'History'),
('indigenous', 'Indigenous Heritage', 'richtext', 'Indigenous peoples and traditions', 90, 'Users'),
('accomplishments', 'Accomplishments', 'structured_data', 'Achievements and events timeline', 100, 'Trophy'),
('contact', 'Contact Info', 'structured_data', 'Contact details and office information', 110, 'Phone');

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. ABOUT_LANGUAGES - Multi-language content support
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_languages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `language_code` VARCHAR(10) NOT NULL COMMENT 'ISO 639-1 code (en, es, fr, tl, etc.)',
  `language_name` VARCHAR(50) NOT NULL COMMENT 'Display name (English, Spanish, etc.)',
  `is_default` BOOLEAN DEFAULT FALSE COMMENT 'Primary language',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Language available for translation',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_language_code (language_code),
  INDEX idx_is_default (is_default),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Supported languages for About page content';

-- Seed languages
INSERT INTO `about_languages` (`language_code`, `language_name`, `is_default`, `is_active`) VALUES
('en', 'English', TRUE, TRUE),
('es', 'Spanish', FALSE, TRUE),
('fr', 'French', FALSE, TRUE),
('tl', 'Tagalog', FALSE, TRUE),
('ja', 'Japanese', FALSE, TRUE);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. ABOUT_SECTION_CONTENT - Translated content for each section
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_section_content` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL COMMENT 'Reference to about_sections',
  `language_id` INT NOT NULL COMMENT 'Reference to about_languages',
  `content` LONGTEXT COMMENT 'Section content (plain text or JSON)',
  `content_format` ENUM('text', 'json', 'html') DEFAULT 'json' COMMENT 'Content format',
  `is_published` BOOLEAN DEFAULT FALSE COMMENT 'Is this version live?',
  `published_at` TIMESTAMP NULL COMMENT 'When this version was published',
  `published_by` INT COMMENT 'User ID who published',
  `version_number` INT DEFAULT 1 COMMENT 'Version of this content',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_section_language (section_id, language_id),
  FOREIGN KEY (section_id) REFERENCES about_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES about_languages(id) ON DELETE CASCADE,
  INDEX idx_is_published (is_published),
  INDEX idx_version_number (version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Translated content for each About section';

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. ABOUT_VERSIONS - Full version history with rollback capability
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version_number` INT NOT NULL COMMENT 'Sequential version number',
  `version_tag` VARCHAR(100) COMMENT 'User-friendly version name (e.g., "2025-Q1-Update")',
  `content_snapshot` JSON NOT NULL COMMENT 'Complete snapshot of all About content',
  `change_summary` TEXT COMMENT 'Summary of changes in this version',
  `created_by` INT COMMENT 'User ID who made changes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_current` BOOLEAN DEFAULT FALSE COMMENT 'Is this the current live version?',
  `restored_from_version` INT DEFAULT NULL COMMENT 'If restored, which version was it from?',
  INDEX idx_version_number (version_number DESC),
  INDEX idx_is_current (is_current),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='About page version history for rollback';

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. ABOUT_PUBLISH_WORKFLOW - Publishing and scheduling
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_publish_workflow` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `content_key` VARCHAR(150) NOT NULL COMMENT 'Identifies what content (section/language combo)',
  `status` ENUM('draft', 'review_pending', 'approved', 'scheduled', 'published', 'archived') DEFAULT 'draft' COMMENT 'Publishing state',
  `draft_content` LONGTEXT COMMENT 'Current draft content',
  `published_content` LONGTEXT COMMENT 'Currently published content',
  `scheduled_publish_at` DATETIME NULL COMMENT 'When to auto-publish draft',
  `published_at` TIMESTAMP NULL COMMENT 'When content was last published',
  `published_by` INT COMMENT 'User ID who published',
  `review_requested_at` TIMESTAMP NULL COMMENT 'When review was requested',
  `review_requested_by` INT COMMENT 'Who requested review',
  `review_notes` TEXT COMMENT 'Notes during review process',
  `reviewed_at` TIMESTAMP NULL COMMENT 'When review was completed',
  `reviewed_by` INT COMMENT 'Who reviewed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_content_key (content_key),
  INDEX idx_status (status),
  INDEX idx_scheduled_publish_at (scheduled_publish_at),
  INDEX idx_published_at (published_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Publishing workflow with draft/review/publish states';

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. ABOUT_MEDIA - Media files (images, videos) for gallery sections
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_media` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL COMMENT 'Which section this media belongs to',
  `media_type` ENUM('image', 'video', 'document') DEFAULT 'image' COMMENT 'Type of media',
  `file_url` VARCHAR(500) NOT NULL COMMENT 'URL to media file',
  `file_name` VARCHAR(255) NOT NULL COMMENT 'Original file name',
  `file_size` INT COMMENT 'File size in bytes',
  `mime_type` VARCHAR(100) COMMENT 'MIME type (image/jpeg, video/mp4, etc.)',
  `caption` TEXT COMMENT 'Caption or description',
  `alt_text` VARCHAR(255) COMMENT 'Alt text for images',
  `display_order` INT DEFAULT 1000 COMMENT 'Order within section',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Whether to show in public',
  `uploaded_by` INT COMMENT 'User who uploaded',
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES about_sections(id) ON DELETE CASCADE,
  INDEX idx_section_id (section_id),
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Media files for About page sections';

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. ABOUT_SETTINGS (UPDATED) - Add new fields for enhanced management
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `primary_language_id` INT DEFAULT 1 COMMENT 'Current primary language';
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `publication_status` ENUM('draft', 'published') DEFAULT 'published' COMMENT 'Overall publication status';
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `last_updated_by` INT COMMENT 'User ID who last updated';
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `last_published_at` TIMESTAMP NULL COMMENT 'When content was last published';
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `enable_public_comments` BOOLEAN DEFAULT FALSE COMMENT 'Allow public comments on About page';
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `seo_meta_description` VARCHAR(160) COMMENT 'SEO meta description';
ALTER TABLE `about_settings` ADD COLUMN IF NOT EXISTS `seo_keywords` VARCHAR(500) COMMENT 'SEO keywords (comma-separated)';

-- ─────────────────────────────────────────────────────────────────────────────────
-- 8. ABOUT_AUDIT_LOG - Track all changes for compliance
-- ─────────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `about_audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(50) NOT NULL COMMENT 'Action performed (create, update, publish, delete)',
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'What was changed (section, content, media)',
  `entity_id` INT COMMENT 'ID of affected entity',
  `changes` JSON COMMENT 'Details of what changed (before/after)',
  `user_id` INT COMMENT 'User who made the change',
  `ip_address` VARCHAR(45) COMMENT 'IP address of user',
  `user_agent` VARCHAR(500) COMMENT 'Browser/client info',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_entity_type (entity_type),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail of all About page modifications';

-- ═════════════════════════════════════════════════════════════════════════════════
-- Indexes for performance
-- ═════════════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_about_section_content_published ON about_section_content(is_published, section_id);
CREATE INDEX idx_about_versions_current ON about_versions(is_current, created_at DESC);
CREATE INDEX idx_about_publish_workflow_status_key ON about_publish_workflow(status, content_key);
CREATE INDEX idx_about_media_section_order ON about_media(section_id, display_order);
CREATE INDEX idx_about_audit_created ON about_audit_log(created_at DESC, user_id);
