const express = require('express');
const router = express.Router();
const { listRecords, getRecordById, createRecord, updateRecord, deleteRecord } = require('../controllers/recordController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');
const { recordValidator, updateRecordValidator } = require('../validators/recordValidators');

router.use(authenticateToken);

router.get('/', requireRoles('viewer', 'analyst', 'admin'), listRecords);
router.get('/:id', requireRoles('viewer', 'analyst', 'admin'), getRecordById);
router.post('/', requireRoles('analyst', 'admin'), recordValidator, createRecord);
router.put('/:id', requireRoles('analyst', 'admin'), updateRecordValidator, updateRecord);
router.delete('/:id', requireRoles('admin'), deleteRecord);

module.exports = router;
