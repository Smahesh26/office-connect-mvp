const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

const router = express.Router();
router.use(requireAuth);
router.get('/summary', ctrl.summary);

module.exports = router;
