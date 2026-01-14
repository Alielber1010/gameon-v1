# Master Admin Account Setup

## Master Admin Account

**Email:** `ali.melbermawy@gmail.com`

This is the master/owner admin account that has special protections.

## Setup Instructions

### Option 1: Create via Signup (Recommended for first-time setup)

1. Navigate to the signup page: `http://localhost:3000/signup` (or your production URL)
2. Create an account with:
   - **First Name:** Ali
   - **Last Name:** Melbermawy
   - **Email:** ali.melbermawy@gmail.com
   - **Password:** 

3. After creating the account, you need to manually update the role in the database:

#### Using MongoDB Compass or MongoDB Shell:

```javascript
// Connect to your MongoDB database
use gameon

// Update the user role to admin
db.users.updateOne(
  { email: "ali.melbermawy@gmail.com" },
  { $set: { role: "admin" } }
)
```

#### Or using the Admin Assignment API:

```bash
# Set the ADMIN_SECRET_KEY in your .env file first
ADMIN_SECRET_KEY=your-super-secret-key-here

# Then call the API
curl -X POST http://localhost:3000/api/admin/assign-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali.melbermawy@gmail.com",
    "secretKey": "your-super-secret-key-here"
  }'
```

### Option 2: Direct Database Insert

If you have direct database access, you can insert the master admin account directly:

```javascript
// Connect to your MongoDB database
use gameon

// Hash the password using bcrypt (rounds: 10)
const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync('your-secure-password-here', 10);

// Insert the master admin
db.users.insertOne({
  name: "Ali Melbermawy",
  email: "ali.melbermawy@gmail.com",
  password: hashedPassword,
  role: "admin",
  provider: "credentials",
  gamesPlayed: 0,
  averageRating: 0,
  totalRatings: 0,
  isBanned: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Master Admin Protections

The master admin account (`ali.melbermawy@gmail.com`) has the following protections:

1. **Cannot be banned** - The ban API will reject attempts to ban this account
2. **Cannot have admin role removed** - The role change API will prevent demoting this account
3. **Cannot be deleted** - Protected from account deletion
4. **UI indicators** - Shows "(Master)" badge in the admin panel
5. **No ban/warning buttons** - UI hides these actions for the master admin

## Admin Role Assignment

**No password required!** Admins can now directly promote users to admin role:

1. Go to `/admin/users`
2. Find the user you want to promote
3. Click to view their details
4. Use the role dropdown to change from "User" to "Admin"
5. The change is immediate - no password confirmation needed

## Security Recommendations

### For Production:

1. **Secure the master admin account** - Use a strong, unique password
2. **Store credentials securely** - Use a password manager
3. **Limit admin access** - Only promote trusted users to admin role
4. **Monitor admin activity** - Regularly check admin action logs
5. **Enable 2FA** (if implemented in the future)

### Environment Variables:

Add to your `.env` file:

```env
# Master Admin (for reference only - not used by the app)
MASTER_ADMIN_EMAIL=ali.melbermawy@gmail.com

# Admin Secret Key (for API-based admin assignment)
ADMIN_SECRET_KEY=your-super-secret-key-minimum-32-characters
```

## Verification

After setup, verify the master admin account:

1. Login at `/login` with the credentials
2. You should be redirected to `/admin/dashboard`
3. Navigate to `/admin/users` 
4. You should see all users including other admins
5. Your account should show "(Master)" badge
6. Ban/Warning buttons should not appear for your account

## Troubleshooting

### Cannot login:
- Verify the email is exactly `ali.melbermawy@gmail.com` (lowercase)
- Verify the password is correct
- Check the database to ensure the user exists
- Verify the `role` field is set to `"admin"`

### Not redirected to admin dashboard:
- Clear browser cookies and try again
- Check the browser console for errors
- Verify the session is being created correctly

### Cannot see admin panel:
- Verify the role is set to `"admin"` in the database
- Check that the session includes the role field
- Restart the Next.js development server

## Additional Admins

To create additional admin accounts:

1. Have them sign up normally through the signup page
2. As the master admin, go to `/admin/users`
3. Find their account and click to view details
4. Use the role dropdown to change their role from "User" to "Admin"
5. The user will be promoted to admin role immediately

**Note:** 
- Additional admins can be demoted or banned, but the master admin cannot
- No password is required when promoting users to admin
- Any admin can promote users to admin role
