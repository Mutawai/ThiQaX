// src/controllers/healthController.js
/**
 * Health check controller for ThiQaX platform
 * Provides endpoints for monitoring system health and performance
 */

const mongoose = require('mongoose');
const os = require('os');
const { version } = require('../../package.json');

/**
 * Basic health check endpoint
 * Checks if the application is running and able to process requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.basicHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'thiqax-api',
    version
  });
};

/**
 * Detailed health check endpoint
 * Provides comprehensive status of all system components
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.detailedHealth = async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check system resources
    const memoryUsage = process.memoryUsage();
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsagePercent = 100 - (freeMemory / totalMemory * 100);
    
    // Check CPU load
    const cpus = os.cpus();
    const cpuUsage = process.cpuUsage();
    const cpuCount = cpus.length;
    
    // Add uptime information
    const uptime = process.uptime();
    
    // Get hostname
    const hostname = os.hostname();
    
    // Perform database query timing test
    let dbQueryTime = null;
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      dbQueryTime = Date.now() - startTime;
    } catch (error) {
      dbQueryTime = -1;
    }
    
    // Format response
    const healthData = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'thiqax-api',
      version,
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      host: {
        hostname,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      },
      memory: {
        usage: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external)
        },
        system: {
          total: formatBytes(totalMemory),
          free: formatBytes(freeMemory),
          usagePercent: memoryUsagePercent.toFixed(2) + '%'
        }
      },
      cpu: {
        count: cpuCount,
        model: cpus[0].model,
        speed: cpus[0].speed + ' MHz',
        usage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      database: {
        status: dbStatus,
        queryTime: dbQueryTime !== null ? `${dbQueryTime}ms` : 'n/a'
      }
    };
    
    // Set appropriate status code
    const statusCode = healthData.status === 'ok' ? 200 : 
                     (healthData.status === 'degraded' ? 200 : 503);
    
    res.status(statusCode).json(healthData);
    
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'thiqax-api',
      version,
      error: error.message
    });
  }
};

/**
 * Ready check endpoint for Kubernetes/Docker health checks
 * Verifies essential services are available
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.readyCheck = async (req, res) => {
  try {
    // Check MongoDB connection
    const dbConnected = mongoose.connection.readyState === 1;
    
    // Check any other required services here
    
    if (dbConnected) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Database connection unavailable'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      reason: error.message
    });
  }
};

/**
 * Live check endpoint for Kubernetes/Docker health checks
 * Verifies the application is running and not deadlocked
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.liveCheck = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Format bytes to human readable format
 * 
 * @param {Number} bytes - Bytes to format
 * @param {Number} decimals - Number of decimal places
 * @return {String} Formatted string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format uptime to human readable format
 * 
 * @param {Number} seconds - Uptime in seconds
 * @return {String} Formatted uptime string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
  
  return parts.join(' ');
}

// src/routes/healthRoutes.js
/**
 * Health check routes for ThiQaX platform
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * @route   GET /health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', healthController.basicHealth);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with system information
 * @access  Private (restricted to admin or internal services)
 */
router.get('/detailed', healthController.detailedHealth);

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes
 * @access  Public
 */
router.get('/ready', healthController.readyCheck);

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes
 * @access  Public
 */
router.get('/live', healthController.liveCheck);

module.exports = router;

// src/middleware/metrics.js
/**
 * Prometheus metrics middleware for ThiQaX platform
 * Collects and exposes metrics for monitoring and alerting
 */

const promClient = require('prom-client');
const responseTime = require('response-time');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'thiqax-api'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const mongodbOperationsTotal = new promClient.Counter({
  name: 'mongodb_operations_total',
  help: 'Total number of MongoDB operations',
  labelNames: ['operation', 'collection'],
  registers: [register]
});

const mongodbOperationDurationSeconds = new promClient.Histogram({
  name: 'mongodb_operation_duration_seconds',
  help: 'Duration of MongoDB operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

/**
 * Middleware to track HTTP request metrics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestMetrics = responseTime((req, res, time) => {
  // Get route from request
  const route = req.route ? req.route.path : req.path;
  
  // Increment request counter
  httpRequestsTotal.inc({
    method: req.method,
    route: route,
    status: res.statusCode
  });
  
  // Record request duration
  httpRequestDurationSeconds.observe(
    {
      method: req.method,
      route: route,
      status: res.statusCode
    },
    time / 1000
  );
});

/**
 * Connection tracking middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const connectionTracking = (req, res, next) => {
  // Increment active connections
  activeConnections.inc();
  
  // Decrement when the connection is closed
  res.on('finish', () => {
    activeConnections.dec();
  });
  
  next();
};

/**
 * MongoDB operation tracking
 * 
 * @param {String} operation - Operation type (find, update, etc.)
 * @param {String} collection - Collection name
 * @param {Number} duration - Operation duration in milliseconds
 */
const trackMongoOperation = (operation, collection, duration) => {
  mongodbOperationsTotal.inc({
    operation,
    collection
  });
  
  mongodbOperationDurationSeconds.observe(
    {
      operation,
      collection
    },
    duration / 1000
  );
};

/**
 * Metrics endpoint handler
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = {
  requestMetrics,
  connectionTracking,
  trackMongoOperation,
  metricsEndpoint,
  register
};
