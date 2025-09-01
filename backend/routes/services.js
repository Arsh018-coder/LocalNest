const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET all services
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        _count: {
          select: { providers: true }
        }
      }
    });
    
    const servicesWithProviderCount = services.map(service => ({
      ...service,
      providerCount: service._count.providers
    }));
    
    res.json(servicesWithProviderCount);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        providers: true,
        _count: {
          select: { providers: true }
        }
      }
    });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Return service with both provider details and count
    res.json({
      ...service,
      providerCount: service._count.providers
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET provider's services
router.get('/provider/:providerId', authenticateToken, async (req, res) => {
  try {
    const providerId = parseInt(req.params.providerId);
    
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        services: true
      }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json(provider.services);
  } catch (error) {
    console.error('Error fetching provider services:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST add service to provider
router.post('/provider/:providerId', authenticateToken, async (req, res) => {
  try {
    const providerId = parseInt(req.params.providerId);
    const { serviceId } = req.body;
    
    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) }
    });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Add service to provider
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        services: {
          connect: { id: parseInt(serviceId) }
        }
      },
      include: {
        services: true
      }
    });
    
    res.json(updatedProvider.services);
  } catch (error) {
    console.error('Error adding service to provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE remove service from provider
router.delete('/provider/:providerId/:serviceId', authenticateToken, async (req, res) => {
  try {
    const providerId = parseInt(req.params.providerId);
    const serviceId = parseInt(req.params.serviceId);
    
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        services: {
          disconnect: { id: serviceId }
        }
      },
      include: {
        services: true
      }
    });
    
    res.json(updatedProvider.services);
  } catch (error) {
    console.error('Error removing service from provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create new service (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, category, averagePrice } = req.body;
    
    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        averagePrice: parseFloat(averagePrice)
      }
    });
    
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
