const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('transactions.view'), ctrl.list);
router.post('/', requirePermission('transactions.create'), ctrl.create);
router.delete('/:id', requirePermission('transactions.delete'), ctrl.remove);

module.exports = router;
