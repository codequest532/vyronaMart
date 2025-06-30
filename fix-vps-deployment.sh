#!/bin/bash

# Complete VPS Deployment Fix for VyronaMart
echo "🚀 Fixing VyronaMart VPS deployment..."

# Navigate to project directory
cd /home/vyronamart/VyronaMart || {
    echo "❌ Project directory not found"
    exit 1
}

# Stop any existing PM2 processes
echo "⏹️ Stopping existing processes..."
pm2 stop vyronamart 2>/dev/null || true
pm2 delete vyronamart 2>/dev/null || true

# Kill any processes on ports 5000-5001
echo "🔪 Clearing ports..."
sudo fuser -k 5000/tcp 2>/dev/null || true
sudo fuser -k 5001/tcp 2>/dev/null || true

# Clean and rebuild
echo "🧹 Cleaning old build files..."
rm -rf dist/ node_modules/.vite

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend only (skip backend build for now)
echo "🏗️ Building frontend..."
NODE_ENV=production npm run build:frontend || {
    echo "❌ Frontend build failed, trying regular build..."
    NODE_ENV=production npm run build
}

# Check if build was successful
if [ ! -d "dist/public" ]; then
    echo "❌ Build failed - dist/public not found"
    echo "📂 Contents of dist/:"
    ls -la dist/ 2>/dev/null || echo "dist/ directory doesn't exist"
    exit 1
fi

echo "✅ Build successful"
echo "📁 Build contents:"
ls -la dist/public/

# Make production server executable
chmod +x production-server.js

# Test the production server directly first
echo "🧪 Testing production server..."
timeout 10s node production-server.js &
SERVER_PID=$!
sleep 3

# Test if server responds
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Production server working"
    kill $SERVER_PID 2>/dev/null || true
else
    echo "❌ Production server not responding"
    kill $SERVER_PID 2>/dev/null || true
    
    # Try serving with simple static server as fallback
    echo "🔄 Trying fallback static server..."
    cat > simple-server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = 5001;

app.use(express.static(path.join(__dirname, 'dist/public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});
EOF
    
    # Update ecosystem to use simple server
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vyronamart',
    script: 'simple-server.js',
    cwd: '/home/vyronamart/VyronaMart',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001,
      HOST: '0.0.0.0'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
fi

# Create logs directory
mkdir -p /home/vyronamart/logs

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js --env production

# Wait and test
sleep 5
echo "📊 PM2 Status:"
pm2 status

echo "🔍 Testing application..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
    echo "✅ Application responding with HTTP 200"
    
    # Save PM2 config
    pm2 save
    
    # Test content
    content=$(curl -s http://localhost:5001 2>/dev/null | head -c 200)
    if echo "$content" | grep -q "<!DOCTYPE html>"; then
        echo "✅ Serving HTML content correctly"
    else
        echo "⚠️ Not serving proper HTML content"
        echo "Content preview: $content"
    fi
    
    # Test through nginx
    echo "🌐 Testing nginx proxy..."
    sudo nginx -t && sudo systemctl reload nginx
    
    echo "✅ Deployment completed successfully!"
    echo "🎉 VyronaMart should now be accessible at:"
    echo "   - http://vyronamart.in"
    echo "   - http://codequestzone.com"
    echo "   - Direct: http://your-server-ip:5001"
    
else
    echo "❌ Application not responding (HTTP $response)"
    echo "📝 Checking PM2 logs:"
    pm2 logs vyronamart --lines 20
fi