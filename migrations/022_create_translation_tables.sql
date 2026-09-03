-- Translation Tables for Multi-language Support
-- This enables translating all dynamic content from the database

-- ============================================================
-- TABLE: translation_languages
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_languages (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `code` VARCHAR(10) UNIQUE NOT NULL COMMENT 'Language code: en, es, tl, zh, ja, ko, fr, de',
  `name` VARCHAR(50) NOT NULL COMMENT 'Language name in English: English, Spanish, etc.',
  `native_name` VARCHAR(50) NOT NULL COMMENT 'Language name in native: English, Español, Tagalog, etc.',
  `flag` VARCHAR(20) NOT NULL COMMENT 'Flag emoji',
  `is_active` TINYINT(1) DEFAULT 1,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `code_index` (`code`),
  INDEX `is_active_index` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Supported languages for translation';

-- ============================================================
-- TABLE: translation_fields
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_fields (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `table_name` VARCHAR(100) NOT NULL COMMENT 'Original table: attractions, hotels, itineraries, etc.',
  `field_name` VARCHAR(100) NOT NULL COMMENT 'Field name: name, description, content, etc.',
  `display_name` VARCHAR(150) NOT NULL COMMENT 'Human readable: Attraction Name, Hotel Description',
  `field_type` VARCHAR(20) DEFAULT 'text' COMMENT 'text, longtext, json',
  `is_translatable` TINYINT(1) DEFAULT 1,
  `max_length` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `table_field` (`table_name`, `field_name`),
  INDEX `is_translatable_index` (`is_translatable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registry of translatable fields';

-- ============================================================
-- TABLE: translations
-- ============================================================
CREATE TABLE IF NOT EXISTS translations (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `original_table` VARCHAR(100) NOT NULL COMMENT 'attractions, hotels, itineraries, etc.',
  `original_id` INT NOT NULL COMMENT 'ID in original table',
  `field_name` VARCHAR(100) NOT NULL COMMENT 'Field being translated: name, description, content',
  `language_id` INT NOT NULL COMMENT 'Foreign key to translation_languages',
  `translated_value` LONGTEXT COMMENT 'Translated text or content',
  `is_approved` TINYINT(1) DEFAULT 0 COMMENT 'Whether translation is approved for public display',
  `created_by` INT DEFAULT NULL COMMENT 'User who created translation',
  `approved_by` INT DEFAULT NULL COMMENT 'User who approved translation',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL,
  FOREIGN KEY `fk_language` (`language_id`) REFERENCES translation_languages(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_translation` (`original_table`, `original_id`, `field_name`, `language_id`),
  INDEX `lookup_index` (`original_table`, `original_id`),
  INDEX `language_index` (`language_id`),
  INDEX `approval_index` (`is_approved`),
  FULLTEXT INDEX `search_index` (`translated_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores all translations for database content';

-- ============================================================
-- TABLE: translation_cache
-- ============================================================
CREATE TABLE IF NOT EXISTS translation_cache (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `cache_key` VARCHAR(255) UNIQUE NOT NULL COMMENT 'Hash of query parameters',
  `original_table` VARCHAR(100) NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `cached_data` LONGTEXT NOT NULL COMMENT 'JSON of merged translated data',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL COMMENT 'Cache expiration time',
  INDEX `cache_key_index` (`cache_key`),
  INDEX `expiry_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cache layer for translated queries';

-- ============================================================
-- Initialize Default Languages
-- ============================================================
INSERT INTO translation_languages (code, name, native_name, flag, is_active, is_default) VALUES
('en', 'English', 'English', '🇺🇸', 1, 1),
('es', 'Spanish', 'Español', '🇪🇸', 1, 0),
('tl', 'Tagalog', 'Tagalog', '🇵🇭', 1, 0),
('zh', 'Chinese', '中文', '🇨🇳', 1, 0),
('ja', 'Japanese', '日本語', '🇯🇵', 1, 0),
('ko', 'Korean', '한국어', '🇰🇷', 1, 0),
('fr', 'French', 'Français', '🇫🇷', 1, 0),
('de', 'German', 'Deutsch', '🇩🇪', 1, 0)
ON DUPLICATE KEY UPDATE is_active=1;

-- ============================================================
-- Register Translatable Fields
-- ============================================================
INSERT INTO translation_fields (table_name, field_name, display_name, field_type, is_translatable) VALUES
-- Attractions
('attractions', 'name', 'Attraction Name', 'text', 1),
('attractions', 'description', 'Attraction Description', 'longtext', 1),
('attractions', 'category', 'Category', 'text', 1),
('attractions', 'best_time', 'Best Time to Visit', 'text', 1),
('attractions', 'travel_tips', 'Travel Tips', 'longtext', 1),

-- Hotels
('hotels', 'name', 'Hotel Name', 'text', 1),
('hotels', 'description', 'Hotel Description', 'longtext', 1),
('hotels', 'amenities', 'Amenities', 'text', 1),
('hotels', 'special_requests_info', 'Special Requests Info', 'longtext', 1),

-- Itineraries
('itineraries', 'name', 'Itinerary Name', 'text', 1),
('itineraries', 'description', 'Itinerary Description', 'longtext', 1),

-- About Settings
('about_settings', 'overview_text', 'Overview Text', 'longtext', 1),
('about_settings', 'vision_text', 'Vision Text', 'longtext', 1),
('about_settings', 'mission_text', 'Mission Text', 'longtext', 1),

-- Restaurants
('restaurants', 'name', 'Restaurant Name', 'text', 1),
('restaurants', 'description', 'Restaurant Description', 'longtext', 1),
('restaurants', 'cuisine_type', 'Cuisine Type', 'text', 1)

ON DUPLICATE KEY UPDATE is_translatable=1;
