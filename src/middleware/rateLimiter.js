const { createLogger } = require('../utils/logger');

const logger = createLogger('rateLimit');

// In-memory store for rate limiting
const ipRequestStore = new Map();
const userRequestStore = new Map();

/**
 * Rate limiting middleware to prevent abuse
 * @param {Object} options - Rate limiting options
 * @param {Number} options.windowMs - Time window in milliseconds
 * @param {Number} options.max - Maximum requests per window
 * @param {Boolean} options.userBased - Whether to use user ID instead of IP
 * @param {String} options.message - Custom error message
 */
exports.rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes by default
    max = 100, // 100 requests per windowMs by default
    userBased = false, // IP-based by default
    message = 'Too many requests, please try again later'
  } = options;
  
  return (req, res, next) => {
    // Determine key based on user ID or IP address
    const key = userBased && req.user ? req.user.id : (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    
    // Skip rate limiting for admin users if user-based
    if (userBased && req.user && req.user.role === 'admin') {
      return next();
    }
    
    // Use the appropriate store
    const store = userBased ? userRequestStore : ipRequestStore;
    
    // Get current time
    const now = Date.now();
    
    // Initialize or reset expired entries
    if (!store.has(key) || (now - store.get(key).start > windowMs)) {
      store.set(key, {
        start: now,
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    // Get record and increment count
    const record = store.get(key);
    record.count += 1;
    
    // Check if over limit
    if (record.count > max) {
      const resetTime = record.resetTime;
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);
      
      // Set headers
      res.set('Retry-After', retryAfterSeconds.toString());
      res.set('X-RateLimit-Limit', max.toString());
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      
      // Log rate limit hit
      logger.warn(`Rate limit exceeded for ${userBased ? 'user' : 'IP'}: ${key}`, {
        key,
        count: record.count,
        limit: max,
        retryAfter: retryAfterSeconds,
        path: req.originalUrl
      });
      
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSeconds
      });
    }
    
    // Set rate limit headers
    res.set('X-RateLimit-Limit', max.toString());
    res.set('X-RateLimit-Remaining', (max - record.count).toString());
    res.set('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());
    
    return next();
  };
};

/**
 * Specialized rate limiter for authentication endpoints to prevent brute force
 * @param {Object} options - Rate limiting options for auth endpoints
 */
exports.authRateLimiter = (options = {}) => {
  return exports.rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many login attempts, please try again later',
    ...options
  });
};

/**
 * Clear expired rate limit records periodically
 * Call this function when your app starts
 * @param {Number} interval - Clean-up interval in milliseconds
 */
exports.startCleanup = (interval = 10 * 60 * 1000) => { // 10 minutes by default
  setInterval(() => {
    const now = Date.now();
    let ipCount = 0;
    let userCount = 0;
    
    // Clean IP-based store
    ipRequestStore.forEach((record, key) => {
      if (now - record.start > record.windowMs) {
        ipRequestStore.delete(key);
      } else {
        ipCount++;
      }
    });
    
    // Clean user-based store
    userRequestStore.forEach((record, key) => {
      if (now - record.start > record.windowMs) {
        userRequestStore.delete(key);
      } else {
        userCount++;  
      }
    });
    
    logger.debug(`Rate limit stores cleaned. Active records: IP=${ipCount}, User=${userCount}`);
  }, interval);
};
