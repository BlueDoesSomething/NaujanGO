-- Durable private business-verification documents (JPG/PNG/WEBP/PDF, max 6MB).
-- Back up and select the BACKEND database, then run this whole script.
-- Additive/idempotent: does not rewrite profiles, verification, or payments.
-- Missing legacy files cannot be recreated; restore a backup or re-upload.
SELECT DATABASE() AS target_database;

CREATE TABLE IF NOT EXISTS business_documents (
  file_path VARCHAR(300) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  owner_id INT NOT NULL,
  document_field VARCHAR(40) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  byte_length INT UNSIGNED NOT NULL,
  content MEDIUMBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_business_documents_owner (owner_id, document_field)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
