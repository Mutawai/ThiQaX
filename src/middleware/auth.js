// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const config = require('../config');
const { createLogger } = require('../utils/logger');

const logger = createLogger('authMiddleware');

/**
 * Middleware to protect routes - verifies JWT token and adds user to request
 * Blocks access if authentication fails
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Extract token from cookies as fallback
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token using promisify for cleaner async/await syntax
    const decoded = await promisify(jwt.verify)(token, config.auth.jwtSecret);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!currentUser) {
      logger.warn(`User with ID ${decoded.id} from JWT no longer exists`);
      return next(new ErrorResponse('User no longer exists', 401));
    }

    // Check if user account is active
    if (currentUser.active === false) {
      logger.warn(`Inactive account ${currentUser.id} attempted to access protected route`);
      return next(new ErrorResponse('Your account has been deactivated', 401));
    }

    // Check if user changed password after token was issued
    if (currentUser.passwordChangedAfter && currentUser.passwordChangedAfter(decoded.iat)) {
      logger.info(`User ${currentUser.id} using token issued before password change`);
      return next(new ErrorResponse('User recently changed password, please log in again', 401));
    }

    // Set user on request object
    req.user = currentUser;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return next(new ErrorResponse('Authentication failed', 401));
  }
});

/**
 * Middleware for optional authentication
 * Proceeds with or without valid authentication
 */
exports.optional = asyncHandler(async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Extract token from cookies as fallback
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, proceed without authentication
  if (!token) {
    return next();
  }

  try {
    // Verify token using promisify
    const decoded = await promisify(jwt.verify)(token, config.auth.jwtSecret);
    
    // Set user if exists
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.active !== false) {
      req.user = currentUser;
    }
  } catch (error) {
    // Continue without authentication if token is invalid
    logger.debug(`Optional auth failed: ${error.message}`);
    // No error is thrown, the request simply proceeds without a user
  }
  
  next();
});

/**
 * Middleware to restrict routes to specific roles
 * @param  {...string} roles - Roles allowed to access the route
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (in case this middleware is used after optional auth)
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }
    
    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} with role ${req.user.role} attempted to access restricted route`);
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    
    next();
  };
};

/**
 * Middleware to verify that user has completed KYC
 * Used for routes that require verified identity
 */
exports.requireVerifiedUser = asyncHandler(async (req, res, next) => {
  if (!req.user.kycVerified) {
    logger.info(`User ${req.user.id} attempted to access route requiring KYC verification`);
    return next(
      new ErrorResponse(
        'Identity verification required to access this route',
        403
      )
    );
  }
  
  next();
});

/**
 * Middleware to verify that user has a complete profile
 * Used for routes that require complete profile information
 */
exports.requireProfileComplete = asyncHandler(async (req, res, next) => {
  if (!req.user.profileComplete) {
    logger.info(`User ${req.user.id} attempted to access route requiring complete profile`);
    return next(
      new ErrorResponse(
        'Complete profile required to access this route',
        403
      )
    );
  }
  
  next();
});

/**
 * Middleware to verify that user has verified their email
 * Used for routes that require email verification
 */
exports.requireEmailVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.emailVerified) {
    logger.info(`User ${req.user.id} attempted to access route requiring email verification`);
    return next(
      new ErrorResponse(
        'Email verification required to access this route',
        403
      )
    );
  }
  
  next();
});

/**
 * Middleware to verify active account status
 * Prevents suspended/inactive accounts from accessing protected resources
 */
exports.requireActiveAccount = asyncHandler(async (req, res, next) => {
  if (req.user.status !== 'active') {
    logger.warn(`Inactive account ${req.user.id} with status ${req.user.status} attempted access`);
    return next(
      new ErrorResponse(
        `Account is ${req.user.status}. Please contact support.`,
        403
      )
    );
  }
  
  next();
});

/**
 * Rate limiting middleware wrapper for sensitive operations
 * @param {number} maxAttempts - Maximum number of attempts allowed
 * @param {number} windowMinutes - Time window in minutes
 */
exports.rateLimit = (maxAttempts = 5, windowMinutes = 15) => {
  // This is a placeholder for a proper rate limiting implementation
  // In a real implementation, this would use Redis or another store to track attempts
  return (req, res, next) => {
    // Implementation would go here
    next();
  };
};

/**
 * Adds CSRF protection for sensitive routes
 * Must be used with a CSRF token implementation
 */
exports.csrfProtection = (req, res, next) => {
  // This is a placeholder that should be implemented with a proper CSRF library
  // such as csurf or a custom implementation
  if (!req.csrfToken || req.csrfToken !== req.body._csrf) {
    logger.warn(`CSRF validation failed for ${req.originalUrl}`);
    return next(new ErrorResponse('Invalid or missing CSRF token', 403));
  }
  
  next();
};

module.exports = exports;
