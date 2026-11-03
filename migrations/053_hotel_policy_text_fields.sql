-- Migration 053: owner-editable wording for the three standard booking-policy lines
-- payment_terms_text       : payment terms line shown in the booking policy card
-- modification_policy_text : modification / rebooking line
-- noshow_policy_text       : no-show line
-- NULL = show the platform default wording (LanguageContext policy_* keys), so
-- existing hotels keep displaying exactly what they display today.
-- Back up first and select the backend database before executing this script.
-- Idempotent: adds only absent columns, including after a partial deployment.
-- The backend also adds these at startup when it has ALTER rights.

SELECT DATABASE() AS target_database;

SELECT IF(COUNT(*) = 0,
  'SELECT ''Hotel policy text columns already present'' AS migration_status',
  CONCAT('ALTER TABLE `hotels` ', GROUP_CONCAT(
    CONCAT('ADD COLUMN `', fields.column_name, '` TEXT NULL')
    ORDER BY fields.position SEPARATOR ', '
  ))
) INTO @hotel_policy_text_sql
FROM (
  SELECT 1 AS position, 'payment_terms_text' AS column_name
  UNION ALL SELECT 2, 'modification_policy_text'
  UNION ALL SELECT 3, 'noshow_policy_text'
) AS fields
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns AS existing
  WHERE existing.table_schema = DATABASE()
    AND existing.table_name = 'hotels'
    AND existing.column_name = fields.column_name
);

PREPARE hotel_policy_text_statement FROM @hotel_policy_text_sql;
EXECUTE hotel_policy_text_statement;
DEALLOCATE PREPARE hotel_policy_text_statement;

SHOW COLUMNS FROM `hotels` WHERE Field IN ('payment_terms_text', 'modification_policy_text', 'noshow_policy_text');
