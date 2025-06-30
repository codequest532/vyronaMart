# VyronaMart VPS Deployment Troubleshooting Guide

## Problem: Both websites (codequestzone.com and vyronamart.in) not working on port 5000

### Root Causes Analysis

1. **Production Build Missing**: The application needs to be built for production
2. **PM2 Not Running**: Production server not started with PM2
3. **Static Files Not Served**: Vite development mode running instead of production assets
4. **Nginx Configuration**: Virtual hosts not properly configured for multiple domains

### Solution Steps

#### Step 1: Fix Production Build and PM2 Deployment

Run on your VPS server:

```bash
# Navigate to your VyronaMart directory
cd /home/vyronamart/VyronaMart

# Stop any existing PM2 processes
pm2 stop vyronamart
pm2 delete vyronamart

# Install dependencies
npm install

# Build production assets
npm run build

# Verify build output
ls -la dist/

# Start with PM2 in production mode
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs vyronamart
```

#### Step 2: Configure Nginx for Multiple Domains

```bash
# Run the multiple domain setup script
chmod +x setup-multiple-domains.sh
sudo ./setup-multiple-domains.sh

# Test Nginx configuration
sudo nginx -t

# Restart Nginx if configuration is valid
sudo systemctl restart nginx
```

#### Step 3: Verify Application is Running

```bash
# Test local application
curl http://localhost:5000/health

# Test domains (after Nginx setup)
curl -I http://codequestzone.com
curl -I http://vyronamart.in
```

### Key Configuration Files

#### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'vyronamart',
    script: 'dist/index.js',
    cwd: '/home/vyronamart/VyronaMart',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

#### Nginx Configuration (in setup-multiple-domains.sh)
```nginx
server {
    listen 80;
    server_name vyronamart.in www.vyronamart.in;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name codequestzone.com www.codequestzone.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Quick Fix Script

Use the provided `fix-vps-deployment.sh` script for automated troubleshooting:

```bash
chmod +x fix-vps-deployment.sh
sudo ./fix-vps-deployment.sh
```

### Verification Checklist

- [ ] Application builds successfully (`npm run build`)
- [ ] PM2 shows vyronamart as "online" (`pm2 status`)
- [ ] Port 5000 responds (`curl localhost:5000/health`)
- [ ] Nginx configuration is valid (`sudo nginx -t`)
- [ ] Both domains resolve to your server IP
- [ ] Domains return HTTP 200 status

### Common Issues and Solutions

#### Issue: "dist/index.js not found"
**Solution**: Run `npm run build` to create production files

#### Issue: PM2 shows "errored" status
**Solution**: Check logs with `pm2 logs vyronamart` and fix any dependency or environment issues

#### Issue: Nginx shows 502 Bad Gateway
**Solution**: Ensure Node.js application is running on port 5000

#### Issue: Domain not accessible
**Solution**: Verify DNS A records point to your server IP address

### Environment Variables Required

Make sure these environment variables are set in your VPS:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret
```

### SSL Setup (After Basic Setup Works)

Once both domains are working with HTTP, run:

```bash
sudo certbot --nginx -d vyronamart.in -d www.vyronamart.in -d codequestzone.com -d www.codequestzone.com
```

This will enable HTTPS for both domains automatically.