const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = ?').get(decoded.id, 'active');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = { id: user.id, username: user.username, email: user.email, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = { authenticateToken };
