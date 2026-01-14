# Admin Role Management

## Hardcoded Admin Account

There is one hardcoded admin account that cannot be changed:

- **Email:** `admin@gmail.com`
- **Password:** `t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2`

This account is automatically created on first login and always has admin role.

## Assigning Admin Roles to Other Users

Only existing admins can assign admin roles to other users. To assign an admin role:

1. Log in as an admin (using `admin@gmail.com` or any existing admin account)
2. Go to Admin → Users
3. Click on the user you want to make an admin
4. Change the role dropdown from "User" to "Admin"
5. When prompted, enter the admin password: `t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2`
6. Confirm the change

## Security Notes

- The admin password is hardcoded: `t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2`
- Only admins can assign admin roles to other users
- The admin password is required when changing any user's role
- The `admin@gmail.com` account cannot be created through normal signup

## Access Control

- Only users with `role: "admin"` can access `/admin/*` routes
- Middleware automatically redirects non-admin users away from admin routes
- Admin routes are protected by NextAuth middleware
