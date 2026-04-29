const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const geoip = require('geoip-lite');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for login attempts (DISABLED)
// const loginAttempts = new Map();

// const checkLoginAttempts = (req, res, next) => {
//   const ip = req.ip;
//   const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

//   if (attempts.blockedUntil > Date.now()) {
//     return res.status(429).json({
//       error: 'Too many login attempts. Please try again later.'
//     });
//   }

//   // Reset attempts after 15 minutes
//   if (Date.now() - attempts.lastAttempt > 15 * 60 * 1000) {
//     attempts.count = 0;
//   }

//   attempts.count++;
//   attempts.lastAttempt = Date.now();

//   if (attempts.count >= 5) {
//     attempts.blockedUntil = Date.now() + 15 * 60 * 1000; // Block for 15 minutes
//   }

//   loginAttempts.set(ip, attempts);
//   next();
// };

// Super Admin Login
router.post('/super-admin', [
  // checkLoginAttempts, // DISABLED
  body('login').notEmpty().withMessage('Login is required')
    .isLength({ max: 40 }).withMessage('Login must not exceed 40 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 20 }).withMessage('Password must not exceed 20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { login, password } = req.body;  // Check super admin credentials
    if (login === process.env.SUPER_ADMIN_LOGIN && password === process.env.SUPER_ADMIN_PASSWORD) {
      const token = jwt.sign(
        {
          id: 'super-admin',
          role: 'superAdmin',
          login: login
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // Увеличили с 24h до 30d
      );    res.json({
        message: 'Super admin login successful',
        accessToken: token,
        refreshToken: token, // For simplicity, using same token
        user: {
          id: 'super-admin',
          role: 'superAdmin',
          login: login
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid super admin credentials' });
    }
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manager Login
router.post('/manager', [
  // checkLoginAttempts, // DISABLED
  body('login').notEmpty().withMessage('Login is required')
    .isLength({ max: 40 }).withMessage('Login must not exceed 40 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 20 }).withMessage('Password must not exceed 20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { login, password } = req.body;  // Find manager by login
    const manager = await prisma.manager.findUnique({
      where: { login }
    });  if (!manager) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }  // Check if manager is active
    if (!manager.isActive) {
      return res.status(401).json({ error: 'The account is not activated' });
    }  // Verify password
    const isValidPassword = await bcrypt.compare(password, manager.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }  // Check tariff limits
    if (manager.tariffType !== 'UNLIMITED') {
      const employeeCount = await prisma.employee.count({
        where: { managerId: manager.id }
      });    if (employeeCount >= manager.employeeLimit) {
        return res.status(403).json({
          error: 'Employee limit reached',
          currentCount: employeeCount,
          limit: manager.employeeLimit
        });
      }
    }  // Generate JWT token
    const token = jwt.sign(
      {
        id: manager.id,
        role: 'manager',
        login: manager.login
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Увеличили с 24h до 30d
    );  // Get location from IP
    const location = geoip.lookup(req.ip);  res.json({
      message: 'Manager login successful',
      accessToken: token,
      refreshToken: token, // For simplicity, using same token
      user: {
        id: manager.id,
        role: 'manager',
        login: manager.login,
        firstName: manager.firstName,
        lastName: manager.lastName,
        company: manager.company,
        tariffType: manager.tariffType,
        employeeLimit: manager.employeeLimit,
        location: location ? `${location.city}, ${location.country}` : 'Unknown'
      }
    });
  } catch (error) {
    console.error('Manager login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee Login
router.post('/employee', [
  // checkLoginAttempts, // DISABLED
  body('login').notEmpty().withMessage('Login is required'),
  body('password').custom(async (value, { req }) => {
    const login = req.body.login;  // Check if this is an OAuth user
    const employee = await prisma.employee.findUnique({
      where: { login }
    });  if (employee && (employee.googleId || employee.appleId)) {
      // For OAuth users, password must be exactly the login
      if (value !== login) {
        throw new Error('Invalid credentials for OAuth user');
      }
      return true;
    } else {
      // For regular users, password must be at least 6 characters
      if (!value || value.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      return true;
    }
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Employee login validation errors:', errors.array());
      return res.status(400).json({ error: 'Invalid credentials' });
    }  const { login, password } = req.body;  // Find employee by login
    const employee = await prisma.employee.findUnique({
      where: { login },
      include: {
        manager: {
          select: {
            id: true,
            company: true
          }
        }
      }
    });  if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }  // Check if employee is active
    if (!employee.isActive) {
      return res.status(401).json({ error: 'The account is not activated' });
    }  // Check if manager is active
    if (!employee.manager.isActive) {
      return res.status(401).json({ error: 'Manager The account is not activated' });
    }  // Special handling for OAuth users
    if (employee.googleId || employee.appleId) {
      // For OAuth users, accept their login as password
      if (password === employee.login) {
        // OAuth login successful
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      // For regular users, verify password
      const isValidPassword = await bcrypt.compare(password, employee.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }  // Generate JWT token
    const token = jwt.sign(
      {
        id: employee.id,
        role: 'employee',
        login: employee.login,
        managerId: employee.managerId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );  res.json({
      message: 'Employee login successful',
      accessToken: token,
      refreshToken: token, // For simplicity, using same token
      user: {
        id: employee.id,
        role: 'employee',
        login: employee.login,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        manager: {
          id: employee.manager.id,
          company: employee.manager.company
        }
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;  let user;  if (userRole === 'superAdmin') {
      user = {
        id: 'super-admin',
        role: 'superAdmin',
        login: req.user.login,
        isActive: true // Добавлено поле isActive
      };
    } else if (userRole === 'manager') {
      const managerData = await prisma.manager.findUnique({
        where: { id: parseInt(userId) },
        include: {
          tariff: true,
          _count: {
            select: { employees: true }
          }
        }
      });
      if (managerData) {
        user = { ...managerData, role: 'manager' };
      }
    } else if (userRole === 'employee') {
      const employeeData = await prisma.employee.findUnique({
        where: { id: parseInt(userId) },
        include: {
          manager: {
            select: {
              id: true,
              login: true,
              company: true
            }
          }
        }
      });
      if (employeeData) {
        user = { ...employeeData, role: 'employee' };
      }
    }  if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }  res.json({ user });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;  // Generate new token with same user info
    const token = jwt.sign(
      {
        id: userId,
        role: userRole,
        login: req.user.login
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Увеличили с 24h до 30d
    );  res.json({
      message: 'Token refreshed successfully',
      accessToken: token // Изменено с token на accessToken для соответствия клиенту
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real application, you might want to:
    // 1. Add token to blacklist
    // 2. Clear refresh tokens
    // 3. Log the logout activity
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth Employee Login (for OAuth users without password)
router.post('/employee/oauth', [
  body('email').notEmpty().withMessage('Email is required'),
  body('googleId').notEmpty().withMessage('Google ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('OAuth employee login validation errors:', errors.array());
      return res.status(400).json({ error: 'Invalid credentials' });
    }  const { email, googleId } = req.body;  // Find employee by email and googleId
    const employee = await prisma.employee.findFirst({
      where: {
        email,
        googleId
      },
      include: {
        manager: {
          select: {
            id: true,
            company: true
          }
        }
      }
    });  if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }  // Check if employee is active
    if (!employee.isActive) {
      return res.status(401).json({ error: 'The account is not activated' });
    }  // Check if manager is active
    if (!employee.manager.isActive) {
      return res.status(401).json({ error: 'Manager The account is not activated' });
    }  // Generate JWT token
    const token = jwt.sign(
      {
        id: employee.id,
        role: 'employee',
        login: employee.login,
        managerId: employee.managerId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );  res.json({
      message: 'OAuth employee login successful',
      accessToken: token,
      refreshToken: token, // For simplicity, using same token
      user: {
        id: employee.id,
        role: 'employee',
        login: employee.login,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        email: employee.email,
        managerId: employee.managerId
      }
    });
  } catch (error) {
    console.error('OAuth employee login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
