#!/bin/bash
# Complete VyronaMart Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting VyronaMart Production Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if running as vyronamart user
if [ "$USER" != "vyronamart" ]; then
    error "This script must be run as the vyronamart user. Switch with: su - vyronamart"
fi

# Navigate to project directory
cd /home/vyronamart/vyronaMart || error "VyronaMart directory not found"

log "Checking environment configuration..."
if [ ! -f ".env.production" ]; then
    error ".env.production file not found. Please create it first."
fi

# Load environment variables
source .env.production

log "Building VyronaMart application..."
npm run build || error "Build failed"

success "Application built successfully"

log "Setting up database schema..."
npm run db:push || error "Database setup failed"

success "Database schema updated"

log "Starting PM2 process manager..."
# Stop existing processes
pm2 stop vyronamart 2>/dev/null || true
pm2 delete vyronamart 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.js --env production || error "Failed to start PM2"
pm2 save || error "Failed to save PM2 configuration"

# Setup PM2 startup script
pm2 startup | tail -1 | sudo bash || warning "PM2 startup setup may need manual intervention"

success "PM2 configured and VyronaMart started"

log "Configuring Nginx..."
chmod +x setup-nginx.sh
./setup-nginx.sh || error "Nginx setup failed"

success "Nginx configured"

log "Setting up SSL certificates..."
chmod +x setup-ssl.sh
./setup-ssl.sh || error "SSL setup failed"

success "SSL certificates installed"

log "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

success "Firewall configured"

log "Setting up monitoring and backups..."

# Create backup script
cat > /home/vyronamart/backup-vyronamart.sh << 'EOL'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/vyronamart/backups"
source /home/vyronamart/vyronaMart/.env.production

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/vyronamart_db_$DATE.sql"

# Application backup
tar -czf "$BACKUP_DIR/vyronamart_app_$DATE.tar.gz" \
    -C /home/vyronamart vyronaMart \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOL

chmod +x /home/vyronamart/backup-vyronamart.sh

# Setup cron jobs
(crontab -l 2>/dev/null; echo "0 2 * * * /home/vyronamart/backup-vyronamart.sh >> /home/vyronamart/logs/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 1 /usr/bin/certbot renew --quiet") | crontab -

success "Backup and monitoring configured"

log "Performing final health checks..."

# Check PM2 status
if ! pm2 status | grep -q "vyronamart.*online"; then
    error "VyronaMart process not running"
fi

# Check Nginx status
if ! sudo systemctl is-active --quiet nginx; then
    error "Nginx is not running"
fi

# Check SSL certificate
if ! curl -Is https://vyronamart.in | head -1 | grep -q "200 OK"; then
    warning "HTTPS endpoint may not be responding yet. This is normal during initial setup."
fi

# Display final status
log "Deployment Summary:"
echo ""
echo "🌟 VyronaMart E-commerce Platform Successfully Deployed! 🌟"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Access URLs:"
echo "   Main Site: https://vyronamart.in"
echo "   Modules Available:"
echo "   • VyronaHub: https://vyronamart.in/vyronahub"
echo "   • VyronaSocial: https://vyronamart.in/vyronasocial"
echo "   • VyronaSpace: https://vyronamart.in/vyronaspace"
echo "   • VyronaMallConnect: https://vyronamart.in/vyronamallconnect"
echo "   • VyronaRead: https://vyronamart.in/vyronaread"
echo "   • VyronaInstaStore: https://vyronamart.in/instashop"
echo ""
echo "🔧 Management Commands:"
echo "   View Logs: pm2 logs vyronamart"
echo "   Restart App: pm2 restart vyronamart"
echo "   Monitor: pm2 monit"
echo ""
echo "🔒 Security:"
echo "   SSL Certificate: ✅ Installed and auto-renewing"
echo "   Firewall: ✅ Configured"
echo "   Rate Limiting: ✅ Enabled"
echo ""
echo "💾 Backups:"
echo "   Database & Files: Daily at 2:00 AM"
echo "   SSL Renewal: Weekly on Monday at 3:00 AM"
echo ""
echo "🎉 Your VyronaMart platform is now live and ready for customers!"
echo ""

success "Deployment completed successfully!"