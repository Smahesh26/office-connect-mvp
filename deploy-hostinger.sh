#!/bin/bash
# Hostinger VPS Fresh Clone Deployment Script (Robust PM2 Ecosystem & Nginx Diagnostic)

set -e

echo "🚀 Starting Hostinger VPS Deployment & 502 Fix..."

PROJECT_DIR="/var/www/office-connect-mvp"
TARGET_BRANCH="${1:-master}"

# Clean up legacy directories
rm -rf /var/www/officeconnect-cambliss

# Clean any existing git locks
rm -f "$PROJECT_DIR/.git/index.lock" "$PROJECT_DIR/.git/shallow.lock" 2>/dev/null || true

# Fetch or clone latest code
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "🔄 Updating existing repository on branch $TARGET_BRANCH..."
    cd "$PROJECT_DIR"
    rm -f .git/index.lock .git/shallow.lock 2>/dev/null || true
    if git fetch origin "$TARGET_BRANCH"; then
        git checkout -B "$TARGET_BRANCH" "origin/$TARGET_BRANCH" 2>/dev/null || git checkout "$TARGET_BRANCH"
        git reset --hard "origin/$TARGET_BRANCH"
        git clean -fd
    else
        echo "⚠️ Git fetch failed. Re-cloning fresh clean repository..."
        cd /var/www
        rm -rf "$PROJECT_DIR"
        git clone -b "$TARGET_BRANCH" https://github.com/Smahesh26/office-connect-mvp.git "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
else
    echo "📁 Fresh cloning latest clean repository from GitHub..."
    rm -rf "$PROJECT_DIR"
    mkdir -p /var/www
    git clone -b "$TARGET_BRANCH" https://github.com/Smahesh26/office-connect-mvp.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# Stop existing PM2 processes to release build locks
echo "🧹 Stopping existing PM2 processes..."
pm2 delete all || true

# Setup Backend Environment
echo "⚙️ Setting up Backend (cambliss-backend)..."
cd "$PROJECT_DIR/cambliss-backend"

# Preserve existing Razorpay keys if already set on VPS
EXISTING_RZP_KEY=$(grep -E "^(RAZORPAY_KEY_ID|RAZORPAY_KEY)=" .env 2>/dev/null | tail -n 1 || true)
EXISTING_RZP_SEC=$(grep -E "^(RAZORPAY_KEY_SECRET|RAZORPAY_SECRET)=" .env 2>/dev/null | tail -n 1 || true)

cat <<EOT > .env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/cambliss?schema=public"
JWT_SECRET="super-secret-jwt-token-key-2026"
PORT=5000
NODE_ENV=production
SUPER_ADMIN_EMAIL="admin@camblissstudio.com"
SUPER_ADMIN_PASSWORD="SecureAdminPassword123!"
EOT

if [ -n "$EXISTING_RZP_KEY" ]; then
    echo "$EXISTING_RZP_KEY" >> .env
fi
if [ -n "$EXISTING_RZP_SEC" ]; then
    echo "$EXISTING_RZP_SEC" >> .env
fi

npm install
npx prisma generate
npx prisma db push --accept-data-loss || npx prisma migrate deploy || true
npx tsx scripts/clean-ecommerce-data.ts || npx ts-node scripts/clean-ecommerce-data.ts || true
npx ts-node scripts/seed-credentials.ts || true
npm run build

# Setup Frontend Environment
echo "🌐 Setting up Frontend (cambliss-frontend)..."
cd "$PROJECT_DIR/cambliss-frontend"
rm -rf .next
mkdir -p .next

RZP_PUBLIC_KEY=$(grep -E "^(RAZORPAY_KEY_ID|RAZORPAY_KEY)=" "$PROJECT_DIR/cambliss-backend/.env" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)

cat <<EOT > .env.local
BACKEND_ORIGIN="http://127.0.0.1:5000"
NEXT_PUBLIC_API_URL="https://theofficeconnect.com/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="${RZP_PUBLIC_KEY}"
EOT

npm install
npm run build

# Start ALL applications via PM2 ecosystem.config.js ONLY AFTER BUILD FINISHES
cd "$PROJECT_DIR"
echo "🚀 Starting PM2 Ecosystem..."
pm2 start ecosystem.config.js
pm2 save

# Wait 4 seconds for servers to bind
sleep 4

# Print PM2 Logs & Status
echo "📋 PM2 Status:"
pm2 status

echo "🔍 Active Nginx Proxy Passes:"
grep -rn "proxy_pass" /etc/nginx/ || true

# Verify HTTP Connectivity
echo "🧪 HTTP Health Verification:"
curl -Is http://127.0.0.1:3000/store | head -n 2 || echo "⚠️ Port 3000 unreachable"
curl -Is http://127.0.0.1:5000/api/auth/login | head -n 2 || echo "⚠️ Port 5000 unreachable"
curl -Is http://127.0.0.1:4000/api/auth/login | head -n 2 || echo "⚠️ Port 4000 unreachable"

# Test Nginx & Restart
echo "🔁 Restarting Nginx Reverse Proxy..."
sudo nginx -t && sudo systemctl restart nginx

echo "🎉 Hostinger VPS Deployment Finished!"
