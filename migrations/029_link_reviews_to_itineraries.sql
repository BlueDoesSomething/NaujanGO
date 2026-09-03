-- Migration 029: Link reviews to itineraries
-- Connects attraction reviews to the itineraries they're from
-- Allows users to review attractions in the context of their trips

ALTER TABLE `reviews` 
ADD COLUMN `itinerary_id` INT NULL AFTER `attraction_id`,
ADD FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`itinerary_id`) ON DELETE SET NULL;

-- Add unique constraint: prevent duplicate reviews for same attraction in same itinerary
-- Only applies when itinerary_id is not NULL (general reviews can have duplicates)
ALTER TABLE `reviews` 
ADD UNIQUE KEY `unique_itinerary_review` (`itinerary_id`, `attraction_id`, `user_id`) 
WHERE `itinerary_id` IS NOT NULL;

-- Add index for faster queries when filtering reviews by itinerary
CREATE INDEX `idx_reviews_itinerary` ON `reviews`(`itinerary_id`);

-- Add index for common query: all reviews for an attraction
CREATE INDEX `idx_reviews_attraction_itinerary` ON `reviews`(`attraction_id`, `itinerary_id`);

-- Add trigger to validate review date is within/after itinerary dates
DELIMITER $$

CREATE TRIGGER `validate_review_date_with_itinerary` 
BEFORE INSERT ON `reviews`
FOR EACH ROW
BEGIN
  IF NEW.itinerary_id IS NOT NULL THEN
    -- Review date should be >= itinerary start_date
    IF (SELECT start_date FROM itineraries WHERE itinerary_id = NEW.itinerary_id) IS NOT NULL THEN
      IF DATE(NEW.review_date) < (SELECT start_date FROM itineraries WHERE itinerary_id = NEW.itinerary_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Review date cannot be before itinerary start date';
      END IF;
    END IF;
  END IF;
END$$

DELIMITER ;

-- Comment describing the changes
ALTER TABLE `reviews` COMMENT = 'Reviews table now supports linking to specific itineraries. itinerary_id is nullable to support both general and trip-specific reviews.';
