const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/accountController');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('accounts.view'), ctrl.list);
router.get('/:id', requirePermission('accounts.view'), ctrl.getOne);
router.post('/', requirePermission('accounts.create'), ctrl.create);
router.put('/:id', requirePermission('accounts.edit'), ctrl.update);
router.delete('/:id', requirePermission('accounts.delete'), ctrl.remove);

module.exports = router;
