-- Migration: 019_cleanup_old_about_tables.sql
-- Purpose: Remove old About page table structure before implementing hardcoded approach
-- Removes: Old complex section management, versioning, languages, audit logs

-- Disable foreign key checks temporarily to avoid constraint errors
SET FOREIGN_KEY_CHECKS = 0;

-- Drop old tables (order matters - drop dependent tables first)
DROP TABLE IF EXISTS `about_audit_log`;
DROP TABLE IF EXISTS `about_versions`;
DROP TABLE IF EXISTS `about_section_content`;  
DROP TABLE IF EXISTS `about_sections`;
DROP TABLE IF EXISTS `about_languages`;
DROP TABLE IF EXISTS `about_custom_sections`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are gone
SHOW TABLES LIKE 'about_%';

-- Note: We keep about_settings if you want to use it for general settings
