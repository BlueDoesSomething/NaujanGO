-- Quick Setup Script for RBAC Testing
-- Run this after running the migration to set up test users with different roles

-- 1. Find your existing users
SELECT user_id, username, email, role FROM users;

-- 2. Set an admin user (replace the email with your actual admin account)
-- UPDATE users SET role = 'admin' WHERE email = 'benedictmadrigal26@gmail.com';

-- 3. Set an owner user (optional - for testing)
-- UPDATE users SET role = 'owner' WHERE email = 'owner@example.com';

-- 4. Verify roles were set correctly
SELECT user_id, username, email, role, created_at FROM users ORDER BY role, created_at DESC;

-- 5. (Optional) Assign a hotel to an owner for testing
-- First, check available hotels
SELECT hotel_id, name, location FROM hotels LIMIT 10;

-- Then assign hotel to owner (replace user_id and hotel_id with actual values)
-- INSERT INTO hotel_owners (user_id, hotel_id) VALUES (2, 1);

-- 6. Verify hotel assignments
SELECT 
  ho.id,
  u.username,
  u.email,
  u.role,
  h.name as hotel_name,
  ho.created_at
FROM hotel_owners ho
JOIN users u ON ho.user_id = u.user_id
JOIN hotels h ON ho.hotel_id = h.hotel_id;

-- 7. Check role changes history (will be empty initially)
SELECT 
  rc.id,
  u.username as user_changed,
  rc.old_role,
  rc.new_role,
  admin.username as changed_by,
  rc.changed_at
FROM role_changes rc
JOIN users u ON rc.user_id = u.user_id
JOIN users admin ON rc.changed_by = admin.user_id
ORDER BY rc.changed_at DESC;
