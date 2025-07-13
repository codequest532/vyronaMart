module.exports = {
  apps: [{
    name: 'vyronamart',
    script: 'server/index.ts',
    interpreter: 'tsx',
    cwd: '/var/www/VyronaMart',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5050,
      NEON_DATABASE_URL: 'postgresql://vyronamart_user:vyronamart_password@localhost:5432/vyronamart_db',
      VYRONAMART_BREVO_API_KEY: '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',
      OPENROUTESERVICE_API_KEY: '5b3ce3597851110001cf6248ff45624d1a724d169107b829d3560720'
    }
  }]
};
