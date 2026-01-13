# Deployment Guide

This guide covers deploying the GameOn application to Vercel with a separate Socket.io server on Render.

## Architecture

```
┌─────────────────────────────────┐
│      Vercel (Next.js App)       │
│  - Next.js API Routes           │
│  - Static Assets                │
│  - Serverless Functions         │
└─────────────────────────────────┘
              │
              │ HTTP API Calls
              ▼
┌─────────────────────────────────┐
│   Render (Socket.io Server)      │
│  - WebSocket Connections        │
│  - Real-time Chat               │
└─────────────────────────────────┘
              │
              │
              ▼
┌─────────────────────────────────┐
│      MongoDB Database            │
└─────────────────────────────────┘
```

## Prerequisites

- Vercel account
- Render account
- MongoDB database (MongoDB Atlas recommended)
- GitHub repository connected to both services

## Step 1: Deploy Socket Server to Render

### 1.1 Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (the same repo as your main project)
4. Configure the service:
   - **Name**: `gameon-socket-server` (or your preferred name)
   - **Root Directory**: `socket-server` ⚠️ **Important**: Set this to `socket-server` so Render only deploys the socket server subdirectory
   - **Environment**: `Node`
   - **Build Command**: `npm install` (or `pnpm install`)
   - **Start Command**: `npm start` (or `pnpm start`)

**Note**: You're connecting the same GitHub repository that contains your entire project, but by setting the Root Directory to `socket-server`, Render will only build and deploy that specific subdirectory.

### 1.2 Set Environment Variables on Render

In the Render dashboard, go to Environment and add:

```
PORT=10000
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

**Important:**
- Render automatically provides a PORT, but you can set it explicitly
- `CORS_ORIGIN` should be your Vercel deployment URL (you'll update this after Vercel deployment)
- For multiple origins, use comma-separated values: `https://app1.vercel.app,https://app2.vercel.app`

### 1.3 Deploy and Get URL

After deployment, Render will provide a URL like:
```
https://gameon-socket-server.onrender.com
```

**Note this URL** - you'll need it for the Vercel configuration.

## Step 2: Deploy Next.js App to Vercel

### 2.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 2.2 Configure Build Settings

Vercel should auto-detect:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (or `pnpm build`)
- **Output Directory**: `.next`
- **Install Command**: `npm install` (or `pnpm install`)

### 2.3 Set Environment Variables on Vercel

In Vercel project settings → Environment Variables, add:

```
# Socket Server URL (from Render)
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com

# MongoDB (same as Render)
MONGODB_URI=your-mongodb-connection-string

# NextAuth Configuration
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Other environment variables your app needs
# (check your .env.local or existing config)
```

**Important:**
- `NEXT_PUBLIC_SOCKET_URL` must be the Render socket server URL
- `NEXTAUTH_URL` should be your Vercel app URL
- Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`

### 2.4 Deploy

Click "Deploy" and wait for the build to complete.

## Step 3: Update CORS Configuration

After Vercel deployment, update the Render environment variable:

1. Go back to Render dashboard
2. Update `CORS_ORIGIN` to include your Vercel URL:
   ```
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
3. Render will automatically redeploy

## Step 4: Verify Deployment

### 4.1 Test Socket Connection

1. Open your Vercel-deployed app
2. Open browser DevTools → Console
3. Navigate to a game with chat
4. Check for socket connection logs:
   - Should see "Socket connected" message
   - No CORS errors

### 4.2 Test Chat Functionality

1. Join a game or create one
2. Send a test message
3. Verify message appears in real-time
4. Check MongoDB to confirm message was saved

## Environment Variables Summary

### Vercel Environment Variables
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your-secret-key
# ... other app-specific variables
```

### Render Environment Variables
```
PORT=10000
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

## Troubleshooting

### Socket Connection Fails

1. **Check CORS configuration**: Ensure Render `CORS_ORIGIN` includes your Vercel URL
2. **Verify environment variable**: Check `NEXT_PUBLIC_SOCKET_URL` in Vercel
3. **Check Render logs**: Look for connection errors in Render dashboard
4. **Test socket URL directly**: `curl https://your-socket-server.onrender.com/api/socket`

### CORS Errors in Browser

- Ensure `CORS_ORIGIN` in Render includes the exact Vercel URL (with https://)
- Check for trailing slashes - they should match
- Multiple origins should be comma-separated without spaces (or with spaces, depending on your server config)

### Messages Not Saving

- Verify MongoDB connection in Render logs
- Check `MONGODB_URI` is correct in both Vercel and Render
- Ensure MongoDB allows connections from Render's IP addresses

### Build Failures

- **Vercel**: Check build logs for missing dependencies or TypeScript errors
- **Render**: Ensure `socket-server` directory structure is correct
- Verify Node.js version compatibility (check `engines` in package.json)

## Custom Domain Setup

### Vercel Custom Domain

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable

### Render Custom Domain

1. In Render service settings → Custom Domains
2. Add your custom domain
3. Update `CORS_ORIGIN` to include custom domain
4. Update Vercel `NEXT_PUBLIC_SOCKET_URL` if using custom domain

## Monitoring

### Vercel
- Check deployment logs in Vercel dashboard
- Monitor function execution times
- Set up Vercel Analytics for performance monitoring

### Render
- Monitor service logs in Render dashboard
- Set up uptime monitoring
- Configure auto-deploy from Git

## Cost Considerations

- **Vercel**: Free tier includes generous limits for Next.js apps
- **Render**: Free tier available but with limitations (spins down after inactivity)
- **MongoDB Atlas**: Free tier (M0) available for development

For production, consider:
- Render paid plans for always-on socket server
- MongoDB Atlas paid plans for better performance
- Vercel Pro for advanced features

## Security Notes

1. **Never commit `.env` files** - use environment variables in platform dashboards
2. **Use strong `NEXTAUTH_SECRET`** - generate with `openssl rand -base64 32`
3. **Restrict MongoDB access** - use IP whitelist in MongoDB Atlas
4. **Enable HTTPS** - both Vercel and Render provide this by default
5. **Review CORS origins** - only include trusted domains

## Support

For issues:
1. Check platform-specific documentation:
   - [Vercel Docs](https://vercel.com/docs)
   - [Render Docs](https://render.com/docs)
2. Review application logs in both platforms
3. Test locally first before deploying
