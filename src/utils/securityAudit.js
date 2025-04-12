/**
 * @file Security Audit Analyzer
 * @description Analyzes security logs to detect potential threats and vulnerabilities
 * @module utils/securityAudit
 */

const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'security-audit' },
  transports: [
    new winston.transports.File({ filename: 'logs/security/audit.log' }),
    new winston.transports.Console()
  ]
});

/**
 * Threshold configurations for security alerts
 */
const THRESHOLDS = {
  LOGIN_FAILURES: 5, // Number of failed logins before alert
  TIMEFRAME_MINUTES: 10, // Timeframe for checking login failures
  SUSPICIOUS_IPS: ['127.0.0.1'], // Example placeholder - should be loaded from database
  HIGH_RISK_PATHS: ['/api/v1/admin', '/api/v1/users', '/api/v1/documents'] // Sensitive API paths
};

/**
 * Analyzes security logs for potential threats
 * @param {string} logPath - Path to security log file
 * @returns {Promise<Object>} - Analysis results
 */
exports.analyzeSecurityLogs = async (logPath) => {
  try {
    // Read security logs
    const logs = await fs.readFile(logPath, 'utf8');
    const logEntries = logs.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line));

    const results = {
      failedLogins: {},
      suspiciousIPs: {},
      sensitiveEndpointAccess: {},
      unauthorized: [],
      timestamp: new Date().toISOString()
    };

    // Group logs by IP address
    const ipGroups = {};
    logEntries.forEach(entry => {
      if (!ipGroups[entry.clientIP]) {
        ipGroups[entry.clientIP] = [];
      }
      ipGroups[entry.clientIP].push(entry);
    });

    // Analyze each IP group
    Object.keys(ipGroups).forEach(ip => {
      const entries = ipGroups[ip];
      
      // Check for failed logins
      const failedLogins = entries.filter(entry => 
        entry.path.includes('/auth/login') && entry.statusCode === 401
      );
      
      if (failedLogins.length >= THRESHOLDS.LOGIN_FAILURES) {
        results.failedLogins[ip] = failedLogins.length;
      }
      
      // Check for suspicious IPs
      if (THRESHOLDS.SUSPICIOUS_IPS.includes(ip)) {
        results.suspiciousIPs[ip] = entries.length;
      }
      
      // Check for sensitive endpoint access
      const sensitiveAccess = entries.filter(entry =>
        THRESHOLDS.HIGH_RISK_PATHS.some(path => entry.path.includes(path))
      );
      
      if (sensitiveAccess.length > 0) {
        results.sensitiveEndpointAccess[ip] = sensitiveAccess.length;
      }
      
      // Check for unauthorized access attempts
      const unauthorized = entries.filter(entry =>
        entry.statusCode === 401 || entry.statusCode === 403
      );
      
      if (unauthorized.length > 0) {
        results.unauthorized.push({
          ip,
          count: unauthorized.length,
          paths: [...new Set(unauthorized.map(entry => entry.path))]
        });
      }
    });

    // Log findings and return results
    if (Object.keys(results.failedLogins).length > 0 || 
        Object.keys(results.suspiciousIPs).length > 0 ||
        Object.keys(results.sensitiveEndpointAccess).length > 0 ||
        results.unauthorized.length > 0) {
      logger.warn('Security audit detected potential threats', results);
    } else {
      logger.info('Security audit completed with no threats detected');
    }

    return results;
  } catch (error) {
    logger.error('Error analyzing security logs', { error: error.message });
    throw error;
  }
};

/**
 * Generate security report for a specified time period
 * @param {Date} startDate - Start date for the report
 * @param {Date} endDate - End date for the report
 * @returns {Promise<Object>} - Security report data
 */
exports.generateSecurityReport = async (startDate, endDate) => {
  try {
    // Get log files from the specified time period
    const logDir = path.join(process.cwd(), 'logs/security');
    const files = await fs.readdir(logDir);
    
    // Filter log files within date range
    const relevantFiles = files.filter(file => {
      const fileDateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (!fileDateMatch) return false;
      
      const fileDate = new Date(fileDateMatch[1]);
      return fileDate >= startDate && fileDate <= endDate;
    });
    
    // Analyze each log file
    const analysisResults = await Promise.all(
      relevantFiles.map(file => 
        exports.analyzeSecurityLogs(path.join(logDir, file))
      )
    );
    
    // Aggregate results
    const report = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalFailedLogins: 0,
        uniqueSuspiciousIPs: new Set(),
        sensitiveEndpointAccesses: 0,
        unauthorizedAttempts: 0
      },
      details: analysisResults
    };
    
    // Calculate summary statistics
    analysisResults.forEach(result => {
      Object.values(result.failedLogins).forEach(count => {
        report.summary.totalFailedLogins += count;
      });
      
      Object.keys(result.suspiciousIPs).forEach(ip => {
        report.summary.uniqueSuspiciousIPs.add(ip);
      });
      
      Object.values(result.sensitiveEndpointAccess).forEach(count => {
        report.summary.sensitiveEndpointAccesses += count;
      });
      
      result.unauthorized.forEach(item => {
        report.summary.unauthorizedAttempts += item.count;
      });
    });
    
    // Convert Set to array for JSON serialization
    report.summary.uniqueSuspiciousIPs = 
      Array.from(report.summary.uniqueSuspiciousIPs);
    
    return report;
  } catch (error) {
    logger.error('Error generating security report', { error: error.message });
    throw error;
  }
};

/**
 * Schedule regular security audits
 * @param {number} intervalMinutes - Interval between audits in minutes
 */
exports.scheduleSecurityAudits = (intervalMinutes = 60) => {
  logger.info(`Scheduling security audits every ${intervalMinutes} minutes`);
  
  // Run first audit immediately
  exports.analyzeSecurityLogs(path.join(process.cwd(), 'logs/security/current.log'))
    .then(results => {
      logger.info('Initial security audit completed');
    })
    .catch(error => {
      logger.error('Initial security audit failed', { error: error.message });
    });
  
  // Schedule recurring audits
  setInterval(() => {
    exports.analyzeSecurityLogs(path.join(process.cwd(), 'logs/security/current.log'))
      .then(results => {
        logger.info('Scheduled security audit completed');
      })
      .catch(error => {
        logger.error('Scheduled security audit failed', { error: error.message });
      });
  }, intervalMinutes * 60 * 1000);
};
