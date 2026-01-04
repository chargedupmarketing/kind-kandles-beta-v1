# User Management Guide

## Overview
The admin panel now includes comprehensive user management features that allow super admins to manage all aspects of user accounts, including passwords, roles, and team assignments.

## Features

### 1. Edit User Information
- **Name Changes**: Update first and last names
- **Role Management**: Change user permission levels
- **Team Assignments**: Add or remove users from teams
- **Password Resets**: Change user passwords without knowing the old password

### 2. Access Control

#### Super Admin Capabilities
Super admins have full control over the user management system:
- ✅ View all users
- ✅ Create new users
- ✅ Edit any user (including other super admins)
- ✅ Delete any user (including other super admins)
- ✅ Change any user's password
- ✅ Assign super admin role
- ✅ Manage team assignments

#### Regular Admin Limitations
Regular admins have limited user management access:
- ❌ Cannot view user management section
- ❌ Cannot edit users
- ❌ Cannot delete users
- ❌ Cannot change passwords

## How to Use

### Editing a User (Desktop)

1. Navigate to **Admin Panel** → **Users**
2. Find the user you want to edit in the table
3. Click the **Edit** button (pencil icon) in the Actions column
4. The Edit User modal will appear with the following options:

#### Basic Information
- **First Name**: Update the user's first name
- **Last Name**: Update the user's last name
- **Email**: Cannot be changed (displayed as read-only)

#### Role/Permission Level
Choose from three roles:
- **User**: View-only access to the dashboard
- **Admin**: Full store management access (orders, products, customers)
- **Super Admin**: Complete system access (includes user management)

#### Team Assignments
- Check/uncheck teams to assign or remove the user
- Users can belong to multiple teams
- Teams provide additional permissions beyond the base role

#### Password Change (Optional)
- Leave blank to keep the current password
- Enter a new password (minimum 8 characters)
- Confirm the new password
- Click the eye icon to show/hide passwords

5. Click **Save Changes** to apply updates
6. Click **Cancel** to discard changes

### Editing a User (Mobile)

1. Navigate to **Admin Panel** → **Users**
2. Find the user in the list
3. Tap the **three dots** (⋮) menu button
4. Select **Edit User**
5. The full-screen edit modal will appear
6. Make your changes (same options as desktop)
7. Tap **Save Changes** or **Cancel**

### Deleting a User

#### Desktop
1. Click the **Delete** button (trash icon) in the Actions column
2. Click **Confirm** (checkmark) to proceed
3. Click **Cancel** (X) to abort

#### Mobile
1. Tap the **three dots** (⋮) menu button
2. Select **Delete User**
3. Tap **Confirm** to proceed
4. Tap **Cancel** to abort

### Activating/Deactivating Users

#### Desktop
- Click the **Active/Inactive** badge in the Status column
- The status will toggle immediately

#### Mobile
- Tap the **three dots** (⋮) menu button
- Select **Activate User** or **Deactivate User**

**Note**: Inactive users cannot log in but their data is preserved.

## Security Features

### Password Security
- Passwords are hashed using bcrypt with 12 rounds
- Minimum password length: 8 characters
- Passwords are never displayed or retrievable
- Password confirmation required for changes

### Role-Based Access Control
- Middleware enforces role checks on all API requests
- Super admin role required for user management
- Cannot downgrade your own role
- Email addresses cannot be changed (prevents account hijacking)

### Audit Trail
All user changes are logged in the database with:
- Timestamp
- Requesting user
- Action performed
- Changed fields

## API Endpoints

### Get All Users
```
GET /api/admin/users
```
Returns list of all admin users (super admin only)

### Get Single User
```
GET /api/admin/users/[id]
```
Returns details for a specific user

### Update User
```
PATCH /api/admin/users/[id]
```
**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin",
  "password": "newpassword123",
  "sub_levels": ["team-id-1", "team-id-2"],
  "is_active": true
}
```
All fields are optional. Only include fields you want to update.

### Delete User
```
DELETE /api/admin/users/[id]
```
Permanently deletes a user account

## Database Schema

### admin_users Table
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  sub_levels TEXT[], -- Array of team IDs
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Cannot See Edit/Delete Buttons
**Problem**: Edit and delete buttons are not visible
**Solution**: Only super admins can see these buttons. Verify your account has the `super_admin` role.

### Password Change Not Working
**Problem**: Password update fails
**Solution**: 
- Ensure password is at least 8 characters
- Verify password and confirm password match
- Check that you have super admin permissions

### Cannot Edit Super Admin
**Problem**: Error when trying to edit a super admin account
**Solution**: Only super admins can edit other super admin accounts. Regular admins cannot modify super admins.

### User Still Can Log In After Deactivation
**Problem**: Deactivated user can still access the system
**Solution**: 
- Verify the is_active status was updated in the database
- User may have an active session - they need to log out and log back in
- Check middleware authentication logic

## Best Practices

1. **Regular Audits**: Review user list regularly and deactivate unused accounts
2. **Least Privilege**: Assign the minimum role needed for each user's responsibilities
3. **Strong Passwords**: When creating users, use strong passwords (12+ characters, mixed case, numbers, symbols)
4. **Team Organization**: Use teams to group users by department or function
5. **Backup Super Admins**: Always have at least 2 active super admin accounts
6. **Document Changes**: Keep notes on why users were added/removed or roles changed

## Related Documentation
- [Admin Panel Guide](ADMIN_PANEL_GUIDE.md)
- [Security Guide](SECURITY_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

