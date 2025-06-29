# VyronaMart Production Deployment Guide

## Step 1: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/vyronamart
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name vyronamart.in www.vyronamart.in;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:5000;
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
        proxy_pass http://localhost:5000;
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
        alias /home/vyronamart/vyronaMart/dist/public/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # File uploads
    location /uploads {
        alias /home/vyronamart/vyronaMart/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

Enable the site:

```bash
# Enable the site and remove default
sudo ln -s /etc/nginx/sites-available/vyronamart /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Step 2: Set Up PM2 Process Management

Create PM2 ecosystem configuration:

```bash
# Navigate to project directory
cd /home/vyronamart/vyronaMart

# Create ecosystem.config.js
nano ecosystem.config.js
```

Add this PM2 configuration:

```javascript
module.exports = {
  apps: [{
    name: 'vyronamart',
    script: 'node',
    args: 'dist/index.js',
    cwd: '/home/vyronamart/vyronaMart',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    exec_mode: 'fork',
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

Start with PM2:

```bash
# Create logs directory
mkdir -p /home/vyronamart/logs

# Load environment and start
source .env.production
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Follow the generated command to enable startup
```

## Step 3: Configure SSL with Let's Encrypt

Install Certbot:

```bash
# Install Certbot
sudo apt update
sudo apt install snapd
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Get SSL certificate:

```bash
# Get certificate for your domain
sudo certbot --nginx -d vyronamart.in -d www.vyronamart.in
```

The SSL configuration will be automatically added to your Nginx config.

Set up auto-renewal:

```bash
# Add auto-renewal to crontab
echo "0 3 * * 1 /usr/bin/certbot renew --quiet" | sudo crontab -
```

## Step 4: Configure Firewall

```bash
# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 5: Set Up Monitoring and Backups

Create backup script:

```bash
# Create backup script
nano /home/vyronamart/backup-vyronamart.sh
```

Add backup script content:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/vyronamart/backups"
source /home/vyronamart/vyronaMart/.env.production

mkdir -p "$BACKUP_DIR"

# Database backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/vyronamart_db_$DATE.sql"

# Application backup
tar -czf "$BACKUP_DIR/vyronamart_app_$DATE.tar.gz" \
    -C /home/vyronamart vyronaMart \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git

# Clean old backups (keep 7 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:

```bash
# Make backup script executable
chmod +x /home/vyronamart/backup-vyronamart.sh

# Add to crontab for daily backups
crontab -e
# Add this line:
# 0 2 * * * /home/vyronamart/backup-vyronamart.sh >> /home/vyronamart/logs/backup.log 2>&1
```

## Step 6: Final Verification

Check all services:

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check application logs
pm2 logs vyronamart --lines 20

# Test HTTPS
curl -I https://vyronamart.in
```

## Management Commands

### Application Management
```bash
# View application status
pm2 status

# Restart application
pm2 restart vyronamart

# View logs
pm2 logs vyronamart

# Monitor resources
pm2 monit
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

### SSL Certificate Management
```bash
# Check certificate status
sudo certbot certificates

# Manual renewal test
sudo certbot renew --dry-run
```

## Success Indicators

✅ PM2 shows VyronaMart as "online"  
✅ Nginx returns 200 OK for https://vyronamart.in  
✅ All 6 VyronaMart modules accessible  
✅ SSL certificate valid and auto-renewing  
✅ Firewall configured and active  
✅ Automated backups scheduled  

Your VyronaMart e-commerce platform is now live at **https://vyronamart.in** with enterprise-grade infrastructure!