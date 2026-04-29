const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const geoip = require('geoip-lite');
const eventManager = require('../middleware/events');

const router = express.Router();
const prisma = new PrismaClient();

// Check distance between employee location and manager registration location
router.post('/check-distance', async (req, res) => {
  try {
    const { employeeId, employeeLatitude, employeeLongitude } = req.body;  // Validate required fields
    if (!employeeId || !employeeLatitude || !employeeLongitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  // Get employee with manager info
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationLatitude: true,
            registrationLongitude: true
          }
        }
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // Check if manager has registration location
    if (!employee.manager.registrationLatitude || !employee.manager.registrationLongitude) {
      return res.json({
        hasManagerLocation: false,
        message: 'Менеджер не указал местоположение регистрации'
      });
    }  // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in kilometers
    };  const distance = calculateDistance(
      parseFloat(employeeLatitude),
      parseFloat(employeeLongitude),
      parseFloat(employee.manager.registrationLatitude),
      parseFloat(employee.manager.registrationLongitude)
    );  // Convert to meters
    const distanceInMeters = distance * 1000;  // Check if distance is more than 10 meters (with small tolerance)
    const maxAllowedDistance = 10; // 10 meters
    const isTooFar = distanceInMeters > maxAllowedDistance;  console.log('Distance check result:', {
      employeeId,
      employeeLocation: { lat: employeeLatitude, lon: employeeLongitude },
      managerLocation: {
        lat: employee.manager.registrationLatitude,
        lon: employee.manager.registrationLongitude
      },
      distanceInMeters: Math.round(distanceInMeters),
      isTooFar
    });  return res.json({
      hasManagerLocation: true,
      distanceInMeters: Math.round(distanceInMeters),
      isTooFar,
      maxAllowedDistance,
      manager: {
        firstName: employee.manager.firstName,
        lastName: employee.manager.lastName
      },
      message: isTooFar
        ? `Сотрудник находится на расстоянии ${Math.round(distanceInMeters)}м от места регистрации менеджера (допустимо: ${maxAllowedDistance}м)`
        : `Сотрудник находится в допустимом расстоянии (${Math.round(distanceInMeters)}м от места регистрации менеджера)`
    });} catch (error) {
    console.error('Error checking distance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's attendance for employee (public)
router.get('/today/:employeeId', async (req, res) => {
  try {
    console.log('Getting today attendance for employee:', req.params.employeeId);
    const { employeeId } = req.params;
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(localToday);
    tomorrow.setDate(tomorrow.getDate() + 1);  console.log('Date range:', { localToday, tomorrow });  const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: localToday,
          lt: tomorrow
        }
      }
    });  console.log('Found attendance:', attendance);
    res.json(attendance);
  } catch (error) {
    console.error('Error getting today attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Perform attendance action (OAuth version)
router.post('/action-oauth', async (req, res) => {
  try {
    const { employeeId, action, timestamp } = req.body;  // Валидация
    if (!employeeId || !action || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  if (!['checkin', 'checkout'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be checkin or checkout' });
    }  // Получаем токен из заголовка
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Токен авторизации отсутствует' });
    }  // Верифицируем JWT токен
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Проверяем, что токен принадлежит сотруднику
    if (decoded.id !== parseInt(employeeId)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }  // Проверяем последнюю запись для предотвращения дублирования
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId)
      },
      orderBy: {
        date: 'desc'
      },
      take: 1
    });  // Проверка на дублирование - обновленная логика
    if (lastAttendance) {
      let lastAction = 'unknown';
      let isIncomplete = false;    // Определяем последнее действие на основе checkInTime и checkOutTime
      if (lastAttendance.checkInTime && !lastAttendance.checkOutTime) {
        lastAction = 'checkin';
        isIncomplete = true;
      } else if (lastAttendance.checkInTime && lastAttendance.checkOutTime) {
        lastAction = 'checkout';
        isIncomplete = false;
      }    const lastTimestamp = new Date(lastAttendance.date);
      const currentTimestamp = new Date(timestamp);    // Если то же самое действие и прошло меньше 1 минуты, считаем дубликатом
      if (lastAction === action && (currentTimestamp - lastTimestamp) < 60000) {
        return res.status(400).json({
          error: 'Duplicate action detected',
          details: `Вы уже выполнили действие "${action === 'checkin' ? 'приход' : 'уход'}" недавно`
        });
      }    // Обновленная логика проверки:
      // 1. Нельзя два "прихода" подряд, если предыдущая запись незавершена
      // 2. Нельзя два "ухода" подряд
      // 3. Можно "приход" после "ухода" (создаем новую запись)
      // 4. Можно "уход" после "прихода" (обновляем существующую запись)    if (action === 'checkin' && lastAction === 'checkin' && isIncomplete) {
        return res.status(400).json({
          error: 'Невозможно выполнить это действие',
          details: 'Вы уже отметились о приходе. Сначала отметьтесь об уходе.'
        });
      }    if (action === 'checkout' && lastAction === 'checkout') {
        return res.status(400).json({
          error: 'Невозможно выполнить это действие',
          details: 'Вы уже отметились об уходе. Сначала отметьтесь о приходе.'
        });
      }    // Для checkout после checkin проверяем, что есть незавершенная запись
      if (action === 'checkout' && (!isIncomplete || lastAction !== 'checkin')) {
        return res.status(400).json({
          error: 'Невозможно выполнить это действие',
          details: 'Сначала необходимо отметиться о приходе.'
        });
      }
    } else {
      // Если нет предыдущих записей, разрешаем только "приход"
      if (action === 'checkout') {
        return res.status(400).json({
          error: 'Невозможно выполнить это действие',
          details: 'Сначала необходимо отметиться о приходе.'
        });
      }
    }  // Создаем запись посещаемости
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        date: new Date(timestamp),
        [action === 'checkin' ? 'checkInTime' : 'checkOutTime']: new Date(timestamp)
      }
    });  // Отправляем уведомление через WebSocket
    try {
      const io = req.app.get('io');
      if (io) {
        const employee = await prisma.employee.findUnique({
          where: { id: parseInt(employeeId) },
          select: {
            firstName: true,
            lastName: true
          }
        });      io.emit('attendance_action', {
          employeeId: parseInt(employeeId),
          action: action,
          timestamp: attendance.timestamp,
          employee: {
            firstName: employee.firstName,
            lastName: employee.lastName
          }
        });
      }
    } catch (socketError) {
      console.error('WebSocket notification error:', socketError);
    }  res.json({
      success: true,
      action: action,
      time: attendance.date,
      message: `${action === 'checkin' ? 'Приход' : 'Уход'} успешно записан`
    });} catch (error) {
    console.error('Error performing attendance action (OAuth):', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Неверный токен авторизации' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
