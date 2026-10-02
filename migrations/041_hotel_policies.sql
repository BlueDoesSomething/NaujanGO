-- Migration 041: hotel cancellation policies + house rules + balance deadline
-- cancellation_type  : free_until = free cancel until check_in - free_cancellation_days
--                      partial    = same window, then first night charged / rest refunded
--                      non_refundable = no refund at any time
-- free_cancellation_days : cutoff offset in days before check-in (default 1 = until day before)
-- balance_due_days      : days before check-in the remaining balance is due (default 1)
-- policy_snapshot       : JSON frozen on the booking at creation (policy + agreement)
-- Note: plain MySQL syntax (no IF NOT EXISTS). Apply once; ignore duplicate-column
-- errors if the application boot ensure (backend/utils/dbSchema.js) already added them.

ALTER TABLE `hotels`
  ADD COLUMN `cancellation_type` ENUM('free_until','partial','non_refundable') NOT NULL DEFAULT 'free_until',
  ADD COLUMN `free_cancellation_days` INT NULL DEFAULT 1,
  ADD COLUMN `custom_policy_text` TEXT NULL,
  ADD COLUMN `house_rules` TEXT NULL,
  ADD COLUMN `check_in_time` TIME NOT NULL DEFAULT '14:00',
  ADD COLUMN `check_out_time` TIME NOT NULL DEFAULT '12:00',
  ADD COLUMN `balance_due_days` INT NULL DEFAULT 1;

ALTER TABLE `hotel_bookings`
  ADD COLUMN `policy_snapshot` TEXT NULL;
