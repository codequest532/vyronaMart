#!/bin/bash

# VyronaMart VPS Deployment Fix Script
# This script fixes the production deployment issues

echo "🔧 Fixing VyronaMart VPS Deployment..."

# Set working directory
cd /home/vyronamart/VyronaMart || {
    echo "❌ Error: VyronaMart directory not found"
    exit 1
}

echo "📂 Current directory: $(pwd)"

# Stop PM2 processes
echo "⏹️ Stopping PM2 processes..."
pm2 stop vyronamart 2>/dev/null || echo "No PM2 process to stop"
pm2 delete vyronamart 2>/dev/null || echo "No PM2 process to delete"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🏗️ Building production application..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

echo "✅ Build successful"

# Set production environment variables
export NODE_ENV=production
export PORT=5000

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Check if application is responding
echo "🔍 Testing application response..."
sleep 3
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ Application is running successfully on port 5000"
else
    echo "❌ Application not responding (HTTP $response)"
    echo "📝 Checking logs..."
    pm2 logs vyronamart --lines 10
fi

# Test both domains if Nginx is configured
echo "🌐 Testing domain access..."
if command -v nginx >/dev/null 2>&1; then
    echo "Testing codequestzone.com..."
    curl -s -o /dev/null -w "HTTP %{http_code}\n" http://codequestzone.com || echo "Domain not accessible"
    
    echo "Testing vyronamart.in..."
    curl -s -o /dev/null -w "HTTP %{http_code}\n" http://vyronamart.in || echo "Domain not accessible"
else
    echo "⚠️ Nginx not installed - domain routing not available"
fi

echo "🎉 VPS deployment fix completed!"
echo ""
echo "Next steps:"
echo "1. If applications is running: Configure Nginx virtual hosts"
echo "2. If not running: Check logs with 'pm2 logs vyronamart'"
echo "3. For SSL: Run setup-ssl.sh after Nginx configuration"