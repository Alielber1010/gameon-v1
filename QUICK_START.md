# Quick Start Guide

## Local Development

### 1. Start the Socket Server (Terminal 1)

```bash
cd socket-server
npm install
cp .env.example .env
# Edit .env with your local MongoDB URI
npm run dev
```

The socket server will run on `http://localhost:3001`

### 2. Start the Next.js App (Terminal 2)

```bash
# In the root directory
npm install
# Create .env.local with:
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
# MONGODB_URI=your-mongodb-uri
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret
npm run dev
```

The Next.js app will run on `http://localhost:3000`

## Environment Variables

### For Next.js App (.env.local)
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### For Socket Server (socket-server/.env)
```
PORT=3001
MONGODB_URI=your-mongodb-connection-string
CORS_ORIGIN=http://localhost:3000
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel and Render.

## Notes

- The `server.ts` file in the root is **not used** for Vercel deployment (Vercel doesn't support custom servers)
- For local development, you can use `server.ts` if you want everything in one process, but the recommended approach is to run the socket server separately
- The socket server must be running before starting the Next.js app for chat functionality to work
