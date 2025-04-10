// src/config/rate-limiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const { logger } = require('./logger');

// Get Redis client based on environment
const getRedisClient = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      connectTimeout: 10000
    });
  }
  return null;
};

// Create Redis store if Redis is available
const createLimiterStore = () => {
  const redisClient = getRedisClient();
  
  if (!redisClient) {
    logger.warn('Redis not configured for rate limiting. Using memory store instead.');
    return null;
  }
  
  // Handle Redis connection errors
  redisClient.on('error', (error) => {
    logger.error('Rate limiter Redis error:', error);
  });
  
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args)
  });
};

// Configure rate limiter options
const getLimiterOptions = (options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const store = createLimiterStore();
  
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { 
      error: 'Too many requests',
      message: 'You have exceeded the request rate limit. Please try again later.'
    },
    skip: (req) => {
      // Skip rate limiting for health check endpoints
      return req.path === '/health' || req.path === '/api/health';
    },
    keyGenerator: (req) => {
      // Use user ID if available, otherwise use IP
      return req.user ? `user_${req.user.id}` : req.ip;
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded: ${options.keyGenerator(req)}`);
      res.status(429).json(options.message);
    }
  };
  
  // Add Redis store if available
  if (store) {
    defaultOptions.store = store;
  }
  
  return { ...defaultOptions, ...options };
};

// Standard API limiter
const apiLimiter = rateLimit(getLimiterOptions());

// Stricter limiter for authentication endpoints
const authLimiter = rateLimit(getLimiterOptions({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // 10 attempts per hour
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login or registration attempts. Please try again later.'
  }
}));

// Limiter for user creation (anti-spam)
const createUserLimiter = rateLimit(getLimiterOptions({
  windowMs: 24 * 60 * 60 * 1000, // 24 hour window
  max: 5, // 5 accounts per day
  message: {
    error: 'Account creation limit reached',
    message: 'Maximum number of accounts created. Please try again tomorrow.'
  }
}));

module.exports = {
  apiLimiter,
  authLimiter,
  createUserLimiter,
  getLimiterOptions,
  createCustomLimiter: (options) => rateLimit(getLimiterOptions(options))
};
