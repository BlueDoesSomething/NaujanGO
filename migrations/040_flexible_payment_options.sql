-- Migration 037: flexible payment options (reservation fee / half / full)
-- payment_option  : which option the guest chose at booking time
-- amount paid     : derived from SUM(hotel_payments.amount WHERE status='succeeded')
-- balance due     : total_amount - amount paid
-- 'partial'       : at least one payment succeeded but balance remains

ALTER TABLE `hotels`
  ADD COLUMN IF NOT EXISTS `reservation_fee` DECIMAL(10,2) NULL DEFAULT NULL AFTER `allowed_payment_methods`;

ALTER TABLE `hotel_bookings`
  ADD COLUMN IF NOT EXISTS `payment_option` ENUM('reservation','half','full') NOT NULL DEFAULT 'full' AFTER `payment_method`;

ALTER TABLE `hotel_bookings`
  MODIFY COLUMN `payment_status` ENUM('unpaid','pending','partial','paid','failed','refunded') DEFAULT 'unpaid';
