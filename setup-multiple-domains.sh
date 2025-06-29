#!/bin/bash
# Setup Multiple Domains on Same Port - VyronaMart

echo "Setting up multiple domains on port 5000..."

# Create Nginx configuration for multiple domains
sudo tee /etc/nginx/sites-available/vyronamart-multi > /dev/null <<'EOF'
# VyronaMart Main Domain
server {
    listen 80;
    server_name vyronamart.in www.vyronamart.in;
    
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
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# Second Domain (example: vyronashop.com)
server {
    listen 80;
    server_name vyronashop.com www.vyronashop.com;
    
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
    }
}

# Third Domain (example: vyronastore.net)
server {
    listen 80;
    server_name vyronastore.net www.vyronastore.net;
    
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
    }
}
EOF

# Enable the multi-domain configuration
sudo ln -sf /etc/nginx/sites-available/vyronamart-multi /etc/nginx/sites-enabled/vyronamart
sudo nginx -t && sudo systemctl reload nginx

echo "Multiple domains configured successfully!"
echo ""
echo "Your VyronaMart app on port 5000 will now respond to:"
echo "• vyronamart.in"
echo "• vyronashop.com" 
echo "• vyronastore.net"
echo ""
echo "To add SSL certificates for all domains:"
echo "sudo certbot --nginx -d vyronamart.in -d www.vyronamart.in -d vyronashop.com -d www.vyronashop.com -d vyronastore.net -d www.vyronastore.net"