const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const geoip = require('geoip-lite');
const { v4: uuidv4 } = require('uuid');
const eventManager = require('../middleware/events');
const { google } = require('googleapis');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// Google OAuth конфигурация
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/oauth/callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Генерация URL для Google OAuth
router.get('/google', async (req, res) => {
  try {
    const { token } = req.query;  console.log('Generating OAuth URL with token:', token);  const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];  // Создаем state с QR токеном если он есть
    const stateData = {
      random: crypto.randomBytes(16).toString('hex'),
      ...(token && { qrToken: token })
    };
    const state = JSON.stringify(stateData);  const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent'
    });  console.log('Generated OAuth URL with state:', state);
    res.json({ authUrl: url });
  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate Google OAuth URL' });
  }
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    console.log('=== Google OAuth Callback ===');
    console.log('Query params:', req.query);
    console.log('Full URL:', req.originalUrl);  const { code, state } = req.query;  if (!code) {
      console.log('No authorization code received');
      return res.status(400).json({ error: 'Authorization code is required' });
    }  console.log('Authorization code received, exchanging for token...');  // Обмениваем код на токен
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);  console.log('Tokens received, getting user info...');  // Получаем информацию о пользователе
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();  console.log('User info received:', userInfo.email);
    console.log('Full user info object:', userInfo);  const { email, name, picture, sub: googleId } = userInfo;
    console.log('Extracted googleId:', googleId);  // Если googleId не пришел в sub, попробуем использовать id
    const finalGoogleId = googleId || userInfo.id || `google_${email}`;
    console.log('Final googleId to use:', finalGoogleId);  // Сначала проверяем QR токен из state или localStorage
    let targetManagerId = null;
    let qrToken = null;  if (state) {
      console.log('Checking state for QR token info');
      // state может содержать QR токен или другую информацию
      try {
        const stateData = JSON.parse(state);
        console.log('State data:', stateData);      if (stateData.qrToken) {
          qrToken = await prisma.qrToken.findUnique({
            where: { token: stateData.qrToken },
            include: { manager: true }
          });        console.log('QR token found:', qrToken);        if (qrToken && qrToken.manager && qrToken.manager.isActive) {
            targetManagerId = qrToken.manager.id;
            console.log('Found target manager from state:', qrToken.manager.email || qrToken.manager.login, 'ID:', targetManagerId);
          }
        }
      } catch (e) {
        console.log('State is not JSON or does not contain QR token:', e.message);
      }
    }  // Используем check-accounts логику для определения дальнейших действий
    if (targetManagerId) {
      console.log('Checking employee accounts for manager:', targetManagerId);    // Ищем всех сотрудников с этим email/googleId
      const whereConditions = [];
      if (email) whereConditions.push({ email });
      if (finalGoogleId) whereConditions.push({ googleId: finalGoogleId });    const existingEmployees = await prisma.employee.findMany({
        where: {
          OR: whereConditions,
          isActive: true
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              login: true
            }
          }
        }
      });    console.log('Found existing employees:', existingEmployees.length);    // Проверяем, есть ли аккаунт у целевого менеджера
      const accountWithTargetManager = existingEmployees.find(emp => emp.managerId === targetManagerId);    if (accountWithTargetManager) {
        // Есть аккаунт у этого менеджера - используем его
        console.log('Found account with target manager, using it');
        employee = accountWithTargetManager;
      } else {
        // Нет аккаунта у этого менеджера - проверяем лимит
        const manager = await prisma.manager.findUnique({
          where: { id: targetManagerId },
          select: { id: true, maxEmployees: true, isActive: true }
        });      if (!manager || !manager.isActive) {
          return res.status(400).json({ error: 'Manager not found or inactive' });
        }      const currentEmployeeCount = await prisma.employee.count({
          where: { managerId: targetManagerId, isActive: true }
        });      console.log('Employee count check for OAuth:', { currentCount: currentEmployeeCount, maxLimit: manager.maxEmployees });      if (currentEmployeeCount >= manager.maxEmployees) {
          return res.status(400).json({
            error: `Достигнут лимит сотрудников (${manager.maxEmployees}).`,
            errorType: 'EMPLOYEE_LIMIT_REACHED',
            maxEmployees: manager.maxEmployees,
            currentEmployees: currentEmployeeCount
          });
        }      // Есть аккаунты у других менеджеров, но не у этого - автоматически создаем новый
        const otherManagers = existingEmployees
          .filter(emp => emp.managerId !== targetManagerId)
          .map(emp => ({
            employeeId: emp.id,
            manager: emp.manager,
            firstName: emp.firstName,
            lastName: emp.lastName
          }));      console.log('Found accounts with other managers, auto-creating new account');      // Автоматически создаем новый аккаунт без выбора
        console.log('About to return registration data for OAuth');
        return res.json({
          needsRegistration: true,
          userData: {
            googleId: finalGoogleId,
            email,
            firstName: name?.split(' ')[0] || '',
            lastName: name?.split(' ')[1] || '',
            picture,
            provider: 'google'
          },
          message: 'Создание нового аккаунта для этого менеджера.'
        });
      }
    } else {
      // Если нет targetManagerId, ищем глобально (старая логика)
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { googleId: finalGoogleId },
            { email }
          ]
        }
      });
    }  // Если сотрудник не найден (это возможно только если нет targetManagerId)
    if (!employee) {
      console.log('Employee not found, returning registration data with googleId:', finalGoogleId);
      return res.json({
        needsRegistration: true,
        userData: {
          googleId: finalGoogleId,
          email,
          firstName: name?.split(' ')[0] || '',
          lastName: name?.split(' ')[1] || '',
          picture,
          provider: 'google'
        }
      });
    }  // Обновляем данные если нужно
    if (!employee.googleId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { googleId }
      });
    }  // Для новой логики не обрабатываем приход/уход здесь - просто авторизуем
    // Позволяем пользователю выбрать действие на странице AttendanceActionPage  // Создаем токен сессии
    const sessionToken = jwt.sign(
      {
        id: employee.id,
        role: 'employee',
        email: employee.email,
        provider: 'google'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );  res.json({
      success: true,
      employee: {
        id: employee.id,
        userId: employee.userId, // Добавляем userId для совместимости
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        googleId: employee.googleId
      },
      token: sessionToken
    });} catch (error) {
    console.error('Google OAuth callback error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });  // Если это ошибка лимита сотрудников, передаем ее дальше
    if (error.message && error.message.includes('лимит')) {
      return res.status(400).json({
        error: error.message,
        errorType: 'EMPLOYEE_LIMIT_REACHED'
      });
    }  res.status(500).json({
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Автоматическая аутентификация (для повторных сканирований)
router.post('/auto-auth', async (req, res) => {
  try {
    const { provider, email, googleId: finalGoogleId, token } = req.body;  if (!provider || !email) {
      return res.status(400).json({ error: 'Provider and email are required' });
    }  console.log('=== Auto Auth Request ===');
    console.log('Request body:', req.body);
    console.log('Token from request:', token);  // Ищем сотрудника
    let employee;  // Сначала ищем по токену, чтобы определить правильного менеджера
    let targetManagerId = null;
    if (token) {
      console.log('Searching for QR token:', token);
      const qrToken = await prisma.qrToken.findUnique({
        where: { token: token },
        include: { manager: true }
      });    console.log('QR token found:', qrToken);    if (qrToken && qrToken.manager && qrToken.manager.isActive) {
        targetManagerId = qrToken.manager.id;
        console.log('Found target manager by QR token:', qrToken.manager.email || qrToken.manager.login, 'ID:', targetManagerId);
      } else {
        console.log('QR token not found or manager inactive, falling back to first active manager');
      }
    } else {
      console.log('No token provided in request');
    }  if (provider === 'google') {
      if (finalGoogleId) {
        console.log('Searching for employee by googleId:', finalGoogleId);
        // Ищем по googleId
        employee = await prisma.employee.findFirst({
          where: {
            googleId: finalGoogleId,
            ...(targetManagerId && { managerId: targetManagerId })
          }
        });
        console.log('Found employee by googleId:', employee);
      } else {
        console.log('No googleId provided, searching by email with manager filter');
        // Ищем по email с фильтром по менеджеру
        employee = await prisma.employee.findFirst({
          where: {
            email: email,
            ...(targetManagerId && { managerId: targetManagerId })
          }
        });
        console.log('Found employee by email:', employee);
      }
    }  if (!employee) {
      console.log('Employee not found for:', { provider, email, googleId });
      return res.status(404).json({ error: 'Employee not found' });
    }  console.log('Employee found:', employee.id);  // Проверяем, что сотрудник пытается войти под правильным менеджером
    if (targetManagerId && employee.managerId !== targetManagerId) {
      console.log('Employee trying to authenticate under different manager');
      console.log('Employee manager:', employee.managerId, 'QR token manager:', targetManagerId);    // Ищем сотрудника с тем же email/googleId у нужного менеджера
      let employeeUnderTargetManager = null;    if (provider === 'google' && finalGoogleId) {
        employeeUnderTargetManager = await prisma.employee.findFirst({
          where: {
            googleId: finalGoogleId,
            managerId: targetManagerId
          }
        });
      } else {
        employeeUnderTargetManager = await prisma.employee.findFirst({
          where: {
            email: email,
            managerId: targetManagerId
          }
        });
      }    console.log('Employee under target manager:', employeeUnderTargetManager);    if (employeeUnderTargetManager) {
        // Нашли сотрудника у нужного менеджера - используем его
        console.log('Found employee under target manager, using this record');
        employee = employeeUnderTargetManager;
      } else {
        // Сотрудник не работает у этого менеджера - предлагаем зарегистрироваться
        console.log('Employee not found under target manager, needs registration');
        return res.status(404).json({
          error: 'Сотрудник не найден у этого менеджера. Пожалуйста, пройдите регистрацию.',
          errorType: 'EMPLOYEE_NOT_REGISTERED_UNDER_MANAGER',
          id: employee.id,
          employeeManagerId: employee.managerId,
          requestedManagerId: targetManagerId,
          needsRegistration: true
        });
      }
    }  console.log('Employee found:', employee.id, 'Manager:', employee.managerId);  // Обновляем googleId если он отсутствует (для обратной совместимости)
    if (provider === 'google' && finalGoogleId && !employee.googleId) {
      console.log('Updating employee googleId:', finalGoogleId);
      await prisma.employee.update({
        where: { id: employee.id },
        data: { googleId: finalGoogleId }
      });
      console.log('Employee googleId updated');
    }  // НЕ обрабатываем приход/уход автоматически - даем пользователю выбрать действие
    console.log('Auto-auth successful, redirecting to action selection');  // Создаем токен сессии
    const sessionToken = jwt.sign(
      {
        id: employee.id,
        role: 'employee',
        email: employee.email,
        provider
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );  res.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        googleId: employee.googleId // Добавляем googleId в ответ
      },
      token: sessionToken,
      redirectToAction: true // Флаг, что нужно перейти к выбору действия
    });} catch (error) {
    console.error('Auto auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Проверка существующих аккаунтов сотрудника
router.post('/check-accounts', async (req, res) => {
  try {
    const { email, googleId: finalGoogleId, targetManagerId, token } = req.body;  console.log('=== CHECKING EMPLOYEE ACCOUNTS ===');
    console.log('Request body:', req.body);  if (!email && !finalGoogleId) {
      return res.status(400).json({ error: 'Email or Google ID is required' });
    }  // Ищем сотрудника по предоставленным данным
    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (finalGoogleId) whereConditions.push({ googleId: finalGoogleId });  const existingEmployees = await prisma.employee.findMany({
      where: {
        OR: whereConditions,
        isActive: true
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
    const otherManagers = existingEmployees
      .filter(emp => emp.managerId !== targetManagerId)
      .map(emp => ({
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

// Регистрация нового сотрудника
router.post('/register', async (req, res) => {
  try {  const {
      googleId: finalGoogleId,
      email,
      firstName,
      lastName,
      phone,
      department,
      position,
      provider,
      token, // Добавляем токен из запроса
      managerId, // Добавляем managerId из запроса
      deviceModel // Модель устройства для проверки
    } = req.body;  if (!email || !firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'Missing required fields: email, firstName, lastName, phone' });
    }  console.log('=== REGISTRATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Looking for manager with token:', token);
    console.log('Required fields check:');
    console.log('- email:', !!email, email);
    console.log('- firstName:', !!firstName, firstName);
    console.log('- lastName:', !!lastName, lastName);
    console.log('- phone:', !!phone, phone);  if (!email || !firstName || !lastName || !phone) {
      console.log('Missing required fields detected');
      return res.status(400).json({
        error: 'Missing required fields: email, firstName, lastName, phone',
        details: {
          email: !!email,
          firstName: !!firstName,
          lastName: !!lastName,
          phone: !!phone
        }
      });
    }  let manager;  // Сначала пробуем использовать переданный managerId
    if (managerId) {
      console.log('Using provided managerId:', managerId);
      manager = await prisma.manager.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          login: true,
          isActive: true,
          maxEmployees: true
        }
      });    if (manager && manager.isActive) {
        console.log('Found manager by provided ID:', manager);
      } else {
        console.log('Manager by provided ID not found or inactive, falling back to token');
        manager = null;
      }
    }  // Если manager не найден по ID, ищем по токену
    if (!manager && token) {
      console.log('Searching for QR token:', token);
      const qrToken = await prisma.qrToken.findUnique({
        where: { token },
        include: { manager: true }
      });    console.log('QR token found:', qrToken);
      console.log('QR token managerId:', qrToken?.managerId);
      console.log('QR token manager:', qrToken?.manager);    if (qrToken && qrToken.manager && qrToken.manager.isActive) {
        manager = qrToken.manager;
        console.log('Found manager by QR token:', manager.login || manager.email, 'ID:', manager.id);
      } else {
        console.log('QR token not found or manager inactive');
        console.log('qrToken exists:', !!qrToken);
        console.log('qrToken.manager exists:', !!qrToken?.manager);
        console.log('qrToken.manager.isActive:', qrToken?.manager?.isActive);
      }
    }  // Если не нашли по токену, возвращаем ошибку
    if (!manager) {
      console.log('No manager found by token, returning error');
      return res.status(400).json({
        error: 'QR код не привязан к менеджеру. Пожалуйста, используйте QR код вашего менеджера.',
        errorType: 'NO_MANAGER_FOR_TOKEN'
      });
    }  // Проверяем лимит сотрудников у менеджера
    const currentEmployeeCount = await prisma.employee.count({
      where: { managerId: manager.id }
    });  console.log('Current employee count for manager:', currentEmployeeCount);
    console.log('Manager max employees limit:', manager.maxEmployees);  if (currentEmployeeCount >= manager.maxEmployees) {
      return res.status(400).json({
        error: `Достигнут лимит сотрудников (${manager.maxEmployees}).`,
        errorType: 'EMPLOYEE_LIMIT_REACHED',
        maxEmployees: manager.maxEmployees,
        currentEmployees: currentEmployeeCount
      });
    }  // Проверяем существующего сотрудника с таким email глобально
    const whereConditions = [{ email }];
    if (finalGoogleId) whereConditions.push({ googleId: finalGoogleId });  console.log('Searching for existing employee with conditions:', whereConditions);  const existingEmployeeGlobal = await prisma.employee.findFirst({
      where: {
        OR: whereConditions
      }
    });  console.log('Checking existing employee globally:', existingEmployeeGlobal);  // Дополнительная проверка по login (так как login тоже уникальный)
    const existingByLogin = await prisma.employee.findFirst({
      where: {
        login: email
      }
    });  console.log('Checking existing employee by login:', existingByLogin);  // Ищем всех сотрудников с таким email для детальной отладки
    const allEmployeesWithEmail = await prisma.employee.findMany({
      where: {
        email: email
      }
    });  console.log('All employees with this email:', allEmployeesWithEmail);  // Ищем всех сотрудников с таким login
    const allEmployeesWithLogin = await prisma.employee.findMany({
      where: {
        login: email
      }
    });  console.log('All employees with this login:', allEmployeesWithLogin);  // Проверка по номеру телефона (самое важное!)
    const existingByPhone = await prisma.employee.findFirst({
      where: {
        phone: phone
      }
    });  console.log('Checking existing employee by phone:', existingByPhone);  const existingEmployee = existingEmployeeGlobal || existingByLogin || existingByPhone;  if (existingEmployee) {
      if (existingEmployee.managerId === manager.id) {
        console.log('Employee already exists with this manager, returning error');
        return res.status(400).json({
          error: 'Сотрудник с такими данными уже зарегистрирован у этого менеджера',
          errorType: 'EMPLOYEE_EXISTS_WITH_MANAGER'
        });
      } else {
        console.log('Employee exists with another manager, allowing registration for multi-manager work');
        // Разрешаем регистрацию - сотрудник может работать у нескольких менеджеров
        // Но предупредим пользователя о существующей записи
        console.log('Allowing registration for multi-manager employment');
        // Продолжаем регистрацию без ошибки
      }
    }  // Создаем нового сотрудника
    console.log('Creating new employee with data:', {
      googleId: finalGoogleId,
      email,
      firstName,
      lastName,
      phone,
      department,
      position,
      provider
    });  try {
      const employee = await prisma.employee.create({
        data: {
          googleId: finalGoogleId,
          email,
          firstName,
          lastName,
          phone,
          department,
          position,
          login: email, // Используем email как login
          password: '', // Пустой пароль для OAuth пользователей
          managerId: manager.id,
          isActive: true,
          deviceModel: deviceModel || null // Сохраняем модель устройства
        }
      });    console.log('Created employee:', employee);    // Уведомляем о регистрации нового сотрудника
      eventManager.notifyEmployeeRegistered(employee, manager.id);  // НЕ создаем автоматическую запись о приходе - сотрудник сам выберет действие
    console.log('Employee registered successfully, no automatic check-in created');  // Создаем токен сессии
    const sessionToken = jwt.sign(
      {
        id: employee.id,
        role: 'employee',
        email: employee.email,
        provider
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );  res.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email
      },
      token: sessionToken
    });} catch (createError) {
    console.error('Employee creation error details:', createError.message);
    console.error('Full error:', createError);
    console.error('Error code:', createError.code);
    console.error('Error meta:', createError.meta);  // Если это ошибка уникального constraint, покажем более детальную информацию
    if (createError.code === 'P2002') {
      console.log('Unique constraint violation detected');
      console.log('Target field:', createError.meta?.target);    // Попробуем найти существующего сотрудника еще раз с расширенным поиском
      const allExistingEmployees = await prisma.employee.findMany({
        where: {
          OR: [
            { email },
            { login: email },
            { phone: phone },
            ...(googleId ? [{ googleId }] : [])
          ]
        }
      });    console.log('All existing employees with conflicting data:', allExistingEmployees);    // Проверим каждое поле отдельно
      const emailConflict = allExistingEmployees.filter(emp => emp.email === email);
      const loginConflict = allExistingEmployees.filter(emp => emp.login === email);
      const phoneConflict = allExistingEmployees.filter(emp => emp.phone === phone);    console.log('Email conflicts:', emailConflict);
      console.log('Login conflicts:', loginConflict);
      console.log('Phone conflicts:', phoneConflict);    let conflictMessage = 'Сотрудник с такими данными уже существует. Конфликтующие поля:\n';
      if (emailConflict.length > 0) conflictMessage += `- Email: ${email}\n`;
      if (loginConflict.length > 0) conflictMessage += `- Login: ${email}\n`;
      if (phoneConflict.length > 0) conflictMessage += `- Телефон: ${phone}\n`;    return res.status(400).json({
        error: conflictMessage,
        errorType: 'EMPLOYEE_ALREADY_EXISTS',
        details: allExistingEmployees.map(emp => ({
          email: emp.email,
          login: emp.login,
          phone: emp.phone,
          managerId: emp.managerId,
          firstName: emp.firstName,
          lastName: emp.lastName
        }))
      });
    }  throw createError; // Передаем ошибку дальше в общий catch блок
  }} catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// Обработка прихода/ухода
async function handleAttendance(employeeId, action = 'auto') {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);// Всегда создаем новую запись для любого действия
  const newRecord = await prisma.attendance.create({
    data: {
      employeeId,
      date: now,
      checkInTime: now,
      checkOutTime: action === 'checkout' ? now : null
    }
  });// Создаем запись в истории
  await prisma.attendanceHistory.create({
    data: {
      employeeId,
      checkInTime: now,
      checkOutTime: action === 'checkout' ? now : null,
      date: today,
      ipAddress: newRecord.ipAddress,
      userAgent: newRecord.userAgent,
      locationLatitude: newRecord.locationLatitude,
      locationLongitude: newRecord.locationLongitude
    }
  });return { type: action, record: newRecord };
}

// ...
router.get('/attendance-history/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 50 } = req.query;  const history = await prisma.attendanceHistory.findMany({
      where: { employeeId: parseInt(employeeId) },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });  const total = await prisma.attendanceHistory.count({
      where: { employeeId: parseInt(employeeId) }
    });  res.json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// Присоединение существующего сотрудника к новому менеджеру
router.post('/join-manager', async (req, res) => {
  try {
    const { employeeId, newManagerId, token } = req.body;  console.log('=== JOIN MANAGER REQUEST ===');
    console.log('Request body:', { employeeId, newManagerId, token });  // Проверяем валидность QR токена
    const qrToken = await prisma.qrToken.findUnique({
      where: { token },
      include: { manager: true }
    });  if (!qrToken || qrToken.isUsed) {
      return res.status(400).json({
        error: 'Недействительный QR токен',
        errorType: 'INVALID_TOKEN'
      });
    }  if (qrToken.managerId !== parseInt(newManagerId)) {
      return res.status(400).json({
        error: 'QR токен не соответствует указанному менеджеру',
        errorType: 'TOKEN_MANAGER_MISMATCH'
      });
    }  // Проверяем существующего сотрудника
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });  if (!employee) {
      return res.status(404).json({
        error: 'Сотрудник не найден',
        errorType: 'EMPLOYEE_NOT_FOUND'
      });
    }  // Проверяем лимит сотрудников у нового менеджера
    const currentEmployeeCount = await prisma.employee.count({
      where: { managerId: parseInt(newManagerId) }
    });  const newManager = await prisma.manager.findUnique({
      where: { id: parseInt(newManagerId) }
    });  if (currentEmployeeCount >= newManager.maxEmployees) {
      return res.status(400).json({
        error: `Достигнут лимит сотрудников (${newManager.maxEmployees})`,
        errorType: 'EMPLOYEE_LIMIT_REACHED'
      });
    }  // Обновляем менеджера сотруднику
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        managerId: parseInt(newManagerId),
        isActive: true
      }
    });  console.log('Employee joined new manager:', updatedEmployee);  // Обрабатываем первый приход
    const result = await handleAttendance(employeeId);  // Создаем токен сессии
    const sessionToken = jwt.sign(
      {
        employeeId: updatedEmployee.id,
        email: updatedEmployee.email,
        provider: updatedEmployee.provider || 'google'
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );  res.json({
      success: true,
      employee: {
        id: updatedEmployee.id,
        firstName: updatedEmployee.firstName,
        lastName: updatedEmployee.lastName,
        email: updatedEmployee.email
      },
      action: result.action,
      time: result.time,
      token: sessionToken
    });} catch (error) {
    console.error('Join manager error:', error);
    res.status(500).json({
      error: 'Failed to join manager',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

module.exports = router;
