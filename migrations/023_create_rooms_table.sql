-- Create rooms table for hotel room types and inventory
CREATE TABLE IF NOT EXISTS `rooms` (
  `room_id` int(11) NOT NULL AUTO_INCREMENT,
  `hotel_id` int(11) NOT NULL,
  `room_type_name` varchar(100) NOT NULL COMMENT 'e.g., Standard Room, Deluxe Room, Suite',
  `description` text DEFAULT NULL,
  `capacity` int(11) NOT NULL COMMENT 'Number of people the room can accommodate',
  `room_size_sqm` decimal(8,2) DEFAULT NULL COMMENT 'Room size in square meters',
  `price_per_night` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'PHP',
  `quantity_available` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of rooms of this type available',
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of amenities specific to this room type',
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of image URLs',
  `primary_image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`room_id`),
  KEY `hotel_id` (`hotel_id`),
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hotel room types and their details';

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_hotel_active ON rooms(hotel_id, is_active);

-- Create room_inventory table to track availability by date
CREATE TABLE IF NOT EXISTS `room_inventory` (
  `inventory_id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `availability_date` date NOT NULL,
  `available_count` int(11) NOT NULL COMMENT 'Number of available rooms on this date',
  `price_override` decimal(10,2) DEFAULT NULL COMMENT 'Override price for this specific date',
  `is_closed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`inventory_id`),
  KEY `room_id` (`room_id`),
  KEY `availability_date` (`availability_date`),
  UNIQUE KEY `unique_room_date` (`room_id`, `availability_date`),
  FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily inventory and pricing for each room type';
