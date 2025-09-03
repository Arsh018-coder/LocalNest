const prisma = require('../lib/prisma');

// GET /api/admin/users?userType=CUSTOMER|PROVIDER&search=keyword&page=1&limit=10
const getUsers = async (req, res) => {
  try {
    const { userType, search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {
      userType: userType ? userType.toUpperCase() : undefined,
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Prevent empty userType from being included
    if (!userType) delete where.userType;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNumber,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          userType: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        userType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
};

// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { firstName, lastName, email, phone } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Disallow updating admin userType
    if (existingUser.userType === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot update admin user' });
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, email, phone }
    });
    const { password, ...rest } = user;
    res.json(rest);
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

// PUT /api/admin/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { isActive } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.userType === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot modify admin user status' });
    }
    if (user.isActive === isActive) {
      return res.status(400).json({ message: `User is already ${isActive ? 'active' : 'inactive'}` });
    }
    const updatedUser = await prisma.user.update({ where: { id: userId }, data: { isActive } });
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: { ...updatedUser, password: undefined }
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.userType === 'ADMIN') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  updateUser,
  deleteUser
};
