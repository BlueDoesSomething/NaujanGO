-- Migration 042: Legitimacy & Accreditation fields for business_profiles
-- Owners submit business permit / DOT accreditation / PhilGEPS details (number,
-- expiry, uploaded document). Admin verifies the profile; verified items earn
-- trust badges on hotel cards and full owner-dashboard authorization
-- (permit + DOT-or-PhilGEPS + verified = full; otherwise listing-only).

ALTER TABLE `business_profiles`
  ADD COLUMN `business_permit_no` VARCHAR(150) NULL DEFAULT NULL AFTER `bank_name`,
  ADD COLUMN `business_permit_expiry` DATE NULL DEFAULT NULL AFTER `business_permit_no`,
  ADD COLUMN `business_permit_file` VARCHAR(500) NULL DEFAULT NULL AFTER `business_permit_expiry`,
  ADD COLUMN `dot_no` VARCHAR(150) NULL DEFAULT NULL AFTER `business_permit_file`,
  ADD COLUMN `dot_expiry` DATE NULL DEFAULT NULL AFTER `dot_no`,
  ADD COLUMN `dot_file` VARCHAR(500) NULL DEFAULT NULL AFTER `dot_expiry`,
  ADD COLUMN `philgeps_no` VARCHAR(150) NULL DEFAULT NULL AFTER `dot_file`,
  ADD COLUMN `philgeps_expiry` DATE NULL DEFAULT NULL AFTER `philgeps_no`,
  ADD COLUMN `philgeps_file` VARCHAR(500) NULL DEFAULT NULL AFTER `philgeps_expiry`;
