const { createLogger } = require('../utils/logger');

/**
 * HTTP request logger middleware
 * @param {Object} options - Logger options
 * @param {Boolean} options.logBody - Whether to log request body
 * @param {Boolean} options.logQuery - Whether to log query parameters
 * @param {Array} options.excludePaths - Paths to exclude from logging
 */
exports.requestLogger = (options = {}) => {
  const logger = createLogger('http');
  const { 
    logBody = false, 
    logQuery = true,
    excludePaths = ['/health', '/api/health']
  } = options;
  
  return (req, res, next) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.originalUrl.startsWith(path))) {
      return next();
    }
    
    // Capture original end method to intercept response
    const originalEnd = res.end;
    
    // Get request start time
    const startTime = Date.now();
    
    // Prepare initial log data
    const logData = {
      method: req.method,
      path: req.originalUrl || req.url,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    
    // Log query parameters if enabled
    if (logQuery && Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }
    
    // Log request body if enabled and exists
    if (logBody && req.body && Object.keys(req.body).length > 0) {
      // Don't log passwords or sensitive data
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
      
      logData.body = sanitizedBody;
    }
    
    // Add user ID if authenticated
    if (req.user && req.user.id) {
      logData.userId = req.user.id;
    }
    
    // Override end method to capture response data
    res.end = function(chunk, encoding) {
      // Restore original end method
      res.end = originalEnd;
      
      // Calculate request duration
      const duration = Date.now() - startTime;
      
      // Add response information to log data
      logData.statusCode = res.statusCode;
      logData.duration = `${duration}ms`;
      
      // Log based on status code
      if (res.statusCode >= 500) {
        logger.error(`Server Error: ${req.method} ${req.originalUrl}`, logData);
      } else if (res.statusCode >= 400) {
        logger.warn(`Client Error: ${req.method} ${req.originalUrl}`, logData);
      } else {
        logger.info(`Request: ${req.method} ${req.originalUrl}`, logData);
      }
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * Middleware to add request ID to each request
 * @param {Function} generator - Optional custom ID generator function
 */
exports.requestId = (generator) => {
  const uuidv4 = generator || (() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });
  
  return (req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  };
};
