const { body } = require('express-validator');

const createUserValidator = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin'),
];

const updateUserValidator = [
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

module.exports = { createUserValidator, updateUserValidator };
