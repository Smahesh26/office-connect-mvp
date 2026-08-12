const express = require('express');
const { officeConnectCustomerSync } = require('../controllers/webhookController');

const router = express.Router();

// This route receives the webhook from cambliss-backend
router.post('/officeconnect/customer', officeConnectCustomerSync);

module.exports = router;
