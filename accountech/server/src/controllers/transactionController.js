const { query, getClient } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

async function list(req, res, next) {
  try {
    const { type = '', account_id = '', from = '', to = '', page = 1, limit = 25 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await query(
      `SELECT t.*, a.name AS account_name, cat.name AS category_name, pm.name AS payment_method_name,
              c.display_name AS customer_name
       FROM transactions t
       LEFT JOIN accounts a ON a.id = t.account_id
       LEFT JOIN transaction_categories cat ON cat.id = t.category_id
       LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
       LEFT JOIN customers c ON c.id = t.customer_id
       WHERE t.company_id = $1
         AND ($2 = '' OR t.type = $2)
         AND ($3 = '' OR t.account_id::text = $3)
         AND ($4 = '' OR t.transaction_date >= $4::date)
         AND ($5 = '' OR t.transaction_date <= $5::date)
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT $6 OFFSET $7`,
      [req.user.companyId, type, account_id, from, to, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM transactions WHERE company_id=$1 AND ($2='' OR type=$2)`,
      [req.user.companyId, type]
    );
    res.json({ data: rows, total: Number(countRows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const client = await getClient();
  try {
    const b = req.body;
    if (!['income', 'expense'].includes(b.type)) return res.status(400).json({ error: 'type must be income or expense' });
    if (!(Number(b.amount) > 0)) return res.status(400).json({ error: 'amount must be greater than 0' });

    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO transactions (company_id, type, account_id, category_id, payment_method_id, customer_id, invoice_id,
        currency_id, created_by, amount, exchange_rate, transaction_date, reference, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.companyId, b.type, b.account_id, b.category_id || null, b.payment_method_id || null,
        b.customer_id || null, b.invoice_id || null, b.currency_id || null, req.user.id, b.amount,
        b.exchange_rate || 1, b.transaction_date || new Date(), b.reference || null, b.description || null]
    );

    const sign = b.type === 'income' ? 1 : -1;
    await client.query(
      `UPDATE accounts SET current_balance = current_balance + $1, updated_at = now() WHERE id = $2 AND company_id = $3`,
      [sign * Number(b.amount), b.account_id, req.user.companyId]
    );

    // If this transaction pays down an invoice, update its paid/due amounts + status
    if (b.invoice_id && b.type === 'income') {
      const { rows: inv } = await client.query('SELECT * FROM invoices WHERE id=$1 AND company_id=$2 FOR UPDATE', [b.invoice_id, req.user.companyId]);
      if (inv.length) {
        const newPaid = Number(inv[0].amount_paid) + Number(b.amount);
        const newDue = Math.max(0, Number(inv[0].total) - newPaid);
        const status = newDue <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : inv[0].status);
        await client.query(
          `UPDATE invoices SET amount_paid=$1, amount_due=$2, status=$3, updated_at=now() WHERE id=$4`,
          [newPaid, newDue, status, b.invoice_id]
        );
      }
    }

    await client.query('COMMIT');
    await logActivity({ companyId: req.user.companyId, userId: req.user.id, action: 'created', entityType: 'transaction', entityId: rows[0].id });
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function remove(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM transactions WHERE id=$1 AND company_id=$2 FOR UPDATE', [req.params.id, req.user.companyId]);
    if (!rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Transaction not found' }); }

    const txn = rows[0];
    const sign = txn.type === 'income' ? -1 : 1; // reverse the original effect
    await client.query(
      `UPDATE accounts SET current_balance = current_balance + $1, updated_at = now() WHERE id = $2`,
      [sign * Number(txn.amount), txn.account_id]
    );

    if (txn.invoice_id && txn.type === 'income') {
      const { rows: inv } = await client.query('SELECT * FROM invoices WHERE id=$1 FOR UPDATE', [txn.invoice_id]);
      if (inv.length) {
        const newPaid = Math.max(0, Number(inv[0].amount_paid) - Number(txn.amount));
        const newDue = Number(inv[0].total) - newPaid;
        const status = newDue <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'sent');
        await client.query('UPDATE invoices SET amount_paid=$1, amount_due=$2, status=$3, updated_at=now() WHERE id=$4', [newPaid, newDue, status, txn.invoice_id]);
      }
    }

    await client.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { list, create, remove };
