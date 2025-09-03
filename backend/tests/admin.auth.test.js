const request = require('supertest');
const app = require('../server');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('Admin Authentication API', () => {
  let adminUser;
  let adminToken;
  let refreshToken;

  // Create a test admin user before running tests
  beforeAll(async () => {
    // Clear any existing test data
    await prisma.auditLog.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'testadmin@localnest.com' } });

    // Create a test admin user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'testadmin@localnest.com',
        password: hashedPassword,
        phone: '1234567890',
        userType: 'ADMIN',
        isActive: true,
        admin: {
          create: {}
        }
      },
      include: {
        admin: true
      }
    });

    adminUser = user;
  });

  // Clean up test data after all tests
  afterAll(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'testadmin@localnest.com' } });
    await prisma.$disconnect();
  });

  describe('POST /api/admin/login', () => {
    it('should login admin with valid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'testadmin@localnest.com',
          password: 'testpassword123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Admin login successful');
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('access');
      expect(res.body.tokens).toHaveProperty('refresh');
      expect(res.body.user.email).toBe('testadmin@localnest.com');
      expect(res.body.user.userType).toBe('ADMIN');

      // Save tokens for subsequent tests
      adminToken = res.body.tokens.access;
      refreshToken = res.body.tokens.refresh;
    });

    it('should return 401 with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'testadmin@localnest.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Invalid admin credentials');
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ email: 'testadmin@localnest.com' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Email and password are required');
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should get admin profile with valid token', async () => {
      const res = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('email', 'testadmin@localnest.com');
      expect(res.body).toHaveProperty('userType', 'ADMIN');
      expect(res.body).toHaveProperty('admin');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/admin/profile');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/admin/refresh-token', () => {
    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/admin/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('expiresIn', 28800); // 8 hours in seconds

      // Update the admin token for subsequent tests
      adminToken = res.body.accessToken;
    });

    it('should return 400 with missing refresh token', async () => {
      const res = await request(app)
        .post('/api/admin/refresh-token')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Refresh token is required');
    });

    it('should return 403 with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/admin/refresh-token')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/admin/logout', () => {
    it('should log out admin user', async () => {
      const res = await request(app)
        .post('/api/admin/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Successfully logged out');
    });
  });
});
