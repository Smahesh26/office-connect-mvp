# AccounTech

A modern rebuild of your accounting/invoicing system: **React (Vite)** frontend,
**Node.js/Express** backend, **PostgreSQL** database. No Docker required — designed to run
directly on a VPS with PM2 + Nginx.

**Scope of this build:** Core Accounting & Invoicing — Dashboard, Customers, Items, Chart of
Accounts, Invoices, Quotes, Transactions (income/expense), Reports (P&L, Aging, Sales by
Customer), Users & Roles, Company Settings. The CRM/Leads/Tasks/Calendar modules from the
original system are intentionally left for a follow-up phase (see the Developer Manual, §7).

## Quick start (local development)

```bash
# 1. Database
sudo -u postgres psql -c "CREATE USER accountech_user WITH PASSWORD 'change_me';"
sudo -u postgres psql -c "CREATE DATABASE accountech OWNER accountech_user;"

# 2. Backend
cd server
cp .env.example .env   # edit DATABASE_URL and JWT secrets
npm install
npm run migrate
npm run seed            # prints your admin login
npm run dev              # http://localhost:4000

# 3. Frontend (new terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

Log in at http://localhost:5173 with the admin email/password printed by `npm run seed`
(default `admin@example.com` / `Admin@12345` unless you changed it in `server/.env` first).

## Documentation

- **[docs/DEVELOPER_MANUAL.md](docs/DEVELOPER_MANUAL.md)** — architecture, local setup, how to
  add fields/tables/pages/integrations, and step-by-step VPS deployment (PM2 + Nginx, no
  Docker).
- **[docs/USER_MANUAL.md](docs/USER_MANUAL.md)** — how to use the app day to day: customers,
  invoices, quotes, transactions, reports, settings.

## Project layout

```
server/   Node.js/Express API + PostgreSQL migrations & seed data
client/   React (Vite) frontend
deploy/   Example Nginx site config
docs/     Developer & user manuals
```
