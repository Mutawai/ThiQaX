// src/config/monitoring.js
const promClient = require('prom-client');
const { logger } = require('./logger');
const { getEnvironment } = require('./environment');

// Configure default metrics collection interval
const METRICS_INTERVAL_MS = parseInt(process.env.METRICS_INTERVAL_MS, 10) || 10000; // 10 seconds

// Initialize Prometheus metrics
const initMetrics = () => {
  const { isDevelopment } = getEnvironment();
  
  // Create metrics registry
  const registry = new promClient.Registry();
  
  // Start collecting default metrics
  promClient.collectDefaultMetrics({
    register: registry,
    timeout: METRICS_INTERVAL_MS,
    labels: {
      app: 'thiqax-api',
      environment: process.env.NODE_ENV
    }
  });
  
  // HTTP request counter
  const httpRequestCounter = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry]
  });
  
  // HTTP request duration histogram
  const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [registry]
  });
  
  // Database operation counter
  const dbOperationCounter = new promClient.Counter({
    name: 'db_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'model', 'success'],
    registers: [registry]
  });
  
  // Database operation duration
  const dbOperationDuration = new promClient.Histogram({
    name: 'db_operation_duration_seconds',
    help: 'Database operation duration in seconds',
    labelNames: ['operation', 'model'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [registry]
  });
  
  // Authentication counter
  const authCounter = new promClient.Counter({
    name: 'auth_attempts_total',
    help: 'Total number of authentication attempts',
    labelNames: ['status', 'provider'],
    registers: [registry]
  });
  
  // Payment transaction counter
  const paymentCounter = new promClient.Counter({
    name: 'payment_transactions_total',
    help: 'Total number of payment transactions',
    labelNames: ['status', 'provider', 'type'],
    registers: [registry]
  });
  
  // User activity gauge
  const activeUsersGauge = new promClient.Gauge({
    name: 'active_users',
    help: 'Number of active users by role',
    labelNames: ['role'],
    registers: [registry]
  });
  
  // Cache hit ratio
  const cacheHitCounter = new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache'],
    registers: [registry]
  });
  
  const cacheMissCounter = new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache'],
    registers: [registry]
  });
  
  // External service request counter
  const externalRequestCounter = new promClient.Counter({
    name: 'external_requests_total',
    help: 'Total number of external service requests',
    labelNames: ['service', 'status'],
    registers: [registry]
  });
  
  // External service request duration
  const externalRequestDuration = new promClient.Histogram({
    name: 'external_request_duration_seconds',
    help: 'External service request duration in seconds',
    labelNames: ['service'],
    buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [registry]
  });
  
  // Store metrics on global object for use in middleware
  global.promClient = {
    registry,
    httpRequestCounter,
    httpRequestDuration,
    dbOperationCounter,
    dbOperationDuration,
    authCounter,
    paymentCounter,
    activeUsersGauge,
    cacheHitCounter,
    cacheMissCounter,
    externalRequestCounter,
    externalRequestDuration
  };
  
  logger.info('Prometheus metrics initialized');
  
  return global.promClient;
};

// Middleware for exposing Prometheus metrics endpoint
const metricsMiddleware = (req, res) => {
  if (!global.promClient || !global.promClient.registry) {
    return res.status(500).send('Metrics not initialized');
  }
  
  res.set('Content-Type', global.promClient.registry.contentType);
  global.promClient.registry.metrics()
    .then(metrics => res.end(metrics))
    .catch(err => {
      logger.error('Error generating metrics', err);
      res.status(500).send('Error generating metrics');
    });
};

// Database operation monitoring wrapper
const monitorDbOperation = async (operation, model, callback) => {
  if (!global.promClient) {
    return await callback();
  }
  
  const startTime = process.hrtime();
  
  try {
    const result = await callback();
    
    // Record successful operation
    global.promClient.dbOperationCounter.inc({
      operation,
      model,
      success: 'true'
    });
    
    // Record duration
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    
    global.promClient.dbOperationDuration.observe({
      operation,
      model
    }, duration);
    
    return result;
  } catch (error) {
    // Record failed operation
    global.promClient.dbOperationCounter.inc({
      operation,
      model,
      success: 'false'
    });
    
    // Re-throw the error
    throw error;
  }
};

// External service request monitoring wrapper
const monitorExternalRequest = async (service, callback) => {
  if (!global.promClient) {
    return await callback();
  }
  
  const startTime = process.hrtime();
  
  try {
    const result = await callback();
    
    // Record successful request
    global.promClient.externalRequestCounter.inc({
      service,
      status: 'success'
    });
    
    // Record duration
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds + nanoseconds / 1e9;
    
    global.promClient.externalRequestDuration.observe({
      service
    }, duration);
    
    return result;
  } catch (error) {
    // Record failed request
    global.promClient.externalRequestCounter.inc({
      service,
      status: 'error'
    });
    
    // Re-throw the error
    throw error;
  }
};

// Record cache activity
const recordCacheHit = (cacheName = 'default') => {
  if (global.promClient) {
    global.promClient.cacheHitCounter.inc({ cache: cacheName });
  }
};

const recordCacheMiss = (cacheName = 'default') => {
  if (global.promClient) {
    global.promClient.cacheMissCounter.inc({ cache: cacheName });
  }
};

module.exports = {
  initMetrics,
  metricsMiddleware,
  monitorDbOperation,
  monitorExternalRequest,
  recordCacheHit,
  recordCacheMiss,
  metrics: global.promClient
};
