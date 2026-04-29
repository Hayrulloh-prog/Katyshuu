const express = require('express');
require('express-async-errors'); // Catch async errors without using try/catch
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const managerRoutes = require('./routes/managers');
const employeeRoutes = require('./routes/employees');
const qrRoutes = require('./routes/qr');
const attendanceRoutes = require('./routes/attendance');
const oauthRoutes = require('./routes/oauth');
const eventsRoutes = require('./routes/events');

const app = express();
const prisma = new PrismaClient();

// Trust proxy for rate limiting when behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip preflight requests
});

// General limiter for regular users
const generalLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Увеличено для разработки
  'Too many requests from this IP, please try again later.'
);

// Auth limiter - higher limit for authentication endpoints
const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 login attempts per 15 minutes
  'Too many login attempts from this IP, please try again later.'
);

// Rate limiting - ОТКЛЮЧЕНО для разработки
// Чтобы включить раскомментируйте следующий блок:
// app.use('/api/', (req, res, next) => {
//   if (req.path === '/managers/toggle-device-check') {
//     return next();
//   }
//   generalLimiter(req, res, next);
// });
app.use('/api/', (req, res, next) => next()); // Пропускаем все запросы без ограничений

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/events', eventsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Auto-deactivate managers with expired tariffs (never deletes, only sets isActive=false)
async function deactivateExpiredManagers() {
  try {
    // Get all active managers with their tariff
    const activeManagers = await prisma.manager.findMany({
      where: { isActive: true },
      include: { tariff: true }
    });

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const expiredIds = [];
    for (const manager of activeManagers) {
      if (!manager.lastActivatedAt || !manager.tariff?.duration) continue;

      const expiryDate = new Date(manager.lastActivatedAt);
      expiryDate.setDate(expiryDate.getDate() + manager.tariff.duration);
      expiryDate.setHours(0, 0, 0, 0); // compare at day level

      if (expiryDate < todayMidnight) {
        expiredIds.push(manager.id);
      }
    }

    if (expiredIds.length > 0) {
      await prisma.manager.updateMany({
        where: { id: { in: expiredIds } },
        data: { isActive: false }
      });
      console.log(`⏰ Auto-deactivated ${expiredIds.length} manager(s) with expired tariff:`, expiredIds);
    } else {
      console.log('⏰ Tariff check: no expired managers found');
    }
  } catch (error) {
    console.error('❌ Error in deactivateExpiredManagers:', error);
  }
}

// Initialize database and start server
async function startServer() {
  try {
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');  // Run expired tariff check immediately on startup
    await deactivateExpiredManagers();  // Set up cron job to check for expired managers every hour (0 * * * *)
    cron.schedule('0 * * * *', () => {
      console.log('🔄 Running hourly check for expired managers...');
      deactivateExpiredManagers();
    });  app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Reset tariffs endpoint (for development only)
app.post('/api/reset-tariffs', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }
  try {  // Delete all existing tariffs
    await prisma.tariff.deleteMany({});  // Create new tariffs with all months
    const tariffs = [
      { name: 'Пробный', duration: 7, maxEmployees: 10, price: 0 },
      { name: '1 месяц', duration: 30, maxEmployees: 10, price: 1000 },
      { name: '2 месяца', duration: 60, maxEmployees: 10, price: 1800 },
      { name: '3 месяца', duration: 90, maxEmployees: 20, price: 2500 },
      { name: '4 месяца', duration: 120, maxEmployees: 25, price: 3200 },
      { name: '5 месяцев', duration: 150, maxEmployees: 25, price: 3800 },
      { name: '6 месяцев', duration: 180, maxEmployees: 30, price: 4500 },
      { name: '7 месяцев', duration: 210, maxEmployees: 35, price: 5200 },
      { name: '8 месяцев', duration: 240, maxEmployees: 35, price: 5800 },
      { name: '9 месяцев', duration: 270, maxEmployees: 40, price: 6500 },
      { name: '10 месяцев', duration: 300, maxEmployees: 40, price: 7200 },
      { name: '11 месяцев', duration: 330, maxEmployees: 45, price: 7800 },
      { name: '1 год', duration: 365, maxEmployees: 50, price: 9000 },
    ];  await prisma.tariff.createMany({ data: tariffs });  res.json({ success: true, message: 'Tariffs reset successfully', count: tariffs.length });
  } catch (error) {
    console.error('Error resetting tariffs:', error);
    res.status(500).json({ error: 'Failed to reset tariffs' });
  }
});

// Start server
startServer();

module.exports = app;
