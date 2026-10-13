-- Expand the attractions table so the admin can edit every field the
-- public attraction detail page displays (hours, fee, duration, best time,
-- difficulty, tags, safety) plus a multi-image gallery.
--
-- Mirrors the hotel gallery pattern (008_add_hotel_gallery.sql): a single
-- image_url for the cover + an image_urls JSON array for the gallery.

ALTER TABLE attractions
  ADD COLUMN opening_hours VARCHAR(255) NULL AFTER image_url,
  ADD COLUMN entrance_fee DECIMAL(10, 2) NULL AFTER opening_hours,
  ADD COLUMN visit_duration VARCHAR(100) NULL AFTER entrance_fee,
  ADD COLUMN best_time_to_visit VARCHAR(255) NULL AFTER visit_duration,
  ADD COLUMN difficulty_level VARCHAR(50) NULL AFTER best_time_to_visit,
  ADD COLUMN category_tags JSON NULL AFTER difficulty_level,
  ADD COLUMN dangerous_animals TEXT NULL AFTER category_tags,
  ADD COLUMN image_urls JSON NULL AFTER image_url;

-- Backfill municipality (rows 5-18 were created before the column was used).
-- Only touches rows that are still NULL.
UPDATE attractions SET municipality = 'Naujan' WHERE municipality IS NULL;
