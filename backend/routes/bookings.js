const express = require('express');
const router = express.Router();

let bookings = [];
let nextId = 1;

// POST create booking
router.post('/', (req, res) => {
  const { providerId, serviceId, date, time, customerName, customerEmail } = req.body;
  
  const booking = {
    id: nextId++,
    providerId,
    serviceId,
    date,
    time,
    customerName,
    customerEmail,
    status: 'pending',
    createdAt: new Date()
  };
  
  bookings.push(booking);
  res.status(201).json(booking);
});

// GET all bookings
router.get('/', (req, res) => {
  res.json(bookings);
});

module.exports = router;
