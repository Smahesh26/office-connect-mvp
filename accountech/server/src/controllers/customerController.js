const { query } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

async function list(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await query(
      `SELECT c.*,
        (SELECT COALESCE(SUM(amount_due),0) FROM invoices i WHERE i.customer_id = c.id AND i.status NOT IN ('paid','cancelled','draft')) AS outstanding_balance
       FROM customers c
       WHERE c.company_id = $1 AND ($2 = '' OR c.display_name ILIKE '%'||$2||'%' OR c.email ILIKE '%'||$2||'%')
       ORDER BY c.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user.companyId, search, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM customers WHERE company_id = $1 AND ($2 = '' OR display_name ILIKE '%'||$2||'%' OR email ILIKE '%'||$2||'%')`,
      [req.user.companyId, search]
    );
    res.json({ data: rows, total: Number(countRows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM customers WHERE id = $1 AND company_id = $2', [req.params.id, req.user.companyId]);
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });

    const { rows: invoices } = await query(
      `SELECT id, invoice_number, status, total, amount_due, invoice_date, due_date FROM invoices
       WHERE customer_id = $1 ORDER BY invoice_date DESC LIMIT 10`,
      [req.params.id]
    );
    res.json({ ...rows[0], recent_invoices: invoices });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO customers (company_id, currency_id, display_name, company_name, email, phone, tax_number,
        billing_address, billing_city, billing_state, billing_zip, billing_country, shipping_address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.companyId, b.currency_id || null, b.display_name, b.company_name || null, b.email || null, b.phone || null,
        b.tax_number || null, b.billing_address || null, b.billing_city || null, b.billing_state || null,
        b.billing_zip || null, b.billing_country || null, b.shipping_address || null, b.notes || null]
    );
    await logActivity({ companyId: req.user.companyId, userId: req.user.id, action: 'created', entityType: 'customer', entityId: rows[0].id });
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE customers SET currency_id=$1, display_name=$2, company_name=$3, email=$4, phone=$5, tax_number=$6,
        billing_address=$7, billing_city=$8, billing_state=$9, billing_zip=$10, billing_country=$11,
        shipping_address=$12, notes=$13, is_active=$14, updated_at=now()
       WHERE id=$15 AND company_id=$16 RETURNING *`,
      [b.currency_id || null, b.display_name, b.company_name || null, b.email || null, b.phone || null, b.tax_number || null,
        b.billing_address || null, b.billing_city || null, b.billing_state || null, b.billing_zip || null,
        b.billing_country || null, b.shipping_address || null, b.notes || null, b.is_active !== false,
        req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM customers WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
