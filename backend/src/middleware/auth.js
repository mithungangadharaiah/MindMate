const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // 🎯 DEMO MODE: Allow access without token for demo users
    if (!token) {
      // Create demo user context for development/demo
      req.user = {
        id: 'demo-user',
        email: 'demo@mindmate.app',
        role: 'user',
        isDemoMode: true
      };
      
      logger.info(`Demo mode: Authenticated as demo user to ${req.originalUrl}`);
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      isDemoMode: false
    };

    // Log authenticated request
    logger.info(`Authenticated request from user ${req.user.id} to ${req.originalUrl}`);

    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });

    // 🎯 FALLBACK TO DEMO MODE on token errors
    req.user = {
      id: 'demo-user',
      email: 'demo@mindmate.app',
      role: 'user',
      isDemoMode: true
    };
    
    logger.info(`Auth error, falling back to demo mode for ${req.originalUrl}`);
    next();
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user'
      };
    }

    next();
  } catch (error) {
    // Silently continue without user context
    next();
  }
};

// Admin role check
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access forbidden',
      message: 'Admin privileges required'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};