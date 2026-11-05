-- Monthly establishment arrivals submitted by owners and reviewed by admins.
-- Additive only: does not change legacy tourist_arrivals, bookings or payments.
-- Back up first and select the backend database before running this migration.
-- No cascading foreign keys: submitted reporting history must survive account
-- or property removal. Access is checked against current hotel ownership.
CREATE TABLE IF NOT EXISTS tourism_arrival_reports (
  report_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  hotel_id INT NOT NULL,
  property_name VARCHAR(255) NOT NULL,
  arrival_month DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  resident_male INT UNSIGNED NULL,
  resident_female INT UNSIGNED NULL,
  local_male INT UNSIGNED NULL,
  local_female INT UNSIGNED NULL,
  foreigner_male INT UNSIGNED NULL,
  foreigner_female INT UNSIGNED NULL,
  notes TEXT NULL,
  revision INT NOT NULL DEFAULT 0,
  lock_version INT NOT NULL DEFAULT 1,
  created_by INT NOT NULL,
  submitted_by INT NULL,
  submitted_at DATETIME NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  review_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_property_month (hotel_id, arrival_month),
  KEY idx_arrival_review (arrival_month, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tourism_arrival_report_revisions (
  revision_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  revision INT NOT NULL,
  property_name VARCHAR(255) NOT NULL,
  resident_male INT UNSIGNED NOT NULL,
  resident_female INT UNSIGNED NOT NULL,
  local_male INT UNSIGNED NOT NULL,
  local_female INT UNSIGNED NOT NULL,
  foreigner_male INT UNSIGNED NOT NULL,
  foreigner_female INT UNSIGNED NOT NULL,
  notes TEXT NULL,
  submitted_by INT NOT NULL,
  submitted_at DATETIME NOT NULL,
  decision VARCHAR(16) NOT NULL DEFAULT 'submitted',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  review_note TEXT NULL,
  UNIQUE KEY uq_report_revision (report_id, revision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
