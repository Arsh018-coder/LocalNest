const jwt = require('jsonwebtoken');
const { requireAdmin, authenticateAdmin, auditLog } = require('../../middleware/auth');
const prisma = require('../../lib/prisma');

// Mock Prisma
jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn()
  },
  auditLog: {
    create: jest.fn()
  }
}));

// Mock JWT
jest.mock('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Admin Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: {},
      params: {},
      method: 'GET',
      originalUrl: '/api/admin/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: 200
    };
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('requireAdmin', () => {
    it('should allow admin users', async () => {
      req.user = { id: 1, userType: 'ADMIN' };
      
      const mockAdminUser = {
        id: 1,
        isActive: true,
        admin: { id: 1, userId: 1 }
      };
      
      prisma.user.findUnique.mockResolvedValue(mockAdminUser);

      await requireAdmin(req, res, next);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { admin: true }
      });
      expect(req.admin).toEqual(mockAdminUser.admin);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      req.user = { id: 1, userType: 'CUSTOMER' };

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject inactive admin users', async () => {
      req.user = { id: 1, userType: 'ADMIN' };
      
      const mockAdminUser = {
        id: 1,
        isActive: false,
        admin: { id: 1, userId: 1 }
      };
      
      prisma.user.findUnique.mockResolvedValue(mockAdminUser);

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid admin account' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      req.user = { id: 1, userType: 'ADMIN' };
      
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authenticateAdmin', () => {
    it('should authenticate valid admin token', async () => {
      req.headers.authorization = 'Bearer valid-token';
      
      const mockDecoded = { id: 1, userType: 'ADMIN', email: 'admin@test.com' };
      const mockAdminUser = {
        id: 1,
        isActive: true,
        admin: { id: 1, userId: 1 }
      };
      
      jwt.verify.mockReturnValue(mockDecoded);
      prisma.user.findUnique.mockResolvedValue(mockAdminUser);

      await authenticateAdmin(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', JWT_SECRET);
      expect(req.user).toEqual(mockDecoded);
      expect(req.admin).toEqual(mockAdminUser.admin);
      expect(next).toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      await authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin access token required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject non-admin token', async () => {
      req.headers.authorization = 'Bearer customer-token';
      
      const mockDecoded = { id: 1, userType: 'CUSTOMER', email: 'customer@test.com' };
      jwt.verify.mockReturnValue(mockDecoded);

      await authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin privileges required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired tokens', async () => {
      req.headers.authorization = 'Bearer expired-token';
      
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw expiredError; });

      await authenticateAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin session expired' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('auditLog', () => {
    it('should log successful admin actions', async () => {
      const middleware = auditLog('USER_UPDATE', 'USER');
      req.admin = { id: 1 };
      req.params.id = '123';
      req.body = { name: 'test' };
      res.statusCode = 200;

      // Mock the original json method
      const originalJson = res.json;
      
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      
      // Simulate successful response
      res.json({ success: true });
      
      // Wait for async audit log
      await new Promise(resolve => setImmediate(resolve));
      
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminId: 1,
          action: 'USER_UPDATE',
          targetType: 'USER',
          targetId: 123,
          details: {
            method: 'GET',
            url: '/api/admin/test',
            userAgent: 'test-agent',
            ip: '127.0.0.1',
            body: undefined
          }
        }
      });
    });

    it('should not log failed actions', async () => {
      const middleware = auditLog('USER_UPDATE', 'USER');
      req.admin = { id: 1 };
      res.statusCode = 400;

      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      
      // Simulate failed response
      res.json({ error: 'Bad request' });
      
      // Wait for potential async audit log
      await new Promise(resolve => setImmediate(resolve));
      
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should handle audit log errors gracefully', async () => {
      const middleware = auditLog('USER_UPDATE', 'USER');
      req.admin = { id: 1 };
      res.statusCode = 200;
      
      prisma.auditLog.create.mockRejectedValue(new Error('Audit log failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      
      // Simulate successful response
      res.json({ success: true });
      
      // Wait for async audit log
      await new Promise(resolve => setImmediate(resolve));
      
      expect(consoleSpy).toHaveBeenCalledWith('Audit log error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});