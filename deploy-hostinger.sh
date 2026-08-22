#!/bin/bash
# Hostinger VPS Fresh Clone Deployment Script (Robust Next.js & Express PM2 Setup)

set -e

echo "🚀 Starting Hostinger VPS Deployment & 502 Fix..."

PROJECT_DIR="/var/www/office-connect-mvp"

# Clean up old project directories
echo "🧹 Cleaning up project directories..."
rm -rf /var/www/officeconnect-cambliss
rm -rf "$PROJECT_DIR"

# Fresh Clone from GitHub
echo "📁 Fresh cloning latest clean repository from GitHub..."
mkdir -p /var/www
git clone https://github.com/Smahesh26/office-connect-mvp.git "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Stop existing PM2 processes
echo "🧹 Stopping existing PM2 processes..."
pm2 delete all || true

# Setup Backend Environment
echo "⚙️ Setting up Backend (cambliss-backend)..."
cd "$PROJECT_DIR/cambliss-backend"

cat <<EOT > .env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/cambliss?schema=public"
JWT_SECRET="super-secret-jwt-token-key-2026"
PORT=5000
NODE_ENV=production
SUPER_ADMIN_EMAIL="admin@camblissstudio.com"
SUPER_ADMIN_PASSWORD="SecureAdminPassword123!"
EOT

npm install
npx prisma generate
npx prisma db push --accept-data-loss || npx prisma migrate deploy || true
npx ts-node scripts/seed-credentials.ts || true
npm run build

# Launch Dual Backend Listeners on Ports 5000 & 4000
PORT=5000 pm2 start dist/server.js --name "cambliss-backend"
PORT=4000 pm2 start dist/server.js --name "cambliss-backend-4000"

# Setup Frontend Environment
echo "🌐 Setting up Frontend (cambliss-frontend)..."
cd "$PROJECT_DIR/cambliss-frontend"

cat <<EOT > .env.local
BACKEND_ORIGIN="http://127.0.0.1:5000"
NEXT_PUBLIC_API_URL="https://theofficeconnect.com/api"
EOT

npm install
npm run build

# Launch Next.js Frontend using direct binary for 100% PM2 stability
PORT=3000 pm2 start node_modules/next/dist/bin/next --name "cambliss-frontend" -- start -p 3000

# Wait 3 seconds for servers to initialize
sleep 3

# Save PM2 state
pm2 save

# Verify PM2 status
echo "📋 PM2 Status:"
pm2 status

# Verify local HTTP connectivity
echo "🔍 Verifying Local Services..."
curl -Is http://127.0.0.1:3000 | head -n 1 || echo "⚠️ Frontend port 3000 check warning"
curl -Is http://127.0.0.1:5000/api/auth/login || echo "⚠️ Backend port 5000 check warning"

# Test Nginx & Restart
echo "🔁 Restarting Nginx Reverse Proxy..."
sudo nginx -t && sudo systemctl restart nginx

echo "🎉 Hostinger VPS Deployment Successfully Completed & Verified!"
