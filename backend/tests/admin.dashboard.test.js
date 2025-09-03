const request = require('supertest');
const app = require('../server');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

// Test data
let adminToken;
let testProvider;
let testCustomer;

// Helper function to create a test user
const createTestUser = async (userData, userType = 'CUSTOMER') => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  return prisma.user.create({
    data: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
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

// Helper function to create test bookings
const createTestBooking = async (customerId, providerId, status, daysAgo = 0) => {
  const bookingDate = new Date();
  bookingDate.setDate(bookingDate.getDate() - daysAgo);
  
  return prisma.booking.create({
    data: {
      date: bookingDate,
      time: '10:00',
      status,
      notes: 'Test booking',
      totalPrice: 100,
      customer: { connect: { id: customerId } },
      provider: { connect: { id: providerId } },
      service: {
        create: {
          name: 'Test Service',
          description: 'Test Service Description',
          category: 'Test Category',
          averagePrice: 100
        }
      }
    }
  });
};

describe('Admin Dashboard API', () => {
  beforeAll(async () => {
    // Clear existing test data
    await prisma.auditLog.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.admin.deleteMany({});

    // Create admin user and get token
    const admin = await createTestUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'admin123',
      phone: '1234567890'
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

    // Create test provider
    testProvider = await createTestUser({
      firstName: 'Test',
      lastName: 'Provider',
      email: 'provider@test.com',
      password: 'provider123',
      verificationRequested: true,
      verified: true,
      verificationRequestedAt: new Date()
    }, 'PROVIDER');

    // Create test customer
    testCustomer = await createTestUser({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      password: 'customer123'
    }, 'CUSTOMER');

    // Create test bookings
    await createTestBooking(testCustomer.customer.id, testProvider.provider.id, 'COMPLETED', 1);
    await createTestBooking(testCustomer.customer.id, testProvider.provider.id, 'PENDING');
    await createTestBooking(testCustomer.customer.id, testProvider.provider.id, 'CONFIRMED');
    await createTestBooking(testCustomer.customer.id, testProvider.provider.id, 'COMPLETED', 5);
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

  describe('GET /api/admin/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('overview');
      expect(res.body.overview).toHaveProperty('totalUsers');
      expect(res.body.overview).toHaveProperty('totalProviders');
      expect(res.body.overview).toHaveProperty('activeBookings');
      expect(res.body.overview).toHaveProperty('completedBookings');
      expect(res.body.overview.completedBookings).toHaveProperty('count');
      expect(res.body.overview.completedBookings).toHaveProperty('completionRate');
      expect(res.body.overview).toHaveProperty('pendingVerifications');
      
      // Verify recent activities
      expect(res.body).toHaveProperty('recentActivities');
      expect(Array.isArray(res.body.recentActivities)).toBe(true);
      
      // Verify trends
      expect(res.body).toHaveProperty('trends');
      expect(res.body.trends).toHaveProperty('userRegistrations');
      expect(Array.isArray(res.body.trends.userRegistrations)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/stats');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/admin/verifications/pending', () => {
    beforeAll(async () => {
      // Create a provider with pending verification
      await createTestUser({
        firstName: 'Pending',
        lastName: 'Provider',
        email: 'pending@test.com',
        password: 'pending123',
        verificationRequested: true,
        verified: false,
        verificationRequestedAt: new Date()
      }, 'PROVIDER');
    });

    it('should return pending verifications', async () => {
      const res = await request(app)
        .get('/api/admin/verifications/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('totalPages');
      
      // Verify at least one pending verification exists
      expect(res.body.meta.total).toBeGreaterThan(0);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('verificationRequested', true);
      expect(res.body.data[0]).toHaveProperty('verified', false);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/verifications/pending?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta).toEqual({
        total: 1,
        page: 1,
        limit: 1,
        totalPages: 1
      });
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .get('/api/admin/verifications/pending');

      expect(res.statusCode).toEqual(401);
    });
  });
});
