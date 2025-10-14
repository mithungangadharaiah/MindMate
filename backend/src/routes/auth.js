const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { auth: authLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, display_name, city, age, interests = [] } = req.body;

    // Validate input
    if (!email || !password || !display_name) {
      return res.status(400).json({
        error: 'Email, password, and display name are required'
      });
    }

    // TODO: Check if user already exists
    // TODO: Hash password and save to database
    
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user object (would normally save to database)
    const user = {
      id: userId,
      email: email.toLowerCase(),
      display_name,
      city: city || null,
      age: age || null,
      interests,
      created_at: new Date(),
      email_verified: false,
      privacy_settings: {
        off_record_mode: false,
        data_retention_days: 90
      }
    };

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`New user registered: ${email}`, { userId });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        city: user.city,
        age: user.age,
        interests: user.interests
      },
      token
    });

  } catch (error) {
    logger.error('User registration failed:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // TODO: Get user from database
    // For now, mock authentication
    const mockUser = {
      id: 'user_123',
      email: email.toLowerCase(),
      password_hash: await bcrypt.hash('password123', 12), // Mock password
      display_name: 'Demo User',
      city: 'San Francisco',
      age: 28,
      interests: ['hiking', 'music', 'reading']
    };

    // Verify password
    const isValidPassword = await bcrypt.compare(password, mockUser.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`User logged in: ${email}`, { userId: mockUser.id });

    res.json({
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email,
        display_name: mockUser.display_name,
        city: mockUser.city,
        age: mockUser.age,
        interests: mockUser.interests
      },
      token
    });

  } catch (error) {
    logger.error('User login failed:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Generate new token
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Please log in again'
    });
  }
});

module.exports = router;