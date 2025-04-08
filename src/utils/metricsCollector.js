/**
 * Metrics collection utilities for performance monitoring in the ThiQaX platform.
 * Provides functions to collect and report performance metrics to Prometheus.
 */
const client = require('prom-client');
const logger = require('./logger');

// Initialize Prometheus metrics registry
const register = new client.Registry();

// Add default metrics (GC, memory usage, event loop lag, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const documentUploadTotal = new client.Counter({
  name: 'document_uploads_total',
  help: 'Total number of document uploads',
  labelNames: ['status', 'document_type']
});

const documentVerificationDurationMs = new client.Histogram({
  name: 'document_verification_duration_ms',
  help: 'Duration of document verification process in ms',
  labelNames: ['status', 'document_type'],
  buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000]
});

const databaseOperationDurationMs = new client.Histogram({
  name: 'database_operation_duration_ms',
  help: 'Duration of database operations in ms',
  labelNames: ['operation', 'collection'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000]
});

const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
});

const jobApplicationsTotal = new client.Counter({
  name: 'job_applications_total',
  help: 'Total number of job applications',
  labelNames: ['status']
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestTotal);
register.registerMetric(documentUploadTotal);
register.registerMetric(documentVerificationDurationMs);
register.registerMetric(databaseOperationDurationMs);
register.registerMetric(activeUsers);
register.registerMetric(jobApplicationsTotal);

/**
 * Start timing an operation for later measurement
 * @returns {Function} Function that stops timer and returns duration in ms
 */
const startTimer = () => {
  const start = process.hrtime();
  
  return () => {
    const diff = process.hrtime(start);
    // Convert to milliseconds
    return (diff[0] * 1e9 + diff[1]) / 1e6;
  };
};

/**
 * HTTP request metrics middleware for Express
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const httpMetricsMiddleware = (req, res, next) => {
  const stopTimer = startTimer();
  
  // Record response data when request finishes
  res.on('finish', () => {
    const duration = stopTimer();
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    // Record request duration
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(duration);
    
    // Increment request counter
    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
  });
  
  next();
};

/**
 * Measure duration of a database operation
 * @param {string} operation - Operation name (find, update, insert, etc.)
 * @param {string} collection - Collection name
 * @param {Function} operationFn - Async function that performs the operation
 * @returns {Promise<any>} Result of the database operation
 */
const measureDatabaseOperation = async (operation, collection, operationFn) => {
  const stopTimer = startTimer();
  
  try {
    const result = await operationFn();
    const duration = stopTimer();
    
    databaseOperationDurationMs
      .labels(operation, collection)
      .observe(duration);
    
    return result;
  } catch (error) {
    const duration = stopTimer();
    
    databaseOperationDurationMs
      .labels(operation, collection)
      .observe(duration);
    
    throw error;
  }
};

/**
 * Record document upload event
 * @param {string} status - Upload status (success, failure)
 * @param {string} documentType - Type of document
 */
const recordDocumentUpload = (status, documentType) => {
  documentUploadTotal
    .labels(status, documentType)
    .inc();
};

/**
 * Measure document verification process
 * @param {string} documentType - Type of document being verified
 * @param {Function} verificationFn - Async function that performs verification
 * @returns {Promise<any>} Result of verification process
 */
const measureDocumentVerification = async (documentType, verificationFn) => {
  const stopTimer = startTimer();
  
  try {
    const result = await verificationFn();
    const duration = stopTimer();
    
    documentVerificationDurationMs
      .labels('success', documentType)
      .observe(duration);
    
    return result;
  } catch (error) {
    const duration = stopTimer();
    
    documentVerificationDurationMs
      .labels('failure', documentType)
      .observe(duration);
    
    throw error;
  }
};

/**
 * Update active users count
 * @param {number} count - Current active users count
 */
const setActiveUsers = (count) => {
  activeUsers.set(count);
};

/**
 * Increment active users count
 */
const incrementActiveUsers = () => {
  activeUsers.inc();
};

/**
 * Decrement active users count
 */
const decrementActiveUsers = () => {
  activeUsers.dec();
};

/**
 * Record job application
 * @param {string} status - Application status (submitted, approved, rejected)
 */
const recordJobApplication = (status) => {
  jobApplicationsTotal
    .labels(status)
    .inc();
};

/**
 * Get metrics in Prometheus format
 * @returns {Promise<string>} Metrics in Prometheus format
 */
const getMetrics = async () => {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Error collecting metrics', { error });
    throw error;
  }
};

module.exports = {
  httpMetricsMiddleware,
  measureDatabaseOperation,
  recordDocumentUpload,
  measureDocumentVerification,
  setActiveUsers,
  incrementActiveUsers,
  decrementActiveUsers,
  recordJobApplication,
  getMetrics,
  startTimer
};
