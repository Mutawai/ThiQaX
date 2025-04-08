// src/config/logger.js
const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Define the log directory
const logDir = process.env.LOG_DIR || 'logs';

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Transport for console output
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
    )
  )
});

// Transport for file output with daily rotation
const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'thiqax-api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'thiqax-api' },
  transports: [
    consoleTransport,
    fileTransport
  ],
  exitOnError: false
});

// Create a stream object for Morgan integration
logger.stream = {
  write: message => logger.http(message.trim())
};

// Add a simple request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.http({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : null,
      ip: req.ip || req.connection.remoteAddress
    });
  });
  
  next();
};

// Middleware for API metrics
const apiMetrics = (req, res, next) => {
  const start = Date.now();
  
  // Override end method to calculate response time
  const end = res.end;
  res.end = function (chunk, encoding) {
    const responseTime = Date.now() - start;
    
    // Add custom metrics if Prometheus is being used
    if (global.promClient) {
      const labels = {
        method: req.method,
        route: req.route ? req.route.path : 'unknown',
        status_code: res.statusCode
      };
      
      // Increment request counter
      global.promClient.httpRequestCounter.inc(labels);
      
      // Observe response time
      global.promClient.httpRequestDuration.observe(labels, responseTime / 1000);
    }
    
    res.end = end;
    return res.end(chunk, encoding);
  };
  
  next();
};

module.exports = {
  logger,
  requestLogger,
  apiMetrics
};
