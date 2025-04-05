const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/fileUpload');
const {
  createOrUpdateProfile,
  getCurrentProfile,
  getProfileByUserId,
  getAllProfiles,
  deleteProfile,
  addEducation,
  deleteEducation,
  addExperience,
  deleteExperience,
  uploadProfilePicture,
  linkDocument,
  unlinkDocument
} = require('../controllers/profileController');

// Base route - all routes here require authentication
router.use(protect);

// Profile CRUD operations
router.route('/')
  .post(createOrUpdateProfile)
  .get(authorize('admin', 'agent'), getAllProfiles)
  .delete(deleteProfile);

// Current user's profile
router.get('/me', getCurrentProfile);

// Profile by user ID
router.get('/user/:userId', getProfileByUserId);

// Education routes
router.route('/education')
  .put(addEducation);

router.route('/education/:eduId')
  .delete(deleteEducation);

// Work experience routes
router.route('/experience')
  .put(addExperience);

router.route('/experience/:expId')
  .delete(deleteExperience);

// Profile picture upload - uses multer middleware
router.put('/picture', upload.single('profilePicture'), uploadProfilePicture);

// Document management routes
router.route('/documents/:documentId')
  .put(linkDocument)
  .delete(unlinkDocument);

/**
 * @swagger
 * /api/v1/profile:
 *   post:
 *     summary: Create or update a profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Profile created or updated successfully
 *       401:
 *         description: Not authorized
 */

/**
 * @swagger
 * /api/v1/profile/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       404:
 *         description: Profile not found
 */

// Additional Swagger documentation can be added for other endpoints

module.exports = router;
