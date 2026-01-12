# NGINX Reverse Proxy Integration Plan for GameOn Sports Website

## ⚠️ CRITICAL DEPLOYMENT CONSTRAINT

**Vercel does NOT support NGINX reverse proxies or custom servers.**

Your project currently uses:
- **Custom Next.js server** (`server.ts`) with Socket.io
- **Long-running WebSocket connections** for real-time chat

**Vercel Limitations:**
- No custom server support (serverless functions only)
- No persistent WebSocket connections
- No ability to run NGINX or any reverse proxy
- No control over the HTTP server layer

---

## 📋 Project Analysis

### Current Architecture
```
┌─────────────────────────────────────────┐
│   Custom Next.js Server (server.ts)     │
│   - Next.js App                         │
│   - Socket.io Server (WebSocket)        │
│   - Port: 3000                          │
└─────────────────────────────────────────┘
```

### Key Components Requiring Attention:
1. **Custom Server** (`server.ts`): Handles Socket.io WebSocket connections
2. **Socket.io Client**: Connects to `/api/socket` path
3. **API Routes**: Next.js API routes in `app/api/`
4. **Static Assets**: Images, uploads in `public/` directory
5. **MongoDB**: Database connection (works on Vercel)

---

## 🎯 Two Deployment Scenarios

### Scenario A: Deploy on Vercel (Recommended for Next.js)
**Cannot use NGINX, but can use Vercel's built-in features**

### Scenario B: Deploy on VPS/Cloud Server (Required for NGINX)
**Can use NGINX reverse proxy with full control**

---

## 📝 SCENARIO A: Vercel Deployment (Without NGINX)

### A.1 Architecture Changes Required

#### Problem: Custom Server + Socket.io
Vercel doesn't support custom servers. You need to:

1. **Remove Custom Server**
   - Delete `server.ts` and `server.js`
   - Update `package.json` scripts
   - Use Next.js standard deployment

2. **Separate Socket.io Server**
   - Deploy Socket.io on a separate service (Railway, Render, Fly.io, etc.)
   - Update client connection URLs
   - Use environment variables for Socket.io URL

3. **Update Package.json**
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start"
     }
   }
   ```

#### New Architecture:
```
┌─────────────────────────────────────────┐
│         Vercel (Next.js App)            │
│   - Next.js API Routes                  │
│   - Static Assets                       │
│   - Serverless Functions                │
└─────────────────────────────────────────┘
              │
              │ HTTP API Calls
              ▼
┌─────────────────────────────────────────┐
│    Separate Socket.io Server            │
│    (Railway/Render/Fly.io)              │
│   - WebSocket Connections               │
│   - Real-time Chat                      │
└─────────────────────────────────────────┘
```

### A.2 Implementation Steps

#### Step 1: Create Separate Socket.io Server
Create new project: `socket-server/`

**File Structure:**
```
socket-server/
├── package.json
├── server.ts
├── .env
└── tsconfig.json
```

**socket-server/server.ts:**
```typescript
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI!
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'

const httpServer = createServer()

const io = new Server(httpServer, {
  path: '/api/socket',
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Connect to MongoDB
mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected')
})

// Socket.io handlers (copy from your current server.ts)
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-game', async (gameId: string) => {
    if (!gameId) return
    socket.join(`game:${gameId}`)
    console.log(`Socket ${socket.id} joined game:${gameId}`)
  })

  socket.on('leave-game', (gameId: string) => {
    if (!gameId) return
    socket.leave(`game:${gameId}`)
    console.log(`Socket ${socket.id} left game:${gameId}`)
  })

  socket.on('send-message', async (data: {
    gameId: string
    message: string
    userId: string
    userName: string
    userImage?: string
  }) => {
    // Your existing message handling logic
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})
```

#### Step 2: Update Client Connection
Update Socket.io client connections to use environment variable:

**components/dashboard/inline-game-chat.tsx:**
```typescript
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

const socketInstance = io(socketUrl, {
  path: '/api/socket',
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
})
```

#### Step 3: Environment Variables
**Vercel Environment Variables:**
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
MONGODB_URI=your-mongodb-uri
```

**Socket Server Environment Variables:**
```
PORT=3001
MONGODB_URI=your-mongodb-uri
CORS_ORIGIN=https://your-app.vercel.app
```

#### Step 4: Remove Custom Server Files
- Delete `server.ts`
- Delete `server.js`
- Update `package.json` scripts

#### Step 5: Vercel Configuration
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### A.3 Benefits of Vercel Approach
✅ Automatic HTTPS/SSL
✅ Global CDN for static assets
✅ Serverless scaling
✅ Easy deployments
✅ Built-in analytics
✅ Edge network

### A.4 Limitations
❌ No NGINX reverse proxy
❌ Separate Socket.io server needed
❌ Additional service to manage
❌ Potential latency between services

---

## 📝 SCENARIO B: VPS/Cloud Server Deployment (With NGINX)

### B.1 Architecture Overview

```
┌─────────────────────────────────────────┐
│         NGINX (Port 80/443)             │
│   - SSL Termination                    │
│   - Reverse Proxy                      │
│   - Static File Serving                │
│   - Load Balancing (optional)          │
└─────────────────────────────────────────┘
              │
              │ Proxy Pass
              ▼
┌─────────────────────────────────────────┐
│   Next.js Custom Server (Port 3000)    │
│   - Next.js App                        │
│   - Socket.io Server                   │
│   - API Routes                         │
└─────────────────────────────────────────┘
```

### B.2 Required Infrastructure

#### Server Requirements:
- **VPS/Cloud Server**: DigitalOcean, AWS EC2, Linode, Hetzner, etc.
- **OS**: Ubuntu 22.04 LTS (recommended)
- **Minimum Specs**:
  - 2 CPU cores
  - 4GB RAM
  - 20GB SSD
  - Public IP address

#### Software Stack:
- Node.js 18+ (via nvm)
- PM2 (process manager)
- NGINX
- SSL Certificate (Let's Encrypt)

### B.3 Implementation Steps

#### Step 1: Server Setup

**1.1 Initial Server Configuration**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install PM2
npm install -g pm2

# Install NGINX
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

**1.2 Firewall Configuration**
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Step 2: Deploy Application

**2.1 Clone and Setup**
```bash
# Clone repository
git clone <your-repo-url> gameon-app
cd gameon-app

# Install dependencies
npm install

# Build application
npm run build

# Create .env file
nano .env
```

**2.2 Environment Variables**
```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
MONGODB_URI=your-mongodb-uri
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
```

**2.3 Start with PM2**
```bash
# Start application
pm2 start npm --name "gameon-app" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Step 3: NGINX Configuration

**3.1 Create NGINX Config**
```bash
sudo nano /etc/nginx/sites-available/gameon
```

**3.2 NGINX Configuration File**
```nginx
# Upstream for Next.js server
upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/gameon-access.log;
    error_log /var/log/nginx/gameon-error.log;

    # Client body size limit (for file uploads)
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # WebSocket support for Socket.io
    location /api/socket {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # API routes with rate limiting
    location /api/ {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Auth endpoints with stricter rate limiting
    location ~ ^/api/auth/(login|signup|forgot-password) {
        limit_req zone=auth_limit burst=3 nodelay;
        
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (served directly by NGINX for better performance)
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }

    # Public assets
    location /images/ {
        proxy_pass http://nextjs_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600";
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://nextjs_backend;
        add_header Cache-Control "public, max-age=3600";
    }

    # Main application
    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Disable buffering for streaming responses
        proxy_buffering off;
    }
}
```

**3.3 Enable Site**
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/gameon /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

#### Step 4: SSL Certificate Setup

**4.1 Obtain SSL Certificate**
```bash
# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

**4.2 Auto-renewal (already configured by certbot)**

#### Step 5: NGINX Optimization

**5.1 Global NGINX Configuration**
```bash
sudo nano /etc/nginx/nginx.conf
```

Add to `http` block:
```nginx
http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
    
    # File upload size
    client_max_body_size 10M;
    
    # Buffer sizes
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
}
```

**5.2 Reload NGINX**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### B.4 Additional NGINX Features

#### Load Balancing (Multiple App Instances)
```nginx
upstream nextjs_backend {
    least_conn;  # Use least connections algorithm
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    keepalive 64;
}
```

#### Caching Static Assets
```nginx
# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://nextjs_backend;
    proxy_cache_valid 200 30d;
    add_header Cache-Control "public, immutable";
    expires 1y;
    access_log off;
}
```

#### IP Whitelisting for Admin Routes
```nginx
location /admin {
    allow 192.168.1.0/24;  # Your office IP range
    allow 203.0.113.0/24;   # Another allowed IP range
    deny all;
    
    proxy_pass http://nextjs_backend;
    # ... other proxy settings
}
```

#### Custom Error Pages
```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /50x.html {
    root /var/www/html;
}
```

### B.5 Monitoring & Maintenance

#### NGINX Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/gameon-access.log

# Error logs
sudo tail -f /var/log/nginx/gameon-error.log

# Log rotation (automatic with logrotate)
```

#### PM2 Monitoring
```bash
# View logs
pm2 logs gameon-app

# Monitor
pm2 monit

# Restart
pm2 restart gameon-app

# Status
pm2 status
```

#### Health Check Endpoint
Create `/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
```

NGINX health check:
```nginx
location /health {
    proxy_pass http://nextjs_backend;
    access_log off;
}
```

### B.6 Security Hardening

#### NGINX Security Headers (already in config)
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

#### Fail2Ban Setup
```bash
# Install fail2ban
sudo apt install fail2ban -y

# Configure for NGINX
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
```

### B.7 Backup Strategy

#### Application Backup
```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /path/to/gameon-app

# Backup NGINX config
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

---

## 🔄 Migration Checklist

### If Moving from Vercel to VPS:

- [ ] Set up VPS server
- [ ] Install Node.js, PM2, NGINX
- [ ] Clone repository
- [ ] Configure environment variables
- [ ] Build application
- [ ] Configure NGINX
- [ ] Set up SSL certificate
- [ ] Test WebSocket connections
- [ ] Test API routes
- [ ] Update DNS records
- [ ] Monitor logs
- [ ] Set up backups
- [ ] Configure monitoring (optional: UptimeRobot, etc.)

### If Staying on Vercel:

- [ ] Create separate Socket.io server
- [ ] Deploy Socket.io server (Railway/Render)
- [ ] Update client connection URLs
- [ ] Remove custom server files
- [ ] Update package.json scripts
- [ ] Test Socket.io connections
- [ ] Update environment variables
- [ ] Deploy to Vercel
- [ ] Test end-to-end

---

## 📊 Comparison: Vercel vs VPS with NGINX

| Feature | Vercel | VPS + NGINX |
|---------|--------|-------------|
| **NGINX Support** | ❌ No | ✅ Yes |
| **Custom Server** | ❌ No | ✅ Yes |
| **WebSocket Support** | ⚠️ Separate server needed | ✅ Native |
| **SSL/HTTPS** | ✅ Automatic | ✅ Let's Encrypt |
| **Scaling** | ✅ Automatic | ⚠️ Manual |
| **Cost** | 💰 Pay per use | 💰 Fixed monthly |
| **Control** | ⚠️ Limited | ✅ Full |
| **Maintenance** | ✅ Minimal | ⚠️ You manage |
| **CDN** | ✅ Global | ⚠️ Optional (CloudFlare) |
| **Deployment** | ✅ Git push | ⚠️ Manual/CI |

---

## 🎯 Recommendation

### Choose Vercel if:
- You want minimal DevOps overhead
- You need automatic scaling
- You're okay with separate Socket.io server
- You want global CDN
- You prefer serverless architecture

### Choose VPS + NGINX if:
- You need full control
- You want everything in one place
- You need custom server features
- You want to use NGINX features (caching, load balancing)
- You have DevOps expertise
- You want to reduce costs at scale

---

## 📚 Additional Resources

### NGINX Documentation
- [NGINX Official Docs](https://nginx.org/en/docs/)
- [NGINX WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)
- [NGINX Rate Limiting](https://www.nginx.com/blog/rate-limiting-nginx/)

### Deployment Guides
- [DigitalOcean Next.js Deployment](https://www.digitalocean.com/community/tutorials/how-to-deploy-a-next-js-app-to-a-vps)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Let's Encrypt Guide](https://letsencrypt.org/getting-started/)

### Socket.io Deployment
- [Railway Deployment](https://railway.app/)
- [Render Deployment](https://render.com/)
- [Fly.io Deployment](https://fly.io/)

---

## 🚀 Quick Start Commands

### VPS Deployment:
```bash
# On your local machine
ssh user@your-server-ip

# On server
git clone <repo-url>
cd gameon-app
npm install
npm run build
pm2 start npm --name "gameon-app" -- start

# Configure NGINX
sudo nano /etc/nginx/sites-available/gameon
# (paste NGINX config)

sudo ln -s /etc/nginx/sites-available/gameon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d yourdomain.com
```

### Vercel Deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SOCKET_URL
vercel env add MONGODB_URI
```

---

## ⚠️ Important Notes

1. **Socket.io on Vercel**: You MUST deploy Socket.io separately. Vercel serverless functions cannot maintain WebSocket connections.

2. **NGINX on Vercel**: Impossible. Vercel uses its own edge network and doesn't allow reverse proxies.

3. **Custom Server on Vercel**: Not supported. You must use standard Next.js deployment.

4. **WebSocket Timeouts**: Configure appropriate timeouts in NGINX for long-lived connections.

5. **Rate Limiting**: Implement rate limiting in NGINX to protect your API.

6. **Monitoring**: Set up monitoring for both scenarios (UptimeRobot, Sentry, etc.).

7. **Backups**: Always have a backup strategy, especially for VPS deployments.

---

## 📝 Next Steps

1. **Decide on deployment platform** (Vercel vs VPS)
2. **If VPS**: Follow Scenario B implementation steps
3. **If Vercel**: Follow Scenario A implementation steps
4. **Test thoroughly** before going live
5. **Monitor** after deployment
6. **Iterate** based on performance metrics

---

**Last Updated**: 2025-01-XX
**Project**: GameOn Sports Website
**Version**: 1.0
