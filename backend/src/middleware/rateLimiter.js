const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Create different rate limiters for different endpoints
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.originalUrl}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// General API rate limiter
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
);

// Auth rate limiter (stricter)
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth requests per windowMs
  'Too many authentication attempts, please try again later'
);

// Audio upload rate limiter
const uploadLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 uploads per minute
  'Too many uploads, please try again later'
);

// Entry creation limiter (daily entries)
const entryLimiter = createRateLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  20, // limit each IP to 20 entries per day
  'Daily entry limit reached, please try again tomorrow'
);

module.exports = {
  general: generalLimiter,
  auth: authLimiter,
  upload: uploadLimiter,
  entry: entryLimiter
};