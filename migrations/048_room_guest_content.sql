-- Optional per-room Perfect For and Common Questions content.
-- Back up first, select the BACKEND database, and execute this whole script.
-- Idempotent: adds only absent columns; no sample content or bookings are changed.
-- The backend also applies these additions at startup when it has ALTER rights.

SELECT DATABASE() AS target_database;

SELECT IF(COUNT(*) = 0,
  'SELECT ''Room guest content columns already present'' AS migration_status',
  CONCAT('ALTER TABLE `rooms` ', GROUP_CONCAT(
    CONCAT('ADD COLUMN `', fields.column_name, '` TEXT NULL')
    ORDER BY fields.position SEPARATOR ', '
  ))
) INTO @room_guest_content_sql
FROM (
  SELECT 1 AS position, 'perfect_for' AS column_name
  UNION ALL SELECT 2, 'common_questions'
) AS fields
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns AS existing
  WHERE existing.table_schema = DATABASE()
    AND existing.table_name = 'rooms'
    AND existing.column_name = fields.column_name
);

PREPARE room_guest_content_statement FROM @room_guest_content_sql;
EXECUTE room_guest_content_statement;
DEALLOCATE PREPARE room_guest_content_statement;

SHOW COLUMNS FROM `rooms` WHERE Field IN ('perfect_for', 'common_questions');
