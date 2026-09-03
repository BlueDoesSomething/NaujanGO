-- Migration: add customer-entered reference confirmation fields for GCash/InstaPay flow

ALTER TABLE `hotel_payments`
  ADD COLUMN IF NOT EXISTS `customer_reference_number` varchar(64) DEFAULT NULL AFTER `transaction_reference`,
  ADD COLUMN IF NOT EXISTS `reference_submitted_at` timestamp NULL DEFAULT NULL AFTER `customer_reference_number`,
  ADD COLUMN IF NOT EXISTS `reference_status` enum('not_required','pending','verified','rejected') NOT NULL DEFAULT 'not_required' AFTER `reference_submitted_at`,
  ADD COLUMN IF NOT EXISTS `reference_notes` text DEFAULT NULL AFTER `reference_status`,
  ADD COLUMN IF NOT EXISTS `verified_by` int(11) DEFAULT NULL AFTER `reference_notes`,
  ADD COLUMN IF NOT EXISTS `verified_at` timestamp NULL DEFAULT NULL AFTER `verified_by`;

CREATE INDEX IF NOT EXISTS `idx_hotel_payments_reference_status` ON `hotel_payments` (`reference_status`);
CREATE INDEX IF NOT EXISTS `idx_hotel_payments_customer_reference` ON `hotel_payments` (`customer_reference_number`);

-- Mark existing GCash pending/processing rows as awaiting reference confirmation.
UPDATE `hotel_payments`
SET `reference_status` = 'pending'
WHERE `method` = 'gcash'
  AND `status` IN ('pending', 'processing')
  AND (`reference_status` = 'not_required' OR `reference_status` IS NULL);
