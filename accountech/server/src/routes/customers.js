const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/customerController');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('customers.view'), ctrl.list);
router.get('/:id', requirePermission('customers.view'), ctrl.getOne);
router.post('/', requirePermission('customers.create'), ctrl.create);
router.put('/:id', requirePermission('customers.edit'), ctrl.update);
router.delete('/:id', requirePermission('customers.delete'), ctrl.remove);

module.exports = router;
