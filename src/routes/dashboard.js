const express = require('express');
const router = express.Router();
const { getSummary, getCategoryTotals, getRecentRecords, getMonthlyTrends } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');

router.use(authenticateToken);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get finance summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finance summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalIncome:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     balance:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Viewer role required
 */
router.get('/summary', requireRoles('viewer', 'analyst', 'admin'), getSummary);

/**
 * @swagger
 * /api/dashboard/category-totals:
 *   get:
 *     summary: Get category totals
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       total:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Viewer role required
 */
router.get('/category-totals', requireRoles('viewer', 'analyst', 'admin'), getCategoryTotals);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get recent records
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent financial records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Record'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Viewer role required
 */
router.get('/recent', requireRoles('viewer', 'analyst', 'admin'), getRecentRecords);

/**
 * @swagger
 * /api/dashboard/monthly-trends:
 *   get:
 *     summary: Get monthly trends
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       income:
 *                         type: number
 *                       expenses:
 *                         type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Analyst role required
 */
router.get('/monthly-trends', requireRoles('analyst', 'admin'), getMonthlyTrends);

module.exports = router;
