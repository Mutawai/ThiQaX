/**
 * Health check utilities for the ThiQaX platform.
 * Provides functions to check system health and readiness.
 */
const mongoose = require('mongoose');
const logger = require('./logger');
const os = require('os');

// Store startup time for uptime calculations
const startTime = Date.now();

/**
 * Check database connection status
 * @returns {Object} Database connection status information
 */
const checkDatabaseConnection = () => {
  try {
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: stateMap[state] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  } catch (error) {
    logger.error('Error checking database connection', { error });
    return {
      status: 'unhealthy',
      state: 'error',
      error: error.message
    };
  }
};

/**
 * Check system memory usage
 * @returns {Object} Memory usage information
 */
const checkMemoryUsage = () => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    // Process memory usage
    const processMemory = process.memoryUsage();
    
    return {
      status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
      systemMemory: {
        total: Math.round(totalMemory / (1024 * 1024)) + ' MB',
        free: Math.round(freeMemory / (1024 * 1024)) + ' MB',
        used: Math.round(usedMemory / (1024 * 1024)) + ' MB',
        usagePercent: Math.round(memoryUsagePercent * 100) / 100 + '%'
      },
      processMemory: {
        rss: Math.round(processMemory.rss / (1024 * 1024)) + ' MB',
        heapTotal: Math.round(processMemory.heapTotal / (1024 * 1024)) + ' MB',
        heapUsed: Math.round(processMemory.heapUsed / (1024 * 1024)) + ' MB',
        external: Math.round(processMemory.external / (1024 * 1024)) + ' MB'
      }
    };
  } catch (error) {
    logger.error('Error checking memory usage', { error });
    return {
      status: 'unknown',
      error: error.message
    };
  }
};

/**
 * Check system CPU usage
 * @returns {Object} CPU information
 */
const checkCPUUsage = () => {
  try {
    const cpus = os.cpus();
    const cpuInfo = cpus[0]; // Sample the first CPU for model info
    
    // Calculate average load
    const loadAvg = os.loadavg();
    
    return {
      status: 'healthy',
      cores: cpus.length,
      model: cpuInfo.model,
      speed: cpuInfo.speed + ' MHz',
      loadAverage: {
        '1min': loadAvg[0],
        '5min': loadAvg[1],
        '15min': loadAvg[2]
      }
    };
  } catch (error) {
    logger.error('Error checking CPU usage', { error });
    return {
      status: 'unknown',
      error: error.message
    };
  }
};

/**
 * Get system uptime information
 * @returns {Object} Uptime information
 */
const getUptimeInfo = () => {
  try {
    const systemUptime = os.uptime();
    const appUptime = (Date.now() - startTime) / 1000; // Convert to seconds
    
    // Helper function to format uptime
    const formatUptime = (uptime) => {
      const days = Math.floor(uptime / (24 * 60 * 60));
      const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((uptime % (60 * 60)) / 60);
      const seconds = Math.floor(uptime % 60);
      
      return {
        days,
        hours,
        minutes,
        seconds,
        formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`
      };
    };
    
    return {
      system: formatUptime(systemUptime),
      application: formatUptime(appUptime)
    };
  } catch (error) {
    logger.error('Error getting uptime info', { error });
    return {
      error: error.message
    };
  }
};

/**
 * Check for required environment variables
 * @param {Array<string>} requiredEnvVars - List of required env var names
 * @returns {Object} Environment variables check status
 */
const checkEnvironmentVariables = (requiredEnvVars) => {
  try {
    const missing = [];
    const present = [];
    
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        missing.push(envVar);
      } else {
        present.push(envVar);
      }
    });
    
    return {
      status: missing.length === 0 ? 'healthy' : 'unhealthy',
      present: present.length,
      missing: missing.length === 0 ? [] : missing,
      total: requiredEnvVars.length
    };
  } catch (error) {
    logger.error('Error checking environment variables', { error });
    return {
      status: 'unknown',
      error: error.message
    };
  }
};

/**
 * Basic health check
 * @returns {Object} Basic health status
 */
const basicCheck = () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ThiQaX API',
    version: process.env.APP_VERSION || 'unknown'
  };
};

/**
 * Detailed health check of all system components
 * @returns {Object} Detailed health information
 */
const detailedCheck = async () => {
  try {
    // Define required environment variables
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'NODE_ENV'
    ];
    
    // Run all checks
    const database = checkDatabaseConnection();
    const memory = checkMemoryUsage();
    const cpu = checkCPUUsage();
    const uptime = getUptimeInfo();
    const environment = checkEnvironmentVariables(requiredEnvVars);
    
    // Determine overall status
    let overallStatus = 'healthy';
    if (database.status === 'unhealthy' || environment.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (memory.status === 'warning') {
      overallStatus = 'warning';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'ThiQaX API',
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV,
      checks: {
        database,
        memory,
        cpu,
        uptime,
        environment
      }
    };
  } catch (error) {
    logger.error('Error running detailed health check', { error });
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      service: 'ThiQaX API',
      version: process.env.APP_VERSION || 'unknown',
      error: error.message
    };
  }
};

/**
 * Express middleware to provide health check endpoints
 * @param {Object} app - Express app
 */
const registerHealthEndpoints = (app) => {
  // Basic health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json(basicCheck());
  });
  
  // Detailed health check endpoint
  app.get('/health/details', async (req, res) => {
    const healthInfo = await detailedCheck();
    const statusCode = healthInfo.status === 'healthy' ? 200 : 
                      (healthInfo.status === 'warning' ? 200 : 503);
    
    res.status(statusCode).json(healthInfo);
  });
  
  logger.info('Health check endpoints registered');
};

module.exports = {
  checkDatabaseConnection,
  checkMemoryUsage,
  checkCPUUsage,
  getUptimeInfo,
  checkEnvironmentVariables,
  basicCheck,
  detailedCheck,
  registerHealthEndpoints
};
