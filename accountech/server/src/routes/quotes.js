const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/quoteController');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('quotes.view'), ctrl.list);
router.get('/:id', requirePermission('quotes.view'), ctrl.getOne);
router.get('/:id/pdf', requirePermission('quotes.view'), ctrl.downloadPdf);
router.post('/', requirePermission('quotes.create'), ctrl.create);
router.patch('/:id/status', requirePermission('quotes.edit'), ctrl.updateStatus);
router.post('/:id/convert', requirePermission('invoices.create'), ctrl.convertToInvoice);
router.delete('/:id', requirePermission('quotes.delete'), ctrl.remove);

module.exports = router;
