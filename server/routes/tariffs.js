const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all tariffs (Super Admin only)
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    // Static tariffs data - in a real app this would come from database
    const tariffs = [
      {
        id: 1,
        name: 'Basic',
        price: 1000,
        employeeLimit: 10,
        features: ['Basic attendance tracking', 'QR codes', 'Reports']
      },
      {
        id: 2,
        name: 'Professional',
        price: 2500,
        employeeLimit: 50,
        features: ['Advanced attendance tracking', 'QR codes', 'Analytics', 'Priority support']
      },
      {
        id: 3,
        name: 'Enterprise',
        price: 5000,
        employeeLimit: 200,
        features: ['Full attendance tracking', 'QR codes', 'Advanced analytics', 'API access', '24/7 support']
      },
      {
        id: 4,
        name: 'Unlimited',
        price: 10000,
        employeeLimit: null,
        features: ['Unlimited employees', 'All features', 'Custom integrations', 'Dedicated support']
      }
    ];  res.json(tariffs);
  } catch (error) {
    console.error('Error fetching tariffs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
