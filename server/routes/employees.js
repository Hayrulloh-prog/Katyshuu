const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const eventManager = require('../middleware/events');

const router = express.Router();
const prisma = new PrismaClient();

// Register employee (via QR code)
router.post('/register', [
  body('firstName').notEmpty().withMessage('First name is required')
    .isLength({ max: 20 }).withMessage('First name must not exceed 20 characters'),
  body('lastName').notEmpty().withMessage('Last name is required')
    .isLength({ max: 20 }).withMessage('Last name must not exceed 20 characters'),
  body('phone').notEmpty().withMessage('Phone is required')
    .matches(/^(\+996)?\d{9}$/).withMessage('Phone must be in format +996XXXXXXXXX or XXXXXXXXX'),
  body('login').notEmpty().withMessage('Login is required')
    .isLength({ min: 3, max: 40 }).withMessage('Login must be between 3 and 40 characters'),
  body('password').isLength({ min: 6, max: 20 }).withMessage('Password must be between 6 and 20 characters'),
  body('qrToken').notEmpty().withMessage('QR token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { firstName, lastName, phone, login, password, qrToken } = req.body;  // Normalize phone number - add +996 prefix if missing
    const normalizedPhone = phone.startsWith('+996') ? phone : '+996' + phone;  // Find and validate QR token
    const token = await prisma.qrToken.findUnique({
      where: { token: qrToken },
      include: { manager: { include: { tariff: true } } }
    });  if (!token) {
      return res.status(400).json({ error: 'Invalid QR token' });
    }  if (token.isUsed) {
      return res.status(400).json({ error: 'QR token has already been used' });
    }  // Check if manager is active and tariff is valid
    if (!token.manager.isActive) {
      return res.status(400).json({ error: 'Manager The account is not activated' });
    }  if (token.manager.lastActivatedAt) {
      const expiryDate = new Date(token.manager.lastActivatedAt);
      expiryDate.setDate(expiryDate.getDate() + token.manager.tariff.duration);    if (expiryDate < new Date()) {
        return res.status(400).json({
          error: 'Service limit reached. Please contact your manager.'
        });
      }
    }  // Check employee limit
    const employeeCount = await prisma.employee.count({
      where: { managerId: token.managerId }
    });  if (employeeCount >= token.manager.maxEmployees) {
      return res.status(400).json({
        error: 'Cannot register due to employee limit'
      });
    }  // Check if phone or login already exists (in both managers and employees)
    const [existingEmployee, existingManager] = await Promise.all([
      prisma.employee.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { login }
          ]
        }
      }),
      prisma.manager.findFirst({
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
    }  if (existingEmployee) {
      if (existingEmployee.phone === normalizedPhone) {
        return res.status(400).json({ error: 'registration.phoneExists' });
      }
      if (existingEmployee.login === login) {
        return res.status(400).json({ error: 'registration.loginExists' });
      }
    }  if (existingManager) {
      if (existingManager.phone === normalizedPhone) {
        return res.status(400).json({ error: 'registration.phoneExists' });
      }
      if (existingManager.login === login) {
        return res.status(400).json({ error: 'registration.loginExists' });
      }
    }  // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);  // Create employee
    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        phone: normalizedPhone,
        login,
        password: hashedPassword,
        managerId: token.managerId
      }
    });  // Mark QR token as used
    console.log('Marking QR token as used:', {
      tokenId: token.id,
      token: token.token,
      isUsedBefore: token.isUsed
    });  await prisma.qrToken.update({
      where: { id: token.id },
      data: { isUsed: true, usedAt: new Date() }
    });  console.log('QR token marked as used successfully');  // Create new QR token for attendance tracking
    console.log('Creating new QR token for attendance tracking...');
    const crypto = require('crypto');
    const attendanceToken = crypto.randomBytes(32).toString('hex');  const newQrToken = await prisma.qrToken.create({
      data: {
        token: attendanceToken,
        type: 'EMPLOYEE_REG',
        managerId: token.managerId
      }
    });  console.log('✅ New QR token for attendance created:', newQrToken.token);  // Remove password from response
    const { password: _, ...employeeWithoutPassword } = employee;  res.status(201).json({
      ...employeeWithoutPassword,
      attendanceToken: newQrToken.token
    });
  } catch (error) {
    console.error('Error registering employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all employees for a manager (Manager only)
router.get('/', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;  const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: { managerId: parseInt(req.user.id) },
        skip,
        take: limit,
        include: {
          attendance: {
            where: {
              date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({
        where: { managerId: parseInt(req.user.id) }
      })
    ]);  const employeesWithoutPasswords = employees.map(employee => {
      // Find the latest check-out time for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);    const latestCheckOut = employee.attendance
        .filter(a => a.checkOutTime && new Date(a.date) >= today)
        .sort((a, b) => new Date(b.checkOutTime) - new Date(a.checkOutTime))[0]?.checkOutTime;    return {
        ...employee,
        password: undefined,
        todayAttendance: employee.attendance[0] || null,
        lastCheckOut: latestCheckOut || null
      };
    });  res.json({
      employees: employeesWithoutPasswords,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get absent employees for a manager (Manager only)
router.get('/absent', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);  const presentEmployees = await prisma.attendance.findMany({
      where: {
        employee: {
          managerId: parseInt(req.user.id)
        },
        createdAt: {
          gte: today
        },
        checkInTime: {
          not: null
        }
      },
      select: { employeeId: true }
    });  const presentEmployeeIds = presentEmployees.map(a => a.employeeId);  const absentEmployees = await prisma.employee.findMany({
      where: {
        managerId: parseInt(req.user.id),
        id: {
          notIn: presentEmployeeIds
        }
      },
      orderBy: { createdAt: 'desc' }
    });  const employeesWithoutPasswords = absentEmployees.map(employee => ({
      ...employee,
      password: undefined
    }));  res.json(employeesWithoutPasswords);
  } catch (error) {
    console.error('Error fetching absent employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee attendance history (Manager only)
router.get('/:id/attendance', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const { id } = req.params;
    const filter = req.query.filter || 'today';  // Verify employee belongs to manager
    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(id),
        managerId: parseInt(req.user.id)
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  let dateFilter = {};
    const now = new Date();  switch (filter) {
      case 'today':
        dateFilter = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'week':
        dateFilter = {
          gte: new Date(now.setDate(now.getDate() - 7))
        };
        break;
      case 'month':
        dateFilter = {
          gte: new Date(now.setMonth(now.getMonth() - 1))
        };
        break;
      case 'threemonths':
        dateFilter = {
          gte: new Date(now.setMonth(now.getMonth() - 3))
        };
        break;
    }  const attendance = await prisma.attendance.findMany({
      where: {
        employeeId: parseInt(id),
        date: dateFilter
      },
      orderBy: { date: 'desc' }
    });  res.json(attendance);
  } catch (error) {
    console.error('Error fetching employee attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee (Manager only)
router.delete('/:id', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Delete request for employee ID:', id, 'by user:', req.user.id);  // Validate ID
    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid employee ID:', id);
      return res.status(400).json({ error: 'Invalid employee ID' });
    }  const employeeId = parseInt(id);  // Verify employee belongs to manager
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        managerId: parseInt(req.user.id)
      }
    });  if (!employee) {
      console.log('Employee not found or does not belong to manager:', employeeId);
      return res.status(404).json({ error: 'Employee not found' });
    }  console.log('Found employee:', employee);  // Check for related attendance records
    const attendanceCount = await prisma.attendance.count({
      where: { employeeId }
    });
    console.log('Employee has', attendanceCount, 'attendance records');  // Delete employee and related records
    try {
      // First delete all attendance history records for this employee
      await prisma.attendanceHistory.deleteMany({
        where: { employeeId }
      });    // Then delete all attendance records for this employee
      await prisma.attendance.deleteMany({
        where: { employeeId }
      });    const deletedEmployee = await prisma.employee.delete({
        where: { id: employeeId }
      });
      console.log('Successfully deleted employee:', deletedEmployee);    // Уведомляем об удалении сотрудника
      eventManager.notifyEmployeeDeleted(employeeId, req.user.id);
    } catch (deleteError) {
      console.error('Prisma delete error:', deleteError);
      throw deleteError;
    }  res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all employees (SuperAdmin only)
router.get('/all', authenticateToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    });  // Remove passwords from response
    const employeesWithoutPasswords = employees.map(employee => ({
      ...employee,
      password: undefined
    }));  res.json(employeesWithoutPasswords);
  } catch (error) {
    console.error('Error fetching all employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee profile (Employee only)
router.get('/profile', authenticateToken, requireRole(['employee']), async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(req.user.id) },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // Remove password from response
    const { password: _, ...employeeWithoutPassword } = employee;  res.json(employeeWithoutPassword);
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee's last action
router.get('/:id/last-action', authenticateToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;  // Проверяем права доступа: только сам сотрудник или админ могут просматривать
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        userId: true,
        managerId: true,
        firstName: true,
        lastName: true,
        manager: {
          select: {
            registrationLatitude: true,
            registrationLongitude: true
          }
        }
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // Проверяем права доступа
    const isOwner = employee.userId === requestingUserId;
    const isSuperAdmin = requestingUserRole === 'SUPER_ADMIN';
    const isManagerOfEmployee = requestingUserRole === 'MANAGER' && employee.managerId === req.user.managerId;  if (!isOwner && !isSuperAdmin && !isManagerOfEmployee) {
      return res.status(403).json({ error: 'Access denied' });
    }  // Получаем последнюю запись посещаемости
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId
      },
      orderBy: {
        date: 'desc'
      },
      take: 1,
      select: {
        id: true,
        date: true,
        checkInTime: true,
        checkOutTime: true
      }
    });  res.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName
      },
      managerLocation: employee.manager ? {
        latitude: employee.manager.registrationLatitude,
        longitude: employee.manager.registrationLongitude
      } : null,
      lastAction: lastAttendance || null
    });
  } catch (error) {
    console.error('Error fetching last action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee's last action (OAuth version)
router.get('/:id/last-action-oauth', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);  // Получаем токен из заголовка
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Last-action-oauth - Token received:', token ? 'YES' : 'NO');
    console.log('Last-action-oauth - Employee ID:', employeeId);  if (!token) {
      console.log('Last-action-oauth - No token provided');
      return res.status(401).json({ error: 'Токен авторизации отсутствует' });
    }  // Верифицируем JWT токен
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Last-action-oauth - Token verified successfully:', decoded);    // Проверяем, что токен принадлежит сотруднику
      if (decoded.id !== employeeId) {
        console.log('Last-action-oauth - Token employeeId mismatch:', decoded.id, 'vs', employeeId);
        console.log('Last-action-oauth - Token type:', decoded.role ? 'Manager/Admin token' : 'Employee token');
        return res.status(403).json({ error: 'Доступ запрещен - токен не принадлежит сотруднику' });
      }  } catch (jwtError) {
      console.log('Last-action-oauth - JWT verification failed:', jwtError.message);
      return res.status(401).json({ error: 'Недействительный токен' });
    }  // Получаем последнюю запись посещаемости
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId
      },
      orderBy: {
        date: 'desc'
      },
      take: 1,
      select: {
        id: true,
        date: true,
        checkInTime: true,
        checkOutTime: true
      }
    });  // Подсчитываем количество циклов за сегодня
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const tomorrowStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0));  const todayCyclesCount = await prisma.attendance.count({
      where: {
        employeeId: employeeId,
        date: { gte: todayStart, lt: tomorrowStart }
      }
    });  // Получаем данные сотрудника
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        manager: {
          select: {
            firstName: true,
            lastName: true,
            registrationLatitude: true,
            registrationLongitude: true
          }
        }
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  res.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName
      },
      managerLocation: employee.manager ? {
        latitude: employee.manager.registrationLatitude,
        longitude: employee.manager.registrationLongitude
      } : null,
      managerInfo: employee.manager ? {
        firstName: employee.manager.firstName,
        lastName: employee.manager.lastName
      } : null,
      lastAction: lastAttendance || null,
      todayCyclesCount: todayCyclesCount || 0
    });
  } catch (error) {
    console.error('Error fetching last action (OAuth):', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Неверный токен авторизации' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
