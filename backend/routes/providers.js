const express = require('express');
const router = express.Router();

// Mock providers data
const providers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    serviceId: 1,
    rating: 4.8,
    reviews: 127,
    experience: '5 years',
    location: 'Downtown',
    hourlyRate: 25
  },
  {
    id: 2,
    name: 'Mike Chen',
    serviceId: 2,
    rating: 4.9,
    reviews: 89,
    experience: '8 years',
    location: 'Westside',
    hourlyRate: 40
  }
];

// GET all providers
router.get('/', (req, res) => {
  res.json(providers);
});

// GET providers by service
router.get('/service/:serviceId', (req, res) => {
  const serviceProviders = providers.filter(p => p.serviceId === parseInt(req.params.serviceId));
  res.json(serviceProviders);
});

module.exports = router;
