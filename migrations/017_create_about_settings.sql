-- Migration 017: Create/Update About Settings Table
-- Stores dynamic about page content for Naujan

-- Drop existing table if needed for fresh start (commented out - uncomment only if you want to reset)
-- DROP TABLE IF EXISTS about_settings;

-- Create table with all columns
CREATE TABLE IF NOT EXISTS about_settings (
  id INT PRIMARY KEY DEFAULT 1,
  
  -- Vision & Mission
  overview_text TEXT,
  vision_text TEXT,
  mission_text JSON,
  
  -- Demographics & Geography
  population INT,
  land_area_sq_km DECIMAL(10, 2),
  density_per_sq_km DECIMAL(10, 2),
  num_barangays INT,
  municipal_rank VARCHAR(50),
  
  -- Leadership (Current)
  current_mayor_name VARCHAR(255),
  current_mayor_term VARCHAR(50),
  current_vice_mayor_name VARCHAR(255),
  current_vice_mayor_term VARCHAR(50),
  
  -- Tourism Statistics
  visitor_arrivals_2022 INT,
  visitor_arrivals_2023 INT,
  visitor_arrivals_2024 INT,
  visitor_arrivals_2025 INT,
  tourism_total_employment INT,
  tourism_attractions_count INT,
  tourism_accommodation_count INT,
  tourism_female_employed INT,
  tourism_male_employed INT,
  
  -- Timestamps
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS municipal_rank VARCHAR(50);
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS current_mayor_name VARCHAR(255);
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS current_mayor_term VARCHAR(50);
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS current_vice_mayor_name VARCHAR(255);
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS current_vice_mayor_term VARCHAR(50);
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS visitor_arrivals_2022 INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS visitor_arrivals_2023 INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS visitor_arrivals_2024 INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS visitor_arrivals_2025 INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS tourism_total_employment INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS tourism_attractions_count INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS tourism_accommodation_count INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS tourism_female_employed INT;
ALTER TABLE about_settings ADD COLUMN IF NOT EXISTS tourism_male_employed INT;

-- Insert or update default values
INSERT INTO about_settings (id, overview_text, vision_text, mission_text, population, land_area_sq_km, density_per_sq_km, num_barangays, municipal_rank, current_mayor_name, current_mayor_term, current_vice_mayor_name, current_vice_mayor_term, visitor_arrivals_2022, visitor_arrivals_2023, visitor_arrivals_2024, visitor_arrivals_2025, tourism_total_employment, tourism_attractions_count, tourism_accommodation_count, tourism_female_employed, tourism_male_employed)
VALUES (
  1,
  'Naujan is a 1st class municipality in Oriental Mindoro with 70 barangays. It is known for its agricultural economy, cultural heritage, and tourism development.',
  'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA, with a livable and ecologically balanced environment demonstrating a vibrant economy inspired by God-loving, healthy, educated, and empowered citizenry under a dynamic and committed leadership.',
  JSON_OBJECT(
    "points", JSON_ARRAY(
      "Recognition and promotion of indigenous cultural communities while ensuring respect for cultural integrity",
      "Conservation and protection of natural resources for safe, adaptive, and resilient barangays",
      "Accountability and competency of people-centered governance through partnerships and development programs",
      "Promotion of eco-tourism and sustainable agricultural production with adequate social services and improved infrastructure"
    )
  ),
  109122,
  503.10,
  216.50,
  70,
  "2nd most populous in Oriental Mindoro",
  "Henry Joel C. Teves",
  "2022-Present",
  "Candido J. Melgar Jr.",
  "2025-Present",
  15605,
  42561,
  62788,
  36074,
  580,
  475,
  105,
  338,
  242
)
ON DUPLICATE KEY UPDATE 
  overview_text=VALUES(overview_text),
  vision_text=VALUES(vision_text),
  mission_text=VALUES(mission_text),
  population=VALUES(population),
  land_area_sq_km=VALUES(land_area_sq_km),
  density_per_sq_km=VALUES(density_per_sq_km),
  num_barangays=VALUES(num_barangays),
  municipal_rank=VALUES(municipal_rank),
  current_mayor_name=VALUES(current_mayor_name),
  current_mayor_term=VALUES(current_mayor_term),
  current_vice_mayor_name=VALUES(current_vice_mayor_name),
  current_vice_mayor_term=VALUES(current_vice_mayor_term),
  visitor_arrivals_2022=VALUES(visitor_arrivals_2022),
  visitor_arrivals_2023=VALUES(visitor_arrivals_2023),
  visitor_arrivals_2024=VALUES(visitor_arrivals_2024),
  visitor_arrivals_2025=VALUES(visitor_arrivals_2025),
  tourism_total_employment=VALUES(tourism_total_employment),
  tourism_attractions_count=VALUES(tourism_attractions_count),
  tourism_accommodation_count=VALUES(tourism_accommodation_count),
  tourism_female_employed=VALUES(tourism_female_employed),
  tourism_male_employed=VALUES(tourism_male_employed);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_about_settings_id ON about_settings(id);
CREATE INDEX IF NOT EXISTS idx_about_settings_updated ON about_settings(updated_at);
