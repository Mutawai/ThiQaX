// src/app.js
/**
 * ThiQaX API Server Application
 * 
 * This file configures and exports the Express application with all middleware
 * and routes. It's designed to work in production, development, and testing environments.
 */
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');

// Import centralized configuration
const config = require('./config');
const { logger, requestLogger, apiMetrics } = require('./config/logger');

// Import utility modules
const { registerHealthEndpoints } = require('./utils/healthCheck');
const { getMetrics } = require('./utils/metricsCollector');
const errorHandler = require('./utils/errorHandler');
const routes = require('./routes');

/**
 * Creates and configures the Express application
 * Separated from initialization to support testing
 * @param {Object} options - Configuration overrides for testing
 * @returns {Express} Configured Express application
 */
const createApp = (options = {}) => {
  // Initialize environment
  config.loadEnvironment();
  
  // Allow environment override for testing
  const testEnv = options.testEnv || process.env.NODE_ENV;
  if (testEnv) {
    config.env.current = testEnv;
    config.env.isTest = testEnv === 'test';
  }
  
  if (!config.validate()) {
    logger.warn('Missing required environment variables', {
      missing: config.missingVariables
    });
  }

  const app = express();

  // Trust proxy if configured
  if (config.server && config.server.trustProxy) {
    app.set('trust proxy', true);
  }

  // Body parser
  app.use(express.json({ limit: config.files?.maxFileSize || '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging - conditionally disabled in test mode for cleaner outputs
  if (!config.env.isTest || options.enableTestLogging) {
    app.use(requestLogger);
    app.use(apiMetrics);
  }

  // Security middleware
  app.use(config.security.helmet.helmetMiddleware);
  app.use(config.cors.middleware);
  app.use(config.cors.errorHandler);
  app.use(mongoSanitize()); // Prevent NoSQL injection
  app.use(xss()); // Prevent XSS attacks
  app.use(hpp()); // Prevent HTTP parameter pollution

  // API rate limiting - disabled in test mode for more predictable test behavior
  if (!config.env.isTest) {
    app.use('/api', config.rateLimiter.api);
    app.use('/api/auth', config.rateLimiter.auth);
    app.use('/api/users', config.rateLimiter.createUser);
  }

  // Register health check endpoints (basic and detailed)
  registerHealthEndpoints(app);

  // Prometheus metrics endpoint
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', 'text/plain');
    try {
      const metrics = await getMetrics();
      res.send(metrics);
    } catch (error) {
      logger.error('Error generating metrics', { error });
      res.status(500).send('Error generating metrics');
    }
  });

  // API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(config.swagger));

  // Static files for local storage
  if (config.files.storageType === 'local') {
    app.use('/uploads', express.static(config.files.uploadPath));
  }

  // API routes with versioning
  const apiVersion = config.api.version || 'v1';
  app.use(`/api/${apiVersion}`, routes);

  // Test data generation routes in development or test mode
  if (config.env.isDevelopment || config.env.isTest) {
    const generateTestData = require('./utils/generate-test-data');
    
    app.post('/api/test-data/generate', async (req, res) => {
      try {
        const result = await generateTestData.generateAllTestData();
        res.status(200).json({ success: true, result });
      } catch (error) {
        logger.error('Error generating test data', { error });
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.post('/api/test-data/clean', async (req, res) => {
      try {
        await generateTestData.cleanAllData();
        res.status(200).json({ success: true, message: 'All test data cleaned' });
      } catch (error) {
        logger.error('Error cleaning test data', { error });
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  // Test-specific utilities for integration testing
  if (config.env.isTest) {
    app.post('/api/test/reset-db', async (req, res) => {
      try {
        // Only allow this endpoint in test environment
        if (config.env.isTest) {
          // Import here to avoid loading in production
          const { resetTestDatabase } = require('./tests/utils/testDatabase');
          await resetTestDatabase();
          res.status(200).json({ success: true, message: 'Test database reset successful' });
        } else {
          throw new Error('This endpoint is only available in test environment');
        }
      } catch (error) {
        logger.error('Test database reset failed', { error });
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  // Handle 404 routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.originalUrl}`
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};

/**
 * Initialize the application and its dependencies
 * @param {Express} app - Express application to initialize
 * @param {Object} options - Initialization options
 * @returns {Promise<Express>} Initialized Express application
 */
const initializeApp = async (app, options = {}) => {
  try {
    // Support for passing a pre-configured app or creating a new one
    const expressApp = app || createApp(options);
    
    // Allow mock services for testing
    const services = options.services || config.services;
    
    // Initialize all services from config
    await config.initialize(expressApp, services);
    
    logger.info(`ThiQaX API initialized in ${config.env.current} environment`);
    return expressApp;
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    
    // In test mode, propagate the error instead of exiting
    if (config.env.isTest) {
      throw error;
    }
    
    process.exit(1);
  }
};

// Database connection and server startup
if (require.main === module) {
  const PORT = config.server.port || 5000;
  
  const app = createApp();
  
  initializeApp(app)
    .then((initializedApp) => {
      initializedApp.listen(PORT, () => {
        logger.info(`Server running in ${config.env.current} mode on port ${PORT}`);
        logger.info(`API docs available at ${config.server.baseUrl}/api-docs`);
      });
    })
    .catch(err => {
      logger.error('Application initialization failed', { error: err });
      process.exit(1);
    });
}

// Export for testing and programmatic usage
module.exports = { 
  createApp,
  initializeApp,
  // For backwards compatibility
  app: createApp(),
  // For easier testing with pre-configured mock services
  createTestApp: (mockServices) => {
    const testApp = createApp({ testEnv: 'test' });
    return initializeApp(testApp, { services: mockServices });
  }
};
