-- Migration 011: Add per-day hotel availability calendar
CREATE TABLE IF NOT EXISTS `hotel_availability` (
  `availability_id` INT NOT NULL AUTO_INCREMENT,
  `hotel_id` INT NOT NULL,
  `availability_date` DATE NOT NULL,
  `rooms_available` INT DEFAULT NULL,
  `price_override` DECIMAL(10, 2) DEFAULT NULL,
  `is_closed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`availability_id`),
  UNIQUE KEY `uniq_hotel_date` (`hotel_id`, `availability_date`),
  INDEX `idx_hotel_date` (`hotel_id`, `availability_date`),
  CONSTRAINT `fk_hotel_availability_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`) ON DELETE CASCADE
);
