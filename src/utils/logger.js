const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Creates a logger instance with a specific module name
 * @param {string} module - The module name for the logger
 * @returns {winston.Logger} The configured logger instance
 */
const createLogger = (module) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: 'thiqax-api', module },
    transports: [
      // Write all logs with level 'error' and below to error.log
      new winston.transports.File({ 
        filename: path.join(logDir, 'error.log'), 
        level: 'error' 
      }),
      // Write all logs with level 'info' and below to combined.log
      new winston.transports.File({ 
        filename: path.join(logDir, 'combined.log') 
      })
    ]
  });

  // If not in production, log to the console with custom format
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level} [${info.module}]: ${info.message}`
        )
      )
    }));
  }

  return logger;
};

module.exports = {
  createLogger
};
