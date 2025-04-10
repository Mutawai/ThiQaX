// src/app.js
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

// Initialize environment
config.loadEnvironment();
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

// Request logging
app.use(requestLogger);

// Metrics collection middleware
app.use(apiMetrics);

// Security middleware
app.use(config.security.helmet.helmetMiddleware);
app.use(config.cors.middleware);
app.use(config.cors.errorHandler);
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP parameter pollution

// API rate limiting
app.use('/api', config.rateLimiter.api);
app.use('/api/auth', config.rateLimiter.auth);
app.use('/api/users', config.rateLimiter.createUser);

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

// Test data generation routes in development
if (config.env.isDevelopment) {
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

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services
const initializeApp = async () => {
  try {
    // Initialize all services from config
    await config.initialize(app);
    logger.info(`ThiQaX API initialized in ${config.env.current} environment`);
    return app;
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Database connection and server startup
if (require.main === module) {
  const PORT = config.server.port || 5000;
  
  initializeApp()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Server running in ${config.env.current} mode on port ${PORT}`);
        logger.info(`API docs available at ${config.server.baseUrl}/api-docs`);
      });
    })
    .catch(err => {
      logger.error('Application initialization failed', { error: err });
      process.exit(1);
    });
}

module.exports = { app, initializeApp };
