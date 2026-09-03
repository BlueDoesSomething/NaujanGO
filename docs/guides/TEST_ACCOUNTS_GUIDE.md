# 🔐 Test Accounts for Admin & Owner Dashboards

## Quick Setup Steps

### Step 1: Run the Migration (if not done yet)
```bash
cd backend
node run_migration_007.js
```

### Step 2: Set Up Test Accounts

You have **2 options**:

---

## OPTION 1: Use Your Existing Accounts (Recommended)

### Set Existing Users as Admin/Owner

Run these SQL commands in your MySQL:

```sql
-- Set Blue as ADMIN
UPDATE users 
SET role = 'admin' 
WHERE email = 'benedictmadrigal26@gmail.com';

-- Set Kyla as OWNER
UPDATE users 
SET role = 'owner' 
WHERE email = 'kymanalobearxkyqt21@gmail.com';
```

### Your Accounts Will Be:

**🛡️ ADMIN Account:**
- **Username**: `Blue`
- **Email**: `benedictmadrigal26@gmail.com`
- **Password**: [Your existing password]
- **Dashboard URL**: `/admin`

**🏨 OWNER Account:**
- **Username**: `kyla`
- **Email**: `kymanalobearxkyqt21@gmail.com`
- **Password**: [Your existing password]
- **Dashboard URL**: `/owner`

---

## OPTION 2: Create New Test Accounts

Run the complete SQL script:
```bash
# Open your MySQL client and run:
source C:/PROGRAMMING/CAPSTONE/setup_test_accounts.sql
```

**Or manually create:**

### 🛡️ ADMIN Account
```sql
INSERT INTO users (username, email, password_hash, role, first_name, last_name)
VALUES (
  'admin',
  'admin@naujango.com',
  '$2b$10$rZ5YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'admin',
  'Admin',
  'User'
);
```

**Login Credentials:**
- **Email**: `admin@naujango.com`
- **Password**: `admin123`

### 🏨 OWNER Account
```sql
INSERT INTO users (username, email, password_hash, role, first_name, last_name)
VALUES (
  'hotelowner',
  'owner@naujango.com',
  '$2b$10$xZ8YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK',
  'owner',
  'Hotel',
  'Owner'
);
```

**Login Credentials:**
- **Email**: `owner@naujango.com`
- **Password**: `owner123`

---

## Step 3: Assign Hotels to Owner

**Important!** Owners need hotels assigned to see data:

```sql
-- Check available hotels
SELECT hotel_id, name FROM hotels LIMIT 5;

-- Assign hotels to owner (replace user_id and hotel_id)
INSERT INTO hotel_owners (user_id, hotel_id) VALUES (2, 1);
INSERT INTO hotel_owners (user_id, hotel_id) VALUES (2, 2);
INSERT INTO hotel_owners (user_id, hotel_id) VALUES (2, 3);
```

Or assign all hotels to the first owner:
```sql
INSERT INTO hotel_owners (user_id, hotel_id) 
SELECT 
  (SELECT user_id FROM users WHERE role = 'owner' LIMIT 1),
  hotel_id 
FROM hotels 
LIMIT 3;
```

---

## Step 4: Test the Dashboards

### Restart Your Backend Server
```bash
cd backend
npm start
```

### Login and Test

**🛡️ Test Admin Dashboard:**
1. Go to your website
2. Login with admin credentials
3. Click your profile dropdown
4. Click "Admin Dashboard" 🛡️
5. You should see: `/admin` with full system access

**🏨 Test Owner Dashboard:**
1. Logout from admin
2. Login with owner credentials
3. Click your profile dropdown
4. Click "Owner Dashboard" 🏨
5. You should see: `/owner` with hotel management

---

## Quick Reference

### Dashboard URLs
- **Admin Dashboard**: `https://localhost:4000/admin`
- **Owner Dashboard**: `https://localhost:4000/owner`

### Account Roles
| Role | Username | Email | Dashboard Access |
|------|----------|-------|-----------------|
| 👤 User | testuser | user@naujango.com | None |
| 🏨 Owner | kyla/hotelowner | [owner email] | Owner Dashboard |
| 🛡️ Admin | Blue/admin | [admin email] | Both Dashboards |

---

## Verification Commands

Check if roles are set correctly:
```bash
cd backend
node check_rbac_setup.js
```

Or manually in MySQL:
```sql
-- Check all users and their roles
SELECT user_id, username, email, role FROM users;

-- Check hotel assignments
SELECT 
  u.username,
  h.name as hotel_name
FROM hotel_owners ho
JOIN users u ON ho.user_id = u.user_id
JOIN hotels h ON ho.hotel_id = h.hotel_id;
```

---

## Troubleshooting

### "Access Denied" when accessing dashboard
**Solution**: 
1. Verify role in database: `SELECT role FROM users WHERE email = 'your-email';`
2. Logout and login again (to get new JWT token with role)

### Owner Dashboard shows no hotels
**Solution**: Assign hotels to the owner user in `hotel_owners` table

### Admin can't delete users
**Solution**: Admin cannot delete themselves (security feature)

---

## Summary

**Quickest Setup (30 seconds):**
```sql
-- Make Blue an admin
UPDATE users SET role = 'admin' WHERE email = 'benedictmadrigal26@gmail.com';

-- Make Kyla an owner
UPDATE users SET role = 'owner' WHERE email = 'kymanalobearxkyqt21@gmail.com';

-- Assign 3 hotels to Kyla
INSERT INTO hotel_owners (user_id, hotel_id) 
SELECT 2, hotel_id FROM hotels LIMIT 3;
```

Then restart backend and login!

---

**Need Help?**
- Run: `node backend/check_rbac_setup.js`
- Check: `RBAC_GUIDE.md` for detailed documentation
