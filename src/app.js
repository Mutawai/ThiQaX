// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

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
app.use(helmet());
app.use(cors());

// Body parser
app.use(express.json());

// Logging middleware
app.use(morgan('dev'));

// Handle file upload errors
app.use(handleUploadError);

// Serve uploaded files - conditional based on environment
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
} else {
  // In production, still serve files but with more restrictive settings
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    setHeaders: (res) => {
      res.set('Cache-Control', 'public, max-age=86400');
    }
  }));
}

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Base route with enhanced documentation info
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to ThiQaX API - The Trust-Based Recruitment Platform',
    version: '1.0.0',
    documentation: '/api-docs',
    healthCheck: '/health',
    basePath: '/api/v1'
  });
});

// API routes - using standardized plural naming convention
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/integrations', integrationRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    availableResources: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/profiles',
      '/api/v1/jobs',
      '/api/v1/applications',
      '/api/v1/documents',
      '/api/v1/notifications',
      '/api/v1/integrations',
      '/api-docs',
      '/health'
    ]
  });
});

// Apply both error handlers for comprehensive error handling
app.use(errorHandler);
app.use(globalErrorHandler);

module.exports = app;
