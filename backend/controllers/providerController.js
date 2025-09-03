const prisma = require('../lib/prisma');
const { auditLog, writeAuditLog } = require('../middleware/auth');

/**
 * Get pending provider verifications with pagination
 */
const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {
      verificationRequested: true,
      verified: false,
      user: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }
    };

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, 
              email: true, phone: true, isActive: true
            }
          },
          services: { select: { id: true, name: true } },
          _count: { select: { services: true, bookings: true } }
        },
        orderBy: { verificationRequestedAt: 'asc' },
        skip: offset,
        take: limitNumber
      }),
      prisma.provider.count({ where })
    ]);

    res.json({
      data: providers.map(p => ({
        id: p.id,
        userId: p.userId,
        name: `${p.user.firstName} ${p.user.lastName}`,
        email: p.user.email,
        phone: p.user.phone,
        verified: p.verified,
        verificationRequested: p.verificationRequested,
        isActive: p.user.isActive,
        experience: p.experience,
        location: p.location,
        services: p.services,
        totalServices: p._count.services,
        verificationRequestedAt: p.verificationRequestedAt
      })),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Error fetching pending verifications' });
  }
};

/**
 * Verify a provider
 */
const verifyProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.admin?.id || req.user.id;

    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id, 10) },
      include: { user: true }
    });

    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    if (provider.verified) {
      return res.status(400).json({ message: 'Provider is already verified' });
    }
    if (!provider.verificationRequested) {
      return res.status(400).json({ message: 'Provider has not requested verification' });
    }

    const updatedProvider = await prisma.provider.update({
      where: { id: parseInt(id, 10) },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: req.admin.userId,
        verificationRejectedReason: null
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    await writeAuditLog(
      'PROVIDER_VERIFIED',
      'PROVIDER',
      { adminId: req.admin.id, providerId: provider.id, notes: notes || null }
    );

    res.json({
      id: updatedProvider.id,
      userId: updatedProvider.userId,
      name: `${updatedProvider.user.firstName} ${updatedProvider.user.lastName}`,
      email: updatedProvider.user.email,
      verified: updatedProvider.verified,
      verifiedAt: updatedProvider.verifiedAt,
      verifiedBy: req.admin ? req.admin.id : null,
      message: 'Provider verified successfully'
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({ message: 'Error verifying provider' });
  }
};

/**
 * Reject a provider verification
 */
const rejectProviderVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Rejection reason must be at least 10 characters long' 
      });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(id, 10) },
      include: { user: true }
    });

    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    if (provider.verified) {
      return res.status(400).json({ message: 'Cannot reject a verified provider' });
    }

    const updatedProvider = await prisma.provider.update({
      where: { id: parseInt(id, 10) },
      data: {
        verificationRequested: false,
        verificationRejectedReason: reason,
        verified: false,
        verifiedAt: null,
        verifiedBy: null
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    await writeAuditLog(
      'PROVIDER_VERIFICATION_REJECTED',
      'PROVIDER',
      { adminId, providerId: provider.id, reason }
    );

    res.json({
      id: updatedProvider.id,
      userId: updatedProvider.userId,
      name: `${updatedProvider.user.firstName} ${updatedProvider.user.lastName}`,
      email: updatedProvider.user.email,
      verificationRequested: updatedProvider.verificationRequested,
      verificationRejectedReason: updatedProvider.verificationRejectedReason,
      message: 'Provider verification rejected'
    });
  } catch (error) {
    console.error('Reject provider verification error:', error);
    res.status(500).json({ message: 'Error rejecting provider verification' });
  }
};

module.exports = {
  getPendingVerifications,
  verifyProvider,
  rejectProviderVerification
};
