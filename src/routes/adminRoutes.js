// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// Validation schemas
const verificationStatusUpdateSchema = {
  status: {
    in: ['body'],
    isIn: {
      options: [['APPROVED', 'REJECTED', 'PENDING_REVIEW']],
      errorMessage: 'Invalid verification status'
    }
  },
  notes: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true
  },
  rejectionReason: {
    in: ['body'],
    optional: { options: { nullable: true } },
    isString: true,
    isLength: {
      options: { min: 5, max: 500 },
      errorMessage: 'Rejection reason must be between 5 and 500 characters'
    },
    custom: {
      options: (value, { req }) => {
        if (req.body.status === 'REJECTED' && !value) {
          throw new Error('Rejection reason is required when rejecting');
        }
        return true;
      }
    }
  }
};

const userStatusUpdateSchema = {
  status: {
    in: ['body'],
    isIn: {
      options: [['ACTIVE', 'SUSPENDED', 'DEACTIVATED']],
      errorMessage: 'Invalid user status'
    }
  },
  reason: {
    in: ['body'],
    optional: { options: { nullable: true } },
    isString: true,
    isLength: {
      options: { min: 5, max: 500 },
      errorMessage: 'Reason must be between 5 and 500 characters'
    }
  }
};

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard metrics and summary
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/dashboard',
  protect,
  authorize('admin'),
  adminController.getDashboardMetrics
);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with pagination and filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [jobSeeker, agent, sponsor, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, DEACTIVATED, ALL]
 *         description: Filter by account status
 *       - in: query
 *         name: kycVerified
 *         schema:
 *           type: boolean
 *         description: Filter by KYC verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/users',
  protect,
  authorize('admin'),
  adminController.getUsers
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get detailed user information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:userId',
  protect,
  authorize('admin'),
  adminController.getUserDetails
);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/status:
 *   put:
 *     summary: Update user account status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED, DEACTIVATED]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.put(
  '/users/:userId/status',
  protect,
  authorize('admin'),
  validateRequest(userStatusUpdateSchema),
  adminController.updateUserStatus
);

/**
 * @swagger
 * /api/v1/admin/verification/pending:
 *   get:
 *     summary: Get all pending verifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: Pending verifications retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/verification/pending',
  protect,
  authorize('admin'),
  adminController.getPendingVerifications
);

/**
 * @swagger
 * /api/v1/admin/verification/{documentId}:
 *   put:
 *     summary: Update verification status for a document
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, PENDING_REVIEW]
 *               notes:
 *                 type: string
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Document not found
 */
router.put(
  '/verification/:documentId',
  protect,
  authorize('admin'),
  validateRequest(verificationStatusUpdateSchema),
  adminController.updateVerificationStatus
);

/**
 * @swagger
 * /api/v1/admin/system/metrics:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Time period for metrics
 *     responses:
 *       200:
 *         description: System metrics retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/system/metrics',
  protect,
  authorize('admin'),
  adminController.getSystemMetrics
);

/**
 * @swagger
 * /api/v1/admin/analytics/reports:
 *   get:
 *     summary: Get analytics reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [user-growth, job-postings, applications, verifications, conversions]
 *           required: true
 *         description: Type of report to generate
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report data
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report data
 *     responses:
 *       200:
 *         description: Report data retrieved successfully
 *       400:
 *         description: Invalid report type
 *       401:
 *         description: Not authorized
 */
router.get(
  '/analytics/reports',
  protect,
  authorize('admin'),
  adminController.getAnalyticsReports
);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/settings',
  protect,
  authorize('admin'),
  adminController.getSystemSettings
);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid settings data
 *       401:
 *         description: Not authorized
 */
router.put(
  '/settings',
  protect,
  authorize('admin'),
  adminController.updateSystemSettings
);

/**
 * @swagger
 * /api/v1/admin/audit-logs:
 *   get:
 *     summary: Get system audit logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of logs per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for logs
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for logs
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get(
  '/audit-logs',
  protect,
  authorize('admin'),
  adminController.getAuditLogs
);

module.exports = router;
