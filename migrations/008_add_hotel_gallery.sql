-- Migration 008: Add gallery images to hotels
ALTER TABLE hotels
ADD COLUMN image_urls JSON DEFAULT NULL AFTER image_url;
