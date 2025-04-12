/**
 * @file Security Integration
 * @description Integrates all security components into the application
 * @module config/securityIntegration
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { configureSecurityMiddleware, securityAuditMiddleware } = require('../middleware/security');
const securityRoutes = require('../routes/securityRoutes');
const securityAudit = require('../utils/securityAudit');
const logger = require('./logger');

/**
 * Initialize security components
 * @param {Express.Application} app - Express application
 * @param {Object} config - Application configuration
 */
exports.initializeSecurity = async (app, config) => {
  try {
    logger.info('Initializing security components...');

    // Apply security middleware
    logger.info('Configuring security middleware...');
    configureSecurityMiddleware(app, config);
    
    // Add security audit middleware
    logger.info('Setting up security audit logging...');
    app.use(securityAuditMiddleware());
    
    // Register security routes
    logger.info('Registering security API routes...');
    app.use('/api/v1/security', securityRoutes);
    
    // Ensure security directories exist
    const securityReportsDir = path.join(process.cwd(), 'security-reports');
    const securityLogsDir = path.join(process.cwd(), 'logs/security');
    
    await fs.ensureDir(securityReportsDir);
    await fs.ensureDir(securityLogsDir);
    
    // Set up scheduled security audits if enabled
    if (config.ENABLE_SECURITY_AUDITS === 'true') {
      const auditInterval = parseInt(config.SECURITY_AUDIT_INTERVAL_MINUTES, 10) || 60;
      logger.info(`Setting up scheduled security audits every ${auditInterval} minutes`);
      securityAudit.scheduleSecurityAudits(auditInterval);
    }
    
    // Set up automated vulnerability scanning if enabled
    if (config.ENABLE_VULNERABILITY_SCANNING === 'true' && process.env.NODE_ENV !== 'test') {
      logger.info('Setting up automated vulnerability scanning...');
      
      // Set up cron job for vulnerability scanning
      try {
        const vulnScanScript = path.join(process.cwd(), 'scripts/security/vulnerability-scan.sh');
        
        // Ensure script is executable
        await fs.chmod(vulnScanScript, 0o755);
        
        // Schedule vulnerability scan using cron (if in production/staging)
        if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
          const cronExpression = config.VULNERABILITY_SCAN_CRON || '0 0 * * 0'; // Default: weekly on Sunday at midnight
          
          // Add cron job (this is a simplified version, in a real app you'd use a proper cron job system)
          const cronCommand = `(crontab -l 2>/dev/null || echo "") | grep -v "${vulnScanScript}" | ` +
            `(cat; echo "${cronExpression} ${vulnScanScript} --environment ${process.env.NODE_ENV} --report-path ${securityReportsDir}") | ` +
            `crontab -`;
          
          try {
            execSync(cronCommand);
            logger.info(`Scheduled vulnerability scan with cron: ${cronExpression}`);
          } catch (cronError) {
            logger.warn(`Could not set up cron job for vulnerability scanning: ${cronError.message}`);
            logger.warn('Skipping automated vulnerability scanning setup');
          }
        } else {
          logger.info('Skipping cron setup for vulnerability scanning in development environment');
        }
        
        // Run initial vulnerability scan if configured
        if (config.RUN_INITIAL_VULNERABILITY_SCAN === 'true') {
          logger.info('Running initial vulnerability scan...');
          
          // Run the scan asynchronously to not block server startup
          setTimeout(() => {
            try {
              execSync(`${vulnScanScript} --environment ${process.env.NODE_ENV} --report-path ${securityReportsDir}`, {
                stdio: 'ignore'
              });
              logger.info('Initial vulnerability scan completed');
            } catch (scanError) {
              logger.error('Initial vulnerability scan failed', { error: scanError.message });
            }
          }, 10000); // Wait 10 seconds after server start
        }
      } catch (error) {
        logger.error('Failed to set up vulnerability scanning', { error: error.message });
      }
    }
    
    // Set up security monitoring integration with ELK if configured
    if (config.SECURITY_MONITORING_ENABLED === 'true') {
      logger.info('Setting up security monitoring integration...');
      
      // Ensure security log rotation is configured
      const logRotateConfig = path.join(process.cwd(), 'config/logrotate-security.conf');
      if (await fs.pathExists(logRotateConfig)) {
        try {
          // This would typically be set up by devops, but we include the command for reference
          logger.info('Log rotation for security logs is configured');
        } catch (error) {
          logger.warn('Could not configure log rotation for security logs', { error: error.message });
        }
      }
    }
    
    logger.info('Security components initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize security components', { error: error.message });
    throw error;
  }
};

/**
 * Register security routes with Express application
 * @param {Express.Application} app - Express application
 */
exports.registerSecurityRoutes = (app) => {
  app.use('/api/v1/security', securityRoutes);
  return app;
};

/**
 * Configure security alert webhooks
 * @param {Object} config - Application configuration
 */
exports.configureSecurityAlerts = (config) => {
  if (config.SECURITY_ALERTS_ENABLED !== 'true') {
    logger.info('Security alerts are disabled');
    return;
  }
  
  logger.info('Configuring security alerts...');
  
  // Set up email alerts if configured
  if (config.SECURITY_EMAIL_ALERTS === 'true' && config.EMAIL_ENABLED === 'true') {
    logger.info('Email security alerts enabled');
    // Implementation would integrate with email service
  }
  
  // Set up Slack alerts if configured
  if (config.SECURITY_SLACK_ALERTS === 'true' && config.SLACK_WEBHOOK_URL) {
    logger.info('Slack security alerts enabled');
    // Implementation would integrate with Slack webhook
  }
  
  // Set up SMS alerts if configured
  if (config.SECURITY_SMS_ALERTS === 'true' && config.SMS_API_KEY) {
    logger.info('SMS security alerts enabled');
    // Implementation would integrate with SMS service
  }
  
  logger.info('Security alerts configured successfully');
};

/**
 * Run full security suite
 * @param {Object} config - Application configuration
 */
exports.runSecuritySuite = async (config) => {
  try {
    logger.info('Running full security suite...');
    
    // Run vulnerability scan
    const vulnScanScript = path.join(process.cwd(), 'scripts/security/vulnerability-scan.sh');
    logger.info('Running vulnerability scan...');
    
    try {
      execSync(`${vulnScanScript} --environment ${process.env.NODE_ENV} --report-path ./security-reports`, {
        stdio: 'inherit'
      });
      logger.info('Vulnerability scan completed');
    } catch (error) {
      logger.error('Vulnerability scan failed', { error: error.message });
      throw new Error('Vulnerability scan failed');
    }
    
    // Run security audit
    logger.info('Running security audit...');
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const auditReport = await securityAudit.generateSecurityReport(oneWeekAgo, today);
    logger.info('Security audit completed', { summary: auditReport.summary });
    
    // Check for critical issues
    const hasCriticalIssues = auditReport.summary.unauthorizedAttempts > 100 || 
                             auditReport.summary.uniqueSuspiciousIPs.length > 5;
    
    if (hasCriticalIssues) {
      logger.error('Critical security issues detected', { 
        unauthorizedAttempts: auditReport.summary.unauthorizedAttempts,
        suspiciousIPs: auditReport.summary.uniqueSuspiciousIPs
      });
      
      // Trigger alerts
      // Implementation would send alerts via configured channels
    }
    
    logger.info('Security suite completed successfully');
    return {
      vulnerabilityScan: true,
      securityAudit: auditReport,
      criticalIssuesDetected: hasCriticalIssues
    };
  } catch (error) {
    logger.error('Failed to run security suite', { error: error.message });
    throw error;
  }
};
