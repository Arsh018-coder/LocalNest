const prisma = require('../lib/prisma');

// GET /api/admin/analytics/overview
const getOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalCustomers,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count({}),
      prisma.user.count({ where: { userType: 'PROVIDER' } }),
      prisma.user.count({ where: { userType: 'CUSTOMER' } }),
      prisma.booking.count({}),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.aggregate({ _sum: { totalPrice: true } })
    ]);

    res.json({
      totals: {
        users: totalUsers,
        providers: totalProviders,
        customers: totalCustomers,
        bookings: totalBookings
      },
      bookings: {
        completed: completedBookings,
        cancelled: cancelledBookings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
      },
      revenue: {
        total: totalRevenue._sum.totalPrice || 0
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Error fetching analytics overview' });
  }
};

// GET /api/admin/analytics/trends?days=30
const getTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [registrations, bookings] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true }
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, status: true, totalPrice: true }
      })
    ]);

    const bucket = (date) => date.toISOString().split('T')[0];
    const registrationTrend = {};
    for (const r of registrations) {
      const k = bucket(r.createdAt);
      registrationTrend[k] = (registrationTrend[k] || 0) + 1;
    }

    const bookingTrend = {};
    for (const b of bookings) {
      const k = bucket(b.createdAt);
      bookingTrend[k] = bookingTrend[k] || { total: 0, completed: 0, revenue: 0 };
      bookingTrend[k].total += 1;
      if (b.status === 'COMPLETED') {
        bookingTrend[k].completed += 1;
        bookingTrend[k].revenue += b.totalPrice || 0;
      }
    }

    res.json({
      registrations: registrationTrend,
      bookings: bookingTrend
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ message: 'Error fetching analytics trends' });
  }
};

// GET /api/admin/analytics/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
const getRevenue = async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date('1970-01-01');
    const to = req.query.to ? new Date(req.query.to) : new Date();

    const [sum, bookings] = await Promise.all([
      prisma.booking.aggregate({
        where: { status: 'COMPLETED', updatedAt: { gte: from, lte: to } },
        _sum: { totalPrice: true }
      }),
      prisma.booking.findMany({
        where: { status: 'COMPLETED', updatedAt: { gte: from, lte: to } },
        select: { id: true, totalPrice: true, updatedAt: true }
      })
    ]);

    res.json({
      total: sum._sum.totalPrice || 0,
      count: bookings.length,
      items: bookings
    });
  } catch (error) {
    console.error('Analytics revenue error:', error);
    res.status(500).json({ message: 'Error fetching revenue analytics' });
  }
};

module.exports = {
  getOverview,
  getTrends,
  getRevenue
};


