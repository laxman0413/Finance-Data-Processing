const express = require('express');
const router = express.Router();
const { getSummary, getCategoryTotals, getRecentRecords, getMonthlyTrends } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');

router.use(authenticateToken);

router.get('/summary', requireRoles('viewer', 'analyst', 'admin'), getSummary);
router.get('/category-totals', requireRoles('viewer', 'analyst', 'admin'), getCategoryTotals);
router.get('/recent', requireRoles('viewer', 'analyst', 'admin'), getRecentRecords);
router.get('/monthly-trends', requireRoles('analyst', 'admin'), getMonthlyTrends);

module.exports = router;
