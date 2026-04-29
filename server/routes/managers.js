const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all managers (Super Admin only)
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;  const [managers, total] = await Promise.all([
      prisma.manager.findMany({
        skip,
        take: limit,
        include: {
          tariff: true,
          _count: {
            select: { employees: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.manager.count()
    ]);  const managersWithoutPasswords = managers.map(manager => ({
      ...manager,
      password: undefined
    }));  res.json({
      managers: managersWithoutPasswords,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    });
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create manager (Super Admin only)
router.post('/', [
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  body('firstName').notEmpty().withMessage('FIRST_NAME_REQUIRED'),
  body('lastName').notEmpty().withMessage('LAST_NAME_REQUIRED'),
  body('phone').notEmpty().withMessage('PHONE_REQUIRED')
    .matches(/^(\+996)?\d{9}$/).withMessage('PHONE_FORMAT'),
  body('login').notEmpty().withMessage('LOGIN_REQUIRED')
    .isLength({ min: 3 }).withMessage('LOGIN_MIN_LENGTH')
    .isLength({ max: 40 }).withMessage('Login must not exceed 40 characters'),
  body('password').isLength({ min: 6 }).withMessage('PASSWORD_MIN_LENGTH')
    .isLength({ max: 20 }).withMessage('Password must not exceed 20 characters'),
  body('tariffId').isInt().withMessage('TARIFF_ID_REQUIRED'),
  body('maxEmployees').isInt({ min: 1 }).withMessage('MAX_EMPLOYEES_REQUIRED')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { firstName, lastName, phone, login, password, tariffId, maxEmployees } = req.body;  // Normalize phone number - add +996 prefix if missing
    const normalizedPhone = phone.startsWith('+996') ? phone : '+996' + phone;  // Check if phone or login already exists
    const existingManager = await prisma.manager.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { login }
        ]
      }
    });  if (existingManager) {
      if (existingManager.phone === normalizedPhone) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }
      if (existingManager.login === login) {
        return res.status(400).json({ error: 'User with this login already exists' });
      }
    }  // Check if tariff exists
    const tariff = await prisma.tariff.findUnique({
      where: { id: tariffId }
    });  if (!tariff) {
      return res.status(400).json({ error: 'Invalid tariff' });
    }  // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);  // Create manager
    const manager = await prisma.manager.create({
      data: {
        firstName,
        lastName,
        phone: normalizedPhone,
        login,
        password: hashedPassword,
        tariffId,
        maxEmployees,
        lastActivatedAt: new Date()
      },
      include: {
        tariff: true,
        _count: {
          select: { employees: true }
        }
      }
    });  // Remove password from response
    const { password: _, ...managerWithoutPassword } = manager;  res.status(201).json(managerWithoutPassword);
  } catch (error) {
    console.error('Error creating manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update manager (Super Admin only)
router.put('/:id', [
  authenticateToken,
  requireRole(['SUPER_ADMIN']),
  body('firstName').optional().notEmpty().withMessage('FIRST_NAME_REQUIRED')
    .isLength({ max: 20 }).withMessage('FIRST_NAME_MAX_LENGTH'),
  body('lastName').optional().notEmpty().withMessage('LAST_NAME_REQUIRED')
    .isLength({ max: 20 }).withMessage('LAST_NAME_MAX_LENGTH'),
  body('phone').optional().matches(/^(\+996)?\d{9}$/).withMessage('PHONE_FORMAT'),
  body('login').optional().isLength({ min: 3, max: 40 }).withMessage('LOGIN_LENGTH'),
  body('password').optional().isLength({ min: 6, max: 20 }).withMessage('PASSWORD_LENGTH'),
  body('tariffId').optional().isInt().withMessage('TARIFF_ID_REQUIRED'),
  body('maxEmployees').optional().isInt({ min: 1 }).withMessage('MAX_EMPLOYEES_REQUIRED')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { id } = req.params;
    const updateData = req.body;  // Check if manager exists
    const existingManager = await prisma.manager.findUnique({
      where: { id: parseInt(id) }
    });  if (!existingManager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  // Check if phone or login already exists (excluding current manager)
    if (updateData.phone || updateData.login) {
      const duplicateManager = await prisma.manager.findFirst({
        where: {
          OR: [
            updateData.phone ? { phone: updateData.phone } : {},
            updateData.login ? { login: updateData.login } : {}
          ],
          NOT: { id: parseInt(id) }
        }
      });    if (duplicateManager) {
        if (duplicateManager.phone === updateData.phone) {
          return res.status(400).json({ error: 'User with this phone number already exists' });
        }
        if (duplicateManager.login === updateData.login) {
          return res.status(400).json({ error: 'User with this login already exists' });
        }
      }
    }  // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }  // Update manager
    const manager = await prisma.manager.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        tariff: true,
        _count: {
          select: { employees: true }
        }
      }
    });  // Remove password from response
    const { password: _, ...managerWithoutPassword } = manager;  res.json(managerWithoutPassword);
  } catch (error) {
    console.error('Error updating manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle manager status (Super Admin only)
router.patch('/:id/toggle-status', [
  authenticateToken,
  requireRole(['SUPER_ADMIN'])
], async (req, res) => {
  try {
    const { id } = req.params;  const manager = await prisma.manager.findUnique({
      where: { id: parseInt(id) }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  // Prepare update data
    const updateData = { isActive: !manager.isActive };  // If activating manager, update lastActivatedAt
    if (!manager.isActive) {
      updateData.lastActivatedAt = new Date();
    }  const updatedManager = await prisma.manager.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        tariff: true,
        _count: {
          select: { employees: true }
        }
      }
    });  // Remove password from response
    const { password: _, ...managerWithoutPassword } = updatedManager;  res.json(managerWithoutPassword);
  } catch (error) {
    console.error('Error toggling manager status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete manager (Super Admin only)
router.delete('/:id', [
  authenticateToken,
  requireRole(['SUPER_ADMIN'])
], async (req, res) => {
  try {
    const { id } = req.params;  const manager = await prisma.manager.findUnique({
      where: { id: parseInt(id) }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  const managerId = parseInt(id);  // Get all employees for this manager to delete their related records
    const employees = await prisma.employee.findMany({
      where: { managerId },
      select: { id: true }
    });
    const employeeIds = employees.map(e => e.id);  await prisma.$transaction(async (tx) => {
      // 1. Unlink QR tokens (set to null so old codes go to /system-inactive)
      await tx.qrToken.updateMany({
        where: { managerId },
        data: { managerId: null }
      });    if (employeeIds.length > 0) {
        // 2. Delete attendance history
        await tx.attendanceHistory.deleteMany({
          where: { employeeId: { in: employeeIds } }
        });      // 3. Delete attendance
        await tx.attendance.deleteMany({
          where: { employeeId: { in: employeeIds } }
        });
      }    // 4. Delete cycles
      await tx.cycle.deleteMany({
        where: { managerId }
      });    // 5. Delete employees
      await tx.employee.deleteMany({
        where: { managerId }
      });    // 6. Finally, delete manager
      await tx.manager.delete({
        where: { id: managerId }
      });
    });  res.json({ message: 'Manager and all related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting manager:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tariffs (Super Admin only)
router.get('/tariffs', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { duration: 'asc' }
    });  res.json(tariffs);
  } catch (error) {
    console.error('Error fetching tariffs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tariffs (public - for registration)
router.get('/tariffs/public', async (req, res) => {
  try {
    const tariffs = await prisma.tariff.findMany({
      orderBy: { duration: 'asc' }
    });  res.json(tariffs);
  } catch (error) {
    console.error('Error fetching public tariffs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register manager from QR code (public)
router.post('/register-from-qr', [
  body('firstName').notEmpty().withMessage('FIRST_NAME_REQUIRED')
    .isLength({ max: 20 }).withMessage('FIRST_NAME_MAX_LENGTH'),
  body('lastName').notEmpty().withMessage('LAST_NAME_REQUIRED')
    .isLength({ max: 20 }).withMessage('LAST_NAME_MAX_LENGTH'),
  body('phone').notEmpty().withMessage('PHONE_REQUIRED')
    .matches(/^(\+996)?\d{9}$/).withMessage('PHONE_FORMAT'),
  body('login').notEmpty().withMessage('LOGIN_REQUIRED')
    .isLength({ min: 3, max: 40 }).withMessage('LOGIN_LENGTH'),
  body('password').isLength({ min: 6, max: 20 }).withMessage('PASSWORD_LENGTH'),
  body('tariffId').isInt({ min: 1 }).withMessage('TARIFF_ID_REQUIRED'),
  body('maxEmployees').isInt({ min: 1, max: 1000 }).withMessage('MAX_EMPLOYEES_REQUIRED'),
  body('qrToken').notEmpty().withMessage('QR_TOKEN_REQUIRED'),
  body('latitude').isFloat().withMessage('LATITUDE_REQUIRED'),
  body('longitude').isFloat().withMessage('LONGITUDE_REQUIRED')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { firstName, lastName, phone, login, password, tariffId, maxEmployees, qrToken, latitude, longitude } = req.body;  // Convert string values to numbers if needed
    const parsedTariffId = parseInt(tariffId);
    const parsedMaxEmployees = parseInt(maxEmployees);  // Normalize phone number - add +996 prefix if missing
    const normalizedPhone = phone.startsWith('+996') ? phone : '+996' + phone;  // Validate QR token - must exist in database
    const token = await prisma.qrToken.findUnique({
      where: { token: qrToken }
    });  if (!token) {
      // QR token must exist - no automatic creation
      console.log('QR token not found - registration denied');
      return res.status(404).json({
        error: 'QR_TOKEN_NOT_FOUND',
        message: 'QR-код не найден. Используйте только QR-коды, сгенерированные в суперадминке.'
      });
    }  if (token.type !== 'MANAGER_REG') {
      return res.status(400).json({ error: 'Invalid QR token type' });
    }  // For new tokens, allow registration (don't check isUsed)
    if (token.isUsed && token.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return res.status(400).json({ error: 'QR token has already been used' });
    }  // Check if phone or login already exists (in both managers and employees)
    const [existingManager, existingEmployee] = await Promise.all([
      prisma.manager.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { login }
          ]
        }
      }),
      prisma.employee.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { login }
          ]
        }
      })
    ]);  // Check if trying to register with project owner's login
    const PROJECT_OWNER_LOGIN = 'hayrulloh1706@gmail.com';
    if (login === PROJECT_OWNER_LOGIN) {
      return res.status(400).json({ error: 'registration.projectOwnerLoginReserved' });
    }  if (existingManager) {
      if (existingManager.phone === normalizedPhone) {
        return res.status(400).json({ error: 'registration.phoneExists' });
      }
      if (existingManager.login === login) {
        return res.status(400).json({ error: 'registration.loginExists' });
      }
    }  if (existingEmployee) {
      if (existingEmployee.phone === normalizedPhone) {
        return res.status(400).json({ error: 'registration.phoneExists' });
      }
      if (existingEmployee.login === login) {
        return res.status(400).json({ error: 'registration.loginExists' });
      }
    }  // Check if tariff exists
    console.log('Tariff validation - ID:', parsedTariffId, 'Type:', typeof parsedTariffId);
    const tariff = await prisma.tariff.findUnique({
      where: { id: parsedTariffId }
    });  if (!tariff) {
      console.error('Tariff not found! Available IDs:');
      const allTariffs = await prisma.tariff.findMany({ select: { id: true, name: true } });
      console.log(allTariffs);
      return res.status(400).json({ error: 'Неверный тариф. Выберите другой тариф.' });
    }  // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);  // Create manager
    const manager = await prisma.manager.create({
      data: {
        firstName,
        lastName,
        phone: normalizedPhone,
        login,
        password: hashedPassword,
        tariffId: parsedTariffId,
        maxEmployees: parsedMaxEmployees,
        registrationLatitude: parseFloat(latitude),
        registrationLongitude: parseFloat(longitude),
        lastActivatedAt: new Date()
      },
      include: {
        tariff: true,
        _count: {
          select: { employees: true }
        }
      }
    });  // Link QR token to manager (but don't mark as used)
    await prisma.qrToken.update({
      where: { id: token.id },
      data: {
        managerId: manager.id,
        type: 'EMPLOYEE_REG' // Now this token can be used for employee registration
      }
    });  // Remove password from response
    const { password: _, ...managerWithoutPassword } = manager;  res.status(201).json(managerWithoutPassword);
  } catch (error) {
    console.error('Error registering manager from QR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get manager profile (Manager only)
router.get('/profile', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const manager = await prisma.manager.findUnique({
      where: { id: parseInt(req.user.id) },
      include: {
        tariff: true,
        _count: {
          select: { employees: true }
        }
      }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  // Remove password from response
    const { password: _, ...managerWithoutPassword } = manager;  res.json(managerWithoutPassword);
  } catch (error) {
    console.error('Error fetching manager profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee count for manager (public endpoint for QR registration)
router.get('/:managerId/employee-count', async (req, res) => {
  try {
    const { managerId } = req.params;  const manager = await prisma.manager.findUnique({
      where: { id: parseInt(managerId) },
      select: {
        id: true,
        maxEmployees: true,
        isActive: true
      }
    });  if (!manager || !manager.isActive) {
      return res.status(404).json({ error: 'Manager not found or inactive' });
    }  const currentCount = await prisma.employee.count({
      where: {
        managerId: manager.id,
        isActive: true
      }
    });  res.json({
      currentCount,
      maxLimit: manager.maxEmployees,
      available: manager.maxEmployees - currentCount,
      isActive: manager.isActive
    });
  } catch (error) {
    console.error('Error checking employee count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle strict device check mode (Manager only)
router.patch('/toggle-device-check', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const managerId = parseInt(req.user.id);  // Get current manager state
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        strictDeviceCheck: true,
        firstName: true,
        lastName: true
      }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  // Toggle the setting
    const updatedManager = await prisma.manager.update({
      where: { id: managerId },
      data: { strictDeviceCheck: !manager.strictDeviceCheck },
      select: {
        id: true,
        strictDeviceCheck: true,
        firstName: true,
        lastName: true
      }
    });  res.json({
      success: true,
      strictDeviceCheck: updatedManager.strictDeviceCheck,
      mode: updatedManager.strictDeviceCheck ? 'strict' : 'check',
      messageKey: updatedManager.strictDeviceCheck
        ? 'deviceCheck.strictActivated'
        : 'deviceCheck.checkActivated'
    });
  } catch (error) {
    console.error('Error toggling device check mode:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device check mode status (Manager only)
router.get('/device-check-status', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const managerId = parseInt(req.user.id);  const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        strictDeviceCheck: true
      }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  res.json({
      strictDeviceCheck: manager.strictDeviceCheck,
      mode: manager.strictDeviceCheck ? 'strict' : 'check'
    });
  } catch (error) {
    console.error('Error getting device check status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
