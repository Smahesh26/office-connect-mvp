const { query, getClient } = require('../config/db');
const { calculateTotals } = require('../utils/totals');
const { nextDocumentNumber } = require('../utils/numbering');
const { logActivity } = require('../utils/activityLog');
const { renderDocumentPdf } = require('../utils/pdf');

async function list(req, res, next) {
  try {
    const { status = '', customer_id = '', search = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await query(
      `SELECT i.*, c.display_name AS customer_name, cur.symbol AS currency_symbol
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id
       LEFT JOIN currencies cur ON cur.id = i.currency_id
       WHERE i.company_id = $1
         AND ($2 = '' OR i.status = $2)
         AND ($3 = '' OR i.customer_id::text = $3)
         AND ($4 = '' OR i.invoice_number ILIKE '%'||$4||'%' OR c.display_name ILIKE '%'||$4||'%')
       ORDER BY i.invoice_date DESC, i.created_at DESC
       LIMIT $5 OFFSET $6`,
      [req.user.companyId, status, customer_id, search, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*) FROM invoices i WHERE i.company_id=$1 AND ($2='' OR i.status=$2)`,
      [req.user.companyId, status]
    );
    res.json({ data: rows, total: Number(countRows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT i.*, c.display_name AS customer_name, c.email AS customer_email, cur.symbol AS currency_symbol
       FROM invoices i JOIN customers c ON c.id = i.customer_id LEFT JOIN currencies cur ON cur.id = i.currency_id
       WHERE i.id=$1 AND i.company_id=$2`,
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });

    const { rows: items } = await query(
      `SELECT ii.*, t.rate AS tax_rate, t.name AS tax_name FROM invoice_items ii
       LEFT JOIN tax_rates t ON t.id = ii.tax_id WHERE ii.invoice_id = $1 ORDER BY ii.sort_order ASC`,
      [req.params.id]
    );
    const { rows: payments } = await query(
      `SELECT * FROM transactions WHERE invoice_id = $1 ORDER BY transaction_date DESC`,
      [req.params.id]
    );
    res.json({ ...rows[0], items, payments });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const client = await getClient();
  try {
    const b = req.body;
    if (!b.customer_id) return res.status(400).json({ error: 'customer_id is required' });
    if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ error: 'At least one line item is required' });

    // Resolve tax rate percentages for each line (client sends tax_id, we look up %)
    const taxIds = [...new Set(b.items.map((it) => it.tax_id).filter(Boolean))];
    let taxMap = {};
    if (taxIds.length) {
      const { rows: taxRows } = await client.query(
        `SELECT id, rate FROM tax_rates WHERE id = ANY($1::int[]) AND company_id = $2`,
        [taxIds, req.user.companyId]
      );
      taxMap = Object.fromEntries(taxRows.map((r) => [r.id, Number(r.rate)]));
    }
    const itemsWithTaxRate = b.items.map((it) => ({ ...it, tax_rate: it.tax_id ? taxMap[it.tax_id] || 0 : 0 }));
    const totals = calculateTotals(itemsWithTaxRate, { type: b.discount_type || 'fixed', value: b.discount_value || 0 });

    await client.query('BEGIN');
    const invoiceNumber = b.invoice_number || await nextDocumentNumber(client, req.user.companyId, 'invoice');

    const { rows } = await client.query(
      `INSERT INTO invoices (company_id, customer_id, currency_id, created_by, invoice_number, status, invoice_date,
        due_date, reference, notes, terms, subtotal, discount_type, discount_value, discount_total, tax_total, total, amount_due)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$17) RETURNING *`,
      [req.user.companyId, b.customer_id, b.currency_id || null, req.user.id, invoiceNumber, b.status || 'draft',
        b.invoice_date || new Date(), b.due_date || null, b.reference || null, b.notes || null, b.terms || null,
        totals.subtotal, b.discount_type || 'fixed', b.discount_value || 0, totals.discountTotal, totals.taxTotal, totals.total]
    );
    const invoice = rows[0];

    let sort = 0;
    for (const it of totals.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, item_id, tax_id, description, quantity, unit_price, tax_amount, total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [invoice.id, it.item_id || null, it.tax_id || null, it.description, it.quantity, it.unit_price, it.tax_amount, it.total, sort++]
      );
    }

    await client.query('COMMIT');
    await logActivity({ companyId: req.user.companyId, userId: req.user.id, action: 'created', entityType: 'invoice', entityId: invoice.id, description: invoiceNumber });
    res.status(201).json(invoice);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function update(req, res, next) {
  const client = await getClient();
  try {
    const b = req.body;
    const { rows: existingRows } = await client.query('SELECT * FROM invoices WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!existingRows.length) return res.status(404).json({ error: 'Invoice not found' });

    const taxIds = [...new Set((b.items || []).map((it) => it.tax_id).filter(Boolean))];
    let taxMap = {};
    if (taxIds.length) {
      const { rows: taxRows } = await client.query(`SELECT id, rate FROM tax_rates WHERE id = ANY($1::int[]) AND company_id=$2`, [taxIds, req.user.companyId]);
      taxMap = Object.fromEntries(taxRows.map((r) => [r.id, Number(r.rate)]));
    }
    const itemsWithTaxRate = (b.items || []).map((it) => ({ ...it, tax_rate: it.tax_id ? taxMap[it.tax_id] || 0 : 0 }));
    const totals = calculateTotals(itemsWithTaxRate, { type: b.discount_type || 'fixed', value: b.discount_value || 0 });

    await client.query('BEGIN');
    const amountDue = totals.total - Number(existingRows[0].amount_paid);

    const { rows } = await client.query(
      `UPDATE invoices SET customer_id=$1, currency_id=$2, status=$3, invoice_date=$4, due_date=$5, reference=$6,
        notes=$7, terms=$8, subtotal=$9, discount_type=$10, discount_value=$11, discount_total=$12, tax_total=$13,
        total=$14, amount_due=$15, updated_at=now()
       WHERE id=$16 AND company_id=$17 RETURNING *`,
      [b.customer_id, b.currency_id || null, b.status || existingRows[0].status, b.invoice_date, b.due_date || null,
        b.reference || null, b.notes || null, b.terms || null, totals.subtotal, b.discount_type || 'fixed',
        b.discount_value || 0, totals.discountTotal, totals.taxTotal, totals.total, amountDue,
        req.params.id, req.user.companyId]
    );

    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    let sort = 0;
    for (const it of totals.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, item_id, tax_id, description, quantity, unit_price, tax_amount, total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [req.params.id, it.item_id || null, it.tax_id || null, it.description, it.quantity, it.unit_price, it.tax_amount, it.total, sort++]
      );
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
    const { rows } = await query(
      `UPDATE invoices SET status=$1, updated_at=now() WHERE id=$2 AND company_id=$3 RETURNING *`,
      [status, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    await logActivity({ companyId: req.user.companyId, userId: req.user.id, action: status, entityType: 'invoice', entityId: req.params.id });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM invoices WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'Invoice not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function downloadPdf(req, res, next) {
  try {
    const { rows: invRows } = await query(
      `SELECT i.*, cur.symbol AS currency_symbol FROM invoices i LEFT JOIN currencies cur ON cur.id = i.currency_id
       WHERE i.id=$1 AND i.company_id=$2`,
      [req.params.id, req.user.companyId]
    );
    if (!invRows.length) return res.status(404).json({ error: 'Invoice not found' });
    const invoice = invRows[0];

    const { rows: items } = await query('SELECT * FROM invoice_items WHERE invoice_id=$1 ORDER BY sort_order ASC', [req.params.id]);
    const { rows: customerRows } = await query('SELECT * FROM customers WHERE id=$1', [invoice.customer_id]);
    const { rows: companyRows } = await query('SELECT * FROM companies WHERE id=$1', [req.user.companyId]);

    renderDocumentPdf(res, {
      doc: invoice, items, company: companyRows[0], customer: customerRows[0],
      currencySymbol: invoice.currency_symbol || '$', docLabel: 'Invoice',
    });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, updateStatus, remove, downloadPdf };
