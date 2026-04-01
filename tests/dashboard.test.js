process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { initDB, closeDB, getDb } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

let viewerToken;
let analystToken;

beforeAll(async () => {
  initDB();
  const db = getDb();
  db.prepare('DELETE FROM financial_records').run();
  db.prepare('DELETE FROM users').run();

  const hash = async (p) => bcrypt.hash(p, 10);

  const analystId = uuidv4();
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(analystId, 'dashanalyst', 'dashanalyst@example.com', await hash('analystpass123'), 'analyst');
  
  const viewerId = uuidv4();
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(viewerId, 'dashviewer', 'dashviewer@example.com', await hash('viewerpass123'), 'viewer');

  const [analystRes, viewerRes] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'dashanalyst@example.com', password: 'analystpass123' }),
    request(app).post('/api/auth/login').send({ email: 'dashviewer@example.com', password: 'viewerpass123' }),
  ]);

  analystToken = analystRes.body.data.token;
  viewerToken = viewerRes.body.data.token;

  // Create some records
  await Promise.all([
    request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({ amount: 5000, type: 'income', category: 'Salary', date: '2024-01-01' }),
    request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({ amount: 1000, type: 'expense', category: 'Rent', date: '2024-01-05' }),
    request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({ amount: 200, type: 'expense', category: 'Food', date: '2024-01-10' }),
    request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({ amount: 3000, type: 'income', category: 'Freelance', date: '2024-02-01' }),
  ]);
});

afterAll(() => {
  closeDB();
  const dbPath = path.join(__dirname, '../test.db');
  try { fs.unlinkSync(dbPath); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
});

describe('Dashboard - Summary', () => {
  it('should return summary for viewer', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('totalExpenses');
    expect(res.body.data).toHaveProperty('netBalance');
    expect(res.body.data.totalIncome).toBe(8000);
    expect(res.body.data.totalExpenses).toBe(1200);
    expect(res.body.data.netBalance).toBe(6800);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});

describe('Dashboard - Category Totals', () => {
  it('should return category totals for viewer', async () => {
    const res = await request(app).get('/api/dashboard/category-totals').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Dashboard - Recent Records', () => {
  it('should return recent records for viewer', async () => {
    const res = await request(app).get('/api/dashboard/recent').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(10);
  });
});

describe('Dashboard - Monthly Trends', () => {
  it('should return monthly trends for analyst', async () => {
    const res = await request(app).get('/api/dashboard/monthly-trends').set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return 403 for viewer', async () => {
    const res = await request(app).get('/api/dashboard/monthly-trends').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});
