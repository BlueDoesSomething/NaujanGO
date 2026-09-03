# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This system now has three user roles with different access levels:
- **User**: Regular users who can book hotels and create itineraries
- **Owner**: Hotel owners who can manage their hotels and bookings
- **Admin**: System administrators with full access to manage users, roles, and all system data

## Setup Instructions

### 1. Run the Database Migration
First, run the migration to add role support to your database:

```bash
cd backend
node run_migration_007.js
```

This will:
- Add a `role` column to the `users` table (default: 'user')
- Create a `role_changes` table to track role modifications
- Create a `hotel_owners` table to link owners with their hotels

### 2. Set Up an Admin User
After running the migration, you need to manually set at least one user as admin in your database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com' LIMIT 1;
```

Replace `your-admin-email@example.com` with the email of the user you want to make an admin.

### 3. Restart the Backend Server
```bash
cd backend
npm start
```

### 4. Restart the Frontend Server
```bash
cd frontend
npm run dev
```

## User Roles and Permissions

### User (Default)
**Access:**
- Browse attractions and hotels
- Create bookings
- Manage their own profile
- Create and view itineraries
- View their booking history

**Cannot Access:**
- Owner Dashboard
- Admin Dashboard
- Other users' data

### Owner
**Access:**
- All User permissions
- Owner Dashboard at `/owner`
- View hotels assigned to them
- View and manage bookings for their hotels
- Update booking status (pending, confirmed, cancelled)

**Cannot Access:**
- Admin Dashboard
- Hotels not assigned to them
- User management
- Role changes

### Admin
**Access:**
- All User and Owner permissions
- Admin Dashboard at `/admin`
- Owner Dashboard (can view all hotels and bookings)
- User Management:
  - View all users
  - Change user roles
  - Delete users (except themselves)
- System Statistics:
  - Total users, hotels, bookings, attractions
  - Role distribution
  - Booking statistics
  - Recent activity
- Assign hotels to owners
- View role change history

## Dashboard Features

### Admin Dashboard (`/admin`)
**Tabs:**
1. **Overview**: System-wide statistics, role distribution, booking stats, recent users
2. **Users**: Manage all users, change roles, delete users
3. **Bookings**: View all bookings with complete details
4. **Role Changes**: Audit log of all role modifications

**Key Actions:**
- Change user roles via dropdown in Users tab
- Delete users (cannot delete yourself)
- View comprehensive system statistics

### Owner Dashboard (`/owner`)
**Tabs:**
1. **Overview**: Statistics for owned hotels, recent bookings
2. **Hotels**: View all hotels assigned to the owner
3. **Bookings**: Manage bookings for owned hotels

**Key Actions:**
- Update booking status (pending → confirmed/cancelled)
- View detailed guest information
- Monitor hotel performance

## Backend API Endpoints

### Admin Routes (`/admin`)
All require admin role:
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - List all users
- `PUT /admin/users/:userId/role` - Update user role
- `DELETE /admin/users/:userId` - Delete user
- `GET /admin/bookings` - List all bookings
- `GET /admin/role-changes` - Role change history

### Owner Routes (`/owner`)
All require owner or admin role:
- `GET /owner/dashboard/stats` - Owner dashboard statistics
- `GET /owner/hotels` - List owner's hotels
- `GET /owner/bookings` - List bookings for owner's hotels
- `PUT /owner/bookings/:bookingId/status` - Update booking status
- `POST /owner/assign-hotel` - Assign hotel to owner (admin only)

## Frontend Components

### New Pages
- `AdminDashboard.js` - Admin control panel
- `OwnerDashboard.js` - Owner hotel management
- `Dashboard.css` - Shared styling for both dashboards

### Updated Components
- `App.js` - Added role-based routing with `RoleBasedRoute` wrapper
- `Navbar.js` - Added dashboard links based on user role
- `AuthContext.jsx` - Already includes role in user object

## Navigation

### For Regular Users
- Navbar shows: Home, Attractions, Hotels, Map, About
- Account dropdown: Profile, My Bookings, Logout

### For Owners
- Same as regular users, plus:
- Account dropdown includes: "Owner Dashboard" link

### For Admins
- Account dropdown includes both:
  - "Admin Dashboard" link
  - "Owner Dashboard" link (to view all hotels)

## Database Schema

### Users Table
```sql
role ENUM('user', 'owner', 'admin') NOT NULL DEFAULT 'user'
```

### Hotel Owners Table
```sql
CREATE TABLE hotel_owners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  hotel_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_owner_hotel (user_id, hotel_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id)
);
```

### Role Changes Table
```sql
CREATE TABLE role_changes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  old_role ENUM('user', 'owner', 'admin'),
  new_role ENUM('user', 'owner', 'admin') NOT NULL,
  changed_by INT NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (changed_by) REFERENCES users(user_id)
);
```

## Security Features

1. **JWT Token**: Now includes user role
2. **Backend Middleware**: `authenticateToken` and `requireRole` protect routes
3. **Frontend Guards**: `RoleBasedRoute` component prevents unauthorized access
4. **Audit Trail**: All role changes are logged with timestamp and admin who made the change

## Common Tasks

### Assign a Hotel to an Owner
1. Login as admin
2. Navigate to Admin Dashboard
3. Change user's role to 'owner' in Users tab
4. Use backend API or database to assign hotel:
```sql
INSERT INTO hotel_owners (user_id, hotel_id) VALUES (owner_user_id, hotel_id);
```

### Promote User to Admin
1. Login as existing admin
2. Go to Admin Dashboard → Users tab
3. Find the user and change their role dropdown to "Admin"
4. Confirm the action

### View All Bookings for a Hotel
1. Login as owner or admin
2. Navigate to Owner Dashboard → Bookings tab
3. All bookings for your hotels are displayed
4. Use the status dropdown to update booking status

## Testing the Implementation

1. **Create test accounts**:
   - Register a regular user
   - Create an owner account (manually set role in database)
   - Create an admin account (manually set role in database)

2. **Test access controls**:
   - Try accessing `/admin` as a regular user (should redirect)
   - Try accessing `/owner` as a regular user (should redirect)
   - Login as admin and verify full access

3. **Test role changes**:
   - Login as admin
   - Change a user's role to owner
   - Verify the change is logged in role_changes table
   - Logout and login as that user to verify new permissions

## Troubleshooting

### Issue: Role not showing in token/user object
**Solution**: Logout and login again to get a new JWT token with role information

### Issue: Cannot access dashboard
**Solution**: 
1. Check if role is correctly set in database
2. Clear browser cache and localStorage
3. Logout and login again

### Issue: Owner can't see any hotels
**Solution**: Hotels must be assigned to owner in `hotel_owners` table

### Issue: Migration fails
**Solution**:
1. Check if role column already exists
2. Verify database connection
3. Check for syntax errors in SQL

## Security Considerations

1. **Never expose admin credentials**
2. **Regularly audit role changes** via Admin Dashboard
3. **Limit number of admin accounts** to trusted personnel
4. **Use strong passwords** for admin and owner accounts
5. **Monitor the role_changes table** for unauthorized modifications

## Future Enhancements

Potential additions:
- Email notifications for role changes
- More granular permissions within roles
- Time-limited role assignments
- Multi-hotel owner support (already implemented via hotel_owners table)
- Booking approval workflow for owners
- Revenue analytics for owners
- Hotel management features (add/edit hotels) for owners
