// src/controllers/document.js (add these methods)
const asyncHandler = require('../middleware/async');
const Document = require('../models/Document');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get verification queue
 * @route   GET /api/v1/documents/verification-queue
 * @access  Private/Admin
 */
exports.getVerificationQueue = asyncHandler(async (req, res, next) => {
  // Get all documents that need verification (pending and rejected)
  const documents = await Document.find({
    status: { $in: ['PENDING', 'REJECTED'] }
  })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .sort({ 
      // High priority for old documents (uploaded more than 48 hours ago)
      uploadedAt: 1
    });

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

/**
 * @desc    Get verification statistics
 * @route   GET /api/v1/documents/verification-stats
 * @access  Private/Admin
 */
exports.getVerificationStats = asyncHandler(async (req, res, next) => {
  // Get counts for different document statuses
  const [
    totalCount,
    pendingCount,
    verifiedCount,
    rejectedCount
  ] = await Promise.all([
    Document.countDocuments({}),
    Document.countDocuments({ status: 'PENDING' }),
    Document.countDocuments({ status: 'VERIFIED' }),
    Document.countDocuments({ status: 'REJECTED' })
  ]);

  // Calculate verification rate
  const verificationRate = totalCount > 0
    ? Math.round((verifiedCount / totalCount) * 100)
    : 0;

  // Get daily verifications (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const dailyVerifications = await Document.countDocuments({
    status: 'VERIFIED',
    verifiedAt: { $gte: oneDayAgo }
  });

  // Get previous day verifications for trend calculation
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const previousDayVerifications = await Document.countDocuments({
    status: 'VERIFIED',
    verifiedAt: { 
      $gte: twoDaysAgo,
      $lt: oneDayAgo
    }
  });

  // Calculate daily trend percentage
  let dailyTrend = 0;
  if (previousDayVerifications > 0) {
    dailyTrend = Math.round(
      ((dailyVerifications - previousDayVerifications) / previousDayVerifications) * 100
    );
  }

  // Calculate average verification time (in hours)
  const verifiedDocuments = await Document.find({
    status: 'VERIFIED',
    verifiedAt: { $exists: true },
    uploadedAt: { $exists: true }
  });

  let totalVerificationTime = 0;
  let documentCount = 0;

  verifiedDocuments.forEach(doc => {
    if (doc.verifiedAt && doc.uploadedAt) {
      const verificationTime = (new Date(doc.verifiedAt) - new Date(doc.uploadedAt)) / (1000 * 60 * 60); // in hours
      totalVerificationTime += verificationTime;
      documentCount++;
    }
  });

  const avgVerificationTime = documentCount > 0
    ? Math.round((totalVerificationTime / documentCount) * 10) / 10 // round to 1 decimal place
    : 0;

  res.status(200).json({
    success: true,
    data: {
      totalDocuments: totalCount,
      pendingDocuments: pendingCount,
      verifiedDocuments: verifiedCount,
      rejectedDocuments: rejectedCount,
      verificationRate,
      dailyVerifications,
      dailyTrend,
      avgVerificationTime
    }
  });
});

/**
 * @desc    Verify a document
 * @route   PUT /api/v1/documents/:id/verify
 * @access  Private/Admin
 */
exports.verifyDocument = asyncHandler(async (req, res, next) => {
  let document = await Document.findById(req.params.id);

  if (!document) {
    return next(
      new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
    );
  }

  // Update document status to VERIFIED
  document.status = 'VERIFIED';
  document.verifiedAt = Date.now();
  document.verifiedBy = req.user.id;
  document.verificationNotes = req.body.notes || '';

  await document.save();

  // Get the user who uploaded the document
  const user = await User.findById(document.user);

  // If this is an identity document and now verified, update user's KYC status
  if (document.documentType === 'IDENTITY' && user) {
    // Check if the user has all required KYC documents verified
    const requiredDocuments = ['IDENTITY', 'ADDRESS_PROOF'];
    const verifiedDocuments = await Document.find({
      user: user._id,
      status: 'VERIFIED',
      documentType: { $in: requiredDocuments }
    });

    // Create a Set of document types that are verified
    const verifiedTypes = new Set(verifiedDocuments.map(doc => doc.documentType));

    // Check if all required document types are verified
    const allVerified = requiredDocuments.every(type => verifiedTypes.has(type));

    if (allVerified) {
      user.kycVerified = true;
      await user.save();
    }
  }

  // Create notification for the user
  await Notification.create({
    recipient: document.user,
    type: 'DOCUMENT_VERIFIED',
    title: 'Document Verified',
    message: `Your ${document.documentType.replace('_', ' ').toLowerCase()} document has been verified.`,
    data: {
      documentId: document._id,
      documentType: document.documentType
    }
  });

  // Return the updated document with user info
  const updatedDocument = await Document.findById(req.params.id).populate({
    path: 'user',
    select: 'firstName lastName email'
  });

  res.status(200).json({
    success: true,
    data: updatedDocument
  });
});

/**
 * @desc    Reject a document
 * @route   PUT /api/v1/documents/:id/reject
 * @access  Private/Admin
 */
exports.rejectDocument = asyncHandler(async (req, res, next) => {
  const { rejectionReason, notes } = req.body;

  if (!rejectionReason) {
    return next(new ErrorResponse('Please provide a rejection reason', 400));
  }

  let document = await Document.findById(req.params.id);

  if (!document) {
    return next(
      new ErrorResponse(`Document not found with id of ${req.params.id}`, 404)
    );
  }

  // Update document status to REJECTED
  document.status = 'REJECTED';
  document.rejectedAt = Date.now();
  document.rejectedBy = req.user.id;
  document.rejectionReason = rejectionReason;
  document.verificationNotes = notes || '';

  await document.save();

  // Create notification for the user
  await Notification.create({
    recipient: document.user,
    type: 'DOCUMENT_REJECTED',
    title: 'Document Rejected',
    message: `Your ${document.documentType.replace('_', ' ').toLowerCase()} document has been rejected. Please upload a new document.`,
    data: {
      documentId: document._id,
      documentType: document.documentType,
      rejectionReason
    }
  });

  // Return the updated document with user info
  const updatedDocument = await Document.findById(req.params.id).populate({
    path: 'user',
    select: 'firstName lastName email'
  });

  res.status(200).json({
    success: true,
    data: updatedDocument
  });
});

// src/routes/document.js (add these routes)
// Add verification endpoints
router
  .route('/verification-queue')
  .get(protect, authorize('admin'), getVerificationQueue);

router
  .route('/verification-stats')
  .get(protect, authorize('admin'), getVerificationStats);

router
  .route('/:id/verify')
  .put(protect, authorize('admin'), verifyDocument);

router
  .route('/:id/reject')
  .put(protect, authorize('admin'), rejectDocument);

// src/models/Document.js (if not already defined)
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['IDENTITY', 'ADDRESS_PROOF', 'EDUCATIONAL', 'PROFESSIONAL', 'OTHER'],
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  issuedBy: {
    type: String,
    trim: true
  },
  documentNumber: {
    type: String,
    trim: true
  },
  issueDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    enum: [
      'DOCUMENT_UNCLEAR',
      'DOCUMENT_EXPIRED',
      'INFORMATION_MISMATCH',
      'SUSPECTED_FRAUD',
      'WRONG_DOCUMENT_TYPE',
      'OTHER'
    ]
  },
  verificationNotes: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index for sorting by priority
DocumentSchema.index({ status: 1, uploadedAt: 1 });

// Middleware to check if document is expired
DocumentSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
};

// Virtual for document age in days
DocumentSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - new Date(this.uploadedAt)) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Document', DocumentSchema);

// src/models/Notification.js (if not already defined)
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'DOCUMENT_VERIFIED',
      'DOCUMENT_REJECTED',
      'KYC_COMPLETED',
      'APPLICATION_STATUS',
      'JOB_MATCH',
      'DOCUMENT_EXPIRING',
      'SYSTEM'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add index for fetching unread notifications
NotificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
