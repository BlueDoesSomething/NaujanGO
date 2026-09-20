-- Monthly tourist arrival log for LGU reporting.
-- One row per calendar month. Categories: foreign/local (origin) and male/female (sex).
-- Validation: male_count + female_count should equal foreign_count + local_count.
CREATE TABLE IF NOT EXISTS `tourist_arrivals` (
  `arrival_id` int(11) NOT NULL AUTO_INCREMENT,
  `arrival_month` date NOT NULL COMMENT 'First day of the reported month, e.g. 2025-08-01',
  `foreign_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Foreign tourists (international arrivals)',
  `local_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Local tourists (domestic arrivals)',
  `male_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Male tourists',
  `female_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Female tourists',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`arrival_id`),
  UNIQUE KEY `uk_arrival_month` (`arrival_month`),
  KEY `idx_arrival_origin` (`foreign_count`, `local_count`),
  KEY `idx_arrival_sex` (`male_count`, `female_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Monthly tourist arrivals tracked for LGU reporting';