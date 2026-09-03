-- ============================================
-- Admin and Owner Dashboard Test Accounts
-- ============================================
-- Run this after running the migration (run_migration_007.js)

-- First, check your existing users
SELECT user_id, username, email, role FROM users;

-- ============================================
-- OPTION 1: Set Existing Users as Admin/Owner
-- ============================================

-- Set the first user (Blue) as ADMIN
UPDATE users 
SET role = 'admin' 
WHERE email = 'benedictmadrigal26@gmail.com';

-- Set the second user (kyla) as OWNER
UPDATE users 
SET role = 'owner' 
WHERE email = 'kymanalobearxkyqt21@gmail.com';

-- ============================================
-- OPTION 2: Create New Test Accounts
-- ============================================

-- Create ADMIN test account
-- Password: admin123
INSERT INTO users (username, email, password_hash, role, first_name, last_name, preferred_language)
VALUES (
  'admin',
  'admin@naujango.com',
  '$2b$10$rZ5YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'admin',
  'Admin',
  'User',
  'en'
);

-- Create OWNER test account
-- Password: owner123
INSERT INTO users (username, email, password_hash, role, first_name, last_name, preferred_language)
VALUES (
  'hotelowner',
  'owner@naujango.com',
  '$2b$10$xZ8YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'owner',
  'Hotel',
  'Owner',
  'en'
);

-- Create OWNER test account (Mountain View Inn)
-- Password: owner123
INSERT INTO users (username, email, password_hash, role, first_name, last_name, preferred_language)
SELECT
  'owner2',
  'owner2@naujango.com',
  '$2b$10$xZ8YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'owner',
  'Mountain',
  'Owner',
  'en'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'owner2@naujango.com'
);

-- Create OWNER test account (Naujan Paradise Resort)
-- Password: owner123
INSERT INTO users (username, email, password_hash, role, first_name, last_name, preferred_language)
SELECT
  'owner3',
  'owner3@naujango.com',
  '$2b$10$xZ8YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'owner',
  'Naujan',
  'Owner',
  'en'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'owner3@naujango.com'
);

-- Create REGULAR USER test account (optional)
-- Password: user123
INSERT INTO users (username, email, password_hash, role, first_name, last_name, preferred_language)
VALUES (
  'testuser',
  'user@naujango.com',
  '$2b$10$yZ9YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'user',
  'Test',
  'User',
  'en'
);

-- ============================================
-- Assign Hotels to Owner (IMPORTANT!)
-- ============================================

-- First, check available hotels
SELECT hotel_id, name, location FROM hotels LIMIT 10;

-- Then assign hotels to the owner
-- Replace <owner_user_id> with the actual user_id of your owner
-- Replace <hotel_id> with actual hotel IDs from your database

-- Assign one hotel per owner (by hotel name)
-- Ensure each owner only has a single hotel assignment
DELETE FROM hotel_owners
WHERE user_id IN (
  SELECT user_id FROM users WHERE email IN (
    'owner@naujango.com',
    'owner2@naujango.com',
    'owner3@naujango.com'
  )
);

INSERT INTO hotel_owners (user_id, hotel_id)
SELECT
  (SELECT user_id FROM users WHERE email = 'owner@naujango.com' LIMIT 1),
  (SELECT hotel_id FROM hotels WHERE name = 'Lake View Hotel' LIMIT 1);

INSERT INTO hotel_owners (user_id, hotel_id)
SELECT
  (SELECT user_id FROM users WHERE email = 'owner2@naujango.com' LIMIT 1),
  (SELECT hotel_id FROM hotels WHERE name = 'Mountain View Inn' LIMIT 1);

INSERT INTO hotel_owners (user_id, hotel_id)
SELECT
  (SELECT user_id FROM users WHERE email = 'owner3@naujango.com' LIMIT 1),
  (SELECT hotel_id FROM hotels WHERE name = 'Naujan Paradise Resort' LIMIT 1);

-- ============================================
-- Verify Setup
-- ============================================

-- Check user roles
SELECT user_id, username, email, role, created_at 
FROM users 
ORDER BY role, username;

-- Check hotel assignments
SELECT 
  ho.id,
  u.username,
  u.email,
  u.role,
  h.name as hotel_name,
  h.location
FROM hotel_owners ho
JOIN users u ON ho.user_id = u.user_id
JOIN hotels h ON ho.hotel_id = h.hotel_id
ORDER BY u.username;

-- Check role distribution
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;
