#!/bin/bash

# Hostinger Deployment Setup Script
echo "Setting up VyronaMart for Hostinger deployment..."

# 1. Install MySQL dependencies
npm install mysql2

# 2. Create production build
echo "Building application for production..."
npm run build

# 3. Create environment file template
cat > .env.production << EOF
# Hostinger MySQL Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

# Application Configuration
NODE_ENV=production
SESSION_SECRET=your_secure_session_secret

# Email Configuration (Brevo/Sendinblue)
BREVO_API_KEY=your_brevo_api_key

# Payment Configuration
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# OpenRouteService for Maps
OPENROUTESERVICE_API_KEY=your_openroute_api_key
EOF

echo "Setup complete! Next steps:"
echo "1. Create MySQL database in Hostinger control panel"
echo "2. Update .env.production with your database credentials"
echo "3. Upload dist/ folder and node_modules to Hostinger"
echo "4. Run database migrations on Hostinger"
echo "5. Configure domain and SSL"