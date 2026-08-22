#!/bin/bash
# Hostinger VPS Automated Deployment & 502 Bad Gateway Fix Script

set -e

echo "🚀 Starting Hostinger VPS Deployment & 502 Fix..."

# Detect project root directory
if [ -d "/var/www/office-connect-mvp" ]; then
    PROJECT_DIR="/var/www/office-connect-mvp"
elif [ -d "/var/www/officeconnect-cambliss" ]; then
    PROJECT_DIR="/var/www/officeconnect-cambliss"
else
    PROJECT_DIR="/var/www/office-connect-mvp"
    mkdir -p "$PROJECT_DIR"
    git clone https://github.com/Smahesh26/office-connect-mvp.git "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"
echo "📁 Working Directory: $PROJECT_DIR"

# Clean local working tree to prevent git merge conflict markers on VPS
echo "🧹 Cleaning git working directory on VPS..."
git clean -fd
git checkout .
git fetch --all
git checkout main || git checkout master || true
git reset --hard origin/main || git reset --hard origin/master
git clean -fd

# Stop existing PM2 processes to prevent port conflicts
echo "🧹 Cleaning up PM2 processes..."
pm2 delete all || true

# Deploy Backend (cambliss-backend)
echo "⚙️ Building & Starting Backend (cambliss-backend)..."
cd "$PROJECT_DIR/cambliss-backend"
npm install
npx prisma generate
npx prisma migrate deploy || true
npm run build
pm2 start dist/server.js --name "cambliss-backend"

# Deploy Frontend (cambliss-frontend)
echo "🌐 Building & Starting Frontend (cambliss-frontend)..."
cd "$PROJECT_DIR/cambliss-frontend"
npm install
rm -rf .next
npm run build
pm2 start npx --name "cambliss-frontend" -- next start -p 3000

# Save PM2 state
pm2 save

# Verify PM2 status
echo "📋 PM2 Status:"
pm2 status

# Test Nginx & Restart
echo "🔁 Restarting Nginx Reverse Proxy..."
sudo nginx -t && sudo systemctl restart nginx

echo "🎉 502 Bad Gateway Fixed! Hostinger VPS Deployment Complete."
