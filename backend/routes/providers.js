const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET all providers
router.get('/', async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        services: true,
        user: true
      }
    });
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET providers by service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      where: {
        services: {
          some: {
            id: parseInt(req.params.serviceId)
          }
        }
      },
      include: {
        services: true
      }
    });
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers by service:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET provider by user ID (for current user's provider profile)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const provider = await prisma.provider.findUnique({
      where: { userId: userId },
      include: {
        services: true,
        bookings: {
          include: {
            service: true,
            customer: true
          }
        }
      }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider by user ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET provider by ID
router.get('/:id', async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        services: true,
        bookings: {
          include: {
            service: true,
            customer: true
          }
        }
      }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    res.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST create new provider profile
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { experience, location, hourlyRate, bio, serviceIds } = req.body;
    const userId = req.user.id;
    
    // Check if provider profile already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { userId: userId }
    });
    
    if (existingProvider) {
      return res.status(400).json({ message: 'Provider profile already exists' });
    }
    
    const provider = await prisma.provider.create({
      data: {
        userId: userId,
        experience,
        location,
        hourlyRate: parseFloat(hourlyRate),
        bio,
        services: {
          connect: serviceIds?.map(id => ({ id: parseInt(id) })) || []
        }
      },
      include: {
        services: true,
        user: true
      }
    });
    
    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creating provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update provider profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const providerId = parseInt(req.params.id);
    const { experience, location, hourlyRate, bio, isVerified } = req.body;
    
    // Check if provider exists and belongs to user
    const existingProvider = await prisma.provider.findUnique({
      where: { id: providerId }
    });
    
    if (!existingProvider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    if (existingProvider.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this provider' });
    }
    
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        experience,
        location,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        bio,
        verified: isVerified !== undefined ? isVerified : undefined
      },
      include: {
        services: true,
        user: true
      }
    });
    
    res.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST request verification
router.post('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const providerId = parseInt(req.params.id);
    
    // Check if provider exists and belongs to user
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    if (provider.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update verification request status
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        verificationRequested: true,
        verificationRequestedAt: new Date()
      },
      include: {
        services: true,
        user: true
      }
    });
    
    res.json({ message: 'Verification requested successfully', provider: updatedProvider });
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
