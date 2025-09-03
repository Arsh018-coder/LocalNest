const request = require('supertest');
const app = require('../server');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// Test data
let adminToken;
let testCustomer;
let testProvider;

// Helper function to create a test user
const createTestUser = async (userData, userType = 'CUSTOMER') => {
  const hashedPassword = await bcrypt.hash(userData.password || 'test123', 12);
  return prisma.user.create({
    data: {
      firstName: userData.firstName || 'Test',
      lastName: userData.lastName || 'User',
      email: userData.email || `test${Date.now()}@example.com`,
      password: hashedPassword,
      phone: userData.phone || '1234567890',
      userType,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      ...(userType === 'CUSTOMER' && {
        customer: {
          create: {}
        }
      }),
      ...(userType === 'PROVIDER' && {
        provider: {
          create: {
            experience: '5 years',
            location: 'Test Location',
            hourlyRate: 50,
            verificationRequested: userData.verificationRequested || false,
            verified: userData.verified || false,
            ...(userData.verificationRequestedAt && {
              verificationRequestedAt: new Date(userData.verificationRequestedAt)
            })
          }
        }
      })
    },
    include: {
      customer: true,
      provider: true
    }
  });
};

describe('Admin User Management API', () => {
  beforeAll(async () => {
    // Clear existing test data
    await prisma.auditLog.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.admin.deleteMany({});

    // Create admin user
    const admin = await createTestUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'admin123'
    }, 'ADMIN');

    // Create admin record
    await prisma.admin.create({
      data: {
        userId: admin.id
      }
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    adminToken = loginRes.body.tokens.access;

    // Create test customer
    testCustomer = await createTestUser({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      password: 'customer123'
    }, 'CUSTOMER');

    // Create test provider
    testProvider = await createTestUser({
      firstName: 'Test',
      lastName: 'Provider',
      email: 'provider@test.com',
      password: 'provider123',
      verificationRequested: true,
      verified: true
    }, 'PROVIDER');
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/admin/users', () => {
    it('should return all users with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 10);
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('should filter users by type', async () => {
      const res = await request(app)
        .get('/api/admin/users?userType=CUSTOMER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(user => user.userType === 'CUSTOMER')).toBe(true);
    });

    it('should search users by name or email', async () => {
      const res = await request(app)
        .get('/api/admin/users?search=Test%20Customer')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.some(user => 
          user.name.includes('Test') && user.name.includes('Customer')
        )
      ).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/users');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return user details by ID', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testCustomer.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', testCustomer.id);
      expect(res.body).toHaveProperty('firstName', 'Test');
      expect(res.body).toHaveProperty('lastName', 'Customer');
      expect(res.body).toHaveProperty('email', 'customer@test.com');
      expect(res.body).toHaveProperty('userType', 'CUSTOMER');
      expect(res.body).toHaveProperty('metadata');
      expect(res.body.metadata).toHaveProperty('type', 'customer');
    });

    it('should return provider details with services', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${testProvider.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('userType', 'PROVIDER');
      expect(res.body.metadata).toHaveProperty('type', 'provider');
      expect(res.body.metadata).toHaveProperty('verified', true);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/admin/users/999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user for status updates with unique email
      const unique = Date.now() + Math.floor(Math.random() * 1000);
      testUser = await createTestUser({
        firstName: 'Status',
        lastName: 'Test',
        email: `status-${unique}@test.com`,
        password: 'test123',
        isActive: true
      }, 'CUSTOMER');
    });

    it('should deactivate a user', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false, reason: 'Test deactivation' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'User deactivated successfully');
      expect(res.body.user).toHaveProperty('isActive', false);

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.isActive).toBe(false);
    });

    it('should activate a user', async () => {
      // First deactivate the user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false }
      });

      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'User activated successfully');
      expect(res.body.user).toHaveProperty('isActive', true);
    });

    it('should return 400 if user is already in the target status', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'User is already active');
    });

    it('should not allow modifying admin users', async () => {
      const adminUsers = await prisma.user.findMany({
        where: { userType: 'ADMIN' }
      });
      const adminId = adminUsers[0].id;

      const res = await request(app)
        .put(`/api/admin/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Cannot modify admin user status');
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user for updates with unique email
      const unique = Date.now() + Math.floor(Math.random() * 1000);
      testUser = await createTestUser({
        firstName: 'Update',
        lastName: 'Test',
        email: `update-${unique}@test.com`,
        password: 'test123'
      }, 'CUSTOMER');
    });

    it('should update user basic information', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@test.com',
        phone: '9876543210'
      };

      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'User updated successfully');
      expect(res.body.user).toMatchObject({
        firstName: 'Updated',
        lastName: 'User',
        email: 'updated@test.com',
        phone: '9876543210'
      });
    });

    it('should update user password', async () => {
      const newPassword = 'newSecurePassword123';
      
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: newPassword });

      expect(res.statusCode).toEqual(200);

      // Verify password was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      
      const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should convert customer to provider', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userType: 'PROVIDER',
          experience: '5 years',
          location: 'Test Location',
          hourlyRate: 50,
          bio: 'Test bio'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('userType', 'PROVIDER');
      expect(res.body.user.metadata).toMatchObject({
        type: 'provider',
        experience: '5 years',
        location: 'Test Location',
        hourlyRate: 50,
        bio: 'Test bio',
        verified: false
      });
    });

    it('should verify a provider', async () => {
      // First convert to provider
      await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userType: 'PROVIDER' });

      // Now verify the provider
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verified: true });

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.metadata).toHaveProperty('verified', true);
      expect(res.body.user.metadata.verifiedAt).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid-email' });

      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'customer@test.com' }); // Already exists

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Email already in use');
    });
  });
});
