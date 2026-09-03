-- Migration 030: Create Business Profiles Table
-- Stores business information for hotel owners
-- Includes tax ID, bank account, and business address details

CREATE TABLE IF NOT EXISTS `business_profiles` (
  `id` INT(11) PRIMARY KEY AUTO_INCREMENT,
  `owner_id` INT(11) NOT NULL UNIQUE,
  `business_name` VARCHAR(255) DEFAULT NULL,
  `business_email` VARCHAR(255) DEFAULT NULL,
  `business_phone` VARCHAR(20) DEFAULT NULL,
  `business_address` TEXT DEFAULT NULL,
  `tax_id` VARCHAR(100) DEFAULT NULL COMMENT 'Business Tax ID (e.g., BIR TIN for Philippines)',
  `bank_account` VARCHAR(255) DEFAULT NULL COMMENT 'Encrypted bank account number',
  `bank_name` VARCHAR(255) DEFAULT NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When business profile was verified by admin',
  `verification_status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_verification_status` (`verification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE `business_profiles` COMMENT = 'Stores business information for hotel owners including tax ID, bank account, and address details. Bank account should be stored encrypted.';
