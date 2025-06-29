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
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: process.env.DATABASE_URL,
      SESSION_SECRET: process.env.SESSION_SECRET,
      BREVO_API_KEY: process.env.BREVO_API_KEY,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
      OPENROUTESERVICE_API_KEY: process.env.OPENROUTESERVICE_API_KEY,
      VITE_OPENROUTESERVICE_API_KEY: process.env.VITE_OPENROUTESERVICE_API_KEY,
      REPL_ID: process.env.REPL_ID,
      ISSUER_URL: process.env.ISSUER_URL,
      REPLIT_DOMAINS: process.env.REPLIT_DOMAINS
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
    listen_timeout: 10000
  }]
};