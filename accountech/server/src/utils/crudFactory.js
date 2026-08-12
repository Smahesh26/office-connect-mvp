const { query } = require('../config/db');

/**
 * Builds simple list/create/update/delete handlers for company-scoped lookup
 * tables that only have a handful of columns (tax_rates, payment_methods,
 * transaction_categories, item_categories, item_units).
 *
 * `table`   - table name
 * `fields`  - array of column names that are writable (besides id/company_id)
 */
function crudFactory(table, fields) {
  const cols = fields.join(', ');
  const placeholders = fields.map((_, i) => `$${i + 2}`).join(', ');

  return {
    async list(req, res, next) {
      try {
        const { rows } = await query(
          `SELECT * FROM ${table} WHERE company_id = $1 ORDER BY id ASC`,
          [req.user.companyId]
        );
        res.json(rows);
      } catch (err) { next(err); }
    },

    async create(req, res, next) {
      try {
        const values = fields.map((f) => req.body[f]);
        const { rows } = await query(
          `INSERT INTO ${table} (company_id, ${cols}) VALUES ($1, ${placeholders}) RETURNING *`,
          [req.user.companyId, ...values]
        );
        res.status(201).json(rows[0]);
      } catch (err) { next(err); }
    },

    async update(req, res, next) {
      try {
        const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const values = fields.map((f) => req.body[f]);
        const { rows } = await query(
          `UPDATE ${table} SET ${setClause} WHERE id = $1 AND company_id = $2 RETURNING *`,
          [req.params.id, req.user.companyId, ...values]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
      } catch (err) { next(err); }
    },

    async remove(req, res, next) {
      try {
        const { rowCount } = await query(
          `DELETE FROM ${table} WHERE id = $1 AND company_id = $2`,
          [req.params.id, req.user.companyId]
        );
        if (!rowCount) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
      } catch (err) { next(err); }
    },
  };
}

module.exports = { crudFactory };
