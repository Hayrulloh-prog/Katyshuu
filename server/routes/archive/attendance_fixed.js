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
        message: '�������� �� ������ �������������� �����������'
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
        ? `��������� ��������� �� ���������� ${Math.round(distanceInMeters)}� �� ����� ����������� ��������� (���������: ${maxAllowedDistance}�)`
        : `��������� ��������� � ���������� ���������� (${Math.round(distanceInMeters)}� �� ����� ����������� ���������)`
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

// Record attendance via QR code (public)
router.post('/', async (req, res) => {
  try {
    console.log('Recording attendance:', req.body);
    const {
      employeeId,
      action,
      date,
      time,
      ip,
      latitude,
      longitude,
      deviceFingerprint
    } = req.body;  // Validate required fields
    if (!employeeId || !action || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  // Validate action
    if (!['check-in', 'check-out'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }  // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { manager: true }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // Check if manager is active
    if (!employee.manager.isActive) {
      return res.status(400).json({ error: 'Manager The account is not activated' });
    }  // Check if already has record for today
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: new Date(date)
      }
    });  console.log('Existing record:', existingRecord);  if (action === 'check-in') {
      if (existingRecord?.checkInTime) {
        return res.status(400).json({ error: 'Already checked in today' });
      }    // Create attendance record
      const attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: new Date(date),
          checkInTime: new Date(`${date} ${time}`),
          ipAddress: ip,
          location: `${latitude}, ${longitude}`,
          deviceFingerprint
        }
      });    console.log('Created attendance:', attendance);
      return res.json({ message: 'check-in recorded', attendance });
    }  if (action === 'check-out') {
      if (!existingRecord?.checkInTime) {
        return res.status(400).json({ error: 'Must check in first' });
      }    if (existingRecord?.checkOutTime) {
        return res.status(400).json({ error: 'Already checked out today' });
      }    // Update attendance record
      const attendance = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          checkOutTime: new Date(`${date} ${time}`)
        }
      });    console.log('Updated attendance:', attendance);
      return res.json({ message: 'check-out recorded', attendance });
    }} catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance via QR code (public)
router.post('/mark', async (req, res) => {
  const { employeeId, action, deviceFingerprint, location } = req.body;try {
    console.log('Marking attendance via QR:', req.body);
    const {
      employeeId,
      action,
      deviceFingerprint,
      location
    } = req.body;  // Validate required fields
    if (!employeeId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  // Validate action
    if (!['checkin', 'checkout'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }  // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: { manager: true }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // Check if manager is active
    if (!employee.manager.isActive) {
      return res.status(400).json({ error: 'Manager The account is not activated' });
    }  // Get the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);  // Check records from the last 24 hours
    const recentRecords = await prisma.attendance.findMany({
      where: {
        employeeId: parseInt(employeeId),
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });  console.log('Recent records in last 24h:', recentRecords);  // ��������� ���������� ��������� ��� ��������� ����������
    if (action === 'checkin') {
      // ��� check-in ���������, ���� �� ��� ������������� ������ �������
      const incompleteRecord = recentRecords.find(record =>
        record.checkInTime && !record.checkOutTime
      );    if (incompleteRecord) {
        console.log('Already checked in today:', incompleteRecord);
        return res.status(400).json({ error: '�� ��� ���������� � �������. ������� ���������� �� �����.' });
      }
    } else if (action === 'checkout') {
      // ��� checkout ���������, ���� �� ������������� ������ �������
      const incompleteRecord = recentRecords.find(record =>
        record.checkInTime && !record.checkOutTime
      );    if (!incompleteRecord) {
        console.log('No incomplete record found for checkout');
        return res.status(400).json({ error: '������� ���������� ���������� � �������.' });
      }
    }  if (action === 'checkin') {
      // Check if there's already a check-in record for today
      const today = new Date();
      const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrow = new Date(localToday);
      tomorrow.setDate(tomorrow.getDate() + 1);    // Get today's attendance records for this employee
      const todayRecords = await prisma.attendance.findMany({
        where: {
          employeeId: parseInt(employeeId),
          date: {
            gte: localToday,
            lt: tomorrow
          }
        },
        orderBy: { createdAt: 'desc' }
      });    // �������� �� ������������� ������ ��� ��������� ����    // Limit check removed - unlimited cycles allowed    // �������� �� ����� ������ (�������� 6)
      const todayRecordsForLimit = await prisma.attendance.findMany({
        where: {
          employeeId: parseInt(employeeId),
          date: {
            gte: localToday,
            lt: tomorrow
          },
          checkInTime: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });    if (todayRecordsForLimit.length >= 5) {
        return res.status(400).json({
          error: '��������� ����� ������ �� ������� (�������� 5). ���������� ������.'
        });
      }    // Check if there's an incomplete record from the last 30 minutes
      const recentIncompleteRecord = recentRecords.find(record => {
        if (!record.checkInTime) return false;
        if (!record.checkOutTime) {
          const timeDiff = Math.abs(new Date() - new Date(record.checkInTime));
          return timeDiff < 1800000; // Less than 30 minutes
        }
        return false;
      });    if (recentIncompleteRecord) {
        return res.status(400).json({ error: '����������, ��������� 30 ����� ����� ��������� ��������.' });
      }    // The limit is already checked above (5 cycles), so no need for additional check here    // Create new attendance record for each check-in cycle
      // ���������� ���������� ����� �� ����� ��� �������������� ����������
      const now = new Date();
      const roundedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                                   now.getHours(), now.getMinutes(), 0, 0);    let attendance;
      try {
        attendance = await prisma.attendance.create({
          data: {
            employeeId: parseInt(employeeId),
            date: localToday,
            checkInTime: roundedTime,
            location: location ? `${location.latitude}, ${location.longitude}` : null,
            deviceFingerprint
          }
        });
      } catch (error) {
        // ���� ������ ����������� constraint, ������ �������� ��� ����������
        if (error.code === 'P2002') {
          console.log('Duplicate record detected by constraint:', error);
          return res.status(400).json({ error: '������ � ����� �������� ��� ����������. ����������, ���������.' });
        }
        throw error;
      }    console.log('Created attendance:', attendance);    // ���������� �� ���������� ������������
      eventManager.notifyAttendanceUpdated({
        type: 'checkin',
        employeeId: parseInt(employeeId),
        attendance: attendance
      }, attendance.employeeId);    return res.json({
        success: true,
        message: '������� � �������� ������� ��������',
        record: attendance
      });
    }  if (action === 'checkout') {
      console.log('=== CHECKOUT DEBUG ===');
      console.log('Action:', action);
      console.log('Recent records:', recentRecords);    // ������� ����� ��������� ������������� ������ �� ���� �������
      // ��������� �� createdAt ����� ����� ���������
      const sortedRecords = recentRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const incompleteRecord = sortedRecords.find(record => {
        if (!record.checkInTime) return false;
        if (!record.checkOutTime) return true;
        return false;
      });    console.log('Incomplete record found:', incompleteRecord);    if (!incompleteRecord) {
        console.log('No incomplete record found - returning error');
        return res.status(400).json({ error: '������� ���������� ���������� � �������.' });
      }    // ���������, �� ������� �� ������ ���������� checkout (����� 5 ������ ����� checkin)
      const checkInTime = new Date(incompleteRecord.checkInTime);
      const now = new Date();
      const timeDiff = Math.abs(now - checkInTime);    if (timeDiff < 5000) { // ����� 5 ������
        console.log('Checkout too soon after checkin:', timeDiff / 1000, 'seconds');
        return res.status(400).json({ error: '������� ������� ����. ����������, ��������� �������.' });
      }    // Update the existing incomplete record with checkout time
      const attendance = await prisma.attendance.update({
        where: { id: incompleteRecord.id },
        data: {
          checkOutTime: new Date(),
          location: location ? `${location.latitude}, ${location.longitude}` : incompleteRecord.location,
          deviceFingerprint: deviceFingerprint || incompleteRecord.deviceFingerprint
        }
      });    console.log('Updated attendance for checkout:', attendance);    // ���������� �� ���������� ������������
      eventManager.notifyAttendanceUpdated({
        type: 'checkout',
        employeeId: parseInt(employeeId),
        attendance: attendance
      }, attendance.employeeId);    return res.json({
        success: true,
        message: '������� �� ����� ������� ��������',
        record: attendance
      });
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      action: action || 'unknown',
      employeeId: employeeId || 'unknown',
      recentRecords: recentRecords?.length || 0
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Check in employee (Employee only)
router.post('/check-in', [
  authenticateToken,
  requireRole(['employee'])
], async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    const employeeId = req.user.id;
    const ip = req.ip;  // Check if already checked in today
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());  const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: localToday
        }
      }
    });  if (existingAttendance) {
      if (existingAttendance.checkInTime && !existingAttendance.checkOutTime) {
        return res.status(400).json({
          error: 'Already checked in. Please check out first.'
        });
      }
      if (existingAttendance.checkOutTime) {
        return res.status(400).json({
          error: 'Already completed attendance for today.'
        });
      }
    }  // Get location
    const geo = geoip.lookup(ip);  // Create or update attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: localToday
        }
      },
      update: {
        checkInTime: new Date(),
        ipAddress: ip,
        location: geo ? `${geo.city}, ${geo.country}` : null,
        deviceFingerprint
      },
      create: {
        employeeId,
        date: localToday,
        checkInTime: new Date(),
        ipAddress: ip,
        location: geo ? `${geo.city}, ${geo.country}` : null,
        deviceFingerprint
      }
    });  res.json({
      message: 'Check-in successful',
      attendance: {
        id: attendance.id,
        checkInTime: attendance.checkInTime,
        location: attendance.location
      }
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check out employee (Employee only)
router.post('/check-out', [
  authenticateToken,
  requireRole(['employee'])
], async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    const employeeId = req.user.id;
    const ip = req.ip;  // Find today's attendance record
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());  const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: localToday
        }
      }
    });  if (!attendance) {
      return res.status(400).json({
        error: 'No check-in record found for today. Please check in first.'
      });
    }  if (!attendance.checkInTime) {
      return res.status(400).json({
        error: 'No check-in time found. Please check in first.'
      });
    }  if (attendance.checkOutTime) {
      return res.status(400).json({
        error: 'Already checked out today.'
      });
    }  // Get location
    const geo = geoip.lookup(ip);  // Update attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: new Date(),
        ipAddress: ip,
        location: geo ? `${geo.city}, ${geo.country}` : null,
        deviceFingerprint
      }
    });  res.json({
      message: 'Check-out successful',
      attendance: {
        id: updatedAttendance.id,
        checkInTime: updatedAttendance.checkInTime,
        checkOutTime: updatedAttendance.checkOutTime,
        location: updatedAttendance.location
      }
    });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's attendance status for employee (Employee only)
router.get('/status', [
  authenticateToken,
  requireRole(['employee'])
], async (req, res) => {
  try {
    const employeeId = req.user.id;  // Find today's attendance record
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());  const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: localToday
        }
      }
    });  let status = 'not_checked_in';
    let action = 'check_in';  if (attendance) {
      if (attendance.checkInTime && !attendance.checkOutTime) {
        status = 'checked_in';
        action = 'check_out';
      } else if (attendance.checkOutTime) {
        status = 'completed';
        action = 'completed';
      }
    }  res.json({
      status,
      action,
      attendance: attendance ? {
        id: attendance.id,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        location: attendance.location
      } : null
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance statistics for manager (Manager only)
router.get('/stats', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const filter = req.query.filter || 'week';
    const managerId = req.user.id;  let dateFilter = {};
    const now = new Date();  switch (filter) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        dateFilter = { gte: todayStart };
        break;
      case 'week':
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // ����������� = 0, ����������� = 1
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { gte: weekStart };
        break;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - 1);
        dateFilter = { gte: monthStart };
        break;
      case 'threemonths':
        const threeMonthsStart = new Date(now);
        threeMonthsStart.setMonth(threeMonthsStart.getMonth() - 3);
        dateFilter = { gte: threeMonthsStart };
        break;
    }  const [totalEmployees, presentEmployeesData, attendanceRecords] = await Promise.all([
      prisma.employee.count({
        where: { managerId }
      }),
      prisma.attendance.groupBy({
        by: ['employeeId'],
        where: {
          employee: {
            managerId
          },
          createdAt: dateFilter,
          checkInTime: {
            not: null
          }
        }
      }),
      prisma.attendance.findMany({
        where: {
          employee: {
            managerId
          },
          createdAt: dateFilter
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);  const presentCount = presentEmployeesData.length;
    const absentCount = totalEmployees - presentCount;  res.json({
      total: totalEmployees,
      present: presentCount,
      absent: absentCount,
      attendanceRate: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0,
      records: attendanceRecords
    });
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance chart data for manager (Manager only)
router.get('/chart', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const filter = req.query.filter || 'week';
    const managerId = req.user.id;  let days = 7;
    switch (filter) {
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'threemonths':
        days = 90;
        break;
    }  const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);  const attendanceData = await prisma.attendance.groupBy({
      by: ['createdAt'],
      where: {
        employee: {
          managerId
        },
        createdAt: {
          gte: startDate
        },
        checkInTime: {
          not: null
        }
      },
      _count: {
        id: true
      }
    });  // Get unique employees per day for accurate counting using Prisma
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employee: {
          managerId
        },
        createdAt: {
          gte: startDate
        },
        checkInTime: {
          not: null
        }
      },
      select: {
        createdAt: true,
        employeeId: true
      }
    });  // Group by date and count unique employees
    const uniqueEmployeesPerDay = attendanceRecords.reduce((acc, record) => {
      const date = record.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = new Set();
      }
      acc[date].add(record.employeeId);
      return acc;
    }, {});  // Convert to array format
    const chartDataArray = Object.entries(uniqueEmployeesPerDay).map(([date, employeeSet]) => ({
      day: new Date(date),
      unique_count: employeeSet.size
    })).sort((a, b) => b.day - a.day);  // Get total employees count for absent calculation
    const totalEmployees = await prisma.employee.count({
      where: {
        managerId
      }
    });  // Format data for chart
    const chartData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);    const dayData = chartDataArray.find(d =>
        d.day.toDateString() === date.toDateString()
      );    const presentCount = dayData?.unique_count || 0;
      const absentCount = Math.max(0, totalEmployees - presentCount);    chartData.unshift({
        date: date.toISOString().split('T')[0],
        present: presentCount,
        absent: absentCount
      });
    }  res.json(chartData);
  } catch (error) {
    console.error('Error getting attendance chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employees with multiple check-in/out cycles (Manager only)
router.get('/multiple-cycles', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const filter = req.query.filter || 'today';
    const managerId = req.user.id;  let dateFilter = {};
    const now = new Date();  switch (filter) {
      case 'today':
        dateFilter = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // ����������� = 0, ����������� = 1
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { gte: weekStart };
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
    }  // Get employees with 2+ complete cycles in the specified period using Prisma
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employee: {
          managerId
        },
        createdAt: dateFilter,
        checkInTime: { not: null },
        checkOutTime: { not: null }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });  // Group by employee and filter those with multiple cycles
    const employeeGroups = attendanceRecords.reduce((acc, record) => {
      const empId = record.employeeId;
      if (!acc[empId]) {
        acc[empId] = {
          employee: record.employee,
          records: []
        };
      }
      acc[empId].records.push(record);
      return acc;
    }, {});  const employeesWithMultipleCycles = Object.values(employeeGroups)
      .filter(group => group.records.length >= 2)
      .map(group => ({
        id: group.employee.id,
        firstName: group.employee.firstName,
        lastName: group.employee.lastName,
        phone: group.employee.phone,
        cycle_count: group.records.length,
        first_checkin: group.records[group.records.length - 1].checkInTime,
        last_checkout: group.records[0].checkOutTime
      }))
      .sort((a, b) => b.cycle_count - a.cycle_count || a.firstName.localeCompare(b.firstName));  // Get detailed attendance records for these employees
    const detailedRecords = [];
    for (const employee of employeesWithMultipleCycles) {
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          createdAt: dateFilter,
          checkInTime: { not: null },
          checkOutTime: { not: null }
        },
        orderBy: { createdAt: 'asc' }
      });    detailedRecords.push({
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone
        },
        cycles: attendanceRecords.map(record => ({
          id: record.id,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          date: record.date
        })),
        totalCycles: employee.cycle_count
      });
    }  res.json(detailedRecords);
  } catch (error) {
    console.error('Error getting employees with multiple cycles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all attendance cycles for employees with multiple entries (Manager only)
router.get('/all-cycles', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    console.log(`\n[DEBUG] === ������ � ALL-CYCLES ===`);
    console.log(`[DEBUG] ������: ${req.query.filter || 'today'}`);
    console.log(`[DEBUG] Manager ID: ${req.user.id}`);  const filter = req.query.filter || 'today';
    const managerId = req.user.id;  let dateFilter = {};
    const now = new Date();  switch (filter) {
      case 'today':
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        dateFilter = { gte: todayStart };
        break;
      case 'week':
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // ����������� = 0, ����������� = 1
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { gte: weekStart };
        break;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - 1);
        dateFilter = { gte: monthStart };
        break;
      case 'threemonths':
        const threeMonthsStart = new Date(now);
        threeMonthsStart.setMonth(threeMonthsStart.getMonth() - 3);
        dateFilter = { gte: threeMonthsStart };
        break;
    }  // Get manager info to determine registration date
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      select: { createdAt: true, lastActivatedAt: true }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  // Use the later of registration date or last activation date as the start date
    const startDate = new Date(Math.max(
      new Date(manager.createdAt),
      manager.lastActivatedAt ? new Date(manager.lastActivatedAt) : new Date(manager.createdAt)
    ));
    startDate.setHours(0, 0, 0, 0);  // Get all attendance records for the period
    const allRecords = await prisma.attendance.findMany({
      where: {
        employee: {
          managerId: managerId
        },
        createdAt: dateFilter,
        checkInTime: { not: null }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: [
        { employee: { firstName: 'asc' } },
        { createdAt: 'desc' }
      ]
    });  // Group records by employee
    const groupedRecords = allRecords.reduce((acc, record) => {
      const employeeId = record.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: record.employee,
          records: []
        };
      }
      acc[employeeId].records.push(record);
      return acc;
    }, {});  // Get all employees for this manager
    const allEmployees = await prisma.employee.findMany({
      where: { managerId: managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });  // Generate complete date range from manager registration to today
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);  // Helper function to generate date range
    const generateDateRange = (start, end) => {
      const dates = [];
      const current = new Date(start);
      current.setHours(0, 0, 0, 0);    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };  const dateRange = generateDateRange(startDate, endDate);  // Process each employee
    const employeesWithCompleteHistory = allEmployees.map(employee => {
      const employeeRecords = groupedRecords[employee.id]?.records || [];    // Group actual attendance by date
      const attendanceByDate = {};
      employeeRecords.forEach(record => {
        // ���������� ������ � null checkInTime
        if (!record.checkInTime) return;      const dateKey = new Date(record.checkInTime).toDateString();
        if (!attendanceByDate[dateKey]) {
          attendanceByDate[dateKey] = [];
        }
        attendanceByDate[dateKey].push({
          id: record.id,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          date: record.date
        });
      });    // Generate complete history including missing days
      const completeCycles = [];
      const employeeStartDate = new Date(Math.max(
        startDate,
        new Date(employee.createdAt)
      ));
      employeeStartDate.setHours(0, 0, 0, 0);    const employeeDateRange = generateDateRange(employeeStartDate, endDate);    employeeDateRange.forEach(date => {
        const dateKey = date.toDateString();
        const dayRecords = attendanceByDate[dateKey] || [];      if (dayRecords.length > 0) {
          // ��������� ������ �� checkInTime (oldest first ��� ���������� ���������)
          dayRecords.sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));        // ������� ���������, �� ��������� ������ ���� �������
          const uniqueDayRecords = [];
          const seenTimes = new Map(); // ���������� Map ��� �������� ������ �����        console.log(`\n[DEBUG] ��������� ������� ��� ���� ${dateKey}:`);
          console.log(`[DEBUG] ����� �������: ${dayRecords.length}`);
          dayRecords.forEach((r, i) => {
            const status = r.checkOutTime ? '�����������' : '�������������';
            console.log(`[DEBUG] ${i + 1}. ID: ${r.id}, ������: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
          });        for (const record of dayRecords) {
            const timeKey = new Date(record.checkInTime).getTime();
            // ���������� ������ ����� ��� ���������� ��� ������� ����������� ����������
            const roundedTime = Math.floor(timeKey / 60000) * 60000; // ��������� �� �����          const recordType = record.checkOutTime !== null ? 'completed' : 'incomplete';          console.log(`[DEBUG] ��������� ������ ID: ${record.id}, �����: ${new Date(record.checkInTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}, ���: ${recordType}, �����������: ${new Date(roundedTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`);          if (!seenTimes.has(roundedTime)) {
              // ���� ��� ������� � ����� ��������, ������� Map ��� ������ �����
              seenTimes.set(roundedTime, new Map());
              console.log(`[DEBUG] ? ������ ����� ��������� ���� ��� ${new Date(roundedTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`);
            }          const timeSlot = seenTimes.get(roundedTime);          if (!timeSlot.has(recordType)) {
              // ���� ��� ������ ������ ����, ���������
              timeSlot.set(recordType, record);
              console.log(`[DEBUG] ? ��������� ������ ���� ${recordType} ��� ID: ${record.id}`);
            } else {
              // ���� ������ ������ ���� ��� ����, ���������� � �������� ������
              const existingRecord = timeSlot.get(recordType);            if (recordType === 'completed') {
                // ��� ����������� ������� �������� �� � ������� �������� checkout
                if (new Date(record.checkOutTime) > new Date(existingRecord.checkOutTime)) {
                  timeSlot.set(recordType, record);
                  console.log(`[DEBUG] ?? �������� ����������� ������ ID: ${existingRecord.id} > ${record.id}`);
                } else {
                  console.log(`[DEBUG] ??  ��������� ������������ ����������� ������ ID: ${existingRecord.id}`);
                }
              } else {
                // ��� ������������� ������� �������� �� � ������� �������� checkIn
                if (new Date(record.checkInTime) > new Date(existingRecord.checkInTime)) {
                  timeSlot.set(recordType, record);
                  console.log(`[DEBUG] ?? �������� ������������� ������ ID: ${existingRecord.id} > ${record.id}`);
                } else {
                  console.log(`[DEBUG] ??  ��������� ������������ ������������� ������ ID: ${existingRecord.id}`);
                }
              }
            }
          }        // �������� ���������� ������ - ��������� ������ ������ ��� ������� �������
          console.log(`\n[DEBUG] ���� ���������� ������� �� ${seenTimes.size} ��������� ������:`);
          for (const [time, timeSlot] of seenTimes) {
            const completed = timeSlot.get('completed');
            const incomplete = timeSlot.get('incomplete');          const timeStr = new Date(time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
            console.log(`[DEBUG] ��������� ���� ${timeStr}: �����������=${completed ? 'ID '+completed.id : '���'}, �������������=${incomplete ? 'ID '+incomplete.id : '���'}`);          if (completed && incomplete) {
              // ���� ���� ��� ����, �������� ����������� (��� ����� ������)
              uniqueDayRecords.push(completed);
              console.log(`[DEBUG] ? �������� ����������� ������ ID: ${completed.id} ��� ������� ${timeStr}`);
            } else if (completed) {
              uniqueDayRecords.push(completed);
              console.log(`[DEBUG] ? ��������� ����������� ������ ID: ${completed.id} ��� ������� ${timeStr}`);
            } else if (incomplete) {
              uniqueDayRecords.push(incomplete);
              console.log(`[DEBUG] ? ��������� ������������� ������ ID: ${incomplete.id} ��� ������� ${timeStr}`);
            }
          }        console.log(`\n[DEBUG] ���������� ������ ����� ��������� (${uniqueDayRecords.length}):`);
          uniqueDayRecords.forEach((r, i) => {
            const status = r.checkOutTime ? '�����������' : '�������������';
            console.log(`[DEBUG] ${i + 1}. ID: ${r.id}, ������: ${status}, In: ${r.checkInTime}, Out: ${r.checkOutTime || '-'}`);
          });        // �������������� ��������: ���� ���� ����������� � ������������� ������ � ���������� ��������,
          // � ������������� ���� ������� ����� �����������, ������� �������������
          const finalRecords = [];
          const processedTimes = new Set();        for (const record of uniqueDayRecords) {
            const timeKey = new Date(record.checkInTime).getTime();
            const roundedTime = Math.floor(timeKey / 1000) * 1000;          if (!processedTimes.has(roundedTime)) {
              processedTimes.add(roundedTime);            // ���������, ���� �� ������ ������ � ����� �� ��������
              const otherRecord = uniqueDayRecords.find(r => {
                if (r === record) return false;
                const otherTimeKey = new Date(r.checkInTime).getTime();
                const otherRoundedTime = Math.floor(otherTimeKey / 1000) * 1000;
                return otherRoundedTime === roundedTime;
              });            if (otherRecord) {
                // ���� ��� ������ � ���������� ��������
                const record1Completed = record.checkOutTime !== null;
                const record2Completed = otherRecord.checkOutTime !== null;              if (record1Completed && !record2Completed) {
                  // ������ �����������, ������ ��� - ��������� ������ �����������
                  finalRecords.push(record);
                } else if (!record1Completed && record2Completed) {
                  // ������ �������������, ������ ����������� - ���������� ������
                  continue;
                } else {
                  // ��� ������ ���� - ��������� ������ ������
                  finalRecords.push(record);
                }
              } else {
                // ��� ������ ������� � ����� �� ��������
                finalRecords.push(record);
              }
            }
          }        // �������������� ��������: ���������� ������ � ������������ ��������
          // � ������� ������ � ���������� �������� ������� � ����� (����� 5 ������)
          const filteredRecords = finalRecords.filter(record => {
            if (!record.checkInTime || !record.checkOutTime) {
              return true; // ��������� ������������� ������
            }          const checkInTime = new Date(record.checkInTime).getTime();
            const checkOutTime = new Date(record.checkOutTime).getTime();          // ���������, ��� checkout �� ������ checkin
            if (checkOutTime < checkInTime) {
              console.log('Filtering out record with checkout before checkin:', record.id);
              return false;
            }          const timeDiff = Math.abs(checkOutTime - checkInTime);          // ���� ������� ����� 5 ������, ������� ��� ������������ �������
            if (timeDiff < 5000) {
              console.log('Filtering out record with same checkin/checkout time:', record.id);
              return false;
            }          return true;
          });        completeCycles.push(...filteredRecords);
        } else {
          // Add a placeholder for missing day (no attendance)
          completeCycles.push({
            id: null,
            checkInTime: null,
            checkOutTime: null,
            date: new Date(date),
            isAbsent: true
          });
        }
      });    return {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone
        },
        cycles: completeCycles.sort((a, b) => {
          // ������� ��������� �� ���� (newest first - ����� ������)
          const dateCompare = new Date(b.date) - new Date(a.date);
          if (dateCompare !== 0) return dateCompare;        // ���� ���� ����������, ��������� �� checkInTime (newest first)
          if (a.checkInTime && b.checkInTime) {
            return new Date(b.checkInTime) - new Date(a.checkInTime);
          }        // ������ ��� checkInTime ���� ����� ������� � checkInTime
          if (!a.checkInTime) return 1;
          if (!b.checkInTime) return -1;        return 0;
        }),
        totalCycles: completeCycles.length
      };
    });  // Filter employees who have any records (including absences) in the filtered period
    const filteredEmployees = employeesWithCompleteHistory.filter(employee => {
      return employee.cycles.some(cycle => {
        const cycleDate = new Date(cycle.date);
        return cycleDate >= new Date(dateFilter.gte || new Date(0));
      });
    }).map(employee => {
      // Filter cycles to show only those within the date range
      const filteredCycles = employee.cycles.filter(cycle => {
        const cycleDate = new Date(cycle.date);
        return cycleDate >= new Date(dateFilter.gte || new Date(0));
      });    return {
        ...employee,
        cycles: filteredCycles,
        totalCycles: filteredCycles.length
      };
    });  res.json(filteredEmployees);
  } catch (error) {
    console.error('Error getting all cycles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current status for multi-cycle employees (Manager only)
router.get('/current-status', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(localToday);
    tomorrow.setDate(tomorrow.getDate() + 1);  // Get all employees for this manager
    const employees = await prisma.employee.findMany({
      where: { managerId: managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true
      },
      orderBy: { firstName: 'asc' }
    });  const currentStatuses = [];  for (const employee of employees) {
      // Get today's records for this employee
      const todayRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: localToday,
            lt: tomorrow
          },
          checkInTime: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });    let status = 'absent';
      let checkInTime = null;
      let checkOutTime = null;
      let totalCycles = 0;    if (todayRecords.length > 0) {
        // ������� ������ ������ � ��������� ����
        const sortedByCheckIn = [...todayRecords].sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));
        const firstCheckIn = sortedByCheckIn[0];      const recordsWithCheckOut = todayRecords.filter(r => r.checkOutTime);
        let lastCheckOut = null;
        if (recordsWithCheckOut.length > 0) {
          const sortedByCheckOut = [...recordsWithCheckOut].sort((a, b) => new Date(b.checkOutTime) - new Date(a.checkOutTime));
          lastCheckOut = sortedByCheckOut[0];
        }      checkInTime = firstCheckIn.checkInTime;
        checkOutTime = lastCheckOut ? lastCheckOut.checkOutTime : null;      // ��������� ������ �� ��������� ������
        const latestRecord = todayRecords[0];
        if (!latestRecord.checkOutTime) {
          status = 'checked_in';
        } else {
          status = 'completed';
        }      totalCycles = todayRecords.filter(r => r.checkInTime && r.checkOutTime).length;
      }    currentStatuses.push({
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone
        },
        status,
        checkInTime,
        checkOutTime,
        totalCycles
      });
    }  res.json(currentStatuses);
  } catch (error) {
    console.error('Error getting current status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current status for multi-cycle employees (shows only current record)
router.get('/current-record', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(localToday);
    tomorrow.setDate(tomorrow.getDate() + 1);  // Get all employees for this manager
    const employees = await prisma.employee.findMany({
      where: { managerId: managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true
      },
      orderBy: { firstName: 'asc' }
    });  const currentRecords = [];  for (const employee of employees) {
      // Get today's records for this employee
      const todayRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: localToday,
            lt: tomorrow
          },
          checkInTime: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });    if (todayRecords.length === 0) {
        continue; // Skip employees with no records today
      }    // Find the most recent record (either incomplete or latest complete)
      const latestRecord = todayRecords[0];    let status = 'completed';
      let checkInTime = latestRecord.checkInTime;
      let checkOutTime = latestRecord.checkOutTime;    if (!latestRecord.checkOutTime) {
        status = 'checked_in';
      }    currentRecords.push({
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone
        },
        status,
        checkInTime,
        checkOutTime,
        totalCycles: todayRecords.filter(r => r.checkInTime && r.checkOutTime).length
      });
    }  res.json(currentRecords);
  } catch (error) {
    console.error('Error getting current record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get aggregated data for all employees (first check-in, last check-out)
router.get('/aggregated-status', [
  authenticateToken,
  requireRole(['manager'])
], async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(localToday);
    tomorrow.setDate(tomorrow.getDate() + 1);  // Get all employees for this manager
    const employees = await prisma.employee.findMany({
      where: { managerId: managerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true
      },
      orderBy: { firstName: 'asc' }
    });  const aggregatedStatuses = [];  for (const employee of employees) {
      // Get today's records for this employee
      const todayRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: localToday,
            lt: tomorrow
          },
          checkInTime: { not: null }
        },
        orderBy: { createdAt: 'asc' }
      });    if (todayRecords.length === 0) {
        // Employee with no records
        aggregatedStatuses.push({
          employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone
          },
          status: 'absent',
          checkInTime: null,
          checkOutTime: null
        });
      } else {
        // Find first check-in and last check-out
        const sortedByCheckIn = [...todayRecords].sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));
        const firstCheckIn = sortedByCheckIn[0];      const recordsWithCheckOut = todayRecords.filter(r => r.checkOutTime);
        let lastCheckOut = null;
        if (recordsWithCheckOut.length > 0) {
          const sortedByCheckOut = [...recordsWithCheckOut].sort((a, b) => new Date(b.checkOutTime) - new Date(a.checkOutTime));
          lastCheckOut = sortedByCheckOut[0];
        }      const status = lastCheckOut ? 'completed' : 'checked_in';      aggregatedStatuses.push({
          employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone
          },
          status,
          checkInTime: firstCheckIn.checkInTime,
          checkOutTime: lastCheckOut ? lastCheckOut.checkOutTime : null
        });
      }
    }  res.json(aggregatedStatuses);
  } catch (error) {
    console.error('Error getting aggregated status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Perform attendance action (checkin/checkout)
router.post('/action', authenticateToken, async (req, res) => {
  try {
    const { employeeId, action, timestamp } = req.body;
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;  // ���������
    if (!employeeId || !action || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }  if (!['checkin', 'checkout'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be checkin or checkout' });
    }  // ��������� ����� �������
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      select: {
        id: true,
        userId: true,
        managerId: true,
        firstName: true,
        lastName: true
      }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // ��������� ����� �������
    const isOwner = employee.userId === requestingUserId;
    const isSuperAdmin = requestingUserRole === 'SUPER_ADMIN';
    const isManagerOfEmployee = requestingUserRole === 'MANAGER' && employee.managerId === req.user.managerId;  if (!isOwner && !isSuperAdmin && !isManagerOfEmployee) {
      return res.status(403).json({ error: 'Access denied' });
    }  // ��������� ��������� ������ ��� �������������� ������������
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId)
      },
      orderBy: {
        date: 'desc'
      },
      take: 1
    });  // �������� �� ������������
    if (lastAttendance) {
      let lastAction = 'unknown';    // ���������� ��������� �������� �� ������ checkInTime � checkOutTime
      if (lastAttendance.checkInTime && !lastAttendance.checkOutTime) {
        lastAction = 'checkin';
      } else if (lastAttendance.checkInTime && lastAttendance.checkOutTime) {
        lastAction = 'checkout';
      }    const lastTimestamp = new Date(lastAttendance.date);
      const currentTimestamp = new Date(timestamp);    // ���� �� �� ����� �������� � ������ ������ 1 ������, ������� ����������
      if (lastAction === action && (currentTimestamp - lastTimestamp) < 60000) {
        return res.status(400).json({
          error: 'Duplicate action detected',
          details: `�� ��� ��������� �������� "${action === 'checkin' ? '������' : '����'}" �������`
        });
      }    // ������ ��������� ���� � �� �� �������� ������ ������
      if (lastAction === action) {
        return res.status(400).json({
          details: `�� �� ������ ��������� "${action === 'checkin' ? '������' : '����'}" ������ ������`
        });
      }
    }  // ������� ������ ������������
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        date: new Date(timestamp),
        [action === 'checkin' ? 'checkInTime' : 'checkOutTime']: new Date(timestamp)
      }
    });  // ���������� ����������� ����� WebSocket
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('attendance_action', {
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
      message: `${action === 'checkin' ? '������' : '����'} ������� �������`
    });} catch (error) {
    console.error('Error performing attendance action:', error);
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
    if (decoded.employeeId !== parseInt(employeeId)) {
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
