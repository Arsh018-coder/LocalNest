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

module.exports = {
  authenticateToken,
  requireProvider,
  requireCustomer
};