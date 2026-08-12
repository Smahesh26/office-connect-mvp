const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

const router = express.Router();
router.use(requireAuth);

router.get('/roles', requirePermission('users.manage'), ctrl.listRoles);
router.get('/', requirePermission('users.manage'), ctrl.list);
router.post('/', requirePermission('users.manage'), ctrl.create);
router.put('/:id', requirePermission('users.manage'), ctrl.update);
router.post('/:id/reset-password', requirePermission('users.manage'), ctrl.resetPassword);
router.delete('/:id', requirePermission('users.manage'), ctrl.remove);

module.exports = router;
