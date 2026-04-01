const { getDb } = require('../config/database');

function getSummary(req, res) {
  const db = getDb();
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'income' AND is_deleted = 0").get();
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'expense' AND is_deleted = 0").get();

  return res.json({
    success: true,
    data: {
      totalIncome: income.total,
      totalExpenses: expense.total,
      netBalance: income.total - expense.total
    }
  });
}

function getCategoryTotals(req, res) {
  const db = getDb();
  const totals = db.prepare("SELECT category, type, SUM(amount) as total FROM financial_records WHERE is_deleted = 0 GROUP BY category, type ORDER BY category").all();
  return res.json({ success: true, data: totals });
}

function getRecentRecords(req, res) {
  const db = getDb();
  const records = db.prepare('SELECT * FROM financial_records WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 10').all();
  return res.json({ success: true, data: records });
}

function getMonthlyTrends(req, res) {
  const db = getDb();
  const trends = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total
    FROM financial_records
    WHERE is_deleted = 0
    GROUP BY month, type
    ORDER BY month DESC
  `).all();
  return res.json({ success: true, data: trends });
}

module.exports = { getSummary, getCategoryTotals, getRecentRecords, getMonthlyTrends };
