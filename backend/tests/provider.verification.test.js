const request = require('supertest');
const app = require('../server');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// Test data
let adminToken;
let testProvider;
let testAdmin;

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
      isActive: true,
      ...(userType === 'CUSTOMER' && {
        customer: {
          create: {}
        }
      }),
      ...(userType === 'PROVIDER' && {
        provider: {
          create: {
            experience: userData.experience || '5 years',
            location: userData.location || 'Test Location',
            hourlyRate: userData.hourlyRate || 50,
            verificationRequested: userData.verificationRequested || false,
            verified: userData.verified || false,
            ...(userData.verificationRequestedAt && {
              verificationRequestedAt: new Date(userData.verificationRequestedAt)
            }),
            ...(userData.verificationRejectedReason && {
              verificationRejectedReason: userData.verificationRejectedReason
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

describe('Provider Verification API', () => {
  beforeAll(async () => {
    // Clear existing test data - note the correct model name is auditLog (camelCase)
    await prisma.auditLog.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({});

    // Create admin user
    const admin = await createTestUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'admin123'
    }, 'ADMIN');

    // Create admin record
    testAdmin = await prisma.admin.create({
      data: {
        userId: admin.id
      },
      include: { user: true }
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@test.com',
        password: 'admin123'
      });

    adminToken = loginRes.body.accessToken;

    // Create a test provider with pending verification
    testProvider = await createTestUser({
      firstName: 'Test',
      lastName: 'Provider',
      email: 'provider@test.com',
      password: 'provider123',
      verificationRequested: true,
      verified: false,
      verificationRequestedAt: new Date()
    }, 'PROVIDER');
  });

  afterAll(async () => {
    // Clean up test data - note the correct model name is auditLog (camelCase)
    await prisma.auditLog.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/admin/providers/pending-verifications', () => {
    it('should return pending verifications', async () => {
      const res = await request(app)
        .get('/api/admin/providers/pending-verifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // Find our test provider in the results
      const provider = res.body.data.find(p => p.email === 'provider@test.com');
      expect(provider).toBeDefined();
      expect(provider).toHaveProperty('id');
      expect(provider).toHaveProperty('name', 'Test Provider');
      expect(provider).toHaveProperty('email', 'provider@test.com');
      expect(provider).toHaveProperty('verificationRequested', true);
      expect(provider).toHaveProperty('verified', false);
      expect(provider).toHaveProperty('verificationRequestedAt');
    });

    it('should support pagination', async () => {
      // Create another provider for testing pagination
      await createTestUser({
        firstName: 'Another',
        lastName: 'Provider',
        email: 'another@test.com',
        verificationRequested: true,
        verified: false,
        verificationRequestedAt: new Date()
      }, 'PROVIDER');

      const res = await request(app)
        .get('/api/admin/providers/pending-verifications?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(1);
      
      // Check meta structure without exact total count
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 1,
        totalPages: expect.any(Number)
      });
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('should search providers', async () => {
      // Create a uniquely named provider for search test
      const uniqueName = `SearchTest${Date.now()}`;
      await createTestUser({
        firstName: uniqueName,
        lastName: 'Searchable',
        email: `search-${Date.now()}@test.com`,
        verificationRequested: true,
        verified: false,
        verificationRequestedAt: new Date()
      }, 'PROVIDER');

      const res = await request(app)
        .get(`/api/admin/providers/pending-verifications?search=${uniqueName}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some(p => p.name.includes(uniqueName))).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/providers/pending-verifications');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/admin/providers/:id/verify', () => {
    it('should verify a provider', async () => {
      // Create a new provider for verification test
      const newProvider = await createTestUser({
        firstName: 'Verify',
        lastName: 'Me',
        email: `verify-${Date.now()}@test.com`,
        verificationRequested: true,
        verified: false,
        verificationRequestedAt: new Date()
      }, 'PROVIDER');

      const res = await request(app)
        .put(`/api/admin/providers/${newProvider.provider.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Verified after review' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Provider verified successfully');
      expect(res.body).toHaveProperty('verified', true);
      expect(res.body).toHaveProperty('verifiedAt');
      expect(res.body.verifiedBy).toBeDefined();

      // Verify in database
      const updatedProvider = await prisma.provider.findUnique({
        where: { id: newProvider.provider.id },
        include: { user: true }
      });
      expect(updatedProvider.verified).toBe(true);
      expect(updatedProvider.verifiedBy).toBe(testAdmin.userId);
      expect(updatedProvider.verificationRejectedReason).toBeNull();
    });

    it('should return 400 if provider is already verified', async () => {
      // Create and verify a provider first
      const verifiedProvider = await createTestUser({
        firstName: 'Verified',
        lastName: 'Provider',
        email: `verified-${Date.now()}@test.com`,
        verificationRequested: true,
        verified: true,
        verificationRequestedAt: new Date()
      }, 'PROVIDER');

      const res = await request(app)
        .put(`/api/admin/providers/${verifiedProvider.provider.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Provider is already verified');
    });

    it('should return 404 for non-existent provider', async () => {
      const res = await request(app)
        .put('/api/admin/providers/999999/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Provider not found');
    });
  });

  describe('PUT /api/admin/providers/:id/reject', () => {
    let pendingProvider;

    beforeEach(async () => {
      // Create a new provider with pending verification
      const user = await createTestUser({
        firstName: 'Pending',
        lastName: 'Provider',
        email: `pending-${Date.now()}@test.com`,
        verificationRequested: true,
        verified: false,
        verificationRequestedAt: new Date()
      }, 'PROVIDER');
      
      pendingProvider = user.provider;
    });

    it('should reject a provider verification with a reason', async () => {
      const rejectionReason = 'Insufficient documentation provided for verification';
      
      const res = await request(app)
        .put(`/api/admin/providers/${pendingProvider.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: rejectionReason });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Provider verification rejected');
      expect(res.body).toHaveProperty('verificationRequested', false);
      expect(res.body).toHaveProperty('verificationRejectedReason', rejectionReason);

      // Verify in database
      const updatedProvider = await prisma.provider.findUnique({
        where: { id: pendingProvider.id }
      });
      expect(updatedProvider.verificationRequested).toBe(false);
      expect(updatedProvider.verificationRejectedReason).toBe(rejectionReason);
      expect(updatedProvider.verified).toBe(false);
      expect(updatedProvider.verifiedAt).toBeNull();
      expect(updatedProvider.verifiedBy).toBeNull();
    });

    it('should return 400 if reason is too short', async () => {
      const res = await request(app)
        .put(`/api/admin/providers/${pendingProvider.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Short' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty(
        'message', 
        'Rejection reason must be at least 10 characters long'
      );
    });

    it('should return 400 if provider is already verified', async () => {
      // First verify the provider
      await prisma.provider.update({
        where: { id: pendingProvider.id },
        data: { 
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: testAdmin.id
        }
      });

      const res = await request(app)
        .put(`/api/admin/providers/${pendingProvider.id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Some rejection reason' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Cannot reject a verified provider');
    });

    it('should return 404 for non-existent provider', async () => {
      const res = await request(app)
        .put('/api/admin/providers/999999/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Some rejection reason' });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Provider not found');
    });
  });
});
