const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { search = '' } = req.query;
    const { rows } = await query(
      `SELECT i.*, c.name AS category_name, u.name AS unit_name, t.rate AS tax_rate
       FROM items i
       LEFT JOIN item_categories c ON c.id = i.category_id
       LEFT JOIN item_units u ON u.id = i.unit_id
       LEFT JOIN tax_rates t ON t.id = i.tax_id
       WHERE i.company_id = $1 AND ($2 = '' OR i.name ILIKE '%'||$2||'%' OR i.sku ILIKE '%'||$2||'%')
       ORDER BY i.created_at DESC`,
      [req.user.companyId, search]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `INSERT INTO items (company_id, category_id, unit_id, tax_id, type, name, sku, description, sale_price, purchase_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.companyId, b.category_id || null, b.unit_id || null, b.tax_id || null, b.type || 'product',
        b.name, b.sku || null, b.description || null, b.sale_price || 0, b.purchase_price || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const b = req.body;
    const { rows } = await query(
      `UPDATE items SET category_id=$1, unit_id=$2, tax_id=$3, type=$4, name=$5, sku=$6, description=$7,
        sale_price=$8, purchase_price=$9, is_active=$10, updated_at=now()
       WHERE id=$11 AND company_id=$12 RETURNING *`,
      [b.category_id || null, b.unit_id || null, b.tax_id || null, b.type || 'product', b.name, b.sku || null,
        b.description || null, b.sale_price || 0, b.purchase_price || 0, b.is_active !== false,
        req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM items WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'Item not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
