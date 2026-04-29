const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];console.log('Auth middleware - Token received:', token ? 'YES' : 'NO');
  console.log('Auth middleware - Auth header:', authHeader);if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', decoded);  // Check if user exists and is active
    let user;
    if (decoded.role === 'superAdmin') {
      // Super admin doesn't need database check
      user = { id: 'super-admin', isActive: true };
    } else if (decoded.role === 'manager') {
      console.log('Auth middleware - Checking manager with ID:', decoded.id);
      user = await prisma.manager.findUnique({
        where: { id: parseInt(decoded.id) }
      });
      console.log('Auth middleware - Manager found:', user ? 'YES' : 'NO');
      console.log('Auth middleware - Manager isActive:', user?.isActive);
    } else if (decoded.role === 'employee') {
      user = await prisma.employee.findUnique({
        where: { id: parseInt(decoded.id) }
      });
    } else if (decoded.provider === 'google' && decoded.employeeId) {
      // Handle OAuth tokens for managers
      console.log('Auth middleware - OAuth token detected for manager, employeeId:', decoded.employeeId);
      user = await prisma.manager.findUnique({
        where: { id: parseInt(decoded.employeeId) }
      });
      console.log('Auth middleware - OAuth Manager found:', user ? 'YES' : 'NO');
      console.log('Auth middleware - OAuth Manager isActive:', user?.isActive);
    }  if (!user) {
      console.log('Auth middleware - User not found');
      return res.status(401).json({ error: 'User not found' });
    }  if (user.isActive === false) {
      console.log('Auth middleware - Account deactivated');
      return res.status(401).json({ error: 'The account is not activated' });
    }  // Set user object with correct ID field
    req.user = {
      id: decoded.id || decoded.employeeId, // Handle both regular and OAuth tokens
      role: decoded.role || 'manager', // Default to manager for OAuth
      login: decoded.login,
      ...user
    };  console.log('Auth middleware - Authentication successful');
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('=== requireRole Debug ===');
    console.log('req.user:', req.user);
    console.log('requiredRoles:', roles);  if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ error: 'Authentication required' });
    }  // Normalize roles - handle both camelCase and UPPER_CASE
    const normalizedUserRole = req.user.role.toUpperCase();
    const normalizedRoles = roles.map(role => role.toUpperCase());  // Convert camelCase to UPPER_CASE for comparison
    let userRoleToCheck = normalizedUserRole;
    if (userRoleToCheck === 'SUPERADMIN') {
      userRoleToCheck = 'SUPER_ADMIN';
    }  console.log('Role comparison:', {
      userRole: req.user.role,
      normalizedUserRole,
      userRoleToCheck,
      requiredRoles: roles,
      normalizedRoles,
      isAllowed: normalizedRoles.includes(userRoleToCheck)
    });  if (!normalizedRoles.includes(userRoleToCheck)) {
      console.log('Role check failed - returning 403');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }  console.log('Role check passed - continuing');
    next();
  };
};

module.exports = { authenticateToken, requireRole };
