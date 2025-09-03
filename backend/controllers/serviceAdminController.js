const prisma = require('../lib/prisma');
const { writeAuditLog } = require('../middleware/auth');

// GET /api/admin/services
const listServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: { _count: { select: { providers: true, bookings: true } } },
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: offset,
        take: limitNumber
      }),
      prisma.service.count({ where })
    ]);

    res.json({
      data: services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        averagePrice: s.averagePrice,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        providerCount: s._count.providers,
        bookingCount: s._count.bookings
      })),
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
};

// POST /api/admin/services
const createService = async (req, res) => {
  try {
    const { name, description, category, averagePrice } = req.body;

    if (!name || !description || !category || averagePrice === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        averagePrice: parseFloat(averagePrice)
      }
    });

    await writeAuditLog('SERVICE_CREATED', 'SERVICE', {
      adminId: req.admin.id,
      targetId: service.id,
      name
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Error creating service' });
  }
};

// PUT /api/admin/services/:id
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, averagePrice } = req.body;

    const existing = await prisma.service.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existing) return res.status(404).json({ message: 'Service not found' });

    const updated = await prisma.service.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(averagePrice !== undefined && { averagePrice: parseFloat(averagePrice) })
      }
    });

    await writeAuditLog('SERVICE_UPDATED', 'SERVICE', {
      adminId: req.admin.id,
      targetId: updated.id,
      fields: Object.keys(req.body)
    });

    res.json({ message: 'Service updated successfully', service: updated });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Error updating service' });
  }
};

// DELETE /api/admin/services/:id
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    const existing = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!existing) return res.status(404).json({ message: 'Service not found' });

    // Prevent deletion if there are bookings for this service
    const bookingCount = await prisma.booking.count({ where: { serviceId } });
    if (bookingCount > 0) {
      return res.status(409).json({ message: 'Cannot delete service with existing bookings' });
    }

    await prisma.service.delete({ where: { id: serviceId } });

    await writeAuditLog('SERVICE_DELETED', 'SERVICE', {
      adminId: req.admin.id,
      targetId: serviceId
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Error deleting service' });
  }
};

// GET /api/admin/services/categories
const listCategories = async (_req, res) => {
  try {
    const categories = await prisma.service.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' }
    });
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// PUT /api/admin/services/categories/rename
const renameCategory = async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ message: 'from and to are required' });

    const result = await prisma.service.updateMany({
      where: { category: from },
      data: { category: to }
    });

    await writeAuditLog('CATEGORY_RENAMED', 'SERVICE', {
      adminId: req.admin.id,
      from,
      to,
      updatedCount: result.count
    });

    res.json({ message: 'Category renamed', updated: result.count });
  } catch (error) {
    console.error('Rename category error:', error);
    res.status(500).json({ message: 'Error renaming category' });
  }
};

module.exports = {
  listServices,
  createService,
  updateService,
  deleteService,
  listCategories,
  renameCategory
};


