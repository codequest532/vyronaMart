#!/usr/bin/env node

// Direct production server for VyronaMart
// This bypasses the development setup and serves built files directly

const express = require('express');
const path = require('path');
const fs = require('fs');

// Force production environment
process.env.NODE_ENV = 'production';

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

// Paths
const distPath = path.resolve(__dirname, 'dist', 'public');
const indexPath = path.resolve(distPath, 'index.html');

console.log('🚀 Starting VyronaMart Production Server');
console.log('📁 Static files path:', distPath);
console.log('📄 Index file path:', indexPath);

// Check if build files exist
if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found:', distPath);
  console.log('Run: npm run build');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ Index.html not found:', indexPath);
  console.log('Run: npm run build');
  process.exit(1);
}

console.log('✅ Build files found');

// Middleware for logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Serve static files with proper headers
app.use(express.static(distPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set proper MIME types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  console.log(`Serving index.html for: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Server Error');
    }
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📂 Serving from: ${distPath}`);
  
  // Test if files are accessible
  fs.readdir(distPath, (err, files) => {
    if (err) {
      console.error('❌ Cannot read dist directory:', err);
    } else {
      console.log('📋 Available files:', files.slice(0, 10));
    }
  });
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});