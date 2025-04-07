// src/routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');

// Validation schemas
const documentVerificationSchema = {
  verificationStatus: {
    in: ['body'],
    isIn: {
      options: [['PENDING', 'VERIFIED', 'REJECTED']],
      errorMessage: 'Invalid verification status'
    }
  },
  verificationNotes: {
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
        if (req.body.verificationStatus === 'REJECTED' && !value) {
          throw new Error('Rejection reason is required when rejecting a document');
        }
        return true;
      }
    }
  }
};

const documentLinkSchema = {
  documentIds: {
    in: ['body'],
    isArray: true,
    errorMessage: 'Document IDs must be an array'
  },
  'documentIds.*': {
    in: ['body'],
    isMongoId: true,
    errorMessage: 'Invalid document ID format'
  }
};

const jobStatusChangeSchema = {
  oldStatus: {
    in: ['body'],
    isString: true,
    errorMessage: 'Old status is required'
  },
  newStatus: {
    in: ['body'],
    isString: true,
    errorMessage: 'New status is required'
  },
  applicantIds: {
    in: ['body'],
    optional: true,
    isArray: true,
    errorMessage: 'Applicant IDs must be an array'
  },
  'applicantIds.*': {
    in: ['body'],
    optional: true,
    isMongoId: true,
    errorMessage: 'Invalid applicant ID format'
  },
  message: {
    in: ['body'],
    optional: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 1000 },
      errorMessage: 'Message must be less than 1000 characters'
    }
  }
};

const milestoneSchema = {
  milestone: {
    in: ['body'],
    isIn: {
      options: [['INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'ONBOARDING_STARTED', 'VISA_PROCESSING', 'TRAVEL_ARRANGED']],
      errorMessage: 'Invalid milestone'
    }
  },
  details: {
    in: ['body'],
    optional: true,
    isObject: true,
    errorMessage: 'Details must be an object'
  }
};

const markReadSchema = {
  notificationIds: {
    in: ['body'],
    isArray: true,
    errorMessage: 'Notification IDs must be an array'
  },
  'notificationIds.*': {
    in: ['body'],
    isMongoId: true,
    errorMessage: 'Invalid notification ID format'
  }
};

/**
 * @swagger
 * /api/v1/integrations/applications/{applicationId}/documents:
 *   post:
 *     summary: Link documents to an application
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentIds
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to link
 *     responses:
 *       200:
 *         description: Documents linked successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Application or documents not found
 */
router.post(
  '/applications/:applicationId/documents',
  protect,
  authorize('agent', 'admin', 'jobSeeker'),
  validateRequest(documentLinkSchema),
  integrationController.linkDocumentsToApplication
);

/**
 * @swagger
 * /api/v1/integrations/documents/{documentId}/verification:
 *   put:
 *     summary: Update document verification status
 *     tags: [Integrations]
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
 *               - verificationStatus
 *             properties:
 *               verificationStatus:
 *                 type: string
 *                 enum: [PENDING, VERIFIED, REJECTED]
 *                 description: New verification status
 *               verificationNotes:
 *                 type: string
 *                 description: Optional notes about verification
 *               rejectionReason:
 *                 type: string
 *                 description: Required when rejecting a document
 *     responses:
 *       200:
 *         description: Document verification updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Document not found
 */
router.put(
  '/documents/:documentId/verification',
  protect,
  authorize('admin', 'agent'),
  validateRequest(documentVerificationSchema),
  integrationController.updateDocumentVerification
);

/**
 * @swagger
 * /api/v1/integrations/documents/check-expirations:
 *   post:
 *     summary: Check for expiring documents and send notifications
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiration check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     checked:
 *                       type: number
 *                     notified:
 *                       type: number
 *       401:
 *         description: Not authorized
 */
router.post(
  '/documents/check-expirations',
  protect,
  authorize('admin'),
  integrationController.checkDocumentExpirations
);

/**
 * @swagger
 * /api/v1/integrations/users/{userId}/sync-verification:
 *   post:
 *     summary: Sync user verification status with documents
 *     tags: [Integrations]
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
 *         description: Verification status synced successfully
 *       404:
 *         description: User not found
 */
router.post(
  '/users/:userId/sync-verification',
  protect,
  authorize('admin', 'agent'),
  integrationController.syncProfileVerification
);

/**
 * @swagger
 * /api/v1/integrations/profiles/{profileId}/jobs/{jobId}/eligibility:
 *   get:
 *     summary: Check if a profile is eligible for a job application
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profile
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *     responses:
 *       200:
 *         description: Eligibility check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     eligible:
 *                       type: boolean
 *                     reasons:
 *                       type: array
 *                       items:
 *                         type: string
 *                     missingRequirements:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: Profile or job not found
 */
router.get(
  '/profiles/:profileId/jobs/:jobId/eligibility',
  protect,
  integrationController.checkApplicationEligibility
);

/**
 * @swagger
 * /api/v1/integrations/profiles/{profileId}/sync-applications:
 *   post:
 *     summary: Sync profile changes with associated applications
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profile
 *     responses:
 *       200:
 *         description: Applications synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *       404:
 *         description: Profile not found
 */
router.post(
  '/profiles/:profileId/sync-applications',
  protect,
  integrationController.syncProfileWithApplications
);

/**
 * @swagger
 * /api/v1/integrations/profiles/{profileId}/update-completeness:
 *   post:
 *     summary: Update profile completeness status
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the profile
 *     responses:
 *       200:
 *         description: Profile completeness updated
 *       404:
 *         description: Profile not found
 */
router.post(
  '/profiles/:profileId/update-completeness',
  protect,
  integrationController.updateProfileCompleteness
);

/**
 * @swagger
 * /api/v1/integrations/users/{userId}/kyc-status:
 *   get:
 *     summary: Check KYC verification status of a user
 *     tags: [Integrations]
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
 *         description: KYC status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     kycVerified:
 *                       type: boolean
 *                     documents:
 *                       type: object
 *                       properties:
 *                         identityVerified:
 *                           type: boolean
 *                         addressVerified:
 *                           type: boolean
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:userId/kyc-status',
  protect,
  integrationController.checkKycStatus
);

/**
 * @swagger
 * /api/v1/integrations/jobs/{jobId}/status-notification:
 *   post:
 *     summary: Send notifications when job status changes
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldStatus
 *               - newStatus
 *             properties:
 *               oldStatus:
 *                 type: string
 *               newStatus:
 *                 type: string
 *               applicantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *       404:
 *         description: Job not found
 */
router.post(
  '/jobs/:jobId/status-notification',
  protect,
  authorize('admin', 'agent', 'sponsor'),
  validateRequest(jobStatusChangeSchema),
  integrationController.jobStatusChangeNotification
);

/**
 * @swagger
 * /api/v1/integrations/applications/{applicationId}/milestone-notification:
 *   post:
 *     summary: Send notifications for application milestones
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - milestone
 *             properties:
 *               milestone:
 *                 type: string
 *                 enum: [INTERVIEW_SCHEDULED, OFFER_EXTENDED, ONBOARDING_STARTED, VISA_PROCESSING, TRAVEL_ARRANGED]
 *               details:
 *                 type: object
 *     responses:
 *       200:
 *         description: Milestone notification sent successfully
 *       404:
 *         description: Application not found
 */
router.post(
  '/applications/:applicationId/milestone-notification',
  protect,
  authorize('admin', 'agent', 'sponsor'),
  validateRequest(milestoneSchema),
  integrationController.applicationMilestoneNotification
);

/**
 * @swagger
 * /api/v1/integrations/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications for the current user
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 */
router.get(
  '/notifications/unread-count',
  protect,
  integrationController.getUnreadNotificationCount
);

/**
 * @swagger
 * /api/v1/integrations/notifications:
 *   get:
 *     summary: Get all notifications for the current user
 *     tags: [Integrations]
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
 *         description: Number of notifications per page
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 */
router.get(
  '/notifications',
  protect,
  integrationController.getUserNotifications
);

/**
 * @swagger
 * /api/v1/integrations/notifications/mark-read:
 *   put:
 *     summary: Mark specific notifications as read
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: Invalid notification IDs
 */
router.put(
  '/notifications/mark-read',
  protect,
  validateRequest(markReadSchema),
  integrationController.markNotificationsAsRead
);

/**
 * @swagger
 * /api/v1/integrations/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read for the current user
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: number
 */
router.put(
  '/notifications/mark-all-read',
  protect,
  integrationController.markAllNotificationsAsRead
);

module.exports = router;
