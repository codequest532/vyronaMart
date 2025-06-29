# VyronaMart Hostinger VPS Deployment Guide

## Prerequisites

- Hostinger VPS account with Ubuntu 20.04/22.04
- Domain name (optional, can use IP address)
- Neon PostgreSQL database (existing)
- Local PostgreSQL backup (if migrating from existing database)

## Step 1: VPS Initial Setup

### 1.1 Connect to VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Create Non-Root User
```bash
adduser vyronamart
usermod -aG sudo vyronamart
su - vyronamart
```

## Step 2: Install Required Software

### 2.1 Install Node.js (v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 2.2 Install PM2 Process Manager
```bash
sudo npm install -g pm2
```

### 2.3 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.4 Install Git
```bash
sudo apt install git -y
```

### 2.5 Install PostgreSQL Client (for local database option)
```bash
sudo apt install postgresql-client-14 -y
```

## Step 3: Setup Local PostgreSQL Database (Option A)

### 3.1 Install PostgreSQL Server
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.2 Configure PostgreSQL
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE vyronamart;
CREATE USER vyronamart_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vyronamart TO vyronamart_user;
\q
```

### 3.3 Configure PostgreSQL Access
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```
Update: `listen_addresses = 'localhost'`

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```
Add: `local   vyronamart    vyronamart_user                     md5`

```bash
sudo systemctl restart postgresql
```

## Step 4: Deploy VyronaMart Application

### 4.1 Clone Repository
```bash
cd /home/vyronamart
git clone https://github.com/your-username/vyronamart.git
cd vyronamart
```

### 4.2 Install Dependencies
```bash
npm install
```

### 4.3 Build Application
```bash
npm run build
```

## Step 5: Environment Configuration

### 5.1 Create Production Environment File
```bash
nano .env.production
```

**For Neon Database (Option A):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/vyronamart?sslmode=require
SESSION_SECRET=your_super_secure_session_secret_here
BREVO_API_KEY=your_brevo_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
OPENROUTE_API_KEY=your_openroute_api_key
REPL_ID=vyronamart-production
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=yourdomain.com,www.yourdomain.com
PORT=5001
```

**For Local PostgreSQL (Option B):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://vyronamart_user:your_secure_password@localhost:5432/vyronamart
SESSION_SECRET=your_super_secure_session_secret_here
BREVO_API_KEY=your_brevo_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
OPENROUTE_API_KEY=your_openroute_api_key
REPL_ID=vyronamart-production
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=yourdomain.com,www.yourdomain.com
PORT=5001
```

### 5.2 Set Environment Variables
```bash
export NODE_ENV=production
source .env.production
```

## Step 6: Database Migration

### 6.1 For Neon Database
```bash
# Database schema will be created automatically on first run
npm run db:push
```

### 6.2 For Local PostgreSQL
```bash
# Run database migrations
npm run db:push

# If migrating from existing database, export from Neon first:
# pg_dump "postgresql://username:password@ep-xxx.neon.tech/vyronamart?sslmode=require" > backup.sql

# Then import to local PostgreSQL:
# psql -U vyronamart_user -d vyronamart -f backup.sql
```

## Step 7: PM2 Configuration

### 7.1 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'vyronamart',
    script: 'npm',
    args: 'start',
    cwd: '/home/vyronamart/vyronamart',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/vyronamart/logs/vyronamart-error.log',
    out_file: '/home/vyronamart/logs/vyronamart-out.log',
    log_file: '/home/vyronamart/logs/vyronamart-combined.log',
    time: true
  }]
};
```

### 7.2 Create Logs Directory
```bash
mkdir -p /home/vyronamart/logs
```

### 7.3 Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 8: Nginx Configuration

### 8.1 Create Nginx Site Configuration
```bash
sudo nano /etc/nginx/sites-available/vyronamart
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /assets {
        alias /home/vyronamart/vyronamart/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    location /uploads {
        alias /home/vyronamart/vyronamart/uploads;
        expires 30d;
    }
}
```

### 8.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/vyronamart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: SSL Certificate (Let's Encrypt)

### 9.1 Install Certbot
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 9.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 10: Firewall Configuration

### 10.1 Configure UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5001  # Application port
sudo ufw enable
```

## Step 11: Monitoring and Maintenance

### 11.1 Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/vyronamart
```

```
/home/vyronamart/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 vyronamart vyronamart
    postrotate
        pm2 reload vyronamart
    endscript
}
```

### 11.2 Setup Automatic Updates
```bash
# Create update script
nano /home/vyronamart/update-vyronamart.sh
```

```bash
#!/bin/bash
cd /home/vyronamart/vyronamart
git pull origin main
npm install
npm run build
pm2 reload vyronamart
```

```bash
chmod +x /home/vyronamart/update-vyronamart.sh
```

## Step 12: Database Backup Strategy

### 12.1 For Neon Database
```bash
# Create backup script
nano /home/vyronamart/backup-neon.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL" > /home/vyronamart/backups/vyronamart_backup_$DATE.sql
find /home/vyronamart/backups -name "*.sql" -mtime +7 -delete
```

### 12.2 For Local PostgreSQL
```bash
# Create backup script
nano /home/vyronamart/backup-local.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U vyronamart_user -d vyronamart > /home/vyronamart/backups/vyronamart_backup_$DATE.sql
find /home/vyronamart/backups -name "*.sql" -mtime +7 -delete
```

### 12.3 Setup Automated Backups
```bash
mkdir -p /home/vyronamart/backups
chmod +x /home/vyronamart/backup-*.sh

# Add to crontab
crontab -e
```

Add line for daily backups:
```
0 2 * * * /home/vyronamart/backup-neon.sh  # or backup-local.sh
```

## Step 13: Testing and Verification

### 13.1 Test Application
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs vyronamart

# Test HTTP response
curl -I http://yourdomain.com

# Test HTTPS response
curl -I https://yourdomain.com
```

### 13.2 Database Connection Test
```bash
# Test database connection
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => console.log('Database connected:', res.rows[0])).catch(err => console.error('Database error:', err));
"
```

## Step 14: Performance Optimization

### 14.1 Enable Gzip Compression
```bash
sudo nano /etc/nginx/nginx.conf
```

Add in http block:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
```

### 14.2 Setup Redis for Session Storage (Optional)
```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
```

Update .env to use Redis:
```env
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

### Common Issues and Solutions

1. **Application won't start**
   - Check logs: `pm2 logs vyronamart`
   - Verify environment variables: `pm2 env vyronamart`
   - Check database connection

2. **Database connection issues**
   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database exists and user has permissions

3. **Nginx 502 errors**
   - Check if application is running: `pm2 status`
   - Verify port configuration
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

4. **SSL certificate issues**
   - Verify domain DNS points to VPS IP
   - Check certificate status: `sudo certbot certificates`
   - Renew if needed: `sudo certbot renew`

## Maintenance Commands

```bash
# Restart application
pm2 restart vyronamart

# View real-time logs
pm2 logs vyronamart --lines 100

# Update application
cd /home/vyronamart/vyronamart && ./update-vyronamart.sh

# Backup database
./backup-neon.sh  # or ./backup-local.sh

# Check system resources
htop
df -h
free -h

# Monitor Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

This guide provides complete deployment instructions for both Neon and local PostgreSQL database options with production-ready configurations.