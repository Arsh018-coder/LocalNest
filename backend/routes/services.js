const express = require('express');
const router = express.Router();

// Mock data
const services = [
  {
    id: 1,
    name: 'Home Cleaning',
    description: 'Professional house cleaning services',
    category: 'Home Services',
    averagePrice: 50,
    providers: 24
  },
  {
    id: 2,
    name: 'Plumbing',
    description: 'Expert plumbing repair and installation',
    category: 'Home Services',
    averagePrice: 80,
    providers: 18
  },
  {
    id: 3,
    name: 'Tutoring',
    description: 'Academic support for all subjects',
    category: 'Education',
    averagePrice: 30,
    providers: 32
  }
];

// GET all services
router.get('/', (req, res) => {
  res.json(services);
});

// GET service by ID
router.get('/:id', (req, res) => {
  const service = services.find(s => s.id === parseInt(req.params.id));
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }
  res.json(service);
});

module.exports = router;
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        dominant: '#f1f2ee',
        secondary: '#374650',
        accent: '#C7E94B'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
