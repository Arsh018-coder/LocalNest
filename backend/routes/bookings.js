const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

// POST create booking
router.post('/', async (req, res) => {
  try {
    const { providerId, serviceId, date, time, customerName, customerEmail, notes } = req.body;
    
    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: customerEmail }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          email: customerEmail
        }
      });
    }
    
    const booking = await prisma.booking.create({
      data: {
        date: new Date(date),
        time,
        notes,
        serviceId: parseInt(serviceId),
        providerId: parseInt(providerId),
        customerId: customer.id
      },
      include: {
        service: true,
        provider: true,
        customer: true
      }
    });
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        service: true,
        provider: true,
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        service: true,
        provider: true,
        customer: true
      }
    });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT update booking status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await prisma.booking.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: {
        service: true,
        provider: true,
        customer: true
      }
    });
    
    res.json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
