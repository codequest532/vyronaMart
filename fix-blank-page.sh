#!/bin/bash

# Fix VyronaMart Blank Page Issue on VPS
echo "🔧 Fixing VyronaMart blank page issue..."

# Navigate to project directory
cd /home/vyronamart/VyronaMart || {
    echo "❌ Project directory not found"
    exit 1
}

echo "📂 Working directory: $(pwd)"

# Stop PM2 processes
echo "⏹️ Stopping existing PM2 processes..."
pm2 stop vyronamart 2>/dev/null || echo "No process to stop"
pm2 delete vyronamart 2>/dev/null || echo "No process to delete"

# Kill any processes on port 5000
echo "🔪 Killing processes on port 5000..."
sudo fuser -k 5000/tcp 2>/dev/null || echo "No processes on port 5000"

# Remove old build
echo "🗑️ Cleaning old build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🏗️ Building application for production..."
NODE_ENV=production npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build failed - server file not found"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "❌ Build failed - static files not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo "📁 Build contents:"
ls -la dist/

# Create production package.json script if needed
echo "📝 Updating package.json for production..."
if ! grep -q '"start":.*"node dist/index.js"' package.json; then
    npm pkg set scripts.start="NODE_ENV=production node dist/index.js"
fi

# Update ecosystem config for production
echo "⚙️ Updating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
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
    watch: false,
    max_memory_restart: '1G',
    error_file: '/home/vyronamart/logs/vyronamart-error.log',
    out_file: '/home/vyronamart/logs/vyronamart-out.log',
    log_file: '/home/vyronamart/logs/vyronamart-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    min_uptime: '10s',
    max_restarts: 10
  }]
};
EOF

# Create logs directory
mkdir -p /home/vyronamart/logs

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Test application response
echo "🔍 Testing application..."
for i in {1..5}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✅ Application responding with HTTP 200"
        break
    else
        echo "⏳ Attempt $i: HTTP $response, retrying..."
        sleep 2
    fi
done

# Test if it's serving production files
echo "🔍 Checking if serving production files..."
content=$(curl -s http://localhost:5000 2>/dev/null || echo "")
if echo "$content" | grep -q "vite.*client" || echo "$content" | grep -q "/src/main.tsx"; then
    echo "❌ Still serving development files!"
    echo "📝 Checking logs:"
    pm2 logs vyronamart --lines 10
else
    echo "✅ Serving production files correctly"
fi

# Test through Nginx
echo "🌐 Testing domain access..."
if command -v nginx >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
        echo "Testing vyronamart.in..."
        response=$(curl -s -o /dev/null -w "%{http_code}" http://vyronamart.in 2>/dev/null || echo "000")
        echo "vyronamart.in: HTTP $response"
        
        echo "Testing codequestzone.com..."
        response=$(curl -s -o /dev/null -w "%{http_code}" http://codequestzone.com 2>/dev/null || echo "000")
        echo "codequestzone.com: HTTP $response"
    else
        echo "⚠️ Nginx not running"
    fi
else
    echo "⚠️ Nginx not installed"
fi

echo ""
echo "🎉 Fix completed!"
echo ""
echo "✅ Next steps:"
echo "1. Check if vyronamart.in loads properly"
echo "2. If still blank, check logs: pm2 logs vyronamart"
echo "3. If needed, restart Nginx: sudo systemctl restart nginx"