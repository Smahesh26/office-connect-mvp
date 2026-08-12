/**
 * Seeds a fresh database with:
 *  - one company (from .env SEED_COMPANY_NAME)
 *  - default roles (Admin, Accountant, Staff) with sensible permissions
 *  - one admin user (from .env SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
 *  - a default currency
 *  - a starter chart of accounts
 *  - common tax rates, payment methods, transaction categories, item units
 *
 * Usage: npm run seed   (run once, after `npm run migrate`)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PERMISSIONS = {
  admin: {
    'invoices.view': true, 'invoices.create': true, 'invoices.edit': true, 'invoices.delete': true, 'invoices.send': true,
    'quotes.view': true, 'quotes.create': true, 'quotes.edit': true, 'quotes.delete': true,
    'transactions.view': true, 'transactions.create': true, 'transactions.edit': true, 'transactions.delete': true,
    'customers.view': true, 'customers.create': true, 'customers.edit': true, 'customers.delete': true,
    'items.view': true, 'items.create': true, 'items.edit': true, 'items.delete': true,
    'accounts.view': true, 'accounts.create': true, 'accounts.edit': true, 'accounts.delete': true,
    'reports.view': true, 'users.manage': true, 'settings.manage': true,
  },
  accountant: {
    'invoices.view': true, 'invoices.create': true, 'invoices.edit': true, 'invoices.send': true,
    'quotes.view': true, 'quotes.create': true, 'quotes.edit': true,
    'transactions.view': true, 'transactions.create': true, 'transactions.edit': true,
    'customers.view': true, 'customers.create': true, 'customers.edit': true,
    'items.view': true, 'items.create': true, 'items.edit': true,
    'accounts.view': true, 'accounts.create': true, 'accounts.edit': true,
    'reports.view': true, 'users.manage': false, 'settings.manage': false,
  },
  staff: {
    'invoices.view': true, 'invoices.create': true,
    'quotes.view': true, 'quotes.create': true,
    'transactions.view': true,
    'customers.view': true, 'customers.create': true,
    'items.view': true,
    'accounts.view': true,
    'reports.view': false, 'users.manage': false, 'settings.manage': false,
  },
};

async function run() {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query('SELECT id FROM companies LIMIT 1');
    if (existing.length) {
      console.log('Seed skipped: a company already exists.');
      return;
    }

    await client.query('BEGIN');

    const companyName = process.env.SEED_COMPANY_NAME || 'My Company';
    const { rows: [company] } = await client.query(
      `INSERT INTO companies (name) VALUES ($1) RETURNING id`,
      [companyName]
    );
    const companyId = company.id;

    const { rows: [currency] } = await client.query(
      `INSERT INTO currencies (company_id, code, name, symbol, decimal_places, is_default)
       VALUES ($1, 'USD', 'US Dollar', '$', 2, true) RETURNING id`,
      [companyId]
    );
    const currencyId = currency.id;

    const roleIds = {};
    for (const [name, perms] of Object.entries(PERMISSIONS)) {
      const { rows: [role] } = await client.query(
        `INSERT INTO roles (company_id, name, permissions, is_system) VALUES ($1,$2,$3,true) RETURNING id`,
        [companyId, name, JSON.stringify(perms)]
      );
      roleIds[name] = role.id;
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await client.query(
      `INSERT INTO users (company_id, role_id, name, email, password_hash)
       VALUES ($1,$2,$3,$4,$5)`,
      [companyId, roleIds.admin, 'Administrator', adminEmail, passwordHash]
    );

    const accounts = [
      ['1000', 'Cash on Hand', 'asset'],
      ['1010', 'Business Bank Account', 'asset'],
      ['1200', 'Accounts Receivable', 'asset'],
      ['2000', 'Accounts Payable', 'liability'],
      ['2100', 'Taxes Payable', 'liability'],
      ['3000', "Owner's Equity", 'equity'],
      ['4000', 'Sales Revenue', 'income'],
      ['4100', 'Service Revenue', 'income'],
      ['5000', 'Cost of Goods Sold', 'expense'],
      ['6000', 'Office Supplies', 'expense'],
      ['6100', 'Rent Expense', 'expense'],
      ['6200', 'Utilities Expense', 'expense'],
      ['6300', 'Software & Subscriptions', 'expense'],
      ['6400', 'Salaries & Wages', 'expense'],
    ];
    for (const [code, name, type] of accounts) {
      await client.query(
        `INSERT INTO accounts (company_id, currency_id, code, name, type) VALUES ($1,$2,$3,$4,$5)`,
        [companyId, currencyId, code, name, type]
      );
    }

    const taxRates = [['No Tax', 0], ['GST', 18], ['VAT', 20], ['Sales Tax', 8.5]];
    for (const [name, rate] of taxRates) {
      await client.query(
        `INSERT INTO tax_rates (company_id, name, rate) VALUES ($1,$2,$3)`,
        [companyId, name, rate]
      );
    }

    const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'PayPal', 'Stripe'];
    for (const name of paymentMethods) {
      await client.query(`INSERT INTO payment_methods (company_id, name) VALUES ($1,$2)`, [companyId, name]);
    }

    const incomeCategories = ['Product Sales', 'Service Income', 'Consulting', 'Other Income'];
    const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Office Supplies', 'Software', 'Marketing', 'Travel', 'Miscellaneous'];
    for (const name of incomeCategories) {
      await client.query(`INSERT INTO transaction_categories (company_id, name, type) VALUES ($1,$2,'income')`, [companyId, name]);
    }
    for (const name of expenseCategories) {
      await client.query(`INSERT INTO transaction_categories (company_id, name, type) VALUES ($1,$2,'expense')`, [companyId, name]);
    }

    const units = ['pcs', 'hrs', 'kg', 'box', 'license'];
    for (const name of units) {
      await client.query(`INSERT INTO item_units (company_id, name) VALUES ($1,$2)`, [companyId, name]);
    }
    const categories = ['General', 'Hardware', 'Software', 'Consulting'];
    for (const name of categories) {
      await client.query(`INSERT INTO item_categories (company_id, name) VALUES ($1,$2)`, [companyId, name]);
    }

    await client.query('COMMIT');
    console.log('Seed complete.');
    console.log(`  Company: ${companyName}`);
    console.log(`  Admin login: ${adminEmail} / ${adminPassword}`);
    console.log('  >>> Log in and change this password immediately. <<<');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
