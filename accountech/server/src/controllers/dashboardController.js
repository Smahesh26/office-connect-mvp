const { query } = require('../config/db');

async function summary(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const [{ rows: incomeExpense }, { rows: outstanding }, { rows: overdue }, { rows: recentInvoices },
      { rows: monthly }, { rows: topCustomers }, { rows: cashBalance }] = await Promise.all([
      query(`SELECT
              COALESCE(SUM(CASE WHEN type='income' AND date_trunc('month', transaction_date)=date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END),0) AS income_this_month,
              COALESCE(SUM(CASE WHEN type='expense' AND date_trunc('month', transaction_date)=date_trunc('month', CURRENT_DATE) THEN amount ELSE 0 END),0) AS expense_this_month
             FROM transactions WHERE company_id=$1`, [companyId]),
      query(`SELECT COALESCE(SUM(amount_due),0) AS total, COUNT(*) AS count FROM invoices WHERE company_id=$1 AND status NOT IN ('paid','cancelled','draft')`, [companyId]),
      query(`SELECT COALESCE(SUM(amount_due),0) AS total, COUNT(*) AS count FROM invoices WHERE company_id=$1 AND status NOT IN ('paid','cancelled') AND due_date < CURRENT_DATE`, [companyId]),
      query(`SELECT i.id, i.invoice_number, i.total, i.status, i.due_date, c.display_name AS customer_name
             FROM invoices i JOIN customers c ON c.id=i.customer_id WHERE i.company_id=$1 ORDER BY i.created_at DESC LIMIT 6`, [companyId]),
      query(`SELECT to_char(month, 'YYYY-MM') AS month,
               COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount END),0) AS income,
               COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount END),0) AS expense
             FROM generate_series(date_trunc('month', CURRENT_DATE) - interval '5 months', date_trunc('month', CURRENT_DATE), interval '1 month') AS month
             LEFT JOIN transactions t ON date_trunc('month', t.transaction_date) = month AND t.company_id = $1
             GROUP BY month ORDER BY month`, [companyId]),
      query(`SELECT c.id, c.display_name, COALESCE(SUM(i.total),0) AS total_billed
             FROM customers c JOIN invoices i ON i.customer_id = c.id WHERE c.company_id=$1
             GROUP BY c.id, c.display_name ORDER BY total_billed DESC LIMIT 5`, [companyId]),
      query(`SELECT COALESCE(SUM(current_balance),0) AS total FROM accounts WHERE company_id=$1 AND type='asset'`, [companyId]),
    ]);

    res.json({
      income_this_month: Number(incomeExpense[0].income_this_month),
      expense_this_month: Number(incomeExpense[0].expense_this_month),
      outstanding_total: Number(outstanding[0].total),
      outstanding_count: Number(outstanding[0].count),
      overdue_total: Number(overdue[0].total),
      overdue_count: Number(overdue[0].count),
      cash_balance: Number(cashBalance[0].total),
      recent_invoices: recentInvoices,
      monthly_cashflow: monthly.map((m) => ({ month: m.month, income: Number(m.income), expense: Number(m.expense) })),
      top_customers: topCustomers.map((c) => ({ ...c, total_billed: Number(c.total_billed) })),
    });
  } catch (err) { next(err); }
}

module.exports = { summary };
