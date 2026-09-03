-- Add enhanced fields to itinerary_attractions table for better itinerary management

ALTER TABLE `itinerary_attractions`
ADD COLUMN `day_number` INT DEFAULT 1 AFTER `order_sequence`,
ADD COLUMN `estimated_cost` DECIMAL(10,2) DEFAULT 0.00 AFTER `estimated_duration`,
ADD COLUMN `duration_minutes` INT DEFAULT 120 AFTER `estimated_cost`,
ADD COLUMN `item_type` VARCHAR(50) DEFAULT 'attraction' AFTER `day_number`,
ADD COLUMN `custom_name` VARCHAR(255) DEFAULT NULL AFTER `item_type`,
ADD COLUMN `custom_location` VARCHAR(255) DEFAULT NULL AFTER `custom_name`,
ADD COLUMN `latitude` FLOAT DEFAULT NULL AFTER `custom_location`,
ADD COLUMN `longitude` FLOAT DEFAULT NULL AFTER `latitude`,
ADD COLUMN `priority` VARCHAR(20) DEFAULT 'medium' AFTER `longitude`,
ADD COLUMN `weather_dependent` BOOLEAN DEFAULT FALSE AFTER `priority`;

-- Update existing records to have default values
UPDATE `itinerary_attractions` 
SET `duration_minutes` = COALESCE(`estimated_duration`, 120),
    `day_number` = 1,
    `estimated_cost` = 0.00
WHERE `duration_minutes` IS NULL OR `day_number` IS NULL OR `estimated_cost` IS NULL;

-- Create function to recalculate itinerary budget
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS calculate_itinerary_budget(itinerary_id_param INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10,2);
    
    SELECT COALESCE(SUM(estimated_cost), 0.00) INTO total
    FROM itinerary_attractions
    WHERE itinerary_id = itinerary_id_param;
    
    RETURN total;
END$$

DELIMITER ;

-- Create trigger to auto-update itinerary budget when items change
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS update_itinerary_budget_after_insert
AFTER INSERT ON itinerary_attractions
FOR EACH ROW
BEGIN
    UPDATE itineraries
    SET total_budget = calculate_itinerary_budget(NEW.itinerary_id)
    WHERE itinerary_id = NEW.itinerary_id;
END$$

CREATE TRIGGER IF NOT EXISTS update_itinerary_budget_after_update
AFTER UPDATE ON itinerary_attractions
FOR EACH ROW
BEGIN
    UPDATE itineraries
    SET total_budget = calculate_itinerary_budget(NEW.itinerary_id)
    WHERE itinerary_id = NEW.itinerary_id;
END$$

CREATE TRIGGER IF NOT EXISTS update_itinerary_budget_after_delete
AFTER DELETE ON itinerary_attractions
FOR EACH ROW
BEGIN
    UPDATE itineraries
    SET total_budget = calculate_itinerary_budget(OLD.itinerary_id)
    WHERE itinerary_id = OLD.itinerary_id;
END$$

DELIMITER ;
