const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/invoiceController');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('invoices.view'), ctrl.list);
router.get('/:id', requirePermission('invoices.view'), ctrl.getOne);
router.get('/:id/pdf', requirePermission('invoices.view'), ctrl.downloadPdf);
router.post('/', requirePermission('invoices.create'), ctrl.create);
router.put('/:id', requirePermission('invoices.edit'), ctrl.update);
router.patch('/:id/status', requirePermission('invoices.send'), ctrl.updateStatus);
router.delete('/:id', requirePermission('invoices.delete'), ctrl.remove);

module.exports = router;
