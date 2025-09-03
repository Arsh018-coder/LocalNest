const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is a provider
const requireProvider = async (req, res, next) => {
  try {
    if (req.user.userType !== 'PROVIDER') {
      return res.status(403).json({ message: 'Provider access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check if user is a customer
const requireCustomer = async (req, res, next) => {
  try {
    if (req.user.userType !== 'CUSTOMER') {
      return res.status(403).json({ message: 'Customer access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check if user is an admin
const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.userType !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Verify admin record exists and user is active
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { admin: true }
    });

    if (!adminUser || !adminUser.isActive || !adminUser.admin) {
      return res.status(403).json({ message: 'Invalid admin account' });
    }

    // Add admin info to request
    req.admin = adminUser.admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Enhanced admin authentication with session validation
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Admin access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.userType !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    // Verify admin account is still valid
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { admin: true }
    });

    if (!adminUser || !adminUser.isActive || !adminUser.admin) {
      return res.status(403).json({ message: 'Invalid admin session' });
    }

    req.user = decoded;
    req.admin = adminUser.admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Admin session expired' });
    }
    return res.status(403).json({ message: 'Invalid admin token' });
  }
};

// Audit logging utility for direct usage in controllers/routes
const writeAuditLog = async (action, targetType, details) => {
  try {
    const adminId = details?.adminId;
    await prisma.auditLog.create({
      data: {
        adminId: adminId || null,
        action,
        targetType,
        targetId: details?.targetId || null,
        details: details || null
      }
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

// Audit logging middleware for automatic logging of successful admin actions
const auditLog = (action, targetType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode < 400 && req.admin) {
        setImmediate(async () => {
          try {
            await prisma.auditLog.create({
              data: {
                adminId: req.admin.id,
                action,
                targetType,
                targetId: req.params.id ? parseInt(req.params.id, 10) : null,
                details: {
                  method: req.method,
                  url: req.originalUrl,
                  userAgent: req.get('User-Agent'),
                  ip: req.ip,
                  body: req.method !== 'GET' ? req.body : undefined
                }
              }
            });
          } catch (error) {
            console.error('Audit log error:', error);
          }
        });
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

module.exports = {
  authenticateToken,
  requireProvider,
  requireCustomer,
  requireAdmin,
  authenticateAdmin,
  auditLog,
  writeAuditLog
};