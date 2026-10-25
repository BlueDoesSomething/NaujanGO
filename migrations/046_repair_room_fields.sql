-- Repair missing Room Management columns (MySQL / MariaDB).
-- In DBeaver, select the BACKEND database (e.g. railway), open a NEW SQL
-- editor, and execute this entire file as a script (Alt+X by default).
-- Back up first: ALTER TABLE implicitly commits in MySQL.
-- Only absent columns are added. Existing room data and bookings are untouched.
-- This can be rerun safely after the server's automatic schema check.

SELECT DATABASE() AS target_database;

SELECT IF(COUNT(*) = 0,
  'SELECT ''Room fields already present'' AS migration_status',
  CONCAT('ALTER TABLE `rooms` ', GROUP_CONCAT(
    CONCAT('ADD COLUMN `', fields.column_name, '` ', fields.definition)
    ORDER BY fields.position SEPARATOR ', '
  ))
) INTO @room_fields_sql
FROM (
  SELECT 1 AS position, 'bed_type' AS column_name,
    'VARCHAR(50) NULL DEFAULT NULL' AS definition
  UNION ALL SELECT 2, 'check_in_time', 'TIME NOT NULL DEFAULT ''14:00:00'''
  UNION ALL SELECT 3, 'check_out_time', 'TIME NOT NULL DEFAULT ''11:00:00'''
  UNION ALL SELECT 4, 'smoking_allowed', 'TINYINT(1) NOT NULL DEFAULT 0'
  UNION ALL SELECT 5, 'pets_allowed', 'TINYINT(1) NOT NULL DEFAULT 0'
  UNION ALL SELECT 6, 'events_allowed', 'TINYINT(1) NOT NULL DEFAULT 0'
  UNION ALL SELECT 7, 'room_features', 'TEXT NULL'
) AS fields
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns AS existing
  WHERE existing.table_schema = DATABASE()
    AND existing.table_name = 'rooms'
    AND existing.column_name = fields.column_name
);

PREPARE room_fields_statement FROM @room_fields_sql;
EXECUTE room_fields_statement;
DEALLOCATE PREPARE room_fields_statement;

SHOW COLUMNS FROM `rooms`;
