const { query } = require('../config/db');

async function profitAndLoss(req, res, next) {
  try {
    const { from, to } = req.query;
    const start = from || '1970-01-01';
    const end = to || new Date().toISOString().slice(0, 10);

    const { rows: byCategory } = await query(
      `SELECT cat.name AS category, t.type, COALESCE(SUM(t.amount),0) AS total
       FROM transactions t LEFT JOIN transaction_categories cat ON cat.id = t.category_id
       WHERE t.company_id=$1 AND t.transaction_date BETWEEN $2 AND $3
       GROUP BY cat.name, t.type ORDER BY t.type, total DESC`,
      [req.user.companyId, start, end]
    );
    const { rows: totalsRows } = await query(
      `SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) AS income,
              COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expense
       FROM transactions WHERE company_id=$1 AND transaction_date BETWEEN $2 AND $3`,
      [req.user.companyId, start, end]
    );
    const income = Number(totalsRows[0].income);
    const expense = Number(totalsRows[0].expense);

    res.json({
      from: start, to: end,
      income, expense, net_profit: income - expense,
      by_category: byCategory.map((r) => ({ category: r.category || 'Uncategorized', type: r.type, total: Number(r.total) })),
    });
  } catch (err) { next(err); }
}

async function invoiceAging(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT i.id, i.invoice_number, i.total, i.amount_due, i.due_date, c.display_name AS customer_name,
        CASE
          WHEN i.due_date IS NULL OR i.due_date >= CURRENT_DATE THEN 'current'
          WHEN CURRENT_DATE - i.due_date <= 30 THEN '1-30'
          WHEN CURRENT_DATE - i.due_date <= 60 THEN '31-60'
          WHEN CURRENT_DATE - i.due_date <= 90 THEN '61-90'
          ELSE '90+'
        END AS bucket
       FROM invoices i JOIN customers c ON c.id = i.customer_id
       WHERE i.company_id = $1 AND i.status NOT IN ('paid','cancelled','draft')
       ORDER BY i.due_date ASC NULLS LAST`,
      [req.user.companyId]
    );
    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    rows.forEach((r) => { buckets[r.bucket] += Number(r.amount_due); });
    res.json({ invoices: rows, buckets });
  } catch (err) { next(err); }
}

async function salesByCustomer(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT c.id, c.display_name, COUNT(i.id) AS invoice_count, COALESCE(SUM(i.total),0) AS total_billed,
              COALESCE(SUM(i.amount_paid),0) AS total_paid
       FROM customers c LEFT JOIN invoices i ON i.customer_id = c.id
       WHERE c.company_id = $1 GROUP BY c.id, c.display_name ORDER BY total_billed DESC`,
      [req.user.companyId]
    );
    res.json(rows.map((r) => ({ ...r, total_billed: Number(r.total_billed), total_paid: Number(r.total_paid) })));
  } catch (err) { next(err); }
}

module.exports = { profitAndLoss, invoiceAging, salesByCustomer };
