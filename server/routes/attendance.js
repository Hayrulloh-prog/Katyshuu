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
    const distanceInMeters = distance * 1000;  // Check if distance is more than 15 meters (with small tolerance)
    const maxAllowedDistance = 15; // 15 meters
    const isTooFar = distanceInMeters > maxAllowedDistance;
  console.log('Distance check result:', {
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

// Perform attendance action (OAuth version) - SECURE VERSION
router.post('/action-oauth', authenticateToken, async (req, res) => {
  try {
    const { action, latitude, longitude, deviceModel, scannerInfo } = req.body;
    const employeeId = req.user.id; // Use ID from authenticated token  // Validation
    if (!action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  if (!['checkin', 'checkout'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be checkin or checkout' });
    }  // Use Server Time always!
    const serverTime = new Date();  // Get full employee info with manager for distance and device check
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: {
        manager: {
          select: {
            id: true,
            registrationLatitude: true,
            registrationLongitude: true,
            strictDeviceCheck: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // DEVICE SECURITY CHECK
    let deviceMismatch = false;
    let savedDeviceModel = employee.deviceModel;
    let isNewDevice = !savedDeviceModel;  // Track device owner info for CHECK mode
    let deviceOwnerInfo = null;  // Scanner mismatch detection
    let scannerMismatch = false;
    let actualScannerName = null;  // Check if scanner (from client localStorage) differs from the employee being marked
    if (scannerInfo && scannerInfo.email && scannerInfo.email !== employee.email) {
      scannerMismatch = true;
      actualScannerName = `${scannerInfo.firstName || ''} ${scannerInfo.lastName || ''}`.trim();
    }  if (deviceModel) {
      if (!savedDeviceModel) {
        // First time - save the device model
        await prisma.employee.update({
          where: { id: parseInt(employeeId) },
          data: { deviceModel: deviceModel }
        });
        savedDeviceModel = deviceModel;
      } else if (savedDeviceModel !== deviceModel) {
        // Device mismatch detected
        deviceMismatch = true;      if (employee.manager.strictDeviceCheck) {
          // STRICT MODE: Reject the attendance
          return res.status(403).json({
            error: 'DEVICE_MISMATCH_STRICT',
            message: 'Вы не можете отметиться с чужого устройства. Нарушение правил безопасности!',
            savedDevice: savedDeviceModel,
            currentDevice: deviceModel,
            strictMode: true,
            scannerInfo: scannerInfo || null
          });
        }
        // CHECK MODE: Find who owns this device
        const deviceOwner = await prisma.employee.findFirst({
          where: {
            deviceModel: deviceModel,
            managerId: employee.manager.id,
            isActive: true
          },
          select: {
            firstName: true,
            lastName: true,
            id: true
          }
        });      if (deviceOwner) {
          deviceOwnerInfo = {
            firstName: deviceOwner.firstName,
            lastName: deviceOwner.lastName,
            id: deviceOwner.id
          };
        }
      }
    }  // Server-side distance check
    if (employee.manager.registrationLatitude && employee.manager.registrationLongitude) {
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'LOCATION_REQUIRED' });
      }    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const dPhi = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };    const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(employee.manager.registrationLatitude),
        parseFloat(employee.manager.registrationLongitude)
      );    if (distance > 10) { // 10 meters tolerance
        return res.status(400).json({
          error: 'TOO_FAR',
          distance: Math.round(distance),
          maxDistance: 10
        });
      }
    }  // Rate limiting (1 minute between actions) - ЗАКОММЕНТИРОВАНО
    // const lastAttendance = await prisma.attendance.findFirst({
    //   where: { employeeId: parseInt(employeeId) },
    //   orderBy: { date: 'desc' },
    //   take: 1
    // });  // if (lastAttendance) {
    //   const lastEventTime = lastAttendance.checkOutTime
    //     ? new Date(lastAttendance.checkOutTime)
    //     : new Date(lastAttendance.checkInTime || lastAttendance.date);  //   const secondsSinceLastAction = (serverTime - lastEventTime) / 1000;  //   if (secondsSinceLastAction < 60) {
    //     return res.status(400).json({
    //       error: 'ATTENDANCE_RATE_LIMIT',
    //       remainingSeconds: Math.ceil(60 - secondsSinceLastAction)
    //     });
    //   }
    // }  // Daily cycle limit (max 5) - используем UTC для корректного подсчета
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const tomorrowStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0));  const totalRecordsToday = await prisma.attendance.count({
      where: {
        employeeId: parseInt(employeeId),
        date: { gte: todayStart, lt: tomorrowStart }
      }
    });  if (action === 'checkin' && totalRecordsToday >= 5) {
      return res.status(400).json({ error: 'ATTENDANCE_DAILY_LIMIT' });
    }  // Perform action
    // Security flags for attendance record
    const securityFlags = {
      isForeignDevice: deviceMismatch,
      actualScannerName: scannerMismatch ? actualScannerName : null
    };  let attendance;
    if (action === 'checkin') {
      attendance = await prisma.attendance.create({
        data: {
          employeeId: parseInt(employeeId),
          date: serverTime,
          checkInTime: serverTime,
          ipAddress: req.ip,
          deviceFingerprint: req.body.fingerprint,
          ...securityFlags
        }
      });
    } else {
      // ========== CHECKOUT LOGIC ==========
      // 1. Find the most recent attendance record
      const lastRecord = await prisma.attendance.findFirst({
        where: { employeeId: parseInt(employeeId) },
        orderBy: { date: 'desc' }
      });    // 2. Determine what to do based on last record
      let shouldCreateNew = false;
      let shouldUpdateExisting = false;
      let recordToUpdate = null;    if (!lastRecord) {
        // No records at all - create new checkout-only record
        shouldCreateNew = true;
      } else if (lastRecord.checkOutTime && !lastRecord.checkInTime) {
        // Last record was checkout-only - create new checkout-only record
        shouldCreateNew = true;
      } else if (!lastRecord.checkOutTime && lastRecord.checkInTime) {
        // Open check-in exists - check if same day
        const lastCheckIn = new Date(lastRecord.checkInTime);
        const isSameDay = lastCheckIn.toDateString() === serverTime.toDateString();
        if (isSameDay) {
          shouldUpdateExisting = true;
          recordToUpdate = lastRecord;
        } else {
          // Different day - create new checkout-only record
          shouldCreateNew = true;
        }
      } else if (lastRecord.checkInTime && lastRecord.checkOutTime) {
        // Last record is complete (has both) - always create new checkout-only record
        shouldCreateNew = true;
      }    // 3. Execute the action
      if (shouldUpdateExisting && recordToUpdate) {
        // Update existing open record
        const updateData = { checkOutTime: serverTime };
        // Propagate security flags if they exist on the record or are detected now
        if (deviceMismatch || scannerMismatch) {
          updateData.isForeignDevice = deviceMismatch || recordToUpdate.isForeignDevice;
          updateData.actualScannerName = scannerMismatch ? actualScannerName : recordToUpdate.actualScannerName;
        }
        attendance = await prisma.attendance.update({
          where: { id: recordToUpdate.id },
          data: updateData
        });
      } else if (shouldCreateNew) {
        // Check daily limit before creating new
        if (totalRecordsToday >= 5) {
          return res.status(400).json({ error: 'ATTENDANCE_DAILY_LIMIT' });
        }
        // Create new checkout-only record
        attendance = await prisma.attendance.create({
          data: {
            employeeId: parseInt(employeeId),
            date: serverTime,
            checkOutTime: serverTime,
            ipAddress: req.ip,
            ...securityFlags
          }
        });
      }
    }  // Notify via Socket.io
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('attendance_action', {
          employeeId: parseInt(employeeId),
          action: action,
          timestamp: attendance.date,
          employee: {
            firstName: employee.firstName,
            lastName: employee.lastName
          },
          isForeignDevice: deviceMismatch,
          actualScannerName: scannerMismatch ? actualScannerName : null
        });
      }
    } catch (err) { console.error('WS Error:', err); }  // Notify via EventSource
    try {
      eventManager.notifyAttendanceUpdated({
        employeeId: parseInt(employeeId),
        action: action,
        timestamp: attendance.date,
        type: 'checkin'
      });
    } catch (err) { console.error('ES Error:', err); }  // Prepare response with device check info
    const response = {
      success: true,
      action: action,
      time: action === 'checkin' ? attendance.checkInTime : attendance.checkOutTime,
      message: 'Success',
      isForeignDevice: deviceMismatch,
      actualScannerName: scannerMismatch ? actualScannerName : null
    };  // Add device mismatch warning for CHECK mode
    if (deviceMismatch && !employee.manager.strictDeviceCheck) {
      response.deviceMismatch = true;
      response.savedDevice = savedDeviceModel;
      response.currentDevice = deviceModel;
      response.strictMode = false;
      response.scannerInfo = scannerInfo || null;
      response.deviceOwner = deviceOwnerInfo;
      response.warning = 'Отметка зафиксирована, но устройство отличается от зарегистрированного';
    }  // Add scanner mismatch warning
    if (scannerMismatch) {
      response.scannerMismatch = true;
      response.scannerInfo = scannerInfo;
    }  res.json(response);} catch (error) {
    console.error('Attendance action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get attendance statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { filter = 'today' } = req.query;
    const isSuperAdmin = req.user.role === 'superAdmin';
    const managerId = isSuperAdmin ? null : parseInt(req.user.id);  let startDate;
    const now = new Date();
    // endDate is always "today + 1" at 00:00:00 to include the entire day of today
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);  switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'threemonths':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 89);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }  // Получаем всех активных сотрудников
    const whereClause = isSuperAdmin
      ? { isActive: true }
      : { managerId, isActive: true };  const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        attendance: {
          where: {
            date: { gte: startDate, lt: endDate }
          },
          orderBy: { date: 'desc' }
        }
      }
    });  let present = 0;
    let absent = 0;
    let totalRequiredDays = 0;
    let totalAttendedDays = 0;  employees.forEach(employee => {
      const attendanceRecords = employee.attendance;    // --- New percentage calculation logic ---
      // Determine the employee's effective start date for the period
      const effectiveStart = new Date(Math.max(startDate.getTime(), new Date(employee.createdAt).getTime()));
      effectiveStart.setHours(0, 0, 0, 0);    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());    let requiredDaysForEmployee = 0;
      let attendedDaysForEmployee = 0;    if (effectiveStart <= todayStart) {
        // Count how many valid days there are between effectiveStart and todayStart inclusive
        const diffTime = todayStart.getTime() - effectiveStart.getTime();
        requiredDaysForEmployee = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;      // Helper function to get local YYYY-MM-DD
        const getLocalDateKey = (dateInput) => {
          const d = new Date(dateInput);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };      // Count unique dates attended using local time so it matches other endpoints perfectly
        const uniqueAttendedDates = new Set();
        attendanceRecords.forEach(record => {
          if (record.checkInTime || record.date) {
            uniqueAttendedDates.add(getLocalDateKey(record.checkInTime || record.date));
          }
        });
        attendedDaysForEmployee = uniqueAttendedDates.size;      totalRequiredDays += requiredDaysForEmployee;
        totalAttendedDays += attendedDaysForEmployee;
      }
      // ------------------------------------------    // If no attendance records, employee is absent
      if (attendanceRecords.length === 0) {
        absent++;
        return;
      }    // Find first check-in across all cycles for status
      const firstCheckIn = attendanceRecords
        .filter(record => record.checkInTime)
        .sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime))[0];    if (firstCheckIn) {
        present++;
      } else {
        absent++;
      }
    });  const total = employees.length;
    const attendanceRate = totalRequiredDays > 0
      ? Math.round((totalAttendedDays / totalRequiredDays) * 100)
      : 0;
    const totalAbsences = totalRequiredDays - totalAttendedDays;
    const totalAttendances = totalAttendedDays;  res.json({
      total,
      present,
      absent,
      attendanceRate,
      totalAbsences,
      totalAttendances
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get aggregated status for all employees
router.get('/aggregated-status', authenticateToken, requireRole(['manager', 'superAdmin']), async (req, res) => {
  try {
    const { filter = 'today' } = req.query;
    const isSuperAdmin = req.user.role === 'superAdmin';
    const managerId = isSuperAdmin ? null : parseInt(req.user.id);  let startDate, endDate;
    const now = new Date();  switch (filter) {
      case 'today':
        // Только сегодня
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        // Последние 7 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Последние 30 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'threemonths':
        // Последние 60 дней (два месяца)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 59);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }  const whereClause = isSuperAdmin
      ? { isActive: true }
      : { managerId, isActive: true };  const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        attendance: {
          where: {
            date: { gte: startDate, lt: endDate }
          },
          orderBy: { date: 'desc' }
        }
      }
    });  // Helper function to get local YYYY-MM-DD
    const getLocalDateKey = (dateInput) => {
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };  // Generate all dates in the range
    const allDatesKeys = [];
    const currentDateIt = new Date(startDate);
    while (currentDateIt < endDate) {
      allDatesKeys.push(getLocalDateKey(currentDateIt));
      currentDateIt.setDate(currentDateIt.getDate() + 1);
    }  const aggregatedData = [];  employees.forEach(employee => {
      const attendanceRecords = employee.attendance;
      const recordsByDate = {};    attendanceRecords.forEach(record => {
        const dateToUse = record.checkInTime || record.checkOutTime || record.date;
        const dateKey = getLocalDateKey(dateToUse);
        if (!recordsByDate[dateKey]) {
          recordsByDate[dateKey] = [];
        }
        recordsByDate[dateKey].push(record);
      });    // Loop through all dates in the selected period
      const createdAtKey = getLocalDateKey(employee.createdAt);
      allDatesKeys.forEach(dateKey => {
        // Пропускаем дни до создания сотрудника
        if (dateKey < createdAtKey) return;      const dayRecords = recordsByDate[dateKey];      let status = 'absent';
        let checkInTime = null;
        let checkOutTime = null;
        let isForeignDevice = false;
        let actualScannerName = null;      if (dayRecords && dayRecords.length > 0) {
          // Находим первую запись с check-in за день
          const firstCheckIn = dayRecords
            .filter(record => record.checkInTime)
            .sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime))[0];        // Находим последнюю запись с check-out за день
          const lastCheckOut = dayRecords
            .filter(record => record.checkOutTime)
            .sort((a, b) => new Date(b.checkOutTime) - new Date(a.checkOutTime))[0];        const latestRecord = dayRecords[0];
          const hasIncompleteCycle = latestRecord && latestRecord.checkInTime && !latestRecord.checkOutTime;        if (firstCheckIn) {
            checkInTime = firstCheckIn.checkInTime;
            status = hasIncompleteCycle ? 'checked_in' : 'completed';
          } else if (lastCheckOut) {
            status = 'completed';
          }        // Проверяем, что check-out не раньше check-in
          if (lastCheckOut && firstCheckIn) {
            if (new Date(lastCheckOut.checkOutTime) >= new Date(firstCheckIn.checkInTime)) {
              checkOutTime = lastCheckOut.checkOutTime;
            } else {
              // Если check-out раньше check-in, не показываем его
              checkOutTime = null;
              if (hasIncompleteCycle) {
                status = 'checked_in';
              } else {
                status = 'completed';
              }
            }
          } else if (lastCheckOut) {
            checkOutTime = lastCheckOut.checkOutTime;
          }        // Check security flags from any record in the day
          const foreignRecord = dayRecords.find(r => r.isForeignDevice);
          if (foreignRecord) {
            isForeignDevice = true;
          }
          const scannerRecord = dayRecords.find(r => r.actualScannerName);
          if (scannerRecord) {
            actualScannerName = scannerRecord.actualScannerName;
          }
        }      // We use the start of the dateKey day as the recordDate so sorting works
        const recordDateObj = new Date(dateKey + 'T00:00:00');      aggregatedData.push({
          employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone,
            updatedAt: employee.updatedAt
          },
          status,
          checkInTime,
          checkOutTime,
          recordDate: recordDateObj.toISOString(),
          isForeignDevice,
          actualScannerName
        });
      });
    });  res.json(aggregatedData);
  } catch (error) {
    console.error('Error fetching aggregated status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employees who are absent today
router.get('/employees/absent', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'today' } = req.query;
    const isSuperAdmin = req.user.role === 'superAdmin';
    const managerId = isSuperAdmin ? null : parseInt(req.user.id);
    const offset = (page - 1) * limit;  let startDate, endDate;
    const now = new Date();  switch (filter) {
      case 'today':
        // Только сегодня
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        // Последние 7 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Последние 30 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'threemonths':
        // Последние 60 дней (два месяца)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 59);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }  // Helper function
    const getLocalDateKey = (dateInput) => {
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };  const allDatesKeys = [];
    const currentDateIt = new Date(startDate);
    while (currentDateIt < endDate) {
      allDatesKeys.push(getLocalDateKey(currentDateIt));
      currentDateIt.setDate(currentDateIt.getDate() + 1);
    }  const whereClause = isSuperAdmin
      ? { isActive: true }
      : { managerId, isActive: true };  const allEmployees = await prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });  const employeeIds = allEmployees.map(e => e.id);  const attendanceData = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: startDate, lt: endDate },
        checkInTime: { not: null }
      },
      select: { employeeId: true, checkInTime: true, date: true }
    });  const attendanceByEmployee = {};
    attendanceData.forEach(record => {
      if (!attendanceByEmployee[record.employeeId]) {
         attendanceByEmployee[record.employeeId] = new Set();
      }
      const dateToUse = record.checkInTime || record.date;
      attendanceByEmployee[record.employeeId].add(getLocalDateKey(dateToUse));
    });  const absentRecords = [];
    allEmployees.forEach(employee => {
      const presentDates = attendanceByEmployee[employee.id] || new Set();
      const createdAtKey = getLocalDateKey(employee.createdAt);    const missingDates = [];
      allDatesKeys.forEach(dateKey => {
         if (dateKey >= createdAtKey && !presentDates.has(dateKey)) {
           missingDates.push(new Date(dateKey + 'T00:00:00').toISOString());
         }
      });    if (missingDates.length > 0) {
        // Sort missing dates newest to oldest
        missingDates.sort((a, b) => new Date(b) - new Date(a));
        absentRecords.push({
          ...employee,
          absentDates: missingDates
        });
      }
    });  // Sort absentRecords by number of absent dates descending, then by most recent missing date
    absentRecords.sort((a, b) => {
      if (b.absentDates.length !== a.absentDates.length) {
        return b.absentDates.length - a.absentDates.length;
      }
      return new Date(b.absentDates[0]) - new Date(a.absentDates[0]);
    });  const paginatedRecords = absentRecords.slice(offset, offset + parseInt(limit));
    const hasMore = offset + parseInt(limit) < absentRecords.length;  res.json({
      employees: paginatedRecords,
      hasMore,
      total: absentRecords.length
    });
  } catch (error) {
    console.error('Error fetching absent employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chart data
router.get('/chart', authenticateToken, async (req, res) => {
  try {
    const { filter = 'today' } = req.query;
    const isSuperAdmin = req.user.role === 'superAdmin';
    const managerId = isSuperAdmin ? null : parseInt(req.user.id);  let startDate, endDate, groupBy;
    const now = new Date();  switch (filter) {
      case 'today':
        // Показываем последние 7 дней включая сегодня
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // -6 дней + сегодня = 7 дней
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 1); // Включаем завтрашний день для полноты
        endDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        // Последние 7 дней включая сегодня
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // -6 дней + сегодня = 7 дней
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 1); // Включаем завтрашний день для полноты
        endDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        // Последние 30 дней включая сегодня
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29); // -29 дней + сегодня = 30 дней
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 1); // Включаем завтрашний день для полноты
        endDate.setHours(0, 0, 0, 0);
        break;
      case 'threemonths':
        // Последние 60 дней включая сегодня
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 59); // -59 дней + сегодня = 60 дней
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(now.getDate() + 1); // Включаем завтрашний день для полноты
        endDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }  const whereClause = isSuperAdmin
      ? { isActive: true }
      : { managerId, isActive: true };  const employees = await prisma.employee.findMany({
      where: whereClause,
      select: { id: true }
    });  const employeeIds = employees.map(e => e.id);  // Get all attendance records for the period
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: startDate, lte: endDate }
      },
      select: {
        date: true,
        employeeId: true,
        checkInTime: true
      },
      orderBy: {
        date: 'asc'
      }
    });  // Helper function to get local YYYY-MM-DD
    const getLocalDateKey = (dateInput) => {
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };  // Group by date and count unique employees who checked in
    const uniqueEmployeesByDate = {};
    attendanceRecords.forEach(record => {
      const dateToUse = record.checkInTime || record.date;
      const dateKey = getLocalDateKey(dateToUse);
      if (!uniqueEmployeesByDate[dateKey]) {
        uniqueEmployeesByDate[dateKey] = new Set();
      }
      // Count only employees who actually checked in
      if (record.checkInTime) {
        uniqueEmployeesByDate[dateKey].add(record.employeeId);
      }
    });  // Generate all dates in the range including empty ones
    const allDates = [];
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }  const chartData = allDates.map(date => {
      const dateKey = getLocalDateKey(date);
      const presentCount = uniqueEmployeesByDate[dateKey] ? uniqueEmployeesByDate[dateKey].size : 0;
      return {
        date: date,
        present: presentCount,
        total: employees.length, // Общее количество активных сотрудников
        absent: employees.length - presentCount // Отсутствующие
      };
    });  res.json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all cycles data for employees with multiple cycles
router.get('/all-cycles', authenticateToken, async (req, res) => {
  try {
    const { filter = 'today' } = req.query;
    const isSuperAdmin = req.user.role === 'superAdmin';
    const managerId = isSuperAdmin ? null : parseInt(req.user.id);  let startDate, endDate;
    const now = new Date();  switch (filter) {
      case 'today':
        // Только сегодня
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        // Последние 7 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Последние 30 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'threemonths':
        // Последние 60 дней (два месяца)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 60);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }  const whereClause = isSuperAdmin
      ? {}
      : { managerId };  const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        attendance: {
          where: {
            date: { gte: startDate, lt: endDate }
          },
          orderBy: { date: 'desc' }
        }
      }
    });  const employeesWithCycles = employees.map(employee => ({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone,
        updatedAt: employee.updatedAt
      },
      cycles: employee.attendance.map(record => ({
        id: record.id,
        date: record.date,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        isForeignDevice: record.isForeignDevice,
        actualScannerName: record.actualScannerName
      }))
    }));  res.json(employeesWithCycles);
  } catch (error) {
    console.error('Error fetching all cycles data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee history
router.get('/employee-history/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { filter = 'today' } = req.query;
    const managerId = req.user.id;  // Verify employee belongs to manager
    const employee = await prisma.employee.findFirst({
      where: {
        id: parseInt(employeeId),
        managerId
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  let startDate, endDate;
    const now = new Date();  switch (filter) {
      case 'today':
        // Только сегодня
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        // Последние 7 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Последние 30 дней
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'threemonths':
        // Последние 60 дней (два месяца)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 60);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }  const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: parseInt(employeeId),
        date: { gte: startDate, lt: endDate }
      },
      orderBy: {  date: 'desc' }
    });  const getLocalDateKey = (dateInput) => {
      const d = new Date(dateInput);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };  const employeeStart = new Date(employee.createdAt);
    employeeStart.setHours(0, 0, 0, 0);
    const actualStart = startDate > employeeStart ? startDate : employeeStart;  // We only go up to today or endDate, whichever is earlier. Actually endDate is built as tomorrow 00:00.
    // So all dates strictly less than endDate are in the range.
    // And actually "now" means we only want up to today.
    const actualEnd = new Date(Math.min(endDate.getTime(), new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()));  const allDatesKeys = [];
    const currentDateIt = new Date(actualStart);
    while (currentDateIt < actualEnd) {
      allDatesKeys.push(getLocalDateKey(currentDateIt));
      currentDateIt.setDate(currentDateIt.getDate() + 1);
    }
    allDatesKeys.reverse();  const recordsByDate = {};
    attendanceRecords.forEach(record => {
      const dateKey = getLocalDateKey(record.checkInTime || record.checkOutTime || record.date);
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = [];
      }
      recordsByDate[dateKey].push(record);
    });  const finalRecords = [];
    allDatesKeys.forEach(dateKey => {
      if (recordsByDate[dateKey] && recordsByDate[dateKey].length > 0) {
        // Use existing records
        finalRecords.push(...recordsByDate[dateKey]);
      } else {
        // Create absent record
        const recordDateObj = new Date(dateKey + 'T00:00:00');
        finalRecords.push({
          id: `absent-${dateKey}`,
          employeeId: parseInt(employeeId),
          date: recordDateObj.toISOString(),
          checkInTime: null,
          checkOutTime: null,
          isAbsent: true
        });
      }
    });  res.json({
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone
      },
      records: finalRecords
    });
  } catch (error) {
    console.error('Error fetching employee history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
