-- Back up the backend database first. Additive and idempotent.
-- Business Permit and LGU/Mayor's Permit are one credential: preserve the
-- existing business_permit_* columns. No renaming/backfill or status changes.
SELECT DATABASE() AS target_database;
SET @old_credential_group_concat_max_len = @@SESSION.group_concat_max_len;
SET SESSION group_concat_max_len = 8192;
SELECT IF(COUNT(*) = 0, 'SELECT 1', CONCAT('ALTER TABLE `business_profiles` ', GROUP_CONCAT(
  CONCAT('ADD COLUMN `', fields.name, '` ', fields.definition) SEPARATOR ', '
))) INTO @credential_sql
FROM (
  SELECT 'registration_authority' AS name, 'VARCHAR(10) NULL' AS definition
  UNION ALL SELECT 'registration_no', 'VARCHAR(150) NULL'
  UNION ALL SELECT 'registration_expiry', 'DATE NULL'
  UNION ALL SELECT 'registration_file', 'VARCHAR(500) NULL'
  UNION ALL SELECT 'sanitary_permit_no', 'VARCHAR(150) NULL'
  UNION ALL SELECT 'sanitary_permit_expiry', 'DATE NULL'
  UNION ALL SELECT 'sanitary_permit_file', 'VARCHAR(500) NULL'
  UNION ALL SELECT 'credential_flags', 'TEXT NULL'
) AS fields
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = DATABASE() AND c.table_name = 'business_profiles' AND c.column_name = fields.name);
PREPARE credential_statement FROM @credential_sql;
EXECUTE credential_statement;
DEALLOCATE PREPARE credential_statement;
SET SESSION group_concat_max_len = @old_credential_group_concat_max_len;

CREATE TABLE IF NOT EXISTS business_credential_events (
  event_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  credential_type VARCHAR(40) NOT NULL,
  flagged TINYINT(1) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  actor_id INT NOT NULL,
  version INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_credential_events_profile (profile_id, credential_type, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
