-- Create Hotels Table
CREATE TABLE IF NOT EXISTS `hotels` (
  `hotel_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `description` text,
  `price_per_night` decimal(10, 2) NOT NULL,
  `currency` varchar(3) DEFAULT 'PHP',
  `rating` decimal(3, 1) DEFAULT 0,
  `rooms_total` int(11) DEFAULT 10,
  `rooms_available` int(11) DEFAULT 10,
  `amenities` json DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `map_url` varchar(500) DEFAULT NULL,
  `latitude` decimal(10, 8) DEFAULT NULL,
  `longitude` decimal(11, 8) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`hotel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert Sample Hotel Data
INSERT INTO `hotels` (`name`, `location`, `description`, `price_per_night`, `currency`, `rating`, `rooms_total`, `rooms_available`, `amenities`, `image_url`, `map_url`, `latitude`, `longitude`, `contact_phone`, `contact_email`, `is_active`) VALUES

('Naujan Paradise Resort', 'Brgy. Panaytayan, Naujan', 'A luxury resort featuring stunning views of Naujan Lake with world-class amenities and services. Perfect for a relaxing getaway with family and friends.', 3500.00, 'PHP', 4.8, 30, 30,
  JSON_ARRAY('Swimming Pool', 'Restaurant', 'Bar', 'WiFi', 'Air Conditioning', 'Spa', 'Room Service', 'TV'), 
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606700/paradise_resort_yz9qwz.jpg', 
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.123456789!2d121.22!3d12.31!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.310000, 121.220000, '(043) 208-5555', 'info@naijanparadiseresort.com', 1),

('Lake View Hotel', 'Naujan Town Proper', 'Affordable and comfortable hotel with direct views of Naujan Lake. A perfect base for exploring local attractions with friendly staff and quality service.', 1500.00, 'PHP', 4.3, 18, 18,
  JSON_ARRAY('Restaurant', 'Bar', 'WiFi', 'Air Conditioning', 'Room Service', 'TV', 'Parking'),
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606710/lake_view_hotel_ab1cd2.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.456789012!2d121.225!3d12.404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.404000, 121.225000, '(043) 208-3456', 'lakeview@naujango.com', 1),

('Mountain View Inn', 'Brgy. Sulong, Naujan', 'Cozy inn located near Mt. Halcon foothills, ideal for trekkers and nature enthusiasts. Offers budget-friendly accommodations with authentic local hospitality.', 800.00, 'PHP', 4.1, 12, 12,
  JSON_ARRAY('Restaurant', 'WiFi', 'Fan', 'Parking', 'Common Area'),
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606720/mountain_view_inn_cd3ef4.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.789012345!2d121.21!3d12.35!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.350000, 121.210000, '(043) 208-7890', 'info@mountainviewinn.com', 1),

('Naujan Heritage Hotel', 'Naujan Town Plaza Area', 'Historic hotel showcasing the culture and heritage of Naujan with modern amenities. Perfect for cultural tours and heritage exploration.', 2000.00, 'PHP', 4.5, 20, 20,
  JSON_ARRAY('Restaurant', 'Bar', 'WiFi', 'Air Conditioning', 'Heritage Museum', 'Room Service', 'TV', 'Parking'),
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606730/heritage_hotel_ef5gh6.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.012345678!2d121.225!3d12.404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.404000, 121.225000, '(043) 208-2121', 'heritage@naujango.com', 1),

('Lakeside Eco-Lodge', 'Brgy. Igtanim, Naujan', 'Sustainable eco-friendly accommodation promoting environmental conservation. Ideal for eco-tourists and nature lovers seeking an authentic experience.', 1200.00, 'PHP', 4.6, 14, 14,
  JSON_ARRAY('Restaurant', 'WiFi', 'Natural Amenities', 'Outdoor Activities', 'Garden', 'Nature Trails'),
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606740/eco_lodge_gh7ij8.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.345678901!2d121.18!3d12.32!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.320000, 121.180000, '(043) 208-4444', 'ecolodge@naujango.com', 1),

('Naujan Comfort Inn', 'Brgy. Rosario, Naujan', 'Well-maintained comfortable inn offering great value for money. Convenient location with easy access to major attractions and restaurants.', 950.00, 'PHP', 4.2, 16, 16,
  JSON_ARRAY('Restaurant', 'WiFi', 'Air Conditioning', 'Room Service', 'TV', 'Parking'),
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606750/comfort_inn_ij9kl0.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.678901234!2d121.23!3d12.41!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.410000, 121.230000, '(043) 208-1515', 'comfort@naujango.com', 1),

('Lakefront Premium Resort', 'Brgy. Panaytayan, Naujan', 'Premium five-star resort with exclusive amenities and personalized services. Experience luxury living with lakefront access and world-class facilities.', 5000.00, 'PHP', 4.9, 24, 24,
  JSON_ARRAY('Swimming Pool', 'Restaurant', 'Bar', 'Spa', 'WiFi', 'Air Conditioning', 'Room Service', 'TV', 'Gym', 'Concierge'),
  'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606760/premium_resort_kl1mn2.jpg',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.901234567!2d121.222!3d12.311!2m3!1f0!2f0!3f0!3m2!1i1024!2i768',
  12.311000, 121.222000, '(043) 208-6666', 'premium@naujango.com', 1);
