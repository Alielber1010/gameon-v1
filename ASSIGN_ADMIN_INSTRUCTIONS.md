# Assign Admin Role Instructions

## Quick Start: Assign Admin to ali.melbermawy@gmail.com

### Using cURL
```bash
curl -X POST http://localhost:3000/api/admin/assign-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali.melbermawy@gmail.com",
    "secretKey": "t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2"
  }'
```

## Method 1: Using the API Endpoint (Recommended)

You can assign admin role to `ali.melbermawy@gmail.com` using the existing API endpoint.

### Using cURL:
```bash
curl -X POST http://localhost:3000/api/admin/assign-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali.melbermawy@gmail.com",
    "secretKey": "t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2"
  }'
```

### Using JavaScript/Node.js:
```javascript
fetch('http://localhost:3000/api/admin/assign-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'ali.melbermawy@gmail.com',
    secretKey: 't9rmQXsQj9b0K37J3rkBIncdXxD8WPd2'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### Using Postman or similar:
1. Method: POST
2. URL: `http://localhost:3000/api/admin/assign-admin`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
```json
{
  "email": "ali.melbermawy@gmail.com",
  "secretKey": "t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2"
}
```

## Method 2: Using the Admin Panel (After First Admin is Created)

Once you have at least one admin, you can:
1. Log in as an admin
2. Go to Admin → Users
3. Click on the user you want to change
4. Change the role dropdown
5. Enter the admin secret key when prompted
6. Confirm the change

## Security Notes

- The `ADMIN_SECRET_KEY` must be set in your environment variables
- The secret key is required for all role changes
- Never commit the secret key to version control
- Keep the secret key secure and rotate it periodically

## Environment Variable

Make sure you have this in your `.env.local` or environment:
```
ADMIN_SECRET_KEY=t9rmQXsQj9b0K37J3rkBIncdXxD8WPd2
```

## Access Control

- Only users with `role: "admin"` can access `/admin/*` routes
- Middleware automatically redirects non-admin users away from admin routes
- Admin routes are protected by NextAuth middleware
