module.exports = {
  apps: [
    {
      name: 'accountech-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,          // increase to 'max' for cluster mode once you've tested it
      exec_mode: 'fork',     // switch to 'cluster' for multi-core scaling
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '300M',
      autorestart: true,
      watch: false,
      out_file: '/var/log/accountech/api-out.log',
      error_file: '/var/log/accountech/api-error.log',
      time: true,
    },
  ],
};
