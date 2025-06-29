module.exports = {
  apps: [{
    name: 'vyronamart',
    script: 'dist/index.js',
    cwd: '/home/vyronamart/VyronaMart',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
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