const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Generate QR tokens for managers
router.post('/generate-manager-tokens', async (req, res) => {
  try {
    const count = req.body.count || 100;  function generateRandomToken() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return token;
    }  const tokens = [];
    for (let i = 0; i < count; i++) {
      const token = generateRandomToken();
      const savedToken = await prisma.qrToken.create({
        data: {
          token,
          type: 'MANAGER_REG',
          isUsed: false,
          managerId: null
        }
      });
      tokens.push({
        id: savedToken.id,
        token: savedToken.token,
        url: `${process.env.QR_BASE_URL}/qr/${savedToken.token}`
      });
    }  res.json({
      success: true,
      generated: tokens.length,
      tokens: tokens.slice(0, 5), // Return first 5 for preview
      message: `${tokens.length} QR tokens generated successfully`
    });
  } catch (error) {
    console.error('Error generating QR tokens:', error);
    res.status(500).json({ error: 'Failed to generate QR tokens' });
  }
});

// Test endpoint to debug token issues
router.get('/test/:token', (req, res) => {
  const { token } = req.params;
  console.log('=== TEST ENDPOINT ===');
  console.log('Received token:', token);
  console.log('Token length:', token.length);
  console.log('Full URL:', req.originalUrl);
  console.log('===================');res.json({
    receivedToken: token,
    tokenLength: token.length,
    url: req.originalUrl,
    message: 'Token received successfully'
  });
});

// Get QR token info
router.get('/token/:token', async (req, res) => {
  try {
    const { token } = req.params;  // Find QR token
    const qrToken = await prisma.qrToken.findUnique({
      where: {
        token
      },
      include: {
        manager: true
      }
    });  if (!qrToken) {
      return res.status(404).json({ error: 'QR token not found' });
    }  res.json({
      id: qrToken.id,
      token: qrToken.token,
      type: qrToken.type,
      isUsed: qrToken.isUsed,
      createdAt: qrToken.createdAt,
      usedAt: qrToken.usedAt,
      manager: qrToken.manager
    });
  } catch (error) {
    console.error('QR token info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate QR token and get employee info
router.get('/scan/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log('=== QR SCAN DEBUG ===');
    console.log('Raw token from URL:', token);
    console.log('Token length:', token.length);
    console.log('Full URL:', req.originalUrl);
    console.log('===================');  // Find QR token (including used ones)
    const qrToken = await prisma.qrToken.findUnique({
      where: { token },
      include: { manager: true }
    });  console.log('Found QR token:', qrToken);  if (!qrToken) {
      console.log('QR token not found');
      return res.status(404).json({ error: 'QR token not found' });
    }  // Check if this is a manager registration token
    if (qrToken.type === 'MANAGER_REG') {
      console.log('This is a manager registration token');    // Первый скан - регистрация менеджера (если токен не используется)
      if (!qrToken.isUsed) {
        console.log('First scan - manager registration needed');
        return res.json({
          isFirstScan: true,
          isManagerRegistration: true,
          token: qrToken.token,
          managerId: qrToken.managerId
        });
      }    // Если токен помечен как использованный, но менеджер не привязан - токен деактивирован или поврежден
      if (!qrToken.managerId) {
        console.log('Token marked used but no manager assigned (inactive/deleted)');
        return res.status(403).json({ error: 'System inactive', isManagerDeleted: true });
      }    // Проверяем, есть ли у менеджера сотрудники
      const manager = await prisma.manager.findUnique({
        where: { id: qrToken.managerId },
        include: {
          employees: {
            where: { isActive: true }
          }
        }
      });    if (!manager) {
        return res.status(403).json({ error: 'System inactive', isManagerDeleted: true });
      }    if (!manager.isActive) {
        return res.status(403).json({ error: 'System inactive', isManagerInactive: true });
      }    console.log('Manager found:', manager);
      console.log('Employee count:', manager.employees.length);    // Если у менеджера нет сотрудников - это регистрация первого сотрудника
      if (manager.employees.length === 0) {
        console.log('Second scan - first employee registration');
        return res.json({
          isSecondScan: true,
          isEmployeeRegistration: true,
          token: qrToken.token,
          managerId: manager.id,
          manager: {
            id: manager.id,
            firstName: manager.firstName,
            lastName: manager.lastName
          }
        });
      }    // Если у менеджера есть сотрудники - это отметка посещаемости
      console.log('Attendance scan for existing employees');
      return res.json({
        isAttendanceScan: true,
        token: qrToken.token,
        managerId: manager.id,
        manager: {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName
        },
        employees: manager.employees
      });
    }  // For EMPLOYEE_REG tokens
    if (qrToken.type === 'EMPLOYEE_REG') {
      console.log('This is an employee registration/attendance token');
      console.log('Token isUsed:', qrToken.isUsed);    if (!qrToken.managerId) {
        return res.status(403).json({ error: 'System inactive', isManagerDeleted: true });
      }    // Получаем менеджера и его сотрудников
      const manager = await prisma.manager.findUnique({
        where: { id: qrToken.managerId },
        include: {
          employees: {
            where: { isActive: true }
          }
        }
      });    if (!manager) {
        return res.status(403).json({ error: 'System inactive', isManagerDeleted: true });
      }    if (!manager.isActive) {
        return res.status(403).json({ error: 'System inactive', isManagerInactive: true });
      }    // Если токен уже использован и у менеджера есть сотрудники - это отметка посещаемости
      if (qrToken.isUsed && manager.employees.length > 0) {
        console.log('Token is used and manager has employees - attendance scan');
        return res.json({
          isAttendanceScan: true,
          token: qrToken.token,
          managerId: manager.id,
          manager: {
            id: manager.id,
            firstName: manager.firstName,
            lastName: manager.lastName
          },
          employees: manager.employees
        });
      }    // Если токен не использован или у менеджера нет сотрудников - это регистрация
      console.log('Employee registration needed');
      return res.json({
        isSecondScan: true,
        isEmployeeRegistration: true,
        token: qrToken.token,
        managerId: manager.id,
        manager: {
          id: manager.id,
          firstName: manager.firstName,
          lastName: manager.lastName
        }
      });
    }} catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check for existing employee accounts when scanning different QR code
router.post('/check-employee-accounts', async (req, res) => {
  try {
    const { email, googleId, targetManagerId, token } = req.body;  console.log('=== CHECKING EMPLOYEE ACCOUNTS ===');
    console.log('Request body:', req.body);  if (!email && !googleId) {
      return res.status(400).json({ error: 'Email or Google ID is required' });
    }  // Ищем сотрудника по предоставленным данным
    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (googleId) whereConditions.push({ googleId });  const existingEmployees = await prisma.employee.findMany({
      where: {
        OR: whereConditions
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            login: true
          }
        }
      }
    });  console.log('Found existing employees:', existingEmployees.length);  if (existingEmployees.length === 0) {
      // Нет существующих аккаунтов - можно регистрировать нового
      return res.json({
        hasExistingAccounts: false,
        canRegister: true
      });
    }  // Проверяем, есть ли аккаунт у целевого менеджера
    const accountWithTargetManager = existingEmployees.find(emp => emp.managerId === targetManagerId);  if (accountWithTargetManager) {
      // Уже есть аккаунт у этого менеджера
      return res.json({
        hasExistingAccounts: true,
        hasAccountWithTargetManager: true,
        existingAccount: {
          employeeId: accountWithTargetManager.id,
          manager: accountWithTargetManager.manager,
          firstName: accountWithTargetManager.firstName,
          lastName: accountWithTargetManager.lastName
        },
        canRegister: false,
        message: 'У вас уже есть аккаунт у этого менеджера'
      });
    }  // Есть аккаунты у других менеджеров, но не у этого
    const otherManagers = existingEmployees.map(emp => ({
      employeeId: emp.id,
      manager: emp.manager,
      firstName: emp.firstName,
      lastName: emp.lastName
    }));  return res.json({
      hasExistingAccounts: true,
      hasAccountWithTargetManager: false,
      otherManagers,
      canRegister: true, // Можно регистрировать у нового менеджера
      message: 'Найдены аккаунты у других менеджеров. Вы можете создать новый аккаунт или выбрать существующий.'
    });} catch (error) {
    console.error('Error checking employee accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to handle attendance logic
async function handleAttendance(employee, res) {
  try {
    // Get the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);  const recentRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });  console.log('Recent records for employee:', recentRecords);  // Проверяем логические дубликаты без временной блокировки
    // Find most recent incomplete record (check-in without check-out)
    const incompleteRecord = recentRecords.find(record => {
      if (!record.checkInTime) return false;
      if (!record.checkOutTime) return true;    // Убираем проверку на разницу в 1 минуту - считаем все записи с checkOutTime завершенными
      return false;
    });  // Дополнительная проверка: отфильтровываем некорректные записи
    let filteredIncompleteRecord = incompleteRecord;
    if (incompleteRecord && incompleteRecord.checkOutTime) {
      const checkInTime = new Date(incompleteRecord.checkInTime).getTime();
      const checkOutTime = new Date(incompleteRecord.checkOutTime).getTime();    // Проверяем, что checkout не раньше checkin
      if (checkOutTime < checkInTime) {
        console.log('Filtering incomplete record with checkout before checkin:', incompleteRecord.id);
        filteredIncompleteRecord = null;
      }    // Проверяем, что разница не менее 5 секунд
      const timeDiff = Math.abs(checkOutTime - checkInTime);
      if (timeDiff < 5000) {
        console.log('Filtering incomplete record with same checkin/checkout time:', incompleteRecord.id);
        filteredIncompleteRecord = null;
      }
    }  console.log('Incomplete record found:', incompleteRecord);
    console.log('Filtered incomplete record:', filteredIncompleteRecord);  res.json({
      employee,
      todayRecord: filteredIncompleteRecord,
      recentRecords
    });
  } catch (error) {
    console.error('Attendance handling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get all QR tokens for admin panel
router.get('/tokens/all', async (req, res) => {
  try {
    const tokens = await prisma.qrToken.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            login: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });  res.json(tokens);
  } catch (error) {
    console.error('Error fetching QR tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download all QR codes as SVG
router.post('/download-all', async (req, res) => {
  try {
    console.log('=== DOWNLOAD ALL QR CODES ===');
    // Generate and save 100 manager registration QR codes to database
    const qrTokens = [];
    for (let i = 0; i < 100; i++) {
      const token = generateRandomToken();    // Save to database
      const savedToken = await prisma.qrToken.create({
        data: {
          token,
          type: 'MANAGER_REG',
          isUsed: false,
          managerId: null // Will be set when manager registers
        }
      });
      qrTokens.push({
        id: savedToken.id,
        token: savedToken.token,
        type: savedToken.type,
        isUsed: savedToken.isUsed,
        manager: {
          firstName: 'Manager',
          lastName: `Registration ${i + 1}`,
          login: `manager${i + 1}@company.com`
        }
      });
    }
    console.log(`Generated and saved ${qrTokens.length} manager registration QR codes to database`);
    // Generate SVG content without container constraints
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2000mm" height="2000mm" viewBox="0 0 2000 2000">
`;  // Generate QR codes in grid layout (10x10) with larger spacing
    const qrSize = 40; // QR code size in mm
    const spacing = 50; // Larger spacing between QR codes in mm
    const startX = 20; // Start X position in mm
    const startY = 20; // Start Y position in mm
    const cols = 10; // Number of columns
    qrTokens.forEach((qr, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      const qrUrl = `${process.env.QR_BASE_URL}/qr/${qr.token}`;
      svgContent += `
  <!-- QR Code ${index + 1} -->
  <g transform="translate(${x}, ${y})">
    <!-- Background -->
    <rect x="0" y="0" width="${qrSize}" height="${qrSize}" fill="white" stroke="black" stroke-width="1" rx="2"/>
    <!-- QR Code Image -->
    <image x="${qrSize/2 - 18}" y="${qrSize/2 - 18}" width="36" height="36"
           xlink:href="https://api.qrserver.com/v1/create-qr-code/?size=180x180&amp;data=${encodeURIComponent(qrUrl)}"/>
  </g>
`;
    });
    svgContent += `
</svg>`;
    console.log('Generated SVG for manager QR codes download');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="manager_qr_codes_${Date.now()}.svg"`);
    res.send(svgContent);
  } catch (error) {
    console.error('Error downloading QR codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate QR token for employee
router.post('/generate', [
  body('employeeId').isInt().withMessage('Employee ID must be an integer'),
  body('expiresInHours').optional().isInt({ min: 1, max: 24 }).withMessage('Expires in must be between 1 and 24 hours')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { employeeId, expiresInHours = 8 } = req.body;  // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });  if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }  // Generate unique token
    const token = generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);  // Create QR token
    const qrToken = await prisma.qrToken.create({
      data: {
        token,
        managerId: employee.managerId,
        type: 'EMPLOYEE_REG', // or appropriate type
        isUsed: false
      }
    });  res.json({
      token: qrToken.token,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName
      }
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate QR token
router.post('/deactivate/:token', async (req, res) => {
  try {
    const { token } = req.params;  const qrToken = await prisma.qrToken.updateMany({
      where: { token },
      data: { isUsed: true }
    });  if (qrToken.count === 0) {
      return res.status(404).json({ error: 'QR token not found' });
    }  res.json({ message: 'QR token marked as used successfully' });
  } catch (error) {
    console.error('QR deactivation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate new QR token for employee registration
router.post('/generate-employee-token', [
  body('managerId').isInt().withMessage('Manager ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }  const { managerId } = req.body;  // Check if manager exists
    const manager = await prisma.manager.findUnique({
      where: { id: managerId }
    });  if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }  // Generate unique token
    const token = generateRandomToken();  // Create QR token for employee registration
    const qrToken = await prisma.qrToken.create({
      data: {
        token,
        managerId,
        type: 'EMPLOYEE_REG',
        isUsed: false
      }
    });  console.log('Generated new employee registration token:', qrToken.token);  res.json({
      token: qrToken.token,
      manager: {
        id: manager.id,
        firstName: manager.firstName,
        lastName: manager.lastName
      }
    });
  } catch (error) {
    console.error('Error generating employee registration token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate random token
function generateRandomToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

module.exports = router;
