const { query, getClient } = require('../config/db');
const { calculateTotals } = require('../utils/totals');
const { nextDocumentNumber } = require('../utils/numbering');
const { logActivity } = require('../utils/activityLog');
const { renderDocumentPdf } = require('../utils/pdf');

async function list(req, res, next) {
  try {
    const { status = '', search = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { rows } = await query(
      `SELECT q.*, c.display_name AS customer_name, cur.symbol AS currency_symbol
       FROM quotes q JOIN customers c ON c.id = q.customer_id LEFT JOIN currencies cur ON cur.id = q.currency_id
       WHERE q.company_id=$1 AND ($2='' OR q.status=$2)
         AND ($3='' OR q.quote_number ILIKE '%'||$3||'%' OR c.display_name ILIKE '%'||$3||'%')
       ORDER BY q.quote_date DESC, q.created_at DESC LIMIT $4 OFFSET $5`,
      [req.user.companyId, status, search, limit, offset]
    );
    const { rows: countRows } = await query(`SELECT COUNT(*) FROM quotes WHERE company_id=$1 AND ($2='' OR status=$2)`, [req.user.companyId, status]);
    res.json({ data: rows, total: Number(countRows[0].count), page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT q.*, c.display_name AS customer_name, c.email AS customer_email, cur.symbol AS currency_symbol
       FROM quotes q JOIN customers c ON c.id=q.customer_id LEFT JOIN currencies cur ON cur.id=q.currency_id
       WHERE q.id=$1 AND q.company_id=$2`,
      [req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Quote not found' });
    const { rows: items } = await query('SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY sort_order ASC', [req.params.id]);
    res.json({ ...rows[0], items });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  const client = await getClient();
  try {
    const b = req.body;
    if (!b.customer_id) return res.status(400).json({ error: 'customer_id is required' });
    if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ error: 'At least one line item is required' });

    const taxIds = [...new Set(b.items.map((it) => it.tax_id).filter(Boolean))];
    let taxMap = {};
    if (taxIds.length) {
      const { rows: taxRows } = await client.query(`SELECT id, rate FROM tax_rates WHERE id = ANY($1::int[]) AND company_id=$2`, [taxIds, req.user.companyId]);
      taxMap = Object.fromEntries(taxRows.map((r) => [r.id, Number(r.rate)]));
    }
    const itemsWithTaxRate = b.items.map((it) => ({ ...it, tax_rate: it.tax_id ? taxMap[it.tax_id] || 0 : 0 }));
    const totals = calculateTotals(itemsWithTaxRate, { type: b.discount_type || 'fixed', value: b.discount_value || 0 });

    await client.query('BEGIN');
    const quoteNumber = b.quote_number || await nextDocumentNumber(client, req.user.companyId, 'quote');

    const { rows } = await client.query(
      `INSERT INTO quotes (company_id, customer_id, currency_id, created_by, quote_number, status, quote_date, expiry_date,
        notes, terms, subtotal, discount_type, discount_value, discount_total, tax_total, total)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [req.user.companyId, b.customer_id, b.currency_id || null, req.user.id, quoteNumber, b.status || 'draft',
        b.quote_date || new Date(), b.expiry_date || null, b.notes || null, b.terms || null,
        totals.subtotal, b.discount_type || 'fixed', b.discount_value || 0, totals.discountTotal, totals.taxTotal, totals.total]
    );
    const quote = rows[0];
    let sort = 0;
    for (const it of totals.items) {
      await client.query(
        `INSERT INTO quote_items (quote_id, item_id, tax_id, description, quantity, unit_price, tax_amount, total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [quote.id, it.item_id || null, it.tax_id || null, it.description, it.quantity, it.unit_price, it.tax_amount, it.total, sort++]
      );
    }
    await client.query('COMMIT');
    await logActivity({ companyId: req.user.companyId, userId: req.user.id, action: 'created', entityType: 'quote', entityId: quote.id, description: quoteNumber });
    res.status(201).json(quote);
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
    const allowed = ['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'];
    if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });
    const { rows } = await query('UPDATE quotes SET status=$1, updated_at=now() WHERE id=$2 AND company_id=$3 RETURNING *', [status, req.params.id, req.user.companyId]);
    if (!rows.length) return res.status(404).json({ error: 'Quote not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM quotes WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'Quote not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

/** Converts an accepted quote into a new draft invoice with the same line items. */
async function convertToInvoice(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { rows: quoteRows } = await client.query('SELECT * FROM quotes WHERE id=$1 AND company_id=$2 FOR UPDATE', [req.params.id, req.user.companyId]);
    if (!quoteRows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Quote not found' }); }
    const quote = quoteRows[0];
    if (quote.converted_invoice_id) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Quote already converted' }); }

    const { rows: quoteItems } = await client.query('SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY sort_order ASC', [req.params.id]);
    const invoiceNumber = await nextDocumentNumber(client, req.user.companyId, 'invoice');

    const { rows: invRows } = await client.query(
      `INSERT INTO invoices (company_id, customer_id, currency_id, created_by, invoice_number, status, invoice_date,
        due_date, notes, terms, subtotal, discount_type, discount_value, discount_total, tax_total, total, amount_due)
       VALUES ($1,$2,$3,$4,$5,'draft',CURRENT_DATE, CURRENT_DATE + interval '15 days',$6,$7,$8,$9,$10,$11,$12,$13,$13)
       RETURNING *`,
      [req.user.companyId, quote.customer_id, quote.currency_id, req.user.id, invoiceNumber, quote.notes, quote.terms,
        quote.subtotal, quote.discount_type, quote.discount_value, quote.discount_total, quote.tax_total, quote.total]
    );
    const invoice = invRows[0];

    for (const it of quoteItems) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, item_id, tax_id, description, quantity, unit_price, tax_amount, total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [invoice.id, it.item_id, it.tax_id, it.description, it.quantity, it.unit_price, it.tax_amount, it.total, it.sort_order]
      );
    }

    await client.query(`UPDATE quotes SET status='converted', converted_invoice_id=$1, updated_at=now() WHERE id=$2`, [invoice.id, quote.id]);
    await client.query('COMMIT');
    res.status(201).json(invoice);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

async function downloadPdf(req, res, next) {
  try {
    const { rows: qRows } = await query(
      `SELECT q.*, cur.symbol AS currency_symbol FROM quotes q LEFT JOIN currencies cur ON cur.id=q.currency_id WHERE q.id=$1 AND q.company_id=$2`,
      [req.params.id, req.user.companyId]
    );
    if (!qRows.length) return res.status(404).json({ error: 'Quote not found' });
    const quote = qRows[0];
    const { rows: items } = await query('SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY sort_order ASC', [req.params.id]);
    const { rows: customerRows } = await query('SELECT * FROM customers WHERE id=$1', [quote.customer_id]);
    const { rows: companyRows } = await query('SELECT * FROM companies WHERE id=$1', [req.user.companyId]);

    renderDocumentPdf(res, {
      doc: quote, items, company: companyRows[0], customer: customerRows[0],
      currencySymbol: quote.currency_symbol || '$', docLabel: 'Quote',
    });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, updateStatus, remove, convertToInvoice, downloadPdf };
