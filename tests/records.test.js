process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { initDB, closeDB, getDb } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

let adminToken;
let analystToken;
let viewerToken;

beforeAll(async () => {
  initDB();
  const db = getDb();
  db.prepare('DELETE FROM financial_records').run();
  db.prepare('DELETE FROM users').run();

  const hash = async (p) => bcrypt.hash(p, 10);

  const adminId = uuidv4();
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(adminId, 'recadmin', 'recadmin@example.com', await hash('adminpass123'), 'admin');
  
  const analystId = uuidv4();
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(analystId, 'recanalyst', 'recanalyst@example.com', await hash('analystpass123'), 'analyst');

  const viewerId = uuidv4();
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(viewerId, 'recviewer', 'recviewer@example.com', await hash('viewerpass123'), 'viewer');

  const [adminRes, analystRes, viewerRes] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'recadmin@example.com', password: 'adminpass123' }),
    request(app).post('/api/auth/login').send({ email: 'recanalyst@example.com', password: 'analystpass123' }),
    request(app).post('/api/auth/login').send({ email: 'recviewer@example.com', password: 'viewerpass123' }),
  ]);

  adminToken = adminRes.body.data.token;
  analystToken = analystRes.body.data.token;
  viewerToken = viewerRes.body.data.token;
});

afterAll(() => {
  closeDB();
  const dbPath = path.join(__dirname, '../test.db');
  try { fs.unlinkSync(dbPath); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
});

describe('Records - Create', () => {
  it('should create record as analyst', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({
      amount: 1000,
      type: 'income',
      category: 'Salary',
      date: '2024-01-15',
      notes: 'Monthly salary'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(1000);
  });

  it('should create record as admin', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${adminToken}`).send({
      amount: 500,
      type: 'expense',
      category: 'Rent',
      date: '2024-01-16'
    });
    expect(res.status).toBe(201);
  });

  it('should fail for viewer', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${viewerToken}`).send({
      amount: 100,
      type: 'income',
      category: 'Test',
      date: '2024-01-17'
    });
    expect(res.status).toBe(403);
  });

  it('should fail with invalid amount', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({
      amount: -100,
      type: 'income',
      category: 'Test',
      date: '2024-01-17'
    });
    expect(res.status).toBe(400);
  });

  it('should fail with invalid type', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({
      amount: 100,
      type: 'transfer',
      category: 'Test',
      date: '2024-01-17'
    });
    expect(res.status).toBe(400);
  });
});

describe('Records - List', () => {
  it('should list records for viewer', async () => {
    const res = await request(app).get('/api/records').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should filter by type', async () => {
    const res = await request(app).get('/api/records?type=income').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(r => expect(r.type).toBe('income'));
  });

  it('should support pagination', async () => {
    const res = await request(app).get('/api/records?page=1&limit=1').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });
});

describe('Records - Get by ID', () => {
  let recordId;

  beforeAll(async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({
      amount: 200,
      type: 'income',
      category: 'Bonus',
      date: '2024-02-01'
    });
    recordId = res.body.data.id;
  });

  it('should get record by id', async () => {
    const res = await request(app).get(`/api/records/${recordId}`).set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(recordId);
  });

  it('should return 404 for non-existent record', async () => {
    const res = await request(app).get('/api/records/nonexistent').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Records - Update', () => {
  let recordId;

  beforeAll(async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({
      amount: 300,
      type: 'expense',
      category: 'Food',
      date: '2024-02-10'
    });
    recordId = res.body.data.id;
  });

  it('should update record as analyst', async () => {
    const res = await request(app).put(`/api/records/${recordId}`).set('Authorization', `Bearer ${analystToken}`).send({ amount: 350 });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(350);
  });

  it('should fail for viewer', async () => {
    const res = await request(app).put(`/api/records/${recordId}`).set('Authorization', `Bearer ${viewerToken}`).send({ amount: 400 });
    expect(res.status).toBe(403);
  });
});

describe('Records - Delete', () => {
  let recordId;

  beforeAll(async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${adminToken}`).send({
      amount: 150,
      type: 'expense',
      category: 'Utilities',
      date: '2024-02-15'
    });
    recordId = res.body.data.id;
  });

  it('should soft-delete record as admin', async () => {
    const res = await request(app).delete(`/api/records/${recordId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify soft-deleted
    const getRes = await request(app).get(`/api/records/${recordId}`).set('Authorization', `Bearer ${viewerToken}`);
    expect(getRes.status).toBe(404);
  });

  it('should fail for analyst', async () => {
    const createRes = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send({
      amount: 99,
      type: 'income',
      category: 'Other',
      date: '2024-02-20'
    });
    const res = await request(app).delete(`/api/records/${createRes.body.data.id}`).set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });
});
