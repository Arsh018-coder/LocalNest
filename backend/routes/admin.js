const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticateAdmin, auditLog, writeAuditLog } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const providerController = require('../controllers/providerController');
const serviceAdminController = require('../controllers/serviceAdminController');
const analyticsController = require('../controllers/analyticsController');
const auditController = require('../controllers/auditController');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_TOKEN_EXPIRY = '8h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Dashboard routes
router.get('/dashboard/stats', authenticateAdmin, adminController.getDashboardStats);
// Compatibility route for tests expecting this path
router.get('/verifications/pending', authenticateAdmin, adminController.getPendingVerifications);

// User management routes
router.get('/users', authenticateAdmin, userController.getUsers);
router.get('/users/:id', authenticateAdmin, userController.getUserById);
router.put('/users/:id', authenticateAdmin, userController.updateUser);
router.put('/users/:id/status', authenticateAdmin, userController.updateUserStatus);
router.delete('/users/:id', authenticateAdmin, userController.deleteUser);

// Provider verification routes
router.get('/providers/pending-verifications', authenticateAdmin, providerController.getPendingVerifications);
router.put('/providers/:id/verify', authenticateAdmin, providerController.verifyProvider);
router.put('/providers/:id/reject', authenticateAdmin, providerController.rejectProviderVerification);

// Service management routes
router.get('/services', authenticateAdmin, serviceAdminController.listServices);
router.post('/services', authenticateAdmin, serviceAdminController.createService);
router.put('/services/:id', authenticateAdmin, serviceAdminController.updateService);
router.delete('/services/:id', authenticateAdmin, serviceAdminController.deleteService);
router.get('/services/categories', authenticateAdmin, serviceAdminController.listCategories);
router.put('/services/categories/rename', authenticateAdmin, serviceAdminController.renameCategory);

// Analytics routes
router.get('/analytics/overview', authenticateAdmin, analyticsController.getOverview);
router.get('/analytics/trends', authenticateAdmin, analyticsController.getTrends);
router.get('/analytics/revenue', authenticateAdmin, analyticsController.getRevenue);

// Audit logs
router.get('/audit/logs', authenticateAdmin, auditController.listAuditLogs);

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true }
    });

    // Check if user exists and is an admin
    if (!user || user.userType !== 'ADMIN' || !user.admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Admin account is deactivated' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      await writeAuditLog('LOGIN_ATTEMPT', 'AUTH', {
        userId: user.id,
        success: false,
        reason: 'Invalid credentials'
      });
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        userType: user.userType,
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.id, isRefresh: true },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Optionally log login time in audit logs (no DB column on Admin)

    // Log successful login
    await writeAuditLog('LOGIN_SUCCESS', 'AUTH', {
      adminId: user.admin.id,
      userId: user.id,
      success: true
    });

    // Return tokens and user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Admin login successful',
      user: userWithoutPassword,
      tokens: {
        access: accessToken,
        refresh: refreshToken,
        expiresIn: 8 * 60 * 60 // 8 hours in seconds
      },
      accessToken: accessToken // compatibility for tests expecting top-level accessToken
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error during admin login' });
  }
});

// GET /api/admin/profile
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { admin: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const { password: _pw, ...safe } = user;
    res.json({
      id: safe.id,
      firstName: safe.firstName,
      lastName: safe.lastName,
      email: safe.email,
      phone: safe.phone,
      userType: safe.userType,
      isActive: safe.isActive,
      createdAt: safe.createdAt,
      updatedAt: safe.updatedAt,
      admin: safe.admin
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Error fetching admin profile' });
  }
});

// POST /api/admin/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    if (!decoded.isRefresh) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { admin: true }
    });

    // Verify user exists and is an admin
    if (!user || user.userType !== 'ADMIN' || !user.admin) {
      return res.status(403).json({ message: 'Invalid admin account' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        userType: user.userType,
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: ADMIN_TOKEN_EXPIRY }
    );

    res.json({
      accessToken,
      expiresIn: 8 * 60 * 60 // 8 hours in seconds
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
});

// POST /api/admin/logout
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    // Log the logout action
    await writeAuditLog('LOGOUT', 'AUTH', {
      adminId: req.admin.id,
      userId: req.user.id,
      success: true
    });

    // In a production environment, you might want to implement token blacklisting here
    
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error during logout' });
  }
});

module.exports = router;
