const { query } = require('../config/db');

async function getCompany(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM companies WHERE id=$1', [req.user.companyId]);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function updateCompany(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE companies SET name=$1, email=$2, phone=$3, address=$4, city=$5, state=$6, zip=$7, country=$8,
        logo_url=$9, fiscal_year_start=$10, timezone=$11, invoice_prefix=$12, quote_prefix=$13,
        default_due_days=$14, default_terms=$15, default_notes=$16, updated_at=now()
       WHERE id=$17 RETURNING *`,
      [b.name, b.email || null, b.phone || null, b.address || null, b.city || null, b.state || null, b.zip || null,
        b.country || null, b.logo_url || null, b.fiscal_year_start || 1, b.timezone || 'UTC', b.invoice_prefix || 'INV-',
        b.quote_prefix || 'QUO-', b.default_due_days || 15, b.default_terms || null, b.default_notes || null,
        req.user.companyId]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

module.exports = { getCompany, updateCompany };
