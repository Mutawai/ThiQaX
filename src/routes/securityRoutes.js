/**
 * @file Security Routes
 * @description API routes for security management
 * @module routes/securityRoutes
 */

const express = require('express');
const { 
  runVulnerabilityScan,
  getSecurityAuditLogs,
  getVulnerabilityReports,
  getVulnerabilityReport,
  getSecurityDashboard
} = require('../controllers/securityController');
const { protect } = require('../middleware/auth');
const { restrictToRoles, hasPermission } = require('../middleware/accessControl');
const { ROLES, PERMISSIONS } = require('../middleware/accessControl');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Security dashboard
router.get(
  '/dashboard',
  restrictToRoles(ROLES.ADMIN, ROLES.MANAGER),
  getSecurityDashboard
);

// Vulnerability scanning
router.get(
  '/vulnerability-scan',
  restrictToRoles(ROLES.ADMIN),
  runVulnerabilityScan
);

// Vulnerability reports
router.get(
  '/vulnerability-reports',
  restrictToRoles(ROLES.ADMIN, ROLES.MANAGER),
  getVulnerabilityReports
);

router.get(
  '/vulnerability-reports/:filename',
  restrictToRoles(ROLES.ADMIN, ROLES.MANAGER),
  getVulnerabilityReport
);

// Security audit logs
router.get(
  '/audit-logs',
  restrictToRoles(ROLES.ADMIN, ROLES.MANAGER),
  getSecurityAuditLogs
);

/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security management endpoints
 */

/**
 * @swagger
 * /api/v1/security/dashboard:
 *   get:
 *     summary: Get security dashboard data
 *     description: Returns security metrics and status for dashboard
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/security/vulnerability-scan:
 *   get:
 *     summary: Run vulnerability scan
 *     description: Triggers a vulnerability scan for the specified environment
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *           enum: [development, staging, production]
 *         description: Environment to scan
 *     responses:
 *       200:
 *         description: Scan results
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/security/vulnerability-reports:
 *   get:
 *     summary: Get vulnerability reports
 *     description: Returns a list of vulnerability scan reports
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/security/vulnerability-reports/{filename}:
 *   get:
 *     summary: Get specific vulnerability report
 *     description: Returns the content of a specific vulnerability report
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Report filename
 *     responses:
 *       200:
 *         description: Report content
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server Error
 */

/**
 * @swagger
 * /api/v1/security/audit-logs:
 *   get:
 *     summary: Get security audit logs
 *     description: Returns security audit logs for a specified time period
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Audit logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server Error
 */

module.exports = router;
