const { query } = require('../config/db');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "OfficeConnectWebhookSecret123!";

async function officeConnectCustomerSync(req, res, next) {
  try {
    const providedSecret = req.headers['x-webhook-secret'];
    if (providedSecret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized webhook payload' });
    }

    const { firstName, lastName, email, phone, companyName } = req.body;
    
    // We need an email or name to create a customer
    if (!email && !firstName && !companyName) {
      return res.status(400).json({ error: 'Missing required customer details' });
    }

    const displayName = companyName || [firstName, lastName].filter(Boolean).join(' ') || email;

    // Get the default company ID
    const compRes = await query(`SELECT id FROM companies ORDER BY id ASC LIMIT 1`);
    const companyId = compRes.rows[0] ? compRes.rows[0].id : null;

    if (!companyId) {
      return res.status(500).json({ error: 'No company found in Accountech' });
    }

    // Check if customer already exists by email (to prevent duplicates)
    if (email) {
      const existing = await query(`SELECT id FROM customers WHERE lower(email) = lower($1) AND company_id = $2`, [email, companyId]);
      if (existing.rows.length > 0) {
        return res.json({ ok: true, message: 'Customer already exists, skipped.' });
      }
    }

    // Insert new customer
    await query(
      `INSERT INTO customers (company_id, display_name, company_name, email, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [companyId, displayName, companyName, email, phone]
    );

    console.log(`[Webhook Receiver] Created customer ${displayName} in Accountech`);
    res.json({ ok: true, message: 'Customer created' });
  } catch (err) {
    console.error("[Webhook Receiver Error]:", err);
    next(err);
  }
}

module.exports = { officeConnectCustomerSync };
