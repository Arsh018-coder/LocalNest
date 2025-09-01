const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, userType } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone,
          userType: userType.toUpperCase()
        }
      });

      // Create corresponding customer or provider record
      if (userType.toLowerCase() === 'customer') {
        await tx.customer.create({
          data: {
            userId: user.id
          }
        });
      } else if (userType.toLowerCase() === 'provider') {
        await tx.provider.create({
          data: {
            userId: user.id,
            experience: '',
            location: '',
            hourlyRate: 0
          }
        });
      }

      return user;
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.id, 
        email: result.email, 
        userType: result.userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = result;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        provider: {
          include: {
            services: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customer: {
          include: {
            bookings: {
              include: {
                service: true,
                provider: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        provider: {
          include: {
            services: true,
            bookings: {
              include: {
                service: true,
                customer: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, experience, location, hourlyRate, bio } = req.body;
    
    await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id: req.user.id },
        data: {
          firstName,
          lastName,
          phone
        }
      });

      // Update provider-specific info if user is a provider
      if (user.userType === 'PROVIDER') {
        await tx.provider.update({
          where: { userId: user.id },
          data: {
            experience,
            location,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            bio
          }
        });
      }
    });

    // Fetch the complete updated user data with relations
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        customer: {
          include: {
            bookings: {
              include: {
                service: true,
                provider: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        provider: {
          include: {
            services: true,
            bookings: {
              include: {
                service: true,
                customer: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;