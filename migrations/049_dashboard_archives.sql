-- Back up first and select the backend database. Run this entire script.
-- Dashboard visibility is personal; business/financial rows are never deleted
-- or updated by this migration. Legacy archived flags remain the initial default.
CREATE TABLE IF NOT EXISTS dashboard_record_archives (
  user_id INT NOT NULL,
  record_type ENUM('booking', 'payment') NOT NULL,
  record_id INT NOT NULL,
  archived TINYINT(1) NOT NULL DEFAULT 1,
  archived_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, record_type, record_id),
  KEY idx_archive_record (record_type, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- No cascading foreign keys: keep the audit trail after content/account cleanup.
CREATE TABLE IF NOT EXISTS dashboard_archive_audit (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id INT NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  record_type VARCHAR(20) NOT NULL,
  record_id INT NOT NULL,
  action VARCHAR(20) NOT NULL,
  reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_archive_audit_record (record_type, record_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
