#!/bin/bash
# Hostinger VPS Deployment Script for Smahesh26/office-connect-mvp

set -e

echo "🚀 Starting Hostinger VPS Deployment for Smahesh26/office-connect-mvp..."

# Navigate to project root
PROJECT_DIR="${1:-/var/www/office-connect-mvp}"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 Directory $PROJECT_DIR not found. Cloning repository from GitHub..."
    git clone https://github.com/Smahesh26/office-connect-mvp.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
else
    cd "$PROJECT_DIR"
    echo "🔄 Pulling latest code from GitHub main branch..."
    git fetch origin
    git reset --hard origin/main
fi

# Build & Deploy Backend (cambliss-backend)
echo "⚙️ Deploying Backend (cambliss-backend)..."
cd "$PROJECT_DIR/cambliss-backend"
npm install --production=false
npx prisma generate
npm run build
pm2 restart cambliss-backend || pm2 start npm --name "cambliss-backend" -- run start

# Build & Deploy Frontend (cambliss-frontend)
echo "🌐 Deploying Frontend (cambliss-frontend)..."
cd "$PROJECT_DIR/cambliss-frontend"
npm install --production=false
npm run build
pm2 restart cambliss-frontend || pm2 start npm --name "cambliss-frontend" -- run start

# Reload Nginx Reverse Proxy
echo "🔁 Reloading Nginx..."
sudo systemctl reload nginx || true

echo "✅ Hostinger VPS Deployment Complete! All services active via PM2."
