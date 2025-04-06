// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const config = require('./config');

// Import error handlers
const { errorHandler } = require('./utils/errorHandler');
const globalErrorHandler = require('./middleware/errorHandler');
const { handleUploadError } = require('./middleware/fileUpload');

// Import all routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const integrationRoutes = require('./routes/integrationRoutes');

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

// Rate limiting
if (config.security.enableRateLimit) {
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMax,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.'
    }
  });
  
  // Apply rate limiting to all routes
  app.use(limiter);
  console.log('\x1b[32m%s\x1b[0m', `✓ Rate limiting enabled: ${config.security.rateLimitMax} requests per ${config.security.rateLimitWindowMs / (60 * 1000)} minutes`);
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware with environment-based configuration
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
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
