-- Room policy / detail fields (migration 043)
-- The owner Room Management form collects these but the rooms table had no
-- columns for them, so values were silently dropped on save.
-- NOTE: backend/utils/dbSchema.js applies the same changes automatically on
-- boot (ensureRoomFieldsSchema), so this file is the hand-run reference.

ALTER TABLE `rooms`
  ADD COLUMN `bed_type` VARCHAR(50) NULL DEFAULT NULL AFTER `room_type_name`,
  ADD COLUMN `check_in_time` TIME NOT NULL DEFAULT '14:00' AFTER `quantity_available`,
  ADD COLUMN `check_out_time` TIME NOT NULL DEFAULT '11:00' AFTER `check_in_time`,
  ADD COLUMN `smoking_allowed` TINYINT(1) NOT NULL DEFAULT 0 AFTER `check_out_time`,
  ADD COLUMN `pets_allowed` TINYINT(1) NOT NULL DEFAULT 0 AFTER `smoking_allowed`,
  ADD COLUMN `events_allowed` TINYINT(1) NOT NULL DEFAULT 0 AFTER `pets_allowed`,
  ADD COLUMN `room_features` TEXT NULL DEFAULT NULL AFTER `amenities`;
