# 🚀 Hostinger VPS Deployment Guide for Office Connect MVP

Repository: `https://github.com/Smahesh26/office-connect-mvp.git`

---

## ⚡ 1-Line Deployment Command on Hostinger VPS

Run this single command on your Hostinger VPS terminal to pull the latest GitHub code and deploy both frontend & backend automatically:

```bash
curl -sSL https://raw.githubusercontent.com/Smahesh26/office-connect-mvp/main/deploy-hostinger.sh | bash
```

---

## 🛠️ Step-by-Step Manual Deployment Steps (Hostinger VPS)

### Step 1: SSH into Hostinger VPS
```bash
ssh root@<YOUR_HOSTINGER_VPS_IP>
```

### Step 2: Clone / Pull Latest Code from GitHub
```bash
cd /var/www
git clone https://github.com/Smahesh26/office-connect-mvp.git
cd office-connect-mvp
git pull origin main
```

### Step 3: Deploy Backend (`cambliss-backend`)
```bash
cd /var/www/office-connect-mvp/cambliss-backend
npm install
npx prisma generate
npm run build
pm2 restart cambliss-backend || pm2 start dist/server.js --name "cambliss-backend"
```

### Step 4: Deploy Frontend (`cambliss-frontend`)
```bash
cd /var/www/office-connect-mvp/cambliss-frontend
npm install
npm run build
pm2 restart cambliss-frontend || pm2 start npm --name "cambliss-frontend" -- start
```

### Step 5: Save PM2 & Reload Nginx
```bash
pm2 save
sudo systemctl reload nginx
```

---

## 🌐 Included Services Active on Hostinger VPS:
- 📹 **WebRTC Video Connect Room**: Dual party video calling, camera & microphone feeds, screen share, and on-screen debug console.
- 🛒 **Mercur Multi-Vendor Engine**: Merchant onboarding, product catalogs, split order commissions, and payouts.
- ⚡ **Akaunting ERP Suite**: Accounting cockpit, invoice studio, purchase bills, bank reconciliations, and P&L reports.
