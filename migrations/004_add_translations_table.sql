-- Add translations table for storing per-entity localized text
CREATE TABLE IF NOT EXISTS translations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id BIGINT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  locale CHAR(5) NOT NULL,
  text TEXT,
  review_required TINYINT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_translation (entity_type, entity_id, field_name, locale)
);
