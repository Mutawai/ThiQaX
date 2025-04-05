const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const upload = require('../middleware/fileUpload');

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job listing and management API
 */

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location.country
 *               - location.city
 *               - salary.amount
 *               - salary.currency
 *               - contractType
 *               - expiresAt
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               location.country:
 *                 type: string
 *               location.city:
 *                 type: string
 *               location.address:
 *                 type: string
 *               salary.amount:
 *                 type: number
 *               salary.currency:
 *                 type: string
 *               salary.period:
 *                 type: string
 *                 enum: [hourly, monthly, yearly]
 *               contractType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, temporary]
 *               contractDuration:
 *                 type: number
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               agent:
 *                 type: string
 *               sponsor:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['sponsor', 'agent', 'admin']),
  upload.array('attachments', 5),
  [
    check('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    check('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    check('location.country').trim().notEmpty().withMessage('Country is required'),
    check('location.city').trim().notEmpty().withMessage('City is required'),
    check('salary.amount').isNumeric().withMessage('Salary amount must be a number'),
    check('salary.currency').trim().notEmpty().withMessage('Currency is required'),
    check('contractType').isIn(['full-time', 'part-time', 'contract', 'temporary']).withMessage('Invalid contract type'),
    check('contractDuration')
      .optional()
      .isNumeric()
      .withMessage('Contract duration must be a number')
      .custom((value, { req }) => {
        if ((req.body.contractType === 'contract' || req.body.contractType === 'temporary') && !value) {
          throw new Error('Contract duration is required for contract and temporary positions');
        }
        return true;
      }),
    check('expiresAt').isISO8601().withMessage('Invalid expiration date')
  ],
  jobController.createJob
);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with filtering and pagination
 *     tags: [Jobs]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, active, filled, closed, rejected]
 *         description: Filter by job status (admin/agent/sponsor only)
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: contractType
 *         schema:
 *           type: string
 *           enum: [full-time, part-time, contract, temporary]
 *         description: Filter by contract type
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: integer
 *         description: Filter by minimum salary
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: integer
 *         description: Filter by maximum salary
 *       - in: query
 *         name: nonExpired
 *         schema:
 *           type: boolean
 *         description: Filter out expired jobs when true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Text search in title, description, and location
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by skills (comma-separated)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: List of jobs with pagination info
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware.optional, jobController.getJobs);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get a job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware.optional, jobController.getJobById);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Job updated successfully
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
router.put(
  '/:id',
  authMiddleware,
  [
    check('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    check('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    check('location.country').optional().trim().notEmpty().withMessage('Country is required'),
    check('location.city').optional().trim().notEmpty().withMessage('City is required'),
    check('salary.amount').optional().isNumeric().withMessage('Salary amount must be a number'),
    check('salary.currency').optional().trim().notEmpty().withMessage('Currency is required'),
    check('contractType').optional().isIn(['full-time', 'part-time', 'contract', 'temporary']).withMessage('Invalid contract type'),
    check('status').optional().isIn(['draft', 'pending', 'active', 'filled', 'closed', 'rejected']).withMessage('Invalid status'),
    check('expiresAt').optional().isISO8601().withMessage('Invalid expiration date')
  ],
  jobController.updateJob
);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, jobController.deleteJob);

/**
 * @swagger
 * /api/jobs/{id}/applications:
 *   get:
 *     summary: Get applications for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by application status
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: List of applications with pagination info
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get('/:id/applications', authMiddleware, jobController.getJobApplications);

/**
 * @swagger
 * /api/jobs/statistics:
 *   get:
 *     summary: Get job statistics
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/statistics', authMiddleware, roleMiddleware(['admin']), jobController.getJobStatistics);

module.exports = router;
