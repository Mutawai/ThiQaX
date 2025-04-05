const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const upload = require('../middleware/fileUpload');

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application management API
 */

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Submit a new job application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - job
 *               - coverLetter
 *               - availableFromDate
 *             properties:
 *               job:
 *                 type: string
 *                 description: Job ID
 *               coverLetter:
 *                 type: string
 *               expectedSalary.amount:
 *                 type: number
 *               expectedSalary.currency:
 *                 type: string
 *               expectedSalary.negotiable:
 *                 type: boolean
 *               availableFromDate:
 *                 type: string
 *                 format: date
 *               resume:
 *                 type: string
 *                 format: binary
 *               certificate:
 *                 type: string
 *                 format: binary
 *               recommendation:
 *                 type: string
 *                 format: binary
 *               identification:
 *                 type: string
 *                 format: binary
 *               other:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['jobSeeker']),
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'certificate', maxCount: 5 },
    { name: 'recommendation', maxCount: 3 },
    { name: 'identification', maxCount: 2 },
    { name: 'other', maxCount: 5 }
  ]),
  [
    check('job').notEmpty().withMessage('Job ID is required'),
    check('coverLetter').trim().isLength({ min: 50 }).withMessage('Cover letter must be at least 50 characters'),
    check('expectedSalary.amount').optional().isNumeric().withMessage('Expected salary amount must be a number'),
    check('availableFromDate').isISO8601().withMessage('Available from date must be a valid date')
  ],
  applicationController.submitApplication
);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications based on user role
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: job
 *         schema:
 *           type: string
 *         description: Filter by job ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by application status
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *         description: Filter by verification status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of applications with pagination info
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, applicationController.getApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get an application by ID
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, applicationController.getApplicationById);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     summary: Update application status
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
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
 *                 enum: [under-review, shortlisted, interview, offer-pending, offered, accepted, rejected, withdrawn]
 *               notes:
 *                 type: string
 *               offerDetails:
 *                 type: object
 *                 description: Required if status is 'offered'
 *               rejectionReason:
 *                 type: string
 *                 description: Required if status is 'rejected' and offer was previously made
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/status',
  authMiddleware,
  [
    check('status').isIn([
      'under-review', 'shortlisted', 'interview', 'offer-pending', 
      'offered', 'accepted', 'rejected', 'withdrawn'
    ]).withMessage('Invalid status'),
    check('notes').optional().trim(),
    check('offerDetails').custom((value, { req }) => {
      if (req.body.status === 'offered' && !value) {
        throw new Error('Offer details are required when setting status to offered');
      }
      return true;
    }),
    check('offerDetails.salary.amount').optional().isNumeric().withMessage('Salary amount must be a number'),
    check('offerDetails.salary.currency').optional().notEmpty().withMessage('Salary currency is required'),
    check('offerDetails.salary.period').optional().isIn(['hourly', 'monthly', 'yearly']).withMessage('Invalid salary period'),
    check('offerDetails.startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    check('offerDetails.expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
    check('rejectionReason').custom((value, { req }) => {
      if (req.body.status === 'rejected' && req.body.previouslyOffered && !value) {
        throw new Error('Rejection reason is required when rejecting after an offer was made');
      }
      return true;
    })
  ],
  applicationController.updateApplicationStatus
);

/**
 * @swagger
 * /api/applications/{id}/feedback:
 *   post:
 *     summary: Add feedback to an application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *               - rating
 *             properties:
 *               comment:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               visibility:
 *                 type: string
 *                 enum: [private, team, all]
 *                 default: private
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/feedback',
  authMiddleware,
  roleMiddleware(['sponsor', 'agent', 'admin']),
  [
    check('comment').trim().notEmpty().withMessage('Comment is required'),
    check('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    check('visibility').optional().isIn(['private', 'team', 'all']).withMessage('Invalid visibility option')
  ],
  applicationController.addFeedback
);

/**
 * @swagger
 * /api/applications/{id}/interviews:
 *   post:
 *     summary: Schedule an interview
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *               - location
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               interviewers:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Interview scheduled successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/interviews',
  authMiddleware,
  roleMiddleware(['sponsor', 'agent', 'admin']),
  [
    check('scheduledDate').isISO8601().withMessage('Scheduled date must be a valid date'),
    check('location').trim().notEmpty().withMessage('Location is required'),
    check('interviewers').optional().isArray().withMessage('Interviewers must be an array'),
    check('notes').optional().trim()
  ],
  applicationController.scheduleInterview
);

/**
 * @swagger
 * /api/applications/{id}/interviews/{interviewId}:
 *   patch:
 *     summary: Update interview status
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Interview ID
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
 *                 enum: [scheduled, completed, cancelled, rescheduled]
 *               notes:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 description: Required if status is 'rescheduled'
 *     responses:
 *       200:
 *         description: Interview updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application or interview not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/interviews/:interviewId',
  authMiddleware,
  roleMiddleware(['sponsor', 'agent', 'admin']),
  [
    check('status').isIn(['scheduled', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
    check('notes').optional().trim(),
    check('scheduledDate').custom((value, { req }) => {
      if (req.body.status === 'rescheduled' && !value) {
        throw new Error('Scheduled date is required when rescheduling');
      }
      if (value) {
        if (!Date.parse(value)) {
          throw new Error('Scheduled date must be a valid date');
        }
      }
      return true;
    })
  ],
  applicationController.updateInterviewStatus
);

/**
 * @swagger
 * /api/applications/{id}/verify-documents:
 *   patch:
 *     summary: Verify application documents
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentIds
 *               - verified
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               verified:
 *                 type: boolean
 *               verificationNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documents verification updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application or document not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/verify-documents',
  authMiddleware,
  roleMiddleware(['admin', 'agent']),
  [
    check('documentIds').isArray().withMessage('Document IDs must be an array'),
    check('documentIds.*').trim().notEmpty().withMessage('Document ID cannot be empty'),
    check('verified').isBoolean().withMessage('Verified must be a boolean'),
    check('verificationNotes').optional().trim()
  ],
  applicationController.verifyDocuments
);

/**
 * @swagger
 * /api/applications/{id}/documents:
 *   post:
 *     summary: Upload additional documents to an application
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *               certificate:
 *                 type: string
 *                 format: binary
 *               recommendation:
 *                 type: string
 *                 format: binary
 *               identification:
 *                 type: string
 *                 format: binary
 *               other:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 description: Required if type isn't defined by field name
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/documents',
  authMiddleware,
  roleMiddleware(['jobSeeker', 'admin']),
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'certificate', maxCount: 5 },
    { name: 'recommendation', maxCount: 3 },
    { name: 'identification', maxCount: 2 },
    { name: 'other', maxCount: 5 }
  ]),
  [
    check('documentType').custom((value, { req }) => {
      // If any file is uploaded with type 'other' and no documentType is specified
      if (req.files && req.files.other && req.files.other.length > 0 && !value) {
        throw new Error('Document type is required for "other" documents');
      }
      return true;
    })
  ],
  applicationController.uploadDocuments
);

/**
 * @swagger
 * /api/applications/{id}/offer:
 *   patch:
 *     summary: Update offer details
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offerDetails
 *             properties:
 *               offerDetails:
 *                 type: object
 *                 required:
 *                   - salary
 *                   - startDate
 *                   - expiryDate
 *                 properties:
 *                   salary:
 *                     type: object
 *                     required:
 *                       - amount
 *                       - currency
 *                     properties:
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       period:
 *                         type: string
 *                         enum: [hourly, monthly, yearly]
 *                   benefits:
 *                     type: array
 *                     items:
 *                       type: string
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   expiryDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/offer',
  authMiddleware,
  roleMiddleware(['sponsor', 'admin']),
  [
    check('offerDetails').notEmpty().withMessage('Offer details are required'),
    check('offerDetails.salary.amount').isNumeric().withMessage('Salary amount must be a number'),
    check('offerDetails.salary.currency').notEmpty().withMessage('Salary currency is required'),
    check('offerDetails.salary.period').optional().isIn(['hourly', 'monthly', 'yearly']).withMessage('Invalid salary period'),
    check('offerDetails.startDate').isISO8601().withMessage('Start date must be a valid date'),
    check('offerDetails.expiryDate').isISO8601().withMessage('Expiry date must be a valid date')
      .custom((value, { req }) => {
        const startDate = new Date(req.body.offerDetails.startDate);
        const expiryDate = new Date(value);
        if (expiryDate <= new Date()) {
          throw new Error('Expiry date must be in the future');
        }
        if (expiryDate <= startDate) {
          throw new Error('Expiry date must be after start date');
        }
        return true;
      })
  ],
  applicationController.updateOffer
);

/**
 * @swagger
 * /api/applications/{id}/respond-to-offer:
 *   patch:
 *     summary: Respond to an offer (accept/reject)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 enum: [accept, reject]
 *               rejectionReason:
 *                 type: string
 *                 description: Required if response is 'reject'
 *     responses:
 *       200:
 *         description: Offer response processed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Application not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/respond-to-offer',
  authMiddleware,
  roleMiddleware(['jobSeeker']),
  [
    check('response').isIn(['accept', 'reject']).withMessage('Response must be either "accept" or "reject"'),
    check('rejectionReason').custom((value, { req }) => {
      if (req.body.response === 'reject' && !value) {
        throw new Error('Rejection reason is required when rejecting an offer');
      }
      return true;
    })
  ],
  applicationController.respondToOffer
);

/**
 * @swagger
 * /api/applications/statistics:
 *   get:
 *     summary: Get application statistics
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/statistics', authMiddleware, roleMiddleware(['admin']), applicationController.getApplicationStatistics);

module.exports = router;
