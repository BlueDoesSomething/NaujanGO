-- Additive and idempotent. Run on the backend database after taking a backup.
-- Existing bookings, prices, payments and policy snapshots are not rewritten.
SELECT DATABASE() AS target_database;

SELECT IF(COUNT(*) = 0, 'SELECT 1', CONCAT('ALTER TABLE `hotels` ', GROUP_CONCAT(
  CONCAT('ADD COLUMN `', fields.name, '` ', fields.definition) SEPARATOR ', '
))) INTO @stay_sql
FROM (SELECT 'allowed_payment_options' AS name, 'TEXT NULL' AS definition) AS fields
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = DATABASE() AND c.table_name = 'hotels' AND c.column_name = fields.name);
PREPARE stay_statement FROM @stay_sql;
EXECUTE stay_statement;
DEALLOCATE PREPARE stay_statement;

SELECT IF(COUNT(*) = 0, 'SELECT 1', CONCAT('ALTER TABLE `rooms` ', GROUP_CONCAT(
  CONCAT('ADD COLUMN `', fields.name, '` ', fields.definition) SEPARATOR ', '
))) INTO @stay_sql
FROM (SELECT 'hourly_rates' AS name, 'TEXT NULL' AS definition) AS fields
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = DATABASE() AND c.table_name = 'rooms' AND c.column_name = fields.name);
PREPARE stay_statement FROM @stay_sql;
EXECUTE stay_statement;
DEALLOCATE PREPARE stay_statement;

SELECT IF(COUNT(*) = 0, 'SELECT 1', CONCAT('ALTER TABLE `hotel_bookings` ', GROUP_CONCAT(
  CONCAT('ADD COLUMN `', fields.name, '` ', fields.definition) SEPARATOR ', '
))) INTO @stay_sql
FROM (
  SELECT 'check_in_at' AS name, 'DATETIME NULL' AS definition
  UNION ALL SELECT 'check_out_at', 'DATETIME NULL'
  UNION ALL SELECT 'stay_duration_hours', 'SMALLINT UNSIGNED NULL'
  UNION ALL SELECT 'stay_rate', 'DECIMAL(10,2) NULL'
) AS fields
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = DATABASE() AND c.table_name = 'hotel_bookings' AND c.column_name = fields.name);
PREPARE stay_statement FROM @stay_sql;
EXECUTE stay_statement;
DEALLOCATE PREPARE stay_statement;
