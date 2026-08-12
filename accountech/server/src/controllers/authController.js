const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logActivity } = require('../utils/activityLog');

const REFRESH_COOKIE = 'refresh_token';
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth',
};

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { rows } = await query(
      `SELECT u.*, r.name AS role_name, r.permissions
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE lower(u.email) = lower($1)`,
      [email]
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '30 days')`,
      [user.id, hashToken(refreshToken)]
    );
    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    await logActivity({ companyId: user.company_id, userId: user.id, action: 'login', entityType: 'user', entityId: user.id, ip: req.ip });

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    res.json({
      accessToken,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role_name,
        permissions: user.permissions, companyId: user.company_id,
      },
    });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);

    const { rows } = await query(
      `SELECT * FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > now()`,
      [payload.sub, tokenHash]
    );
    if (!rows.length) return res.status(401).json({ error: 'Refresh token invalid or expired' });

    const { rows: userRows } = await query(
      `SELECT u.*, r.name AS role_name, r.permissions FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [payload.sub]
    );
    const user = userRows[0];
    if (!user || !user.is_active) return res.status(401).json({ error: 'Account disabled' });

    const accessToken = signAccessToken(user);
    res.json({
      accessToken,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role_name,
        permissions: user.permissions, companyId: user.company_id,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hashToken(token)]);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const ok = await bcrypt.compare(currentPassword || '', rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function sso(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Use SAAS_JWT_SECRET or fallback to other secrets
    const secret = process.env.SAAS_JWT_SECRET || process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
    let payload;
    try {
      console.log("SSO Token received:", token.substring(0, 20) + "...");
      console.log("Using secret:", secret.substring(0, 10) + "...");
      payload = jwt.verify(token, secret);
      console.log("Payload:", payload);
    } catch (e) {
      console.error("JWT Verify Error:", e.message);
      return res.status(401).json({ error: 'Invalid SSO token' });
    }

    const email = payload.email;
    if (!email) return res.status(400).json({ error: 'Token does not contain email' });

    let { rows } = await query(
      `SELECT u.*, r.name AS role_name, r.permissions
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE lower(u.email) = lower($1)`,
      [email]
    );

    let user = rows[0];

    if (!user) {
      const compRes = await query(`SELECT id FROM companies ORDER BY id ASC LIMIT 1`);
      const companyId = compRes.rows[0] ? compRes.rows[0].id : null;

      const roleRes = await query(`SELECT id, name, permissions FROM roles WHERE name = 'admin' OR name = 'Admin' LIMIT 1`);
      const roleId = roleRes.rows[0] ? roleRes.rows[0].id : 1;
      const roleName = roleRes.rows[0] ? roleRes.rows[0].name : 'admin';
      const permissions = roleRes.rows[0] ? roleRes.rows[0].permissions : {};

      const insertRes = await query(
        `INSERT INTO users (email, name, role_id, is_active, password_hash, company_id)
         VALUES ($1, $2, $3, true, $4, $5) RETURNING *`,
        [email, email.split('@')[0], roleId, 'sso_no_password', companyId]
      );
      user = { ...insertRes.rows[0], role_name: roleName, permissions };
    } else if (!user.is_active) {
      return res.status(401).json({ error: 'Account disabled' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '30 days')`,
      [user.id, hashToken(refreshToken)]
    );
    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    
    // Check if logActivity handles companyId safely when null
    if (user.company_id) {
      await logActivity({ companyId: user.company_id, userId: user.id, action: 'sso_login', entityType: 'user', entityId: user.id, ip: req.ip });
    }

    res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
    res.json({
      accessToken,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role_name,
        permissions: user.permissions, companyId: user.company_id,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { login, refresh, logout, me, changePassword, sso };
