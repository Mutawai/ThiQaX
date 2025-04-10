// src/config/cors.js
const cors = require('cors');
const { logger } = require('./logger');

// Parse comma-separated origin list from environment
const parseOrigins = (originsString) => {
  if (!originsString) return [];
  return originsString.split(',').map(origin => origin.trim());
};

// CORS configuration based on environment
const getCorsOptions = () => {
  const allowedOrigins = parseOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default configuration
  const corsOptions = {
    origin: isProduction ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  // In production with specified origins, implement origin checking
  if (isProduction && allowedOrigins.length > 0) {
    corsOptions.origin = (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    };
  }

  return corsOptions;
};

// Create the CORS middleware
const corsMiddleware = cors(getCorsOptions());

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    logger.error(`CORS Error: ${err.message}`, { origin: req.headers.origin });
    return res.status(403).json({
      error: 'CORS Error',
      message: 'This origin is not allowed to access the resource'
    });
  }
  next(err);
};

module.exports = {
  getCorsOptions,
  corsMiddleware,
  corsErrorHandler
};
