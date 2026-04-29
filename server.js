const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./server/routes/auth');
const managerRoutes = require('./server/routes/managers');
const employeeRoutes = require('./server/routes/employees');
const qrRoutes = require('./server/routes/qr');
const attendanceRoutes = require('./server/routes/attendance');
const oauthRoutes = require('./server/routes/oauth');
const eventsRoutes = require('./server/routes/events');
const tariffsRoutes = require('./server/routes/tariffs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tariffs', tariffsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
