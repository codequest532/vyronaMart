#!/usr/bin/env node

// Production server startup script for VyronaMart
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting VyronaMart in production mode...');

// Force production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';
process.env.HOST = '0.0.0.0';

const distPath = path.resolve(__dirname, 'dist', 'public');
const serverPath = path.resolve(__dirname, 'dist', 'index.js');

// Check if build exists
if (!fs.existsSync(distPath) || !fs.existsSync(serverPath)) {
  console.log('📦 Build files missing, running build...');
  
  const build = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed successfully');
      startServer();
    } else {
      console.error('❌ Build failed with code', code);
      process.exit(1);
    }
  });
} else {
  console.log('✅ Build files found, starting server...');
  startServer();
}

function startServer() {
  console.log(`🌐 Starting server on ${process.env.HOST}:${process.env.PORT}`);
  console.log(`📁 Static files: ${distPath}`);
  console.log(`🔧 Server script: ${serverPath}`);
  
  // Start the production server
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: process.env,
    shell: true
  });
  
  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}