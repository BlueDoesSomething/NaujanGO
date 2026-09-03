-- Enhanced Weather and Hazard Database Schema
-- Add to existing naujango database

-- Drop existing weather_data table if it exists to recreate with enhanced structure
DROP TABLE IF EXISTS `weather_data`;

-- Enhanced weather_data table with comprehensive fields
CREATE TABLE `weather_data` (
  `weather_id` int(11) NOT NULL AUTO_INCREMENT,
  `attraction_id` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  
  -- Basic weather data
  `temperature` decimal(5,2) NOT NULL,
  `feels_like` decimal(5,2) DEFAULT NULL,
  `humidity` int(11) NOT NULL,
  `pressure` decimal(7,2) DEFAULT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `wind_direction` int(11) DEFAULT NULL,
  `visibility` int(11) DEFAULT NULL,
  
  -- Weather conditions
  `weather_condition` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `icon_code` varchar(10) DEFAULT NULL,
  `cloudiness` int(11) DEFAULT NULL,
  `uv_index` decimal(3,1) DEFAULT NULL,
  
  -- Precipitation data
  `rainfall_1h` decimal(5,2) DEFAULT 0,
  `rainfall_3h` decimal(5,2) DEFAULT 0,
  `snowfall_1h` decimal(5,2) DEFAULT 0,
  
  -- Timestamps
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  
  -- Additional fields
  `api_source` varchar(50) DEFAULT 'openweathermap',
  `is_forecast` boolean DEFAULT FALSE,
  `forecast_hours` int(11) DEFAULT NULL,
  
  PRIMARY KEY (`weather_id`),
  KEY `idx_attraction_id` (`attraction_id`),
  KEY `idx_location` (`latitude`, `longitude`),
  KEY `idx_recorded_at` (`recorded_at`),
  KEY `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`attraction_id`) REFERENCES `attractions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Weather alerts table for hazard management
CREATE TABLE `weather_alerts` (
  `alert_id` int(11) NOT NULL AUTO_INCREMENT,
  `weather_id` int(11) NOT NULL,
  `alert_type` enum('heat','cold','storm','rain','wind','fog','humidity','flood','uv') NOT NULL,
  `severity_level` enum('low','medium','high','extreme') NOT NULL,
  `alert_message` text NOT NULL,
  `alert_icon` varchar(10) DEFAULT NULL,
  `alert_color` varchar(7) DEFAULT NULL,
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  
  PRIMARY KEY (`alert_id`),
  KEY `idx_weather_id` (`weather_id`),
  KEY `idx_severity` (`severity_level`),
  KEY `idx_active` (`is_active`),
  KEY `idx_expires` (`expires_at`),
  FOREIGN KEY (`weather_id`) REFERENCES `weather_data`(`weather_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Weather preferences for users
CREATE TABLE `user_weather_preferences` (
  `preference_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `temperature_unit` enum('celsius','fahrenheit') DEFAULT 'celsius',
  `wind_speed_unit` enum('kmh','mph','ms') DEFAULT 'kmh',
  `receive_alerts` boolean DEFAULT TRUE,
  `alert_types` json DEFAULT NULL, -- ['storm', 'rain', 'heat'] etc
  `min_safe_temperature` decimal(5,2) DEFAULT 15.00,
  `max_safe_temperature` decimal(5,2) DEFAULT 35.00,
  `max_safe_wind_speed` decimal(5,2) DEFAULT 20.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  
  PRIMARY KEY (`preference_id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Alternative destinations for weather-based recommendations
CREATE TABLE `weather_alternatives` (
  `alternative_id` int(11) NOT NULL AUTO_INCREMENT,
  `original_attraction_id` int(11) NOT NULL,
  `alternative_attraction_id` int(11) NOT NULL,
  `weather_conditions` json NOT NULL, -- ['rain', 'storm'] etc
  `suitability_score` int(11) DEFAULT 0, -- 0-100
  `reason` varchar(255) DEFAULT NULL,
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  
  PRIMARY KEY (`alternative_id`),
  KEY `idx_original_attraction` (`original_attraction_id`),
  KEY `idx_alternative_attraction` (`alternative_attraction_id`),
  KEY `idx_suitability` (`suitability_score`),
  FOREIGN KEY (`original_attraction_id`) REFERENCES `attractions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`alternative_attraction_id`) REFERENCES `attractions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Weather forecast data (separate from current weather)
CREATE TABLE `weather_forecasts` (
  `forecast_id` int(11) NOT NULL AUTO_INCREMENT,
  `attraction_id` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `forecast_date` date NOT NULL,
  `forecast_hour` int(11) NOT NULL DEFAULT 0,
  
  -- Weather data
  `temperature` decimal(5,2) NOT NULL,
  `humidity` int(11) NOT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `weather_condition` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `rainfall_probability` int(11) DEFAULT 0,
  `rainfall_amount` decimal(5,2) DEFAULT 0,
  
  -- Metadata
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `api_source` varchar(50) DEFAULT 'openweathermap',
  
  PRIMARY KEY (`forecast_id`),
  UNIQUE KEY `idx_forecast_unique` (`attraction_id`, `forecast_date`, `forecast_hour`),
  KEY `idx_forecast_date` (`forecast_date`),
  KEY `idx_location_forecast` (`latitude`, `longitude`, `forecast_date`),
  FOREIGN KEY (`attraction_id`) REFERENCES `attractions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Weather statistics for analytics
CREATE TABLE `weather_statistics` (
  `stat_id` int(11) NOT NULL AUTO_INCREMENT,
  `attraction_id` int(11) NOT NULL,
  `month` int(11) NOT NULL, -- 1-12
  `avg_temperature` decimal(5,2) DEFAULT NULL,
  `avg_humidity` decimal(5,2) DEFAULT NULL,
  `avg_rainfall` decimal(5,2) DEFAULT NULL,
  `rainy_days_count` int(11) DEFAULT 0,
  `storm_days_count` int(11) DEFAULT 0,
  `clear_days_count` int(11) DEFAULT 0,
  `year` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  
  PRIMARY KEY (`stat_id`),
  UNIQUE KEY `idx_stat_unique` (`attraction_id`, `month`, `year`),
  KEY `idx_month` (`month`),
  KEY `idx_year` (`year`),
  FOREIGN KEY (`attraction_id`) REFERENCES `attractions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample data for weather alternatives
INSERT INTO `weather_alternatives` (`original_attraction_id`, `alternative_attraction_id`, `weather_conditions`, `suitability_score`, `reason`) VALUES
(1, 3, '["rain", "storm"]', 90, 'Indoor activities available at town plaza during bad weather'),
(2, 3, '["storm", "wind"]', 85, 'Town plaza offers shelter during severe weather conditions'),
(3, 1, '["heat"]', 75, '333 Steps provides elevated views and cooler temperatures');

-- Insert default user weather preferences
INSERT INTO `user_weather_preferences` (`user_id`, `alert_types`) 
SELECT `user_id`, '["storm", "rain", "heat", "wind"]' FROM `users`;

-- Create indexes for better performance
CREATE INDEX `idx_weather_data_composite` ON `weather_data` (`attraction_id`, `recorded_at`, `weather_condition`);
CREATE INDEX `idx_alerts_active` ON `weather_alerts` (`is_active`, `severity_level`, `expires_at`);
CREATE INDEX `idx_forecasts_composite` ON `weather_forecasts` (`attraction_id`, `forecast_date`, `weather_condition`);