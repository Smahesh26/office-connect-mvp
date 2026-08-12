const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.is_active, u.last_login_at, u.created_at, r.id AS role_id, r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.company_id = $1 ORDER BY u.created_at ASC`,
      [req.user.companyId]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password || !role_id) return res.status(400).json({ error: 'name, email, password, role_id are required' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (company_id, role_id, name, email, password_hash) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, is_active, created_at`,
      [req.user.companyId, role_id, name, email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, role_id, is_active } = req.body;
    const { rows } = await query(
      `UPDATE users SET name=$1, role_id=$2, is_active=$3, updated_at=now() WHERE id=$4 AND company_id=$5
       RETURNING id, name, email, is_active`,
      [name, role_id, is_active !== false, req.params.id, req.user.companyId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const hash = await bcrypt.hash(password, 12);
    const { rowCount } = await query('UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2 AND company_id=$3', [hash, req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
    const { rowCount } = await query('DELETE FROM users WHERE id=$1 AND company_id=$2', [req.params.id, req.user.companyId]);
    if (!rowCount) return res.status(404).json({ error: 'User not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

async function listRoles(req, res, next) {
  try {
    const { rows } = await query('SELECT id, name, permissions FROM roles WHERE company_id=$1 ORDER BY id', [req.user.companyId]);
    res.json(rows);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, resetPassword, remove, listRoles };
