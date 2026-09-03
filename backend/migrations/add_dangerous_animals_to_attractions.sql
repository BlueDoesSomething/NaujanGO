-- Add dangerous_animals column to attractions table
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS dangerous_animals TEXT;

-- Update some sample data with dangerous animals warnings
UPDATE attractions SET dangerous_animals = 'Be cautious of wild monkeys. Do not feed them as they can become aggressive. Keep food secured and maintain a safe distance.' WHERE name LIKE '%Mount%' OR name LIKE '%Forest%' OR name LIKE '%Trail%';

UPDATE attractions SET dangerous_animals = 'Watch for jellyfish during certain seasons. Always check with lifeguards before swimming. Be aware of strong currents and undertows.' WHERE name LIKE '%Beach%' OR name LIKE '%Island%';

UPDATE attractions SET dangerous_animals = 'Be aware of snakes in grassy areas. Stay on marked paths. Watch for wild boars, especially during dusk and dawn.' WHERE name LIKE '%Park%' OR name LIKE '%Garden%';
