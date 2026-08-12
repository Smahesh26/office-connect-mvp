const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT a.*, c.code AS currency_code, c.symbol AS currency_symbol
       FROM accounts a LEFT JOIN currencies c ON c.id = a.currency_id
       WHERE a.company_id = $1 ORDER BY a.code ASC`,
      [req.user.companyId]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM accounts WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });

    const { rows: txns } = await query(
      `SELECT * FROM transactions WHERE account_id = $1 ORDER BY transaction_date DESC, created_at DESC LIMIT 25`,
      [req.params.id]
    );
    res.json({ ...rows[0], recent_transactions: txns });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO accounts (company_id, currency_id, parent_id, code, name, type, opening_balance, current_balance, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8) RETURNING *`,
      [req.user.companyId, b.currency_id || null, b.parent_id || null, b.code, b.name, b.type, b.opening_balance || 0, b.description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE accounts SET currency_id=$1, parent_id=$2, code=$3, name=$4, type=$5, description=$6, is_active=$7, updated_at=now()
       WHERE id=$8 AND company_id=$9 RETURNING *`,
      [b.currency_id || null, b.parent_id || null, b.code, b.name, b.type, b.description || null, b.is_active !== false,
        req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM accounts WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'Account not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
