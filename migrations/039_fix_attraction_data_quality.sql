-- -------------------------------------------------------------------
-- 039: Attraction data quality pass.
-- Fixes homepage display accuracy for attraction records:
--   1. Fill NULL/empty municipality (all attraction records belong to
--      the Municipality of Naujan).
--   2. Trim and collapse whitespace in location text (seeded rows had
--      leading spaces, e.g. id 10 "' Brgy. Poblacion, ...'").
--   3. Correct clearly-broken / NULL coordinates to the Naujan town-
--      center approximation (13.3333, 121.3000 - the same center point
--      the site already uses for weather/safety widgets). Real GPS
--      coordinates should be re-surveyed and refined later.
-- NOTE: image_url for id 16 is intentionally left NULL; the frontend
--       falls back to /placeholder-attraction.svg.
-- -------------------------------------------------------------------

UPDATE `attractions`
SET `municipality` = 'Naujan'
WHERE `municipality` IS NULL OR TRIM(`municipality`) = '';

UPDATE `attractions`
SET `location` = REGEXP_REPLACE(TRIM(`location`), '[[:space:]]+', ' ')
WHERE `location` IS NOT NULL AND `location` <> '';

-- Rows whose stored longitude is plainly outside the province
-- (id 10 lon 122.309 = ~Quezon; id 15 lon 116.109 = western Palawan)
UPDATE `attractions`
SET `latitude` = 13.3333, `longitude` = 121.3000
WHERE `id` IN (10, 15, 16);

-- Any remaining NULL coords on live (non-archived) rows
UPDATE `attractions`
SET `latitude` = 13.3333, `longitude` = 121.3000
WHERE (`latitude` IS NULL OR `longitude` IS NULL)
  AND (`archived` IS NULL OR `archived` = 0);