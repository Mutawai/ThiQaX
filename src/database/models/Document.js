/**
 * Document model
 * Handles document verification and tracking for KYC and application processes
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - fileUrl
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID that owns this document
 *         type:
 *           type: string
 *           enum: [identification, passport, certificate, workPermit, address, education, other]
 *           description: Type of document
 *         fileUrl:
 *           type: string
 *           description: URL to access the document
 *         fileName:
 *           type: string
 *           description: Original filename
 *         fileType:
 *           type: string
 *           description: MIME type of the file
 *         fileSize:
 *           type: number
 *           description: Size of the file in bytes
 *         status:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *           default: PENDING
 *           description: Verification status of the document
 *         verifiedBy:
 *           type: string
 *           description: ID of admin who verified the document
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           description: When the document was verified
 *         rejectionReason:
 *           type: string
 *           description: Reason for rejection if status is REJECTED
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: When the document expires (if applicable)
 *         metadata:
 *           type: object
 *           description: Additional document metadata
 *       example:
 *         userId: "60d0fe4f5311236168a109ca"
 *         type: "passport"
 *         fileUrl: "https://storage.thiqax.com/documents/passport-123456.pdf"
 *         fileName: "passport-scan.pdf"
 *         fileType: "application/pdf"
 *         fileSize: 1048576
 *         status: "PENDING"
 *         expiryDate: "2025-01-01T00:00:00.000Z"
 */
const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'identification',
      'passport',
      'certificate',
      'workPermit',
      'address',
      'education',
      'other'
    ],
    index: true
  },
  
  fileUrl: {
    type: String,
    required: [true, 'Document file URL is required']
  },
  
  fileName: {
    type: String,
    trim: true
  },
  
  fileType: {
    type: String,
    trim: true
  },
  
  fileSize: {
    type: Number
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verifiedAt: {
    type: Date
  },
  
  rejectionReason: {
    type: String
  },
  
  expiryDate: {
    type: Date,
    index: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Track applications that use this document
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  
  // Flag for documents about to expire
  expiryNotified: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update the updatedAt field on document update
DocumentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Update user's KYC verified status when document status changes
DocumentSchema.post('save', async function() {
  if (this.isModified('status')) {
    try {
      const User = mongoose.model('User');
      
      // Get all verified documents for this user
      const verifiedDocumentCount = await this.constructor.countDocuments({
        userId: this.userId,
        status: 'VERIFIED'
      });
      
      // Get critical document types for KYC
      const hasVerifiedId = await this.constructor.exists({
        userId: this.userId,
        type: { $in: ['identification', 'passport'] },
        status: 'VERIFIED'
      });
      
      const hasVerifiedAddress = await this.constructor.exists({
        userId: this.userId,
        type: 'address',
        status: 'VERIFIED'
      });
      
      // Update user's KYC status if they have at least one ID and address document verified
      if (hasVerifiedId && hasVerifiedAddress) {
        await User.findByIdAndUpdate(this.userId, {
          kycVerified: true
        });
      } else {
        await User.findByIdAndUpdate(this.userId, {
          kycVerified: false
        });
      }
    } catch (err) {
      console.error('Error updating user KYC status:', err);
    }
  }
});

// Helper method to check if document is expired or about to expire
DocumentSchema.methods.isExpiringSoon = function(daysThreshold = 30) {
  if (!this.expiryDate) return false;
  
  const now = new Date();
  const daysToExpiry = Math.floor((this.expiryDate - now) / (1000 * 60 * 60 * 24));
  
  return daysToExpiry <= daysThreshold && daysToExpiry >= 0;
};

// Helper method to check if document is expired
DocumentSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  
  const now = new Date();
  return this.expiryDate < now;
};

// Virtual for document validation status
DocumentSchema.virtual('validationStatus').get(function() {
  if (this.status !== 'VERIFIED') return this.status;
  if (this.isExpired()) return 'EXPIRED';
  if (this.isExpiringSoon()) return 'EXPIRING_SOON';
  return 'VALID';
});

// Static method to find documents expiring soon
DocumentSchema.statics.findExpiringSoon = function(daysThreshold = 30) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() + daysThreshold);
  
  return this.find({
    expiryDate: { 
      $lte: dateThreshold,
      $gte: new Date()
    },
    status: 'VERIFIED',
    expiryNotified: false
  }).populate('userId', 'email firstName lastName');
};

module.exports = mongoose.model('Document', DocumentSchema);
