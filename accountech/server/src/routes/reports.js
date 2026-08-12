const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

const router = express.Router();
router.use(requireAuth, requirePermission('reports.view'));

router.get('/profit-and-loss', ctrl.profitAndLoss);
router.get('/invoice-aging', ctrl.invoiceAging);
router.get('/sales-by-customer', ctrl.salesByCustomer);

module.exports = router;
