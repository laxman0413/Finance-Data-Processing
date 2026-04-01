const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { getDb } = require('../config/database');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { username, email, password } = req.body;
  const db = getDb();

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, username, email, hashedPassword, 'viewer');

    const user = db.prepare('SELECT id, username, email, role, status, created_at FROM users WHERE id = ?').get(id);
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { email, password } = req.body;
  const db = getDb();

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    return res.json({ success: true, data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { register, login };
