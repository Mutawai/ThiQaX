// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Import utility modules
const { initializeEnv, getAllConfig } = require('./utils/envConfig');
const { connectDatabase } = require('./utils/dbUtils');
const { registerHealthEndpoints } = require('./utils/healthCheck');
const { httpMetricsMiddleware, getMetrics } = require('./utils/metricsCollector');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const routes = require('./routes');

// Initialize environment configuration
const envInitResult = initializeEnv();
if (!envInitResult.valid) {
  logger.warn('Missing required environment variables', {
    missing: envInitResult.missingVars
  });
}

const app = express();

// Body parser
app.use(express.json({ limit: '10kb' }));

// Add metrics collection middleware
app.use(httpMetricsMiddleware);

// Security middleware
app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP parameter pollution

// Rate limiting
const config = getAllConfig();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.server.rateLimit || 150, // Limit each IP to 150 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Enable CORS
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true
}));
app.options('*', cors());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Log requests using our custom logger in non-dev environments
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  });
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API routes
app.use('/api/v1', routes);

// Test data generation routes in development
if (process.env.NODE_ENV === 'development') {
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

// Database connection and server startup
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  connectDatabase()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      });
    })
    .catch(err => {
      logger.error('Database connection failed', { error: err });
      process.exit(1);
    });
}

module.exports = app;
