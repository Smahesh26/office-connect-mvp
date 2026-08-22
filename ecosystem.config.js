module.exports = {
  apps: [
    {
      name: 'cambliss-backend',
      cwd: '/var/www/office-connect-mvp/cambliss-backend',
      script: 'dist/server.js',
      env: {
        PORT: 5000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'cambliss-backend-4000',
      cwd: '/var/www/office-connect-mvp/cambliss-backend',
      script: 'dist/server.js',
      env: {
        PORT: 4000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'cambliss-frontend',
      cwd: '/var/www/office-connect-mvp/cambliss-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    }
  ]
};
