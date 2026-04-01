const express = require('express');
const router = express.Router();
const { listRecords, getRecordById, createRecord, updateRecord, deleteRecord } = require('../controllers/recordController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');
const { recordValidator, updateRecordValidator } = require('../validators/recordValidators');

router.use(authenticateToken);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List all records
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of records
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
router.get('/', requireRoles('viewer', 'analyst', 'admin'), listRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 record:
 *                   $ref: '#/components/schemas/Record'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Viewer role required
 *       404:
 *         description: Record not found
 */
router.get('/:id', requireRoles('viewer', 'analyst', 'admin'), getRecordById);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *             required:
 *               - type
 *               - amount
 *               - date
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 record:
 *                   $ref: '#/components/schemas/Record'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Analyst role required
 */
router.post('/', requireRoles('analyst', 'admin'), recordValidator, createRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 record:
 *                   $ref: '#/components/schemas/Record'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Analyst role required
 *       404:
 *         description: Record not found
 */
router.put('/:id', requireRoles('analyst', 'admin'), updateRecordValidator, updateRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete record
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Record not found
 */
router.delete('/:id', requireRoles('admin'), deleteRecord);

module.exports = router;
