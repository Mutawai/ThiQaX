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

// Document - Application Integration Routes
router.post(
  '/applications/:applicationId/documents',
  protect,
  authorize('agent', 'admin', 'jobSeeker'),
  validateRequest(documentLinkSchema),
  integrationController.linkDocumentsToApplication
);

router.put(
  '/documents/:documentId/verification',
  protect,
  authorize('admin', 'agent'),
  validateRequest(documentVerificationSchema),
  integrationController.updateDocumentVerification
);

router.post(
  '/documents/check-expirations',
  protect,
  authorize('admin'),
  integrationController.checkDocumentExpirations
);

router.post(
  '/users/:userId/sync-verification',
  protect,
  authorize('admin', 'agent'),
  integrationController.syncProfileVerification
);

// Profile - Application Integration Routes
router.get(
  '/profiles/:profileId/jobs/:jobId/eligibility',
  protect,
  integrationController.checkApplicationEligibility
);

router.post(
  '/profiles/:profileId/sync-applications',
  protect,
  integrationController.syncProfileWithApplications
);

router.post(
  '/profiles/:profileId/update-completeness',
  protect,
  integrationController.updateProfileCompleteness
);

router.get(
  '/users/:userId/kyc-status',
  protect,
  integrationController.checkKycStatus
);

// Notification Routes
router.post(
  '/jobs/:jobId/status-notification',
  protect,
  authorize('admin', 'agent', 'sponsor'),
  validateRequest(jobStatusChangeSchema),
  integrationController.jobStatusChangeNotification
);

router.post(
  '/applications/:applicationId/milestone-notification',
  protect,
  authorize('admin', 'agent', 'sponsor'),
  validateRequest(milestoneSchema),
  integrationController.applicationMilestoneNotification
);

router.get(
  '/notifications/unread-count',
  protect,
  integrationController.getUnreadNotificationCount
);

router.get(
  '/notifications',
  protect,
  integrationController.getUserNotifications
);

router.put(
  '/notifications/mark-read',
  protect,
  validateRequest(markReadSchema),
  integrationController.markNotificationsAsRead
);

router.put(
  '/notifications/mark-all-read',
  protect,
  integrationController.markAllNotificationsAsRead
);

module.exports = router;
