/**
 * @file Security Controller
 * @description Controller for security-related endpoints
 * @module controllers/securityController
 */

const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs-extra');
const securityAudit = require('../utils/securityAudit');
const { ROLES } = require('../middleware/accessControl');

/**
 * @desc Run vulnerability scan
 * @route GET /api/v1/security/vulnerability-scan
 * @access Private (Admin only)
 */
exports.runVulnerabilityScan = async (req, res) => {
  try {
    // Get environment from query or default to current environment
    const environment = req.query.environment || process.env.NODE_ENV || 'development';
    
    // Only allow admins to scan production
    if (environment === 'production' && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can run production security scans'
      });
    }
    
    // Run the vulnerability scan script
    const scriptPath = path.join(process.cwd(), 'scripts/security/vulnerability-scan.sh');
    const { stdout, stderr } = await exec(
      `${scriptPath} --environment ${environment} --report-path ./security-reports`
    );
    
    // Parse the report file path from stdout
    const reportPathMatch = stdout.match(/For detailed results, see: ([^\s]+)/);
    const reportPath = reportPathMatch ? reportPathMatch[1] : null;
    
    // Check if high severity issues were found
    const highSeverityMatch = stdout.includes('HIGH SEVERITY ISSUES DETECTED');
    
    return res.status(200).json({
      success: true,
      data: {
        environment,
        reportPath,
        highSeverityIssuesFound: highSeverityMatch,
        output: stdout
      }
    });
  } catch (error) {
    console.error('Error running vulnerability scan:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to run vulnerability scan',
      error: error.message
    });
  }
};

/**
 * @desc Get security audit logs
 * @route GET /api/v1/security/audit-logs
 * @access Private (Admin, Manager)
 */
exports.getSecurityAuditLogs = async (req, res) => {
  try {
    // Parse query parameters
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to last 7 days
    
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();
    
    // Generate security report for the specified time period
    const report = await securityAudit.generateSecurityReport(startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error retrieving security audit logs:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve security audit logs',
      error: error.message
    });
  }
};

/**
 * @desc Get vulnerability reports
 * @route GET /api/v1/security/vulnerability-reports
 * @access Private (Admin, Manager)
 */
exports.getVulnerabilityReports = async (req, res) => {
  try {
    const reportsDir = path.join(process.cwd(), 'security-reports');
    
    // Ensure directory exists
    if (!(await fs.pathExists(reportsDir))) {
      return res.status(200).json({
        success: true,
        data: {
          reports: []
        }
      });
    }
    
    // Get list of report files
    const files = await fs.readdir(reportsDir);
    
    // Filter for JSON reports
    const reportFiles = files.filter(file => 
      file.startsWith('vulnerability-scan-') && file.endsWith('.json')
    );
    
    // Parse environment and date from filenames
    const reports = reportFiles.map(file => {
      const match = file.match(/vulnerability-scan-(\w+)-(\d{4}-\d{2}-\d{2})\.json/);
      
      if (match) {
        return {
          filename: file,
          environment: match[1],
          date: match[2],
          path: `${reportsDir}/${file}`
        };
      }
      
      return null;
    }).filter(Boolean);
    
    // Sort by date, newest first
    reports.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.status(200).json({
      success: true,
      data: {
        reports
      }
    });
  } catch (error) {
    console.error('Error retrieving vulnerability reports:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vulnerability reports',
      error: error.message
    });
  }
};

/**
 * @desc Get specific vulnerability report
 * @route GET /api/v1/security/vulnerability-reports/:filename
 * @access Private (Admin, Manager)
 */
exports.getVulnerabilityReport = async (req, res) => {
  try {
    const { filename } = req.params;
    const reportPath = path.join(process.cwd(), 'security-reports', filename);
    
    // Check if file exists
    if (!(await fs.pathExists(reportPath))) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    // Read report file
    const reportContent = await fs.readJson(reportPath);
    
    return res.status(200).json({
      success: true,
      data: reportContent
    });
  } catch (error) {
    console.error('Error retrieving vulnerability report:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve vulnerability report',
      error: error.message
    });
  }
};

/**
 * @desc Security dashboard statistics
 * @route GET /api/v1/security/dashboard
 * @access Private (Admin, Manager)
 */
exports.getSecurityDashboard = async (req, res) => {
  try {
    // Get recent security audit data
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const endDate = new Date();
    
    const auditReport = await securityAudit.generateSecurityReport(startDate, endDate);
    
    // Get latest vulnerability report
    const reportsDir = path.join(process.cwd(), 'security-reports');
    let latestVulnerabilityReport = null;
    
    if (await fs.pathExists(reportsDir)) {
      const files = await fs.readdir(reportsDir);
      
      // Filter for JSON reports for the current environment
      const environment = process.env.NODE_ENV || 'development';
      const reportFiles = files.filter(file => 
        file.startsWith(`vulnerability-scan-${environment}-`) && file.endsWith('.json')
      );
      
      // Sort by date, newest first
      reportFiles.sort((a, b) => {
        const dateA = a.match(/(\d{4}-\d{2}-\d{2})\.json/)[1];
        const dateB = b.match(/(\d{4}-\d{2}-\d{2})\.json/)[1];
        return new Date(dateB) - new Date(dateA);
      });
      
      // Get the latest report
      if (reportFiles.length > 0) {
        const latestReportPath = path.join(reportsDir, reportFiles[0]);
        latestVulnerabilityReport = await fs.readJson(latestReportPath);
      }
    }
    
    // Calculate security scores
    let securityScore = 100;
    
    // Deduct points for failed JWT config
    if (latestVulnerabilityReport && 
        latestVulnerabilityReport.results.jwt_config_check && 
        latestVulnerabilityReport.results.jwt_config_check.status === 'fail') {
      securityScore -= 15;
    }
    
    // Deduct points for failed MongoDB config
    if (latestVulnerabilityReport && 
        latestVulnerabilityReport.results.mongodb_check && 
        latestVulnerabilityReport.results.mongodb_check.status === 'fail') {
      securityScore -= 15;
    }
    
    // Deduct points for failed SSL config
    if (latestVulnerabilityReport && 
        latestVulnerabilityReport.results.ssl_check && 
        latestVulnerabilityReport.results.ssl_check.status === 'fail') {
      securityScore -= 15;
    }
    
    // Deduct points for failed security headers
    if (latestVulnerabilityReport && 
        latestVulnerabilityReport.results.security_headers && 
        latestVulnerabilityReport.results.security_headers.status === 'fail') {
      securityScore -= 10;
    }
    
    // Deduct points for suspicious activity
    if (auditReport.summary.unauthorizedAttempts > 100) {
      securityScore -= 20;
    } else if (auditReport.summary.unauthorizedAttempts > 50) {
      securityScore -= 10;
    } else if (auditReport.summary.unauthorizedAttempts > 20) {
      securityScore -= 5;
    }
    
    // Ensure score stays in 0-100 range
    securityScore = Math.max(0, Math.min(100, securityScore));
    
    // Prepare dashboard data
    const dashboardData = {
      securityScore,
      vulnerabilityReport: {
        lastScan: latestVulnerabilityReport ? latestVulnerabilityReport.scan_date : null,
        findings: latestVulnerabilityReport ? {
          npmIssues: latestVulnerabilityReport.results.npm_audit 
            ? (latestVulnerabilityReport.results.npm_audit.metadata 
              ? latestVulnerabilityReport.results.npm_audit.metadata.vulnerabilities 
              : null) 
            : null,
          configIssues: {
            jwt: latestVulnerabilityReport.results.jwt_config_check 
              ? latestVulnerabilityReport.results.jwt_config_check.status 
              : null,
            mongodb: latestVulnerabilityReport.results.mongodb_check 
              ? latestVulnerabilityReport.results.mongodb_check.status 
              : null,
            ssl: latestVulnerabilityReport.results.ssl_check 
              ? latestVulnerabilityReport.results.ssl_check.status 
              : null,
            securityHeaders: latestVulnerabilityReport.results.security_headers 
              ? latestVulnerabilityReport.results.security_headers.status 
              : null
          }
        } : null
      },
      securityAudit: {
        period: auditReport.period,
        summary: auditReport.summary
      }
    };
    
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error generating security dashboard:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to generate security dashboard',
      error: error.message
    });
  }
};
