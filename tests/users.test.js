process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { initDB, closeDB, getDb } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

let adminToken;
let viewerToken;
let adminId;

beforeAll(async () => {
  initDB();
  const db = getDb();
  db.prepare('DELETE FROM financial_records').run();
  db.prepare('DELETE FROM users').run();

  // Create admin user directly
  adminId = uuidv4();
  const hashedPassword = await bcrypt.hash('adminpass123', 10);
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(adminId, 'usersadmin', 'usersadmin@example.com', hashedPassword, 'admin');

  // Login admin
  const adminRes = await request(app).post('/api/auth/login').send({ email: 'usersadmin@example.com', password: 'adminpass123' });
  adminToken = adminRes.body.data.token;

  // Create viewer and login
  const viewerId = uuidv4();
  const viewerHash = await bcrypt.hash('viewerpass123', 10);
  db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(viewerId, 'usersviewer', 'usersviewer@example.com', viewerHash, 'viewer');
  const viewerRes = await request(app).post('/api/auth/login').send({ email: 'usersviewer@example.com', password: 'viewerpass123' });
  viewerToken = viewerRes.body.data.token;
});

afterAll(() => {
  closeDB();
  const dbPath = path.join(__dirname, '../test.db');
  try { fs.unlinkSync(dbPath); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
});

describe('Users - List', () => {
  it('should list all users for admin', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return 403 for viewer', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('Users - Get by ID', () => {
  it('should get user by id for admin', async () => {
    const res = await request(app).get(`/api/users/${adminId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(adminId);
  });

  it('should return 404 for non-existent user', async () => {
    const res = await request(app).get('/api/users/nonexistent-id').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Users - Create', () => {
  it('should create user as admin', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({
      username: 'newusercreated',
      email: 'newusercreated@example.com',
      password: 'Password1@',
      role: 'analyst'
    });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('analyst');
  });

  it('should fail with invalid role', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${adminToken}`).send({
      username: 'badrole',
      email: 'badrole@example.com',
      password: 'Password1@',
      role: 'superuser'
    });
    expect(res.status).toBe(400);
  });

  it('should return 403 for viewer', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${viewerToken}`).send({
      username: 'test',
      email: 'test@example.com',
      password: 'Password1@',
      role: 'viewer'
    });
    expect(res.status).toBe(403);
  });
});

describe('Users - Update', () => {
  it('should update user role', async () => {
    const res = await request(app).put(`/api/users/${adminId}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'analyst' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('analyst');
    // Restore admin role
    await request(app).put(`/api/users/${adminId}`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'admin' });
  });

  it('should return 404 for non-existent user', async () => {
    const res = await request(app).put('/api/users/nonexistent').set('Authorization', `Bearer ${adminToken}`).send({ role: 'viewer' });
    expect(res.status).toBe(404);
  });
});

describe('Users - Deactivate', () => {
  it('should deactivate user', async () => {
    const db = getDb();
    const id = uuidv4();
    const hash = await bcrypt.hash('pass123456', 10);
    db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, 'todeactivate', 'todeactivate@example.com', hash, 'viewer');

    const res = await request(app).delete(`/api/users/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify user is inactive
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    expect(user.status).toBe('inactive');
  });
});
