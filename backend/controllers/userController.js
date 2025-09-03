const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { auditLog } = require('../middleware/auth');

/**
 * Get all users with pagination and filtering
 * @route GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      userType,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where = {};
    
    // Search filter (supports full name queries like "First Last")
    if (search) {
      const trimmed = search.trim();
      const parts = trimmed.split(/\s+/);
      const orConditions = [
        { firstName: { contains: trimmed, mode: 'insensitive' } },
        { lastName: { contains: trimmed, mode: 'insensitive' } },
        { email: { contains: trimmed, mode: 'insensitive' } },
        { phone: { contains: trimmed } }
      ];
      const andConditions = parts.length >= 2 ? [{
        AND: [
          { firstName: { contains: parts[0], mode: 'insensitive' } },
          { lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' } }
        ]
      }] : [];
      where.OR = [...orConditions, ...andConditions];
    }

    // User type filter
    if (userType) {
      where.userType = userType.toUpperCase();
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          userType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              bookings: {
                select: { id: true, status: true },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          },
          provider: {
            select: {
              id: true,
              verified: true,
              verificationRequested: true,
              services: {
                select: { id: true, name: true },
                take: 3
              },
              bookings: {
                select: { id: true, status: true },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: offset,
        take: limitNumber
      }),
      prisma.user.count({ where })
    ]);

    // Format response
    const formattedUsers = users.map(user => {
      const userData = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastActivity: user.updatedAt,
        metadata: {}
      };

      // Add user type specific data
      if (user.userType === 'CUSTOMER' && user.customer) {
        userData.metadata = {
          type: 'customer',
          lastBooking: user.customer.bookings[0] || null,
          totalBookings: user.customer._count?.bookings || 0
        };
      } else if (user.userType === 'PROVIDER' && user.provider) {
        userData.metadata = {
          type: 'provider',
          verified: user.provider.verified,
          verificationRequested: user.provider.verificationRequested,
          services: user.provider.services,
          lastBooking: user.provider.bookings[0] || null,
          totalServices: user.provider._count?.services || 0,
          totalBookings: user.provider._count?.bookings || 0
        };
      } else if (user.userType === 'ADMIN') {
        userData.metadata = { type: 'admin' };
      }

      return userData;
    });

    res.json({
      data: formattedUsers,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

/**
 * Get user by ID
 * @route GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        customer: {
          include: {
            bookings: {
              include: {
                service: {
                  select: { id: true, name: true, category: true }
                },
                provider: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        provider: {
          include: {
            services: {
              select: { id: true, name: true, category: true, averagePrice: true }
            },
            bookings: {
              include: {
                service: {
                  select: { id: true, name: true, category: true }
                },
                customer: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true, email: true }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        admin: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format response
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      metadata: {}
    };

    // Add user type specific data
    if (user.userType === 'CUSTOMER' && user.customer) {
      userData.metadata = {
        type: 'customer',
        totalBookings: user.customer._count?.bookings || 0,
        recentBookings: user.customer.bookings || []
      };
    } else if (user.userType === 'PROVIDER' && user.provider) {
      userData.metadata = {
        type: 'provider',
        verified: user.provider.verified,
        verificationRequested: user.provider.verificationRequested,
        verificationRequestedAt: user.provider.verificationRequestedAt,
        verificationRejectedReason: user.provider.verificationRejectedReason,
        experience: user.provider.experience,
        location: user.provider.location,
        hourlyRate: user.provider.hourlyRate,
        bio: user.provider.bio,
        rating: user.provider.rating,
        reviews: user.provider.reviews,
        services: user.provider.services || [],
        totalServices: user.provider._count?.services || 0,
        totalBookings: user.provider._count?.bookings || 0,
        recentBookings: user.provider.bookings || []
      };
    } else if (user.userType === 'ADMIN' && user.admin) {
      userData.metadata = {
        type: 'admin',
        lastLogin: user.admin.lastLoginAt
      };
    }

    res.json(userData);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

/**
 * Update user status (activate/deactivate)
 * @route PUT /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }

    // Check if user exists and is not an admin
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      select: { id: true, userType: true, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.userType === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot modify admin user status' });
    }

    if (user.isActive === isActive) {
      return res.status(400).json({ 
        message: `User is already ${isActive ? 'active' : 'inactive'}` 
      });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true
      }
    });

    // Log the action
    await auditLog(
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'USER',
      {
        adminId: req.user.id,
        targetUserId: updatedUser.id,
        previousStatus: user.isActive,
        newStatus: isActive,
        reason: reason || null
      }
    );

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
};

/**
 * Update user details
 * @route PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      password,
      userType,
      // Provider specific fields
      experience,
      location,
      hourlyRate,
      bio,
      verified
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: { provider: true }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare user update data
    const userUpdateData = {};
    if (firstName) userUpdateData.firstName = firstName;
    if (lastName) userUpdateData.lastName = lastName;
    if (email && email !== existingUser.email) {
      // Basic email format validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      // Check if email is already taken
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists && emailExists.id !== existingUser.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      userUpdateData.email = email;
    }
    if (phone) userUpdateData.phone = phone;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      userUpdateData.password = hashedPassword;
    }
    if (userType && userType !== existingUser.userType) {
      // Only allow changing between CUSTOMER and PROVIDER
      if (!['CUSTOMER', 'PROVIDER'].includes(userType)) {
        return res.status(400).json({ 
          message: 'Invalid user type. Must be CUSTOMER or PROVIDER' 
        });
      }
      userUpdateData.userType = userType;
    }

    // Start a transaction to update user and related data
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      const updatedUser = await tx.user.update({
        where: { id: parseInt(id, 10) },
        data: userUpdateData,
        include: { provider: true }
      });

      // Handle provider specific updates
      if (existingUser.userType === 'PROVIDER' || userType === 'PROVIDER') {
        const providerData = {};
        if (experience !== undefined) providerData.experience = experience;
        if (location !== undefined) providerData.location = location;
        if (hourlyRate !== undefined) providerData.hourlyRate = parseFloat(hourlyRate);
        if (bio !== undefined) providerData.bio = bio;
        if (verified !== undefined) {
          providerData.verified = verified;
          if (verified) {
            providerData.verifiedAt = new Date();
            providerData.verifiedBy = req.user.id;
            providerData.verificationRejectedReason = null;
          }
        }

        // Update or create provider record
        if (existingUser.provider) {
          await tx.provider.update({
            where: { id: existingUser.provider.id },
            data: providerData
          });
        } else if (userType === 'PROVIDER') {
          await tx.provider.create({
            data: {
              userId: updatedUser.id,
              ...providerData
            }
          });
        }
      }

      return updatedUser;
    });

    // Log the action
    await auditLog(
      'USER_UPDATED',
      'USER',
      {
        adminId: req.user.id,
        targetUserId: result.id,
        changes: Object.keys(userUpdateData)
      }
    );

    // Fetch updated user with all relations
    const updatedUser = await prisma.user.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        customer: true,
        provider: {
          include: {
            services: true
          }
        },
        admin: true
      }
    });

    // Shape response with metadata similar to getUserById
    const responseUser = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      userType: updatedUser.userType,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      metadata: {}
    };

    if (updatedUser.userType === 'CUSTOMER' && updatedUser.customer) {
      responseUser.metadata = {
        type: 'customer'
      };
    } else if (updatedUser.userType === 'PROVIDER' && updatedUser.provider) {
      responseUser.metadata = {
        type: 'provider',
        verified: updatedUser.provider.verified,
        verifiedAt: updatedUser.provider.verifiedAt,
        verificationRequested: updatedUser.provider.verificationRequested,
        verificationRequestedAt: updatedUser.provider.verificationRequestedAt,
        verificationRejectedReason: updatedUser.provider.verificationRejectedReason,
        experience: updatedUser.provider.experience,
        location: updatedUser.provider.location,
        hourlyRate: updatedUser.provider.hourlyRate,
        bio: updatedUser.provider.bio,
        services: updatedUser.provider.services || [],
        totalServices: updatedUser.provider._count?.services || (updatedUser.provider.services ? updatedUser.provider.services.length : 0)
      };
    } else if (updatedUser.userType === 'ADMIN' && updatedUser.admin) {
      responseUser.metadata = {
        type: 'admin'
      };
    }

    res.json({
      message: 'User updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUser
};
