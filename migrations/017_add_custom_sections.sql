-- Migration: Add custom (editable) about sections table
-- Purpose: Enable dynamic About page section management

CREATE TABLE IF NOT EXISTS `about_custom_sections` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique identifier (e.g. fun_facts, history_overview)',
  `section_name` VARCHAR(255) NOT NULL COMMENT 'Display name (e.g. Fun Facts, History)',
  `section_type` ENUM('text', 'html', 'json', 'markdown') DEFAULT 'html' COMMENT 'Content format type',
  `content` LONGTEXT COMMENT 'Section content (flexible based on type)',
  `display_order` INT DEFAULT 0 COMMENT 'Order in which sections display',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Show/hide section',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_section_key` (`section_key`),
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Flexible, user-managed sections for About page';

-- Default sections
INSERT INTO `about_custom_sections` (`section_key`, `section_name`, `section_type`, `content`, `display_order`) VALUES
('overview', 'Overview', 'html', '<p>Naujan is a municipality in Oriental Mindoro, Philippines. It is located on the eastern coast of the Mindoro island.</p>', 1),
('history', 'History', 'html', '<p>Naujan was established in 1581 as a settlement of the Augustinian friars. The town was named after Naujan Lake, which is the largest lake in Oriental Mindoro.</p>', 2),
('culture', 'Culture & Heritage', 'json', '{
  "description": "Rich cultural heritage and traditions",
  "highlights": [
    "Indigenous Mangyan heritage",
    "Traditional festivals",
    "Local crafts and artwork"
  ]
}', 3),
('governance', 'Governance', 'html', '<p>Naujan operates a local government structure with a Municipal Mayor as the chief executive, assisted by the Sangguniang Bayan (Municipal Council), and barangay officials.</p>', 4),
('fun_facts', 'Fun Facts About Naujan', 'json', '{
  "facts": [
    {
      "title": "Largest Lake in Mindoro",
      "description": "Naujan Lake, the heartland of the municipality, is Oriental Mindoro\'s largest and deepest lake.",
      "icon": "lake"
    },
    {
      "title": "Historical Significance",
      "description": "Founded in 1581 by Augustinian friars, making it one of the oldest settlements in the region.",
      "icon": "history"
    },
    {
      "title": "Mangyan Heritage",
      "description": "Home to indigenous Mangyan communities, rich in traditional culture and craftsmanship.",
      "icon": "community"
    },
    {
      "title": "Agricultural Hub",
      "description": "Known for rice farming, coconut plantations, and fishing industries.",
      "icon": "agriculture"
    },
    {
      "title": "Scenic Beauty",
      "description": "Blessed with natural attractions including mountains, forests, and pristine waters.",
      "icon": "landscape"
    },
    {
      "title": "Warm Community",
      "description": "Known for the hospitality and warmth of its residents toward visitors.",
      "icon": "people"
    }
  ]
}', 5)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
