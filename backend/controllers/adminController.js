const prisma = require('../lib/prisma');
const { auditLog } = require('../middleware/auth');

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard/stats
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get counts in parallel for better performance
    const [
      userCount,
      providerCount,
      activeBookings,
      completedBookings,
      pendingVerifications,
      recentActivities
    ] = await Promise.all([
      // Total users (excluding admins)
      prisma.user.count({
        where: {
          userType: { in: ['CUSTOMER', 'PROVIDER'] },
          isActive: true
        }
      }),
      
      // Total providers
      prisma.provider.count({
        where: { verified: true }
      }),
      
      // Active bookings (not completed or cancelled)
      prisma.booking.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
        }
      }),
      
      // Completed bookings (last 30 days)
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      
      // Pending verifications
      prisma.provider.count({
        where: { 
          verified: false,
          verificationRequested: true
        }
      }),
      
      // Recent activities (last 20 actions)
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      })
    ]);

    // Calculate booking completion rate (last 30 days)
    const totalRecentBookings = await prisma.booking.count({
      where: {
        status: { in: ['COMPLETED', 'CANCELLED'] },
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    const completionRate = totalRecentBookings > 0 
      ? Math.round((completedBookings / totalRecentBookings) * 100) 
      : 0;

    // Get user registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        userType: { in: ['CUSTOMER', 'PROVIDER'] }
      },
      _count: true
    });

    // Format response
    const stats = {
      overview: {
        totalUsers: userCount,
        totalProviders: providerCount,
        activeBookings,
        completedBookings: {
          count: completedBookings,
          completionRate: `${completionRate}%`
        },
        pendingVerifications
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        targetType: activity.targetType,
        targetId: activity.targetId,
        details: activity.details,
        timestamp: activity.createdAt,
        admin: activity.admin ? {
          name: `${activity.admin.user.firstName} ${activity.admin.user.lastName}`,
          email: activity.admin.user.email
        } : null
      })),
      trends: {
        userRegistrations: userRegistrations.map(day => ({
          date: day.createdAt.toISOString().split('T')[0],
          count: day._count
        }))
      }
    };

    // Log the dashboard access
    await auditLog('DASHBOARD_ACCESS', 'DASHBOARD', {
      adminId: req.user.id,
      stats: {
        users: userCount,
        providers: providerCount,
        activeBookings,
        pendingVerifications
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

/**
 * Get pending verifications
 * @route GET /api/admin/verifications/pending
 */
const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where: {
          verificationRequested: true,
          verified: false
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true
            }
          },
          services: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: { verificationRequestedAt: 'asc' },
        take: limitNumber,
        skip: offset
      }),
      prisma.provider.count({
        where: {
          verificationRequested: true,
          verified: false
        }
      })
    ]);

    res.json({
      data: providers.map(provider => ({
        id: provider.id,
        userId: provider.userId,
        name: `${provider.user.firstName} ${provider.user.lastName}`,
        email: provider.user.email,
        phone: provider.user.phone,
        services: provider.services,
        experience: provider.experience,
        location: provider.location,
        hourlyRate: provider.hourlyRate,
        bio: provider.bio,
        verified: provider.verified,
        verificationRequested: provider.verificationRequested,
        verificationRequestedAt: provider.verificationRequestedAt,
        verificationRejectedReason: provider.verificationRejectedReason
      })),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Pending verifications error:', error);
    res.status(500).json({ message: 'Error fetching pending verifications' });
  }
};

module.exports = {
  getDashboardStats,
  getPendingVerifications
};
