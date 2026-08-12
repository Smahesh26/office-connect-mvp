const express = require('express');
const { requireAuth, requirePermission } = require('../middleware/auth');
const ctrl = require('../controllers/companyController');

const router = express.Router();
router.use(requireAuth);

router.get('/', ctrl.getCompany);
router.put('/', requirePermission('settings.manage'), ctrl.updateCompany);

module.exports = router;
