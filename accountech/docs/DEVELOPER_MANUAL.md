# AccounTech — Developer Manual

Stack: **React (Vite)** frontend · **Node.js/Express** backend · **PostgreSQL** database.
No Docker. Designed to run directly on a VPS behind Nginx, managed by PM2.

This manual covers architecture, local setup, how to extend the system (add fields, tables,
endpoints, pages, integrations), and how to deploy and maintain it in production.

---

## 1. Project structure

```
accountech/
├── server/                  Node.js/Express API
│   ├── src/
│   │   ├── app.js           Express app assembly (middleware + route mounting)
│   │   ├── server.js        Entry point (app.listen)
│   │   ├── config/db.js     PostgreSQL connection pool + query() helper
│   │   ├── middleware/      auth.js (JWT + permissions), errorHandler.js
│   │   ├── controllers/     One file per resource (invoices, quotes, customers, ...)
│   │   ├── routes/          Express routers, one per resource, mounted in app.js
│   │   └── utils/           totals.js, numbering.js, pdf.js, jwt.js, activityLog.js, crudFactory.js
│   ├── db/
│   │   ├── migrations/      Plain numbered .sql files, applied in order
│   │   ├── migrate.js       Migration runner (tracks applied files in schema_migrations)
│   │   └── seed.js          Creates the first company/admin/chart of accounts/etc.
│   ├── ecosystem.config.js  PM2 process definition
│   ├── .env.example         Copy to .env and fill in
│   └── package.json
│
├── client/                  React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── api/             axios client (client.js) + endpoint functions (endpoints.js)
│   │   ├── context/          AuthContext.jsx (login state, token refresh)
│   │   ├── components/       layout/ (sidebar+topbar), ui/ (buttons, cards, modal, table),
│   │   │                      documents/ (LineItemsEditor used by invoices & quotes)
│   │   ├── pages/            One file per screen (Dashboard, Invoices, InvoiceForm, ...)
│   │   ├── routes/           ProtectedRoute.jsx
│   │   ├── utils/format.js   Money/date formatting helpers
│   │   └── styles/index.css  Tailwind + design-system utility classes (.btn-primary, .card, .stamp-*)
│   ├── tailwind.config.js    Design tokens (colors, fonts)
│   ├── vite.config.js        Dev server + /api proxy to the backend
│   └── package.json
│
└── deploy/
    └── accountech.nginx.conf Example Nginx site config
```

**Why this shape?** Every resource (invoices, customers, ...) has a matching controller, route
file, and (on the frontend) page — so once you understand one, you understand all of them.
There's no ORM; the query() helper in `config/db.js` runs plain parameterized SQL, so anyone
who knows SQL can read exactly what every endpoint does. This is a deliberate simplicity
choice — you can swap in an ORM (Prisma, Knex, Sequelize) later if the project grows enough
to want it, but nothing here depends on one.

---

## 2. How a request flows through the system

Example: loading the Invoices list page.

1. **Browser** → React Router renders `pages/Invoices.jsx`, which calls `invoicesApi.list()`
   from `api/endpoints.js`.
2. **Axios client** (`api/client.js`) attaches the JWT access token as an `Authorization: Bearer`
   header, and sends the request to `/api/invoices`. If the access token is expired, a response
   interceptor automatically calls `/api/auth/refresh` (using the httpOnly refresh cookie) and
   retries the original request once.
3. **Nginx** (production) or **Vite dev proxy** (development) forwards `/api/*` to the Express
   server on port 4000.
4. **Express** (`src/app.js`) routes `GET /api/invoices` to `routes/invoices.js`, which runs
   `requireAuth` (verifies the JWT, loads the user + role permissions) then
   `requirePermission('invoices.view')`, then calls `controllers/invoiceController.js#list`.
5. **Controller** runs a parameterized SQL query via `config/db.js`, joining `invoices` with
   `customers` and `currencies`, and returns JSON.
6. **React** renders the table.

Writes (e.g. creating an invoice) follow the same path but the controller opens a
transaction (`getClient()` → `BEGIN` / `COMMIT` / `ROLLBACK`) because an invoice write touches
multiple tables (`invoices`, `invoice_items`, and the company's `next_invoice_no` counter) and
must not partially apply if something fails.

---

## 3. Local development setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (locally installed, or a remote instance you can reach)

### 3.1 Database
```bash
sudo -u postgres psql -c "CREATE USER accountech_user WITH PASSWORD 'change_me';"
sudo -u postgres psql -c "CREATE DATABASE accountech OWNER accountech_user;"
```

### 3.2 Backend
```bash
cd server
cp .env.example .env      # edit DATABASE_URL, JWT secrets, etc.
npm install
npm run migrate           # creates all tables
npm run seed               # creates a company, admin user, chart of accounts, tax rates, etc.
npm run dev                 # starts on http://localhost:4000 with nodemon (auto-restart)
```
The seed script prints the admin login (from `.env`: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`,
defaults to `admin@example.com` / `Admin@12345`). **Log in and change this password immediately
in any environment other than local development.**

### 3.3 Frontend
```bash
cd client
cp .env.example .env       # only needed if the API isn't same-origin
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :4000
```
Open http://localhost:5173 and log in with the seeded admin account.

---

## 4. Authentication & permissions model

- **Access tokens**: short-lived JWTs (15 min default), sent as `Authorization: Bearer <token>`,
  verified by `middleware/auth.js#requireAuth` on every protected route.
- **Refresh tokens**: long-lived JWTs (30 days default), stored **hashed** (SHA-256) in the
  `refresh_tokens` table, delivered to the browser as an **httpOnly cookie** scoped to
  `/api/auth` so client-side JS can never read it. `POST /api/auth/refresh` verifies it against
  the hash and issues a new access token.
- **Roles & permissions**: each `role` row has a `permissions` JSONB column, e.g.
  `{ "invoices.create": true, "users.manage": false }`. `requirePermission('invoices.create')`
  checks `req.user.permissions['invoices.create']`. Three roles are seeded (`admin`,
  `accountant`, `staff`) — see `db/seed.js` for the exact permission map. To add a new
  permission:
  1. Add the key to the relevant role(s) in the `roles.permissions` JSON (via SQL or a small
     admin UI you build later — there's no UI for editing raw permissions yet, by design, to
     avoid an admin locking themselves out).
  2. Guard the route with `requirePermission('your.newkey')`.
  3. Guard the frontend UI with `const { can } = useAuth(); {can('your.newkey') && <button/>}`.
     Remember: **frontend checks are UX only** — the backend check is what actually protects
     the data, so always add both.

---

## 5. Adding a new field to an existing entity (example: add "PO number" to invoices)

1. **Migration** — create `server/db/migrations/002_add_invoice_po_number.sql`:
   ```sql
   ALTER TABLE invoices ADD COLUMN po_number VARCHAR(50);
   ```
   Run `npm run migrate` (it tracks which files already ran, so this is safe to run again later).
2. **Controller** — in `invoiceController.js`, add `po_number` to the `INSERT`/`UPDATE` column
   lists and bound parameters in `create()` and `update()`.
3. **Frontend form** — in `InvoiceForm.jsx`, add a state variable and an `<input>`, and include
   it in the `payload` object sent to `invoicesApi.create()`.
4. **Frontend detail view** — display it in `InvoiceDetail.jsx` if useful.

## 6. Adding a brand-new resource (example: "Recurring Invoices")

1. Add a table in a new migration file (`003_recurring_invoices.sql`).
2. Create `server/src/controllers/recurringInvoiceController.js` (copy the shape of
   `invoiceController.js` — list/getOne/create/update/remove).
3. Create `server/src/routes/recurringInvoices.js`, mounting the controller behind
   `requireAuth` + `requirePermission(...)`.
4. Mount it in `server/src/app.js`:
   `app.use('/api/recurring-invoices', require('./routes/recurringInvoices'));`
5. Add `recurringInvoicesApi` to `client/src/api/endpoints.js`.
6. Add a page under `client/src/pages/` and a route in `client/src/App.jsx`.
7. Add a sidebar link in `client/src/components/layout/AppLayout.jsx`.

For simple lookup-style tables (a name + a couple of flags, company-scoped, no special
business logic), you don't need a bespoke controller — use `utils/crudFactory.js` the way
`routes/lookups.js` does for tax rates, payment methods, and categories.

## 7. Adding the CRM/Leads/Tasks/Calendar modules (planned follow-up)

This build intentionally covers **Accounting + Invoicing** only, per the phased approach we
agreed on. To add CRM/Leads/Tasks/Calendar later:
- They can live as new tables + controllers + routes + pages, following the exact pattern
  above — nothing about the current architecture needs to change.
- If leads should convert into customers, model that the same way quotes convert into
  invoices (`quoteController.js#convertToInvoice` is a good template — it runs the whole
  conversion inside one transaction).
- A natural first table set: `leads`, `lead_sources`, `lead_status`, `tasks`, `calendar_events`.

## 8. Integrating a payment gateway or other third-party API

- Add the API key(s) to `server/.env` (never commit real keys).
- Create `server/src/utils/<provider>.js` wrapping the provider's SDK/HTTP calls.
- Call it from a controller — e.g. a `POST /api/invoices/:id/pay-online` endpoint that creates
  a hosted checkout session and, on the provider's webhook, records a `transactions` row the
  same way `transactionController.js#create` does (so invoice balances and account balances
  stay correct automatically).
- Webhooks need their own unauthenticated route (they can't send your JWT), verified instead
  by the provider's signature header — add it as its own router mounted before
  `requireAuth` is applied.

## 9. Extending the frontend design system

All shared visual styles live in `client/src/styles/index.css` as Tailwind `@layer components`
classes (`.btn-primary`, `.btn-brass`, `.card`, `.input`, `.stamp-*`, `.num`, `.ledger-total`).
Reuse these rather than one-off Tailwind strings so the whole app stays visually consistent.
Colors and fonts are defined once in `client/tailwind.config.js` under `theme.extend` — change
them there to re-theme the entire app.

The `.num` class applies tabular monospace figures to every monetary value — always wrap
money and quantities in it (see any existing page for examples) so columns of numbers stay
vertically aligned, which is the app's signature visual detail.

---

## 10. Deploying to a VPS (no Docker)

Tested against a plain Ubuntu 22.04/24.04 VPS. Adjust paths/usernames as needed.

### 10.1 Server prep
```bash
sudo apt update && sudo apt install -y nginx postgresql postgresql-contrib git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 10.2 Database
```bash
sudo -u postgres psql -c "CREATE USER accountech_user WITH PASSWORD 'STRONG_RANDOM_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE accountech OWNER accountech_user;"
```

### 10.3 Get the code onto the server
```bash
sudo mkdir -p /var/www/accountech
sudo chown $USER:$USER /var/www/accountech
cd /var/www/accountech
# copy/clone the project here (git clone, scp, rsync — your choice)
```

### 10.4 Backend
```bash
cd /var/www/accountech/server
cp .env.example .env
nano .env    # set DATABASE_URL to the accountech_user credentials above,
             # set strong random JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
             # (e.g. `openssl rand -hex 32` twice),
             # set CLIENT_ORIGIN to https://app.yourdomain.com
npm install --omit=dev
npm run migrate
npm run seed
sudo mkdir -p /var/log/accountech
sudo chown $USER:$USER /var/log/accountech
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # follow the printed instructions to enable PM2 on server reboot
```

### 10.5 Frontend
```bash
cd /var/www/accountech/client
npm install
npm run build     # outputs static files to client/dist
```
There's nothing to "run" for the frontend in production — Nginx serves the `dist/` folder
directly as static files (see below). Re-run `npm run build` after every frontend change and
Nginx will pick up the new files immediately (no restart needed).

### 10.6 Nginx
```bash
sudo cp deploy/accountech.nginx.conf /etc/nginx/sites-available/accountech
sudo nano /etc/nginx/sites-available/accountech   # set your real domain
sudo ln -s /etc/nginx/sites-available/accountech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10.7 HTTPS
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.yourdomain.com
```
Certbot edits the Nginx config to add a 443 server block and sets up auto-renewal.

### 10.8 Firewall (if using ufw)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```
Note: the Node.js API on port 4000 should **not** be exposed publicly — Nginx proxies to it over
localhost only, so you don't need to (and shouldn't) open port 4000 in the firewall.

---

## 11. Updating a live deployment

```bash
cd /var/www/accountech
git pull                      # or however you sync new code
cd server && npm install --omit=dev && npm run migrate && pm2 restart accountech-api
cd ../client && npm install && npm run build
```
`npm run migrate` is safe to run every deploy — it skips any migration file it already applied.

## 12. Backups

The entire application state lives in PostgreSQL (no local file uploads in this module yet).
A simple daily backup:
```bash
pg_dump -U accountech_user -h 127.0.0.1 accountech | gzip > /var/backups/accountech-$(date +%F).sql.gz
```
Add that as a cron job, and copy the resulting files off-server (S3, another machine, etc.).
To restore: `gunzip -c backup.sql.gz | psql -U accountech_user -h 127.0.0.1 accountech`.

## 13. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls 502 | Backend not running — check `pm2 status` and `pm2 logs accountech-api` |
| "Invalid or expired token" right after login | Server clock or `JWT_ACCESS_SECRET` mismatch between requests (e.g. load-balanced across two differently-configured instances) |
| Migration fails partway | It runs inside a transaction and rolls back automatically — fix the SQL and re-run `npm run migrate` |
| CORS errors in browser console | `CLIENT_ORIGIN` in `server/.env` doesn't match the URL you're loading the frontend from |
| Invoice totals look wrong after editing tax rates | Existing invoice line items store a snapshot of the tax **amount** at creation time, not a live reference — this is intentional (accounting documents shouldn't retroactively change), so update the invoice itself to recalculate |

---

## 14. Adding automated tests (recommended next step)

None are included yet, to keep the initial build lean. Suggested starting point:
- Backend: `supertest` + a disposable test database, one test file per controller mirroring
  the smoke test performed during development (login → create customer → create invoice →
  record payment → assert balances).
- Frontend: `vitest` + `@testing-library/react` for component-level tests, starting with
  `LineItemsEditor` (the totals math) since it's the most calculation-heavy piece of UI.
