-- Migration: Create hotel_payments table for payment processing
-- This table stores payment transactions for hotel bookings

CREATE TABLE IF NOT EXISTS `hotel_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `currency` varchar(3) DEFAULT 'PHP',
  `method` varchar(50) NOT NULL COMMENT 'card, gcash, paypal, bank_transfer, pay_at_property',
  `provider` varchar(100) DEFAULT NULL COMMENT 'Payment gateway provider (stripe, gcash, paypal, etc)',
  `status` enum('pending','processing','succeeded','failed','refunded','cancelled') DEFAULT 'pending',
  `transaction_reference` varchar(255) DEFAULT NULL COMMENT 'Unique transaction reference from provider',
  `card_last4` varchar(4) DEFAULT NULL COMMENT 'Last 4 digits of card (if card payment)',
  `provider_response` json DEFAULT NULL COMMENT 'Full response from payment provider',
  `paid_at` timestamp NULL DEFAULT NULL,
  `refund_amount` decimal(10, 2) DEFAULT NULL,
  `refund_reference` varchar(255) DEFAULT NULL,
  `refund_reason` text DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_transaction_reference` (`transaction_reference`),
  KEY `idx_status` (`status`),
  KEY `idx_paid_at` (`paid_at`),
  CONSTRAINT `fk_payment_booking` FOREIGN KEY (`booking_id`) REFERENCES `hotel_bookings` (`booking_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_method` ON `hotel_payments` (`method`);
CREATE INDEX IF NOT EXISTS `idx_provider` ON `hotel_payments` (`provider`);

-- Ensure hotel_bookings table has all necessary payment-related columns
ALTER TABLE `hotel_bookings` 
  MODIFY COLUMN `payment_method` varchar(50) DEFAULT 'pay_at_property',
  MODIFY COLUMN `payment_status` enum('unpaid','pending','paid','failed','refunded') DEFAULT 'unpaid';

-- Add hotel_id column to hotel_bookings if it doesn't exist
ALTER TABLE `hotel_bookings` 
  ADD COLUMN IF NOT EXISTS `hotel_id` int(11) DEFAULT NULL AFTER `booking_id`,
  ADD INDEX IF NOT EXISTS `idx_hotel_id` (`hotel_id`);

-- Add foreign key constraint if hotels table exists
-- Uncomment the line below if you want to enforce referential integrity
-- ALTER TABLE `hotel_bookings` ADD CONSTRAINT `fk_booking_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`) ON DELETE SET NULL;

COMMIT;
