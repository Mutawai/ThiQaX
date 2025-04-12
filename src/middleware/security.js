/**
 * @file Security middleware configuration for ThiQaX platform
 * @description Configures Express security middleware and best practices
 * @module middleware/security
 */

const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

/**
 * Configure and apply security middleware to Express application
 * @param {express.Application} app - Express application instance
 * @param {Object} config - Configuration object from environment
 * @returns {express.Application} - Express application with security middleware
 */
exports.configureSecurityMiddleware = (app, config) => {
  // Implement secure headers with Helmet
  if (config.HELMET_ENABLED === 'true') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'same-origin' },
        hsts: {
          maxAge: 15552000, // 180 days
          includeSubDomains: true,
          preload: true,
        },
      })
    );
  }

  // CORS configuration
  const corsOptions = {
    origin: config.CORS_ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
  app.use(cors(corsOptions));

  // Set security-related HTTP headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Protect against XSS attacks
  app.use(xss());

  // Sanitize data to prevent NoSQL injection
  app.use(mongoSanitize());

  // Prevent HTTP parameter pollution
  app.use(hpp());

  // Rate limiting
  if (config.ENABLE_RATE_LIMIT === 'true') {
    const limiter = rateLimit({
      windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes default
      max: parseInt(config.RATE_LIMIT_MAX, 10) || 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 429,
        message: 'Too many requests, please try again later.',
      },
      // Skip rate limiting for specific paths if needed
      skip: (req) => {
        // Example: Skip rate limiting for health checks
        return req.path === '/api/v1/health';
      },
    });
    app.use('/api/', limiter);
  }

  // Prevent clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // Implement Content Security Policy
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'"
    );
    next();
  });

  return app;
};

/**
 * Configure security middleware for specific routes
 * @param {express.Router} router - Express router
 * @param {Object} options - Route-specific security options
 * @returns {express.Router} - Router with security middleware
 */
exports.secureRoute = (router, options = {}) => {
  // Example: Add specific security middleware for certain routes
  if (options.requiresAuth) {
    router.use((req, res, next) => {
      // Check for authentication token
      if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      next();
    });
  }

  // Add CSRF protection for state-changing operations
  if (options.csrfProtection) {
    // Implement CSRF protection
    // Note: This would require setting up CSRF middleware
  }

  return router;
};

/**
 * Create security audit middleware
 * @returns {Function} - Middleware function to log security events
 */
exports.securityAuditMiddleware = () => {
  return (req, res, next) => {
    // Capture original end method
    const originalEnd = res.end;
    
    // Override end method to log security-relevant information
    res.end = function(chunk, encoding) {
      // Log security-relevant requests (e.g., failed logins, access to sensitive endpoints)
      if (
        (res.statusCode === 401 || res.statusCode === 403) ||
        req.path.includes('/admin') ||
        req.path.includes('/auth')
      ) {
        const securityLog = {
          timestamp: new Date().toISOString(),
          clientIP: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userAgent: req.headers['user-agent'],
          userId: req.user ? req.user.id : 'unauthenticated',
        };
        
        // Log security event
        console.log(JSON.stringify({
          type: 'security_audit',
          ...securityLog
        }));
      }
      
      // Call original end method
      originalEnd.apply(res, arguments);
    };
    
    next();
  };
};
