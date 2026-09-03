-- Migration: Add hotel reviews support to reviews table
-- This allows reviews to be associated with either POIs (attractions) or hotels

-- Add hotel_id column to reviews table
ALTER TABLE `reviews`
ADD COLUMN `hotel_id` int(11) DEFAULT NULL AFTER `poi_id`,
ADD INDEX `idx_review_hotel` (`hotel_id`);

-- Modify the check to allow either poi_id or hotel_id (not both)
-- Add constraint to ensure review is for either POI or Hotel, not both
ALTER TABLE `reviews`
ADD CONSTRAINT `chk_review_target` 
CHECK (
  (`poi_id` IS NOT NULL AND `hotel_id` IS NULL) OR 
  (`poi_id` IS NULL AND `hotel_id` IS NOT NULL)
);

-- Update reviews table to add helpful review flag
ALTER TABLE `reviews`
ADD COLUMN `helpful_count` int(11) DEFAULT 0 AFTER `moderated`;

-- Create table for booking receipts
CREATE TABLE IF NOT EXISTS `booking_receipts` (
  `receipt_id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL UNIQUE,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pdf_path` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`receipt_id`),
  KEY `idx_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add payment reference to hotel_bookings if not exists
ALTER TABLE `hotel_bookings`
ADD COLUMN IF NOT EXISTS `payment_reference` varchar(100) DEFAULT NULL AFTER `payment_method`,
ADD COLUMN IF NOT EXISTS `payment_status` enum('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER `payment_reference`;

-- Insert sample reviews for hotels
INSERT INTO `reviews` (`user_id`, `hotel_id`, `rating`, `comment`, `review_date`, `moderated`, `helpful_count`) VALUES
(1, 1, 5, 'Absolutely stunning resort! The lake views are breathtaking and the staff went above and beyond to make our stay special. Highly recommend the spa services.', '2026-01-15 14:30:00', 1, 12),
(2, 1, 4, 'Beautiful location and excellent amenities. The pool area was fantastic. Only minor issue was slow WiFi in some rooms.', '2026-01-20 10:15:00', 1, 8),
(3, 1, 5, 'Perfect for a romantic getaway. The restaurant serves amazing local cuisine. Will definitely return!', '2026-01-25 16:45:00', 1, 15),
(1, 2, 4, 'Great value for money. Clean rooms and friendly staff. The lake view from our room was lovely. Good central location for exploring Naujan.', '2026-01-18 09:20:00', 1, 6),
(2, 2, 4, 'Comfortable stay with all basic amenities. Restaurant food was delicious. Perfect base for our Naujan adventure.', '2026-01-22 13:10:00', 1, 4),
(3, 3, 5, 'Ideal for trekkers heading to Mt. Halcon! The owners are incredibly helpful with trail information. Authentic local experience.', '2026-01-12 11:00:00', 1, 10),
(1, 3, 4, 'Simple but clean and comfortable. Great location near the mountain trails. The home-cooked meals were a highlight!', '2026-01-19 15:30:00', 1, 7),
(2, 4, 5, 'The heritage museum inside the hotel is fascinating! Beautiful architecture and rich cultural displays. Staff are very knowledgeable about Naujan history.', '2026-01-16 12:00:00', 1, 9),
(3, 4, 4, 'Charming hotel with character. Love the traditional design mixed with modern comfort. The location near the plaza is very convenient.', '2026-01-23 10:45:00', 1, 5),
(1, 5, 5, 'Amazing eco-lodge! Everything is sustainably designed and the commitment to conservation is evident. Peaceful and serene setting.', '2026-01-14 08:30:00', 1, 11),
(2, 5, 5, 'Nature lovers paradise! Saw so many birds and butterflies. The staff are passionate about environmental protection. Highly educational stay.', '2026-01-21 14:20:00', 1, 13);

-- Insert sample reviews for attractions (POIs)
INSERT INTO `reviews` (`user_id`, `poi_id`, `rating`, `comment`, `review_date`, `moderated`, `helpful_count`) VALUES
(1, 1, 5, 'Naujan Lake is absolutely beautiful! Perfect for peaceful morning walks and bird watching. A must-visit natural attraction.', '2026-01-10 09:00:00', 1, 18),
(2, 1, 4, 'Lovely scenic views. Great spot for photography. Would recommend visiting during sunset.', '2026-01-17 16:30:00', 1, 12),
(3, 1, 5, 'Pristine and serene. The lake ecosystem is rich with wildlife. Educational and relaxing at the same time.', '2026-01-24 11:15:00', 1, 14),
(1, 2, 5, 'San Guillermo Parish Church is a magnificent example of Spanish colonial architecture. The historical significance is palpable.', '2026-01-11 14:00:00', 1, 10),
(2, 2, 5, 'Beautiful church with deep roots in Naujan history. Peaceful atmosphere perfect for reflection and prayer.', '2026-01-19 10:00:00', 1, 8),
(3, 3, 4, 'Fascinating glimpse into Naujan\'s past. Well-curated exhibits and friendly museum staff. Great for families.', '2026-01-13 13:30:00', 1, 7),
(1, 3, 4, 'Informative and educational. Learned so much about local culture and traditions. Worth a visit!', '2026-01-20 15:00:00', 1, 6);

-- Add hotel rating calculation trigger (optional - to auto-update hotel ratings)
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_hotel_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
  IF NEW.hotel_id IS NOT NULL AND NEW.moderated = 1 THEN
    UPDATE hotels 
    SET rating = (
      SELECT ROUND(AVG(rating), 1) 
      FROM reviews 
      WHERE hotel_id = NEW.hotel_id AND moderated = 1
    )
    WHERE hotel_id = NEW.hotel_id;
  END IF;
END//

DELIMITER ;
