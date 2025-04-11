/**
 * ThiQaX SSL Certificate Monitor
 * 
 * This script monitors SSL certificates for ThiQaX domains and sends notifications
 * when certificates are nearing expiration. It can be run as a scheduled job
 * or integrated with monitoring systems.
 * 
 * The monitor checks certificate validity, expiration dates, and security
 * configuration across all ThiQaX domains in various environments.
 * 
 * Features:
 * - Multi-domain certificate monitoring
 * - Environment-specific checks (staging, production)
 * - Multiple notification channels (email, Slack, monitoring system)
 * - Detailed reports with certificate health metrics
 * - Integration with monitoring dashboard
 * 
 * Usage:
 *   NODE_ENV=production node certificate-monitor.js [options]
 * 
 * Options:
 *   --notify-only     Check without writing to monitoring system
 *   --domains=domain1,domain2    Specific domains to check
 *   --threshold=N     Alert threshold in days (default: 30)
 */

'use strict';

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const https = require('https');
const nodemailer = require('nodemailer');
const axios = require('axios');
const winston = require('winston');

// Configuration
const config = {
  // Certificate checking
  threshold: {
    warning: process.env.CERT_WARNING_THRESHOLD || 30, // days
    critical: process.env.CERT_CRITICAL_THRESHOLD || 14, // days
    urgent: process.env.CERT_URGENT_THRESHOLD || 7 // days
  },
  
  // Domains to monitor (can be overridden with --domains flag)
  domains: process.env.MONITORED_DOMAINS ? 
    process.env.MONITORED_DOMAINS.split(',') : 
    ['thiqax.com', 'staging.thiqax.com', 'api.thiqax.com', 'api.staging.thiqax.com'],
  
  // Certificate paths
  certPaths: {
    // Default Let's Encrypt paths
    letsencrypt: '/etc/letsencrypt/live',
    // Nginx SSL directory
    nginx: '/etc/nginx/ssl'
  },
  
  // Email notifications
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    from: process.env.EMAIL_FROM || 'monitoring@thiqax.com',
    to: process.env.EMAIL_RECIPIENTS || 'admin@thiqax.com,security@thiqax.com'
  },
  
  // Slack notifications
  slack: {
    enabled: process.env.SLACK_NOTIFICATIONS === 'true',
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_CHANNEL || '#monitoring'
  },
  
  // Prometheus metrics
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    endpoint: process.env.METRICS_ENDPOINT || 'http://localhost:9091/metrics/job/ssl-monitor'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    filename: 'certificate-monitor.log'
  }
};

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    notifyOnly: false,
    domains: config.domains,
    threshold: config.threshold.warning
  };
  
  args.forEach(arg => {
    if (arg === '--notify-only') {
      options.notifyOnly = true;
    } else if (arg.startsWith('--domains=')) {
      options.domains = arg.substring(10).split(',');
    } else if (arg.startsWith('--threshold=')) {
      options.threshold = parseInt(arg.substring(12), 10);
    }
  });
  
  return options;
}

// Setup logger
function setupLogger() {
  const logDir = config.logging.dir;
  
  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  return winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ 
        filename: path.join(logDir, config.logging.filename),
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
}

/**
 * Check certificate expiration date using OpenSSL
 * @param {string} domain Domain to check
 * @param {string} certPath Path to certificate file (optional)
 * @returns {Promise<Object>} Certificate information
 */
async function checkCertificate(domain, certPath = null) {
  const logger = setupLogger();
  
  try {
    let cmd;
    let certInfo = {
      domain,
      valid: false,
      daysRemaining: 0,
      expiryDate: null,
      issuer: null,
      subject: null,
      error: null
    };
    
    // If cert path is provided, check local file
    if (certPath) {
      logger.debug(`Checking local certificate at ${certPath} for ${domain}`);
      cmd = `openssl x509 -in ${certPath} -noout -dates -issuer -subject`;
    } else {
      // Otherwise check directly using HTTPS connection
      logger.debug(`Checking remote certificate for ${domain}`);
      cmd = `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates -issuer -subject`;
    }
    
    const { stdout, stderr } = await execAsync(cmd);
    
    if (stderr) {
      logger.error(`Error checking certificate for ${domain}: ${stderr}`);
      certInfo.error = stderr;
      return certInfo;
    }
    
    // Parse certificate information
    const notBeforeMatch = stdout.match(/notBefore=(.+)/);
    const notAfterMatch = stdout.match(/notAfter=(.+)/);
    const issuerMatch = stdout.match(/issuer=(.+)/);
    const subjectMatch = stdout.match(/subject=(.+)/);
    
    if (notAfterMatch) {
      const expiryDate = new Date(notAfterMatch[1]);
      const now = new Date();
      const diffTime = expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      certInfo.valid = true;
      certInfo.daysRemaining = diffDays;
      certInfo.expiryDate = expiryDate.toISOString();
      certInfo.issuer = issuerMatch ? issuerMatch[1] : null;
      certInfo.subject = subjectMatch ? subjectMatch[1] : null;
      
      logger.info(`Certificate for ${domain} expires in ${diffDays} days (${expiryDate.toISOString()})`);
    } else {
      logger.error(`Could not determine expiry date for ${domain}`);
      certInfo.error = 'Could not determine expiry date';
    }
    
    return certInfo;
  } catch (error) {
    logger.error(`Exception checking certificate for ${domain}: ${error.message}`);
    return {
      domain,
      valid: false,
      daysRemaining: 0,
      expiryDate: null,
      issuer: null,
      subject: null,
      error: error.message
    };
  }
}

/**
 * Check certificate security configuration
 * @param {string} domain Domain to check
 * @returns {Promise<Object>} Security configuration information
 */
async function checkSecurityConfig(domain) {
  const logger = setupLogger();
  
  try {
    logger.debug(`Checking security configuration for ${domain}`);
    
    // Use SSLyze or similar tool to check configuration
    // This is a simplified example - in production, use a robust SSL testing tool
    const cmd = `echo | openssl s_client -servername ${domain} -connect ${domain}:443 -tls1_2 2>&1`;
    
    const { stdout, stderr } = await execAsync(cmd);
    
    // Parse security information
    const securityInfo = {
      domain,
      protocols: {
        tls12: stdout.includes('TLSv1.2'),
        tls13: stdout.includes('TLSv1.3')
      },
      ciphers: [],
      securityGrade: 'Unknown',
      issues: []
    };
    
    // Check for weak ciphers (simplified example)
    if (stdout.includes('RC4') || stdout.includes('DES')) {
      securityInfo.issues.push('Weak ciphers detected');
    }
    
    // Check for proper certificate chain
    if (!stdout.includes('Verify return code: 0 (ok)')) {
      securityInfo.issues.push('Certificate chain validation failed');
    }
    
    // Determine security grade (simplified)
    if (securityInfo.issues.length === 0 && securityInfo.protocols.tls13) {
      securityInfo.securityGrade = 'A';
    } else if (securityInfo.issues.length === 0 && securityInfo.protocols.tls12) {
      securityInfo.securityGrade = 'B';
    } else if (securityInfo.issues.length > 0) {
      securityInfo.securityGrade = 'C';
    } else {
      securityInfo.securityGrade = 'F';
    }
    
    logger.info(`Security configuration for ${domain} rated ${securityInfo.securityGrade}`);
    return securityInfo;
  } catch (error) {
    logger.error(`Exception checking security config for ${domain}: ${error.message}`);
    return {
      domain,
      protocols: {},
      ciphers: [],
      securityGrade: 'Error',
      issues: [error.message]
    };
  }
}

/**
 * Find certificate path for domain
 * @param {string} domain Domain name
 * @returns {Promise<string|null>} Path to certificate or null if not found
 */
async function findCertificatePath(domain) {
  const logger = setupLogger();
  
  // Check Let's Encrypt path
  const letsEncryptPath = path.join(config.certPaths.letsencrypt, domain, 'fullchain.pem');
  
  if (fs.existsSync(letsEncryptPath)) {
    logger.debug(`Found Let's Encrypt certificate for ${domain} at ${letsEncryptPath}`);
    return letsEncryptPath;
  }
  
  // Check Nginx SSL directory
  // Assuming certificates might be named like domain.crt or with domain in the filename
  const nginxSslDir = config.certPaths.nginx;
  
  if (fs.existsSync(nginxSslDir)) {
    const files = fs.readdirSync(nginxSslDir);
    
    // Look for files that might contain the domain name
    for (const file of files) {
      if (file.endsWith('.crt') || file.endsWith('.pem')) {
        if (file.includes(domain.replace(/\./g, '_')) || 
            file.includes(domain.split('.')[0]) ||
            file === 'thiqax.crt') {
          
          const certPath = path.join(nginxSslDir, file);
          logger.debug(`Found possible certificate for ${domain} at ${certPath}`);
          return certPath;
        }
      }
    }
  }
  
  logger.warn(`Could not find local certificate for ${domain}`);
  return null;
}

/**
 * Send email notification about certificate status
 * @param {Array} results Certificate check results
 * @returns {Promise<boolean>} Success status
 */
async function sendEmailNotification(results) {
  const logger = setupLogger();
  
  if (!config.email.enabled) {
    logger.debug('Email notifications are disabled');
    return false;
  }
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass
      }
    });
    
    // Format the email content
    let criticalCerts = results.filter(cert => cert.daysRemaining <= config.threshold.critical);
    let warningCerts = results.filter(cert => 
      cert.daysRemaining > config.threshold.critical && 
      cert.daysRemaining <= config.threshold.warning
    );
    
    const subjectLine = criticalCerts.length > 0 
      ? `[CRITICAL] ThiQaX SSL Certificates Expiring Soon` 
      : `[WARNING] ThiQaX SSL Certificates Status Report`;
    
    let emailContent = `<h2>ThiQaX SSL Certificate Status Report</h2>
<p>Generated on: ${new Date().toISOString()}</p>`;
    
    if (criticalCerts.length > 0) {
      emailContent += `<h3 style="color: #d00000;">CRITICAL: Certificates Expiring Soon</h3>
<table border="1" cellpadding="5" style="border-collapse: collapse;">
<tr style="background-color: #f2f2f2;"><th>Domain</th><th>Days Remaining</th><th>Expiry Date</th></tr>`;
      
      criticalCerts.forEach(cert => {
        emailContent += `<tr style="background-color: #ffe6e6;">
<td>${cert.domain}</td>
<td style="text-align: center; font-weight: bold;">${cert.daysRemaining}</td>
<td>${new Date(cert.expiryDate).toLocaleDateString()}</td>
</tr>`;
      });
      
      emailContent += `</table>`;
    }
    
    if (warningCerts.length > 0) {
      emailContent += `<h3 style="color: #f2c744;">WARNING: Certificates Nearing Expiration</h3>
<table border="1" cellpadding="5" style="border-collapse: collapse;">
<tr style="background-color: #f2f2f2;"><th>Domain</th><th>Days Remaining</th><th>Expiry Date</th></tr>`;
      
      warningCerts.forEach(cert => {
        emailContent += `<tr style="background-color: #fff9e6;">
<td>${cert.domain}</td>
<td style="text-align: center; font-weight: bold;">${cert.daysRemaining}</td>
<td>${new Date(cert.expiryDate).toLocaleDateString()}</td>
</tr>`;
      });
      
      emailContent += `</table>`;
    }
    
    // Add a summary of all certificates
    emailContent += `<h3>All Certificates</h3>
<table border="1" cellpadding="5" style="border-collapse: collapse;">
<tr style="background-color: #f2f2f2;"><th>Domain</th><th>Days Remaining</th><th>Expiry Date</th><th>Issuer</th></tr>`;
    
    results.forEach(cert => {
      let rowColor = '';
      if (cert.daysRemaining <= config.threshold.critical) {
        rowColor = '#ffe6e6'; // Light red
      } else if (cert.daysRemaining <= config.threshold.warning) {
        rowColor = '#fff9e6'; // Light yellow
      }
      
      emailContent += `<tr style="background-color: ${rowColor};">
<td>${cert.domain}</td>
<td style="text-align: center; font-weight: bold;">${cert.daysRemaining}</td>
<td>${cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}</td>
<td>${cert.issuer || 'N/A'}</td>
</tr>`;
    });
    
    emailContent += `</table>`;
    
    // Add footer with helpful information
    emailContent += `<p style="margin-top: 20px; font-size: 0.9em; color: #666;">
To renew certificates, run:<br>
<code>./renew-certificates.sh</code> or <code>./renew-certificates.sh --force</code> for immediate renewal.
</p>`;
    
    // Send the email
    const mailOptions = {
      from: config.email.from,
      to: config.email.to,
      subject: subjectLine,
      html: emailContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email notification sent: ${info.messageId}`);
    return true;
    
  } catch (error) {
    logger.error(`Error sending email notification: ${error.message}`);
    return false;
  }
}

/**
 * Send Slack notification about certificate status
 * @param {Array} results Certificate check results
 * @returns {Promise<boolean>} Success status
 */
async function sendSlackNotification(results) {
  const logger = setupLogger();
  
  if (!config.slack.enabled || !config.slack.webhookUrl) {
    logger.debug('Slack notifications are disabled or webhook URL not configured');
    return false;
  }
  
  try {
    // Filter certificates needing attention
    const criticalCerts = results.filter(cert => cert.daysRemaining <= config.threshold.critical);
    const warningCerts = results.filter(cert => 
      cert.daysRemaining > config.threshold.critical && 
      cert.daysRemaining <= config.threshold.warning
    );
    
    // Determine notification color
    let color = '#36a64f'; // Green
    if (criticalCerts.length > 0) {
      color = '#d00000'; // Red
    } else if (warningCerts.length > 0) {
      color = '#f2c744'; // Yellow
    }
    
    // Create Slack message
    const slackMessage = {
      channel: config.slack.channel,
      attachments: [
        {
          color: color,
          pretext: criticalCerts.length > 0 
            ? ':rotating_light: *CRITICAL: SSL Certificates Expiring Soon*' 
            : (warningCerts.length > 0 
              ? ':warning: *WARNING: SSL Certificates Nearing Expiration*' 
              : ':white_check_mark: *SSL Certificates Status Report*'),
          fields: [
            {
              title: 'Certificate Status Summary',
              value: `Total certificates: ${results.length}\nCritical (≤ ${config.threshold.critical} days): ${criticalCerts.length}\nWarning (≤ ${config.threshold.warning} days): ${warningCerts.length}`,
              short: false
            }
          ],
          footer: 'ThiQaX SSL Certificate Monitor',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
    
    // Add fields for critical certificates
    if (criticalCerts.length > 0) {
      slackMessage.attachments[0].fields.push({
        title: 'Critical Certificates',
        value: criticalCerts.map(cert => 
          `*${cert.domain}*: ${cert.daysRemaining} days remaining (expires ${new Date(cert.expiryDate).toLocaleDateString()})`
        ).join('\n'),
        short: false
      });
    }
    
    // Add fields for warning certificates
    if (warningCerts.length > 0) {
      slackMessage.attachments[0].fields.push({
        title: 'Warning Certificates',
        value: warningCerts.map(cert => 
          `*${cert.domain}*: ${cert.daysRemaining} days remaining (expires ${new Date(cert.expiryDate).toLocaleDateString()})`
        ).join('\n'),
        short: false
      });
    }
    
    // Send to Slack webhook
    await axios.post(config.slack.webhookUrl, slackMessage);
    
    logger.info('Slack notification sent successfully');
    return true;
    
  } catch (error) {
    logger.error(`Error sending Slack notification: ${error.message}`);
    return false;
  }
}

/**
 * Send metrics to Prometheus Push Gateway
 * @param {Array} results Certificate check results
 * @returns {Promise<boolean>} Success status
 */
async function sendMetrics(results) {
  const logger = setupLogger();
  
  if (!config.metrics.enabled) {
    logger.debug('Prometheus metrics are disabled');
    return false;
  }
  
  try {
    // Format metrics for Prometheus
    let metrics = '';
    
    // Certificate expiration metric
    metrics += '# HELP ssl_certificate_days_remaining Days until certificate expiration\n';
    metrics += '# TYPE ssl_certificate_days_remaining gauge\n';
    
    results.forEach(cert => {
      if (cert.valid) {
        metrics += `ssl_certificate_days_remaining{domain="${cert.domain}"} ${cert.daysRemaining}\n`;
      }
    });
    
    // Certificate validity metric (0=invalid, 1=valid)
    metrics += '# HELP ssl_certificate_valid Certificate validity status (0=invalid, 1=valid)\n';
    metrics += '# TYPE ssl_certificate_valid gauge\n';
    
    results.forEach(cert => {
      metrics += `ssl_certificate_valid{domain="${cert.domain}"} ${cert.valid ? 1 : 0}\n`;
    });
    
    // Send metrics to Prometheus Push Gateway
    await axios.post(config.metrics.endpoint, metrics, {
      headers: { 'Content-Type': 'text/plain' }
    });
    
    logger.info('Metrics sent to Prometheus Push Gateway');
    return true;
    
  } catch (error) {
    logger.error(`Error sending metrics: ${error.message}`);
    return false;
  }
}

/**
 * Generate a detailed report of all certificate results
 * @param {Array} results Certificate check results
 * @param {Array} securityResults Security check results
 * @returns {string} HTML report
 */
function generateReport(results, securityResults) {
  // Create consolidated results by matching certificate and security data
  const consolidatedResults = results.map(cert => {
    const security = securityResults.find(sec => sec.domain === cert.domain) || {
      securityGrade: 'N/A',
      issues: []
    };
    
    return {
      ...cert,
      securityGrade: security.securityGrade,
      securityIssues: security.issues
    };
  });
  
  // Count certificates by status
  const criticalCount = consolidatedResults.filter(r => r.valid && r.daysRemaining <= config.threshold.critical).length;
  const warningCount = consolidatedResults.filter(r => r.valid && r.daysRemaining > config.threshold.critical && r.daysRemaining <= config.threshold.warning).length;
  const okCount = consolidatedResults.filter(r => r.valid && r.daysRemaining > config.threshold.warn
