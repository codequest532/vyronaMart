#!/bin/bash
# VyronaMart SSL Setup Script

echo "Setting up SSL certificates for VyronaMart..."

# Install Certbot
sudo apt update
sudo apt install snapd
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
sudo certbot --nginx -d vyronamart.in -d www.vyronamart.in --non-interactive --agree-tos --email admin@vyronamart.in

# Set up auto-renewal
echo "0 3 * * 1 /usr/bin/certbot renew --quiet" | sudo crontab -

# Update Nginx configuration for SSL
sudo tee /etc/nginx/sites-available/vyronamart > /dev/null <<'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name vyronamart.in www.vyronamart.in;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name vyronamart.in www.vyronamart.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/vyronamart.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vyronamart.in/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;

    # Main application proxy
    location / {
        limit_req zone=general burst=20 nodelay;
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
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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

    # Static assets with aggressive caching
    location /assets {
        alias /home/vyronamart/vyronaMart/dist/public/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # Enable compression for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # File uploads
    location /uploads {
        alias /home/vyronamart/vyronaMart/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Client max body size for file uploads
    client_max_body_size 50M;
}
EOF

# Test and reload Nginx
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "SSL setup completed successfully!"
    echo "VyronaMart is now accessible at https://vyronamart.in"
else
    echo "Nginx configuration error"
    exit 1
fi