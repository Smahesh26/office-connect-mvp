-- ============================================================================
-- AccounTech Core Schema (PostgreSQL)
-- Module scope: Accounting + Invoicing + Quotes + Transactions + Users/Roles
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Companies (multi-tenant ready; single company by default)
-- ---------------------------------------------------------------------------
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150),
  phone           VARCHAR(30),
  address         VARCHAR(255),
  city            VARCHAR(100),
  state           VARCHAR(100),
  zip             VARCHAR(20),
  country         VARCHAR(100),
  logo_url        VARCHAR(255),
  fiscal_year_start SMALLINT NOT NULL DEFAULT 1, -- month 1-12
  timezone        VARCHAR(64) NOT NULL DEFAULT 'UTC',
  invoice_prefix  VARCHAR(10) NOT NULL DEFAULT 'INV-',
  quote_prefix    VARCHAR(10) NOT NULL DEFAULT 'QUO-',
  next_invoice_no INTEGER NOT NULL DEFAULT 1,
  next_quote_no   INTEGER NOT NULL DEFAULT 1,
  default_due_days SMALLINT NOT NULL DEFAULT 15,
  default_terms   TEXT,
  default_notes   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Currencies
-- ---------------------------------------------------------------------------
CREATE TABLE currencies (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code            VARCHAR(3) NOT NULL,       -- USD, EUR...
  name            VARCHAR(50) NOT NULL,
  symbol          VARCHAR(5) NOT NULL,
  decimal_places  SMALLINT NOT NULL DEFAULT 2,
  exchange_rate   NUMERIC(18,6) NOT NULL DEFAULT 1,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- ---------------------------------------------------------------------------
-- Roles (simple RBAC, JSON permission map so it's extensible without migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(50) NOT NULL,             -- admin, accountant, staff, viewer
  permissions     JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"invoices.create": true, ...}
  is_system       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id         INTEGER NOT NULL REFERENCES roles(id),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(255),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, email)
);

CREATE TABLE refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  currency_id     INTEGER REFERENCES currencies(id),
  display_name    VARCHAR(150) NOT NULL,
  company_name    VARCHAR(150),
  email           VARCHAR(150),
  phone           VARCHAR(30),
  tax_number      VARCHAR(50),
  billing_address VARCHAR(255),
  billing_city    VARCHAR(100),
  billing_state   VARCHAR(100),
  billing_zip     VARCHAR(20),
  billing_country VARCHAR(100),
  shipping_address VARCHAR(255),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Tax rates
-- ---------------------------------------------------------------------------
CREATE TABLE tax_rates (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(50) NOT NULL,
  rate            NUMERIC(6,3) NOT NULL,   -- percentage e.g. 18.000
  is_compound     BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Chart of Accounts
-- ---------------------------------------------------------------------------
CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  currency_id     INTEGER REFERENCES currencies(id),
  parent_id       UUID REFERENCES accounts(id),
  code            VARCHAR(20) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  opening_balance NUMERIC(18,4) NOT NULL DEFAULT 0,
  current_balance NUMERIC(18,4) NOT NULL DEFAULT 0,
  description     VARCHAR(255),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- ---------------------------------------------------------------------------
-- Items (products / services)
-- ---------------------------------------------------------------------------
CREATE TABLE item_categories (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL
);

CREATE TABLE item_units (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(50) NOT NULL
);

CREATE TABLE items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id     INTEGER REFERENCES item_categories(id),
  unit_id         INTEGER REFERENCES item_units(id),
  tax_id          INTEGER REFERENCES tax_rates(id),
  type            VARCHAR(10) NOT NULL DEFAULT 'product' CHECK (type IN ('product','service')),
  name            VARCHAR(150) NOT NULL,
  sku             VARCHAR(50),
  description     VARCHAR(255),
  sale_price      NUMERIC(18,4) NOT NULL DEFAULT 0,
  purchase_price  NUMERIC(18,4) NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------------------
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  currency_id     INTEGER REFERENCES currencies(id),
  created_by      UUID REFERENCES users(id),
  invoice_number  VARCHAR(30) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','viewed','partial','paid','overdue','cancelled')),
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  reference       VARCHAR(100),
  notes           TEXT,
  terms           TEXT,
  subtotal        NUMERIC(18,4) NOT NULL DEFAULT 0,
  discount_type   VARCHAR(10) NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed','percent')),
  discount_value  NUMERIC(18,4) NOT NULL DEFAULT 0,
  discount_total  NUMERIC(18,4) NOT NULL DEFAULT 0,
  tax_total       NUMERIC(18,4) NOT NULL DEFAULT 0,
  total           NUMERIC(18,4) NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(18,4) NOT NULL DEFAULT 0,
  amount_due      NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES items(id),
  tax_id          INTEGER REFERENCES tax_rates(id),
  description     VARCHAR(255) NOT NULL,
  quantity        NUMERIC(14,4) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(18,4) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(18,4) NOT NULL DEFAULT 0,
  total           NUMERIC(18,4) NOT NULL DEFAULT 0,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Quotes / Estimates
-- ---------------------------------------------------------------------------
CREATE TABLE quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  currency_id     INTEGER REFERENCES currencies(id),
  created_by      UUID REFERENCES users(id),
  converted_invoice_id UUID REFERENCES invoices(id),
  quote_number    VARCHAR(30) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','accepted','declined','expired','converted')),
  quote_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date     DATE,
  notes           TEXT,
  terms           TEXT,
  subtotal        NUMERIC(18,4) NOT NULL DEFAULT 0,
  discount_type   VARCHAR(10) NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed','percent')),
  discount_value  NUMERIC(18,4) NOT NULL DEFAULT 0,
  discount_total  NUMERIC(18,4) NOT NULL DEFAULT 0,
  tax_total       NUMERIC(18,4) NOT NULL DEFAULT 0,
  total           NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, quote_number)
);

CREATE TABLE quote_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES items(id),
  tax_id          INTEGER REFERENCES tax_rates(id),
  description     VARCHAR(255) NOT NULL,
  quantity        NUMERIC(14,4) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(18,4) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(18,4) NOT NULL DEFAULT 0,
  total           NUMERIC(18,4) NOT NULL DEFAULT 0,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Payments / Expenses (transactions) + supporting lookups
-- ---------------------------------------------------------------------------
CREATE TABLE payment_methods (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(50) NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE transaction_categories (
  id              SERIAL PRIMARY KEY,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(10) NOT NULL CHECK (type IN ('income','expense'))
);

CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type            VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
  account_id      UUID NOT NULL REFERENCES accounts(id),
  category_id     INTEGER REFERENCES transaction_categories(id),
  payment_method_id INTEGER REFERENCES payment_methods(id),
  customer_id     UUID REFERENCES customers(id),
  invoice_id      UUID REFERENCES invoices(id),
  currency_id     INTEGER REFERENCES currencies(id),
  created_by      UUID REFERENCES users(id),
  amount          NUMERIC(18,4) NOT NULL,
  exchange_rate   NUMERIC(18,6) NOT NULL DEFAULT 1,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference       VARCHAR(100),
  description     VARCHAR(255),
  attachment_url  VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Activity log (lightweight audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(50) NOT NULL,      -- created, updated, deleted, paid, sent...
  entity_type     VARCHAR(50) NOT NULL,      -- invoice, quote, transaction...
  entity_id       UUID,
  description     VARCHAR(255),
  ip_address      VARCHAR(64),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_quotes_company ON quotes(company_id);
CREATE INDEX idx_transactions_company ON transactions(company_id);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_items_company ON items(company_id);
CREATE INDEX idx_accounts_company ON accounts(company_id);
CREATE INDEX idx_activity_company ON activity_logs(company_id);
