// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const config = require('./config');

// Import error handlers
const { errorHandler } = require('./utils/errorHandler');
const globalErrorHandler = require('./middleware/errorHandler');
const { handleUploadError } = require('./middleware/fileUpload');

// Import custom middleware
const { requestLogger, requestId } = require('./middleware/logger');
const { rateLimiter, authRateLimiter, startCleanup } = require('./middleware/rateLimiter');

// Import all routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const jobRoutes = require('./routes/job');
const applicationRoutes = require('./routes/application');
const documentRoutes = require('./routes/document');
const notificationRoutes = require('./routes/notification');
const integrationRoutes = require('./routes/integration');

const app = express();

// Security middleware
if (config.security.helmetEnabled) {
  app.use(helmet());
  console.log('\x1b[32m%s\x1b[0m', '✓ Helmet security middleware enabled');
}

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('\x1b[32m%s\x1b[0m', `✓ CORS enabled for origin: ${config.security.corsOrigin}`);

// Add request ID middleware for request tracking
app.use(requestId());
console.log('\x1b[32m%s\x1b[0m', '✓ Request ID tracking enabled');

// Enhanced request logging (replaces morgan)
app.use(requestLogger({
  logQuery: true,
  logBody: config.server.isDevelopment, // Only log bodies in development
  excludePaths: ['/health', '/api-docs']
}));
console.log('\x1b[32m%s\x1b[0m', '✓ Enhanced request logging enabled');

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - using custom implementation
if (config.security.enableRateLimit) {
  // Apply general rate limiting to all routes
  app.use(rateLimiter({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMax,
    message: 'Too many requests from this IP, please try again later.'
  }));
  
  // Start the cleanup process for rate limiters
  startCleanup();
  
  console.log('\x1b[32m%s\x1b[0m', `✓ Rate limiting enabled: ${config.security.rateLimitMax} requests per ${config.security.rateLimitWindowMs / (60 * 1000)} minutes`);
}

// Handle file upload errors
app.use(handleUploadError);

// Serve uploaded files - conditional based on environment
if (config.server.isDevelopment) {
  app.use('/uploads', express.static(path.join(__dirname, '..', config.files.uploadPath)));
  console.log('\x1b[32m%s\x1b[0m', `✓ Serving uploads from: ${config.files.uploadPath}`);
} else {
  // In production, still serve files but with more restrictive settings
  app.use('/uploads', express.static(path.join(__dirname, '..', config.files.uploadPath), {
    maxAge: '1d',
    setHeaders: (res) => {
      res.set('Cache-Control', 'public, max-age=86400');
    }
  }));
}

// API Documentation
if (config.api.enableSwagger) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
  console.log('\x1b[32m%s\x1b[0m', '✓ API documentation enabled at /api-docs');
}

// Define the API version path prefix
const apiPath = `/api/${config.api.version}`;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: '1.0.0'
  });
});

// Base route with enhanced documentation info
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to ThiQaX API - The Trust-Based Recruitment Platform',
    version: '1.0.0',
    documentation: '/api-docs',
    healthCheck: '/health',
    basePath: apiPath
  });
});

// Apply stricter rate limiting to auth routes
if (config.security.enableRateLimit) {
  app.use(`${apiPath}/auth/login`, authRateLimiter());
  app.use(`${apiPath}/auth/register`, authRateLimiter());
  app.use(`${apiPath}/auth/forgot-password`, authRateLimiter());
  console.log('\x1b[32m%s\x1b[0m', '✓ Enhanced rate limiting applied to authentication endpoints');
}

// API routes - using standardized plural naming convention
app.use(`${apiPath}/auth`, authRoutes);
app.use(`${apiPath}/users`, userRoutes);
app.use(`${apiPath}/profiles`, profileRoutes);
app.use(`${apiPath}/jobs`, jobRoutes);
app.use(`${apiPath}/applications`, applicationRoutes);
app.use(`${apiPath}/documents`, documentRoutes);
app.use(`${apiPath}/notifications`, notificationRoutes);
app.use(`${apiPath}/integrations`, integrationRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    availableResources: [
      `${apiPath}/auth`,
      `${apiPath}/users`,
      `${apiPath}/profiles`,
      `${apiPath}/jobs`,
      `${apiPath}/applications`,
      `${apiPath}/documents`,
      `${apiPath}/notifications`,
      `${apiPath}/integrations`,
      '/api-docs',
      '/health'
    ]
  });
});

// Apply both error handlers for comprehensive error handling
app.use(errorHandler);
app.use(globalErrorHandler);

module.exports = app;
