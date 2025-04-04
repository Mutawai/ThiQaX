// File: src/routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const documentUploadService = require('../services/documentUploadService');

const {
  uploadDocument,
  getMyDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getVerificationQueue,
  verifyDocument,
  getVerificationStats
} = require('../controllers/documentController');

// All routes are protected
router.use(protect);

// User routes
router.route('/')
  .post(documentUploadService.uploadMiddleware(), uploadDocument)
  .get(getMyDocuments);

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

// Admin-only routes
router.route('/verification-queue')
  .get(authorize('admin'), getVerificationQueue);

router.route('/verification-stats')
  .get(authorize('admin'), getVerificationStats);

router.route('/:id/verify')
  .put(authorize('admin'), verifyDocument);

module.exports = router;
