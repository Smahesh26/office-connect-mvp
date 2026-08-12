const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');

/**
 * Verifies the Bearer access token and attaches `req.user` = { id, companyId, role, permissions }
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = verifyAccessToken(token);

    const { rows } = await query(
      `SELECT u.id, u.company_id, u.name, u.email, u.is_active, r.name AS role_name, r.permissions
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [payload.sub]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Account disabled or not found' });

    req.user = {
      id: user.id,
      companyId: user.company_id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions || {},
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Usage: requirePermission('invoices.create')
 * Admin role always passes (permissions object also grants this explicitly via seed data).
 */
function requirePermission(key) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.permissions && req.user.permissions[key]) return next();
    return res.status(403).json({ error: `Missing permission: ${key}` });
  };
}

module.exports = { requireAuth, requirePermission };
