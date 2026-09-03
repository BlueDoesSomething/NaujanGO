-- Migration 034: Restore reviews.itinerary_id support for attraction reviews
-- This keeps itinerary-based attraction reviews working on databases where the
-- earlier migration did not apply successfully.

ALTER TABLE `reviews`
  ADD COLUMN IF NOT EXISTS `itinerary_id` INT NULL AFTER `attraction_id`;

ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_itinerary`
  FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`itinerary_id`)
  ON DELETE SET NULL;

ALTER TABLE `reviews`
  ADD UNIQUE KEY `unique_itinerary_review` (`itinerary_id`, `attraction_id`, `user_id`);

CREATE INDEX IF NOT EXISTS `idx_reviews_itinerary` ON `reviews`(`itinerary_id`);
CREATE INDEX IF NOT EXISTS `idx_reviews_attraction_itinerary` ON `reviews`(`attraction_id`, `itinerary_id`);

DROP TRIGGER IF EXISTS `validate_review_date_with_itinerary`;

DELIMITER $$

CREATE TRIGGER `validate_review_date_with_itinerary`
BEFORE INSERT ON `reviews`
FOR EACH ROW
BEGIN
  IF NEW.itinerary_id IS NOT NULL THEN
    IF (SELECT start_date FROM itineraries WHERE itinerary_id = NEW.itinerary_id) IS NOT NULL THEN
      IF DATE(NEW.review_date) < (SELECT start_date FROM itineraries WHERE itinerary_id = NEW.itinerary_id) THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Review date cannot be before itinerary start date';
      END IF;
    END IF;
  END IF;
END$$

DELIMITER ;

ALTER TABLE `reviews`
  COMMENT = 'Reviews table now supports linking to specific itineraries. itinerary_id is nullable to support both general and trip-specific reviews.';