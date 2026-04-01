const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { getDb } = require('../config/database');

function listRecords(req, res) {
  const db = getDb();
  const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

  let query = 'SELECT * FROM financial_records WHERE is_deleted = 0';
  const params = [];

  if (type) { query += ' AND type = ?'; params.push(type); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND date <= ?'; params.push(endDate); }

  query += ' ORDER BY date DESC, created_at DESC';

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const records = db.prepare(query).all(...params);
  return res.json({ success: true, data: records });
}

function getRecordById(req, res) {
  const db = getDb();
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  return res.json({ success: true, data: record });
}

function createRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const { amount, type, category, date, notes } = req.body;
  const db = getDb();

  try {
    const id = uuidv4();
    db.prepare('INSERT INTO financial_records (id, amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, amount, type, category, date, notes || null, req.user.id);

    const record = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(id);
    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

function updateRecord(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', data: errors.array() });
  }

  const db = getDb();
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  const { amount, type, category, date, notes } = req.body;
  const updates = [];
  const params = [];

  if (amount !== undefined) { updates.push('amount = ?'); params.push(amount); }
  if (type !== undefined) { updates.push('type = ?'); params.push(type); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  if (date !== undefined) { updates.push('date = ?'); params.push(date); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.prepare(`UPDATE financial_records SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(req.params.id);
  return res.json({ success: true, data: updated });
}

function deleteRecord(req, res) {
  const db = getDb();
  const record = db.prepare('SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  db.prepare('UPDATE financial_records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Record deleted successfully' });
}

module.exports = { listRecords, getRecordById, createRecord, updateRecord, deleteRecord };
