// src/utils/errorHandler.js
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

  // Log error for debugging
  console.error('ERROR 💥', err);

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

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  ApiError,
  createError,
  catchAsync,
  errorHandler
};
