process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { initDB, closeDB } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

beforeAll(() => {
  initDB();
});

afterAll(() => {
  closeDB();
  const dbPath = path.join(__dirname, '../test.db');
  try { fs.unlinkSync(dbPath); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-shm'); } catch (e) {}
  try { fs.unlinkSync(dbPath + '-wal'); } catch (e) {}
});

describe('Auth - Register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'authtest1',
      email: 'authtest1@example.com',
      password: 'password123'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.role).toBe('viewer');
  });

  it('should fail on duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'authtest2',
      email: 'authtest2dup@example.com',
      password: 'password123'
    });
    const res = await request(app).post('/api/auth/register').send({
      username: 'authtest2b',
      email: 'authtest2dup@example.com',
      password: 'password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail on duplicate username', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'authtestdup3',
      email: 'authtestdup3a@example.com',
      password: 'password123'
    });
    const res = await request(app).post('/api/auth/register').send({
      username: 'authtestdup3',
      email: 'authtestdup3b@example.com',
      password: 'password123'
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should fail with short username', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'authshort@example.com',
      password: 'password123'
    });
    expect(res.status).toBe(400);
  });

  it('should fail with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'validuser',
      email: 'notanemail',
      password: 'password123'
    });
    expect(res.status).toBe(400);
  });

  it('should fail with short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'validuser2',
      email: 'authvalid2@example.com',
      password: 'short'
    });
    expect(res.status).toBe(400);
  });
});

describe('Auth - Login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      username: 'logintest1',
      email: 'logintest1@example.com',
      password: 'password123'
    });
  });

  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'logintest1@example.com',
      password: 'password123'
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('email', 'logintest1@example.com');
  });

  it('should fail with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'logintest1@example.com',
      password: 'wrongpassword'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail with non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'password123'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should fail with invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'notanemail',
      password: 'password123'
    });
    expect(res.status).toBe(400);
  });
});
