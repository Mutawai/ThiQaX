// src/utils/errorHandler.js
const { logger } = require('../config/logger');
const config = require('../config');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a new API error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {ApiError} API error object
 */
const createError = (message, statusCode = 400) => {
  return new ApiError(message, statusCode);
};

/**
 * Async error handler middleware to avoid try/catch blocks
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Determine environment using new config
  const isDevelopment = config.env?.isDevelopment || process.env.NODE_ENV === 'development';

  // Log error with structured logger instead of console
  logger.error(`Error: ${err.name} - ${err.message}`, {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    errorCode: err.code
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = createError(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value`;
    error = createError(message, 400);
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = createError(message, 400);
  }

  // JWT validation errors
  if (err.name === 'JsonWebTokenError') {
    error = createError('Invalid token. Please log in again', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = createError('Token expired. Please log in again', 401);
  }

  // Rate limiting error
  if (err.name === 'TooManyRequests') {
    error = createError('Too many requests. Please try again later', 429);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = createError(`File too large. Maximum size is ${config.files?.maxFileSize / (1024 * 1024)}MB`, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = createError('Unexpected file upload field', 400);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(isDevelopment && { stack: err.stack }),
    ...(error.details && { details: error.details })
  });
  
  // If this is a critical error in production, log additional details
  if ((error.statusCode >= 500) && config.env?.isProduction) {
    logger.error('Critical error occurred', {
      message: error.message,
      stack: err.stack,
      requestBody: req.body ? JSON.stringify(req.body).substring(0, 1000) : null,
      requestQuery: req.query ? JSON.stringify(req.query) : null
    });
    
    // Potentially notify DevOps team for critical errors in production
    if (config.notifications?.email?.enabled && error.statusCode === 500) {
      try {
        const emailService = require('../services/emailService');
        emailService.sendErrorAlert({
          subject: `Critical API Error: ${error.message}`,
          errorDetails: {
            message: error.message,
            stack: err.stack,
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
          }
        }).catch(emailErr => {
          logger.error('Failed to send error alert email', { error: emailErr });
        });
      } catch (emailServiceError) {
        logger.error('Failed to load email service for error alert', { error: emailServiceError });
      }
    }
  }
};

module.exports = {
  ApiError,
  createError,
  catchAsync,
  errorHandler
};
