const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/itemController');

const router = express.Router();
router.use(requireAuth);

router.get('/', requirePermission('items.view'), ctrl.list);
router.post('/', requirePermission('items.create'), ctrl.create);
router.put('/:id', requirePermission('items.edit'), ctrl.update);
router.delete('/:id', requirePermission('items.delete'), ctrl.remove);

module.exports = router;
