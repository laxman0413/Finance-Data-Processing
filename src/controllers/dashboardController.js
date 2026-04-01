const { getDb } = require('../config/database');

function getSummary(req, res) {
  const db = getDb();
  const income = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'income' AND is_deleted = 0").get();
  const expense = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM financial_records WHERE type = 'expense' AND is_deleted = 0").get();
  const countRow = db.prepare("SELECT COUNT(*) as count FROM financial_records WHERE is_deleted = 0").get();

  return res.json({
    success: true,
    data: {
      totalIncome: income.total,
      totalExpenses: expense.total,
      netBalance: income.total - expense.total,
      recordCount: countRow.count
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
  const rows = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total
    FROM financial_records
    WHERE is_deleted = 0
      AND date >= date('now', '-12 months')
    GROUP BY month, type
    ORDER BY month DESC
  `).all();

  // Pivot income/expense into one row per month with net balance
  const monthMap = {};
  for (const row of rows) {
    if (!monthMap[row.month]) {
      monthMap[row.month] = { month: row.month, income: 0, expenses: 0 };
    }
    if (row.type === 'income') {
      monthMap[row.month].income = row.total;
    } else {
      monthMap[row.month].expenses = row.total;
    }
  }

  const trends = Object.values(monthMap)
    .map(m => ({ ...m, net: m.income - m.expenses }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return res.json({ success: true, data: trends });
}

module.exports = { getSummary, getCategoryTotals, getRecentRecords, getMonthlyTrends };
