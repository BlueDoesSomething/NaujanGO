-- Existing room types continue to offer nightly stays by default.
ALTER TABLE rooms ADD COLUMN nightly_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER hourly_rates;
