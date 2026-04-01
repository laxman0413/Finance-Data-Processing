const express = require('express');
const router = express.Router();
const { listUsers, getUserById, createUser, updateUser, deactivateUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');
const { createUserValidator, updateUserValidator } = require('../validators/userValidators');

router.use(authenticateToken);
router.use(requireRoles('admin'));

router.get('/', listUsers);
router.get('/:id', getUserById);
router.post('/', createUserValidator, createUser);
router.put('/:id', updateUserValidator, updateUser);
router.delete('/:id', deactivateUser);

module.exports = router;
