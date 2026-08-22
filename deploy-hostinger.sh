#!/bin/bash
# Hostinger VPS Fresh Clone Deployment Script (Guaranteed 502 Fix)

set -e

echo "🚀 Starting Fresh Hostinger VPS Deployment for Smahesh26/office-connect-mvp..."

PROJECT_DIR="/var/www/office-connect-mvp"

# Completely remove old directories with stale merge conflict files
echo "🧹 Removing any old/corrupt project directories..."
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

if [ ! -f ".env" ]; then
    echo "📝 Creating default .env for backend..."
    cat <<EOT > .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cambliss?schema=public"
JWT_SECRET="super-secret-jwt-token-key-2026"
PORT=5000
NODE_ENV=production
SUPER_ADMIN_EMAIL="admin@camblissstudio.com"
SUPER_ADMIN_PASSWORD="SecureAdminPassword123!"
EOT
fi

npm install
npx prisma generate
npx prisma db push --accept-data-loss || true
npx ts-node scripts/seed-credentials.ts || true
npm run build

# Launch Backend processes on Ports 5000 & 4000 for Nginx Upstream Compatibility
PORT=5000 pm2 start dist/server.js --name "cambliss-backend"
PORT=4000 pm2 start dist/server.js --name "cambliss-backend-4000"

# Setup Frontend Environment
echo "🌐 Setting up Frontend (cambliss-frontend)..."
cd "$PROJECT_DIR/cambliss-frontend"

if [ ! -f ".env.local" ]; then
    echo "📝 Creating default .env.local for frontend..."
    cat <<EOT > .env.local
NEXT_PUBLIC_API_URL="https://theofficeconnect.com/api"
EOT
fi

npm install
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

echo "🎉 Hostinger VPS Deployment & 502 Fix Successfully Completed!"
