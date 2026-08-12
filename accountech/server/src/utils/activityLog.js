const { query } = require('../config/db');

async function logActivity({ companyId, userId, action, entityType, entityId, description, ip }) {
  try {
    await query(
      `INSERT INTO activity_logs (company_id, user_id, action, entity_type, entity_id, description, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [companyId, userId || null, action, entityType, entityId || null, description || null, ip || null]
    );
  } catch (err) {
    // Never let logging failures break the main request
    console.error('activityLog failed', err.message);
  }
}

module.exports = { logActivity };
