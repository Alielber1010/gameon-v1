# GameOn Socket Server

Standalone Socket.io server for real-time chat functionality. Deploy this to Render separately from the main Next.js application.

## Deployment to Render

### Step 1: Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Select the `socket-server` directory as the root directory

### Step 2: Configure Build Settings

- **Build Command**: `npm install` (or `pnpm install`)
- **Start Command**: `npm start` (or `pnpm start`)

### Step 3: Set Environment Variables

Add these environment variables in Render:

```
PORT=10000
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

**Important Notes:**
- Render will automatically set the `PORT` variable, but you can override it
- `CORS_ORIGIN` should include your Vercel deployment URL(s)
- Multiple origins can be comma-separated

### Step 4: Deploy

Render will automatically deploy your service. Once deployed, you'll get a URL like:
`https://your-socket-server.onrender.com`

### Step 5: Update Vercel Environment Variables

In your Vercel project settings, add:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.onrender.com
```

## Local Development

1. Install dependencies:
```bash
cd socket-server
npm install
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your local values:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/gameon
CORS_ORIGIN=http://localhost:3000
```

4. Run the server:
```bash
npm run dev
```

## Testing

The server will be available at `http://localhost:3001` (or your configured PORT).

Test the connection:
```bash
curl http://localhost:3001/api/socket
```

## Troubleshooting

- **Connection refused**: Check that the PORT matches Render's assigned port
- **CORS errors**: Ensure `CORS_ORIGIN` includes your Vercel app URL
- **MongoDB connection errors**: Verify `MONGODB_URI` is correct and accessible
