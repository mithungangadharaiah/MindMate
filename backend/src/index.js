const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize database
const { initializeDatabase } = require('./config/database');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const entriesRoutes = require('./routes/entries');
const conversationsRoutes = require('./routes/conversations');
const friendsRoutes = require('./routes/friends');
const placesRoutes = require('./routes/places');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // For audio recording
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'", "blob:", "data:"],
    },
  },
}));

// CORS configuration - Allow all origins for demo mode
app.use(cors({
  origin: true, // Allow all origins (for network access like 192.168.1.11)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
app.use(rateLimiter.general);

// Health check endpoint
app.get('/health', (req, res) => {
  const { isUsingLocalDb } = require('./config/database');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: isUsingLocalDb() ? 'local-files' : 'postgresql'
  });
});

app.get('/api/health', (req, res) => {
  const { isUsingLocalDb } = require('./config/database');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: isUsingLocalDb() ? 'local-files' : 'postgresql'
  });
});

// Daily questions endpoint
app.get('/api/questions/daily', async (req, res) => {
  try {
    const { getDatabase, isUsingLocalDb } = require('./config/database');
    const db = getDatabase();
    
    if (isUsingLocalDb()) {
      const question = await db.getRandomDailyQuestion();
      res.json(question || {
        id: 'default',
        question_text: 'How are you feeling right now, and what\'s been on your mind today?',
        category: 'emotions'
      });
    } else {
      const result = await db.query(
        'SELECT * FROM daily_questions WHERE is_active = true ORDER BY RANDOM() LIMIT 1'
      );
      res.json(result.rows[0] || {
        id: 'default',
        question_text: 'How are you feeling right now, and what\'s been on your mind today?',
        category: 'emotions'
      });
    }
  } catch (error) {
    console.error('Error fetching daily question:', error);
    res.json({
      id: 'default',
      question_text: 'How are you feeling right now, and what\'s been on your mind today?',
      category: 'emotions'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

// Serve uploaded audio files (with auth)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const server = app.listen(PORT, async () => {
  // Initialize database
  try {
    await initializeDatabase();
    logger.info('✅ Database initialized successfully');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
  }
  
  logger.info(`🚀 MindMate API server running on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  logger.info(`🎯 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;