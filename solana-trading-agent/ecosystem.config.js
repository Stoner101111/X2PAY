module.exports = {
  apps: [{
    name: 'pump-incinerator',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      HOST: process.env.HOST || '0.0.0.0',
      PUMP_API_KEY: process.env.PUMP_API_KEY,
      SOLANA_PUBLIC_KEY: process.env.SOLANA_PUBLIC_KEY,
      SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY,
      SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
      AUTO_BUY_ENABLED: process.env.AUTO_BUY_ENABLED,
      AUTO_BUY_AMOUNT: process.env.AUTO_BUY_AMOUNT,
      AUTO_BUY_INTERVAL: process.env.AUTO_BUY_INTERVAL
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

