const prisma = require('../lib/prisma');

// GET /api/admin/audit/logs
const listAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: { admin: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
        skip: offset,
        take: limitNumber
      }),
      prisma.auditLog.count()
    ]);

    res.json({
      data: logs.map(l => ({
        id: l.id,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        details: l.details,
        createdAt: l.createdAt,
        admin: l.admin ? { name: `${l.admin.user.firstName} ${l.admin.user.lastName}`, email: l.admin.user.email } : null
      })),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('List audit logs error:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
};

module.exports = { listAuditLogs };


