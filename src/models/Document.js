// File: src/models/Document.js

const mongoose = require('mongoose');
const config = require('../config');

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       required:
 *         - owner
 *         - type
 *         - fileURL
 *         - fileType
 *         - fileSize
 *         - fileName
 *         - originalFilename
 *       properties:
 *         owner:
 *           type: string
 *           description: User ID who owns the document
 *         type:
 *           type: string
 *           enum: [passport, nationalID, driverLicense, birthCertificate, diploma, degree, certificate, employmentLetter, referenceLetter, workPermit, visa, businessLicense, registrationCertificate, taxCertificate, other]
 *           description: Type of document
 *         subType:
 *           type: string
 *           description: Additional classification of document type
 *         documentNumber:
 *           type: string
 *           description: Unique identifier for the document (e.g., passport number)
 *         issuingCountry:
 *           type: string
 *           description: Country that issued the document
 *         issuingAuthority:
 *           type: string
 *           description: Authority that issued the document
 *         issueDate:
 *           type: string
 *           format: date-time
 *           description: When the document was issued
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: When the document expires
 *         fileURL:
 *           type: string
 *           description: URL to access the document file
 *         fileType:
 *           type: string
 *           enum: [image/jpeg, image/png, image/jpg, application/pdf]
 *           description: MIME type of the document file
 *         verificationStatus:
 *           type: string
 *           enum: [pending, underReview, verified, rejected, expired]
 *           description: Current verification status of the document
 *       example:
 *         type: passport
 *         documentNumber: AB123456
 *         issuingCountry: Kenya
 *         expiryDate: 2026-01-01T00:00:00.000Z
 *         verificationStatus: pending
 */
const DocumentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    index: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    index: true
  },
  type: {
    type: String,
    enum: [
      // Identification documents
      'passport', 
      'nationalID', 
      'driverLicense', 
      'birthCertificate',
      // Educational documents
      'diploma', 
      'degree', 
      'certificate',
      // Professional documents
      'employmentLetter',
      'referenceLetter',
      'workPermit',
      'visa',
      // Business documents (for agents/sponsors)
      'businessLicense',
      'registrationCertificate',
      'taxCertificate',
      // Other documents
      'other'
    ],
    required: true
  },
  subType: {
    type: String,
    trim: true
  },
  documentNumber: {
    type: String,
    trim: true
  },
  issuingCountry: {
    type: String,
    trim: true
  },
  issuingAuthority: {
    type: String,
    trim: true
  },
  issueDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  fileURL: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'underReview', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verificationDetails: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    verificationNotes: {
      type: String
    },
    verificationMethod: {
      type: String,
      enum: ['manual', 'automated', 'hybrid'],
      default: 'manual'
    },
    automatedScoreDetails: {
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      authenticityScore: {
        type: Number,
        min: 0,
        max: 100
      },
      completenessScore: {
        type: Number,
        min: 0,
        max: 100
      },
      readabilityScore: {
        type: Number,
        min: 0,
        max: 100
      }
    }
  },
  // Audit trail
  history: [{
    status: {
      type: String,
      enum: ['uploaded', 'pending', 'underReview', 'verified', 'rejected', 'expired']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  // Document metadata
  metadata: {
    requiresTranslation: {
      type: Boolean,
      default: false
    },
    translationProvided: {
      type: Boolean,
      default: false
    },
    translationURL: String,
    isCritical: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    tags: [String]
  },
  // For expiration notification tracking
  expiryNotified: {
    type: Boolean,
    default: false
  },
  expiryNotificationDate: {
    type: Date
  },
  // For linking related documents (e.g., translation of a document)
  relatedDocuments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
DocumentSchema.index({ owner: 1, type: 1 });
DocumentSchema.index({ verificationStatus: 1 });
DocumentSchema.index({ 'verificationDetails.verifiedBy': 1 });
DocumentSchema.index({ uploadDate: 1 });
DocumentSchema.index({ expiryDate: 1, expiryNotified: 1 });

// When a document is first created, add to history
DocumentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.history.push({
      status: 'uploaded',
      timestamp: Date.now(),
      performedBy: this.owner,
      notes: 'Document uploaded by user'
    });
  }
  
  // Auto update status to expired if document is expired
  if (this.expiryDate && new Date(this.expiryDate) < new Date() && 
      this.verificationStatus !== 'expired') {
    this.verificationStatus = 'expired';
    this.history.push({
      status: 'expired',
      timestamp: Date.now(),
      notes: 'Document automatically marked as expired by system'
    });
  }
  
  next();
});

// Method to update verification status
DocumentSchema.methods.updateVerificationStatus = async function(status, userId, notes) {
  const previousStatus = this.verificationStatus;
  this.verificationStatus = status;
  
  // Add to history
  this.history.push({
    status,
    timestamp: Date.now(),
    performedBy: userId,
    notes: notes || `Status changed from ${previousStatus} to ${status}`
  });
  
  // Update verification details
  if (status === 'verified' || status === 'rejected') {
    this.verificationDetails.verifiedBy = userId;
    this.verificationDetails.verificationDate = Date.now();
    
    if (status === 'rejected' && notes) {
      this.verificationDetails.rejectionReason = notes;
    }
    
    if (status === 'verified' && notes) {
      this.verificationDetails.verificationNotes = notes;
    }
  }
  
  return this.save();
};

// Method to check if document is expired
DocumentSchema.methods.checkExpiry = function() {
  if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
    return true;
  }
  return false;
};

// Method to check if document is expiring soon (within configured threshold)
DocumentSchema.methods.isExpiringSoon = function(daysThreshold) {
  if (!this.expiryDate) return false;
  
  const threshold = daysThreshold || config.notifications.expiry.checkDays || 30;
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= threshold && daysUntilExpiry > 0;
};

// Method to link document to an application
DocumentSchema.methods.linkToApplication = async function(applicationId) {
  if (this.application && this.application.toString() === applicationId.toString()) {
    return this; // Already linked to this application
  }
  
  this.application = applicationId;
  this.history.push({
    status: this.verificationStatus,
    timestamp: Date.now(),
    notes: `Document linked to application ${applicationId}`
  });
  
  return this.save();
};

// Method to link document to a profile
DocumentSchema.methods.linkToProfile = async function(profileId) {
  if (this.profile && this.profile.toString() === profileId.toString()) {
    return this; // Already linked to this profile
  }
  
  this.profile = profileId;
  this.history.push({
    status: this.verificationStatus,
    timestamp: Date.now(),
    notes: `Document linked to profile ${profileId}`
  });
  
  return this.save();
};

// Method to mark document as notified for expiration
DocumentSchema.methods.markExpiryNotified = async function() {
  this.expiryNotified = true;
  this.expiryNotificationDate = Date.now();
  return this.save();
};

// Virtual for document age in days
DocumentSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.uploadDate) / (1000 * 60 * 60 * 24));
});

// Virtuals for time since verification
DocumentSchema.virtual('daysSinceVerification').get(function() {
  if (this.verificationDetails.verificationDate) {
    return Math.floor((Date.now() - this.verificationDetails.verificationDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for days until expiry
DocumentSchema.virtual('daysUntilExpiry').get(function() {
  if (this.expiryDate) {
    const today = new Date();
    const expiryDate = new Date(this.expiryDate);
    
    if (expiryDate > today) {
      return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    }
    return 0; // Already expired
  }
  return null; // No expiry date
});

// Virtual for whether document needs translation
DocumentSchema.virtual('needsTranslation').get(function() {
  return this.metadata.requiresTranslation && !this.metadata.translationProvided;
});

// Virtual for document category (for KYC identification)
DocumentSchema.virtual('category').get(function() {
  const identityDocuments = ['passport', 'nationalID', 'driverLicense', 'birthCertificate'];
  const educationalDocuments = ['diploma', 'degree', 'certificate'];
  const professionalDocuments = ['employmentLetter', 'referenceLetter', 'workPermit', 'visa'];
  const businessDocuments = ['businessLicense', 'registrationCertificate', 'taxCertificate'];
  
  if (identityDocuments.includes(this.type)) return 'identity';
  if (educationalDocuments.includes(this.type)) return 'education';
  if (professionalDocuments.includes(this.type)) return 'professional';
  if (businessDocuments.includes(this.type)) return 'business';
  return 'other';
});

// Static method to find documents expiring soon
DocumentSchema.statics.findExpiringSoon = async function(daysThreshold) {
  const threshold = daysThreshold || config.notifications.expiry.checkDays || 30;
  const today = new Date();
  const expiryThreshold = new Date();
  expiryThreshold.setDate(today.getDate() + threshold);
  
  return this.find({
    expiryDate: { $lte: expiryThreshold, $gt: today },
    expiryNotified: false,
    verificationStatus: 'verified'
  }).populate('owner', 'email firstName lastName');
};

// Static method to find verified identity documents for a user
DocumentSchema.statics.findVerifiedIdentityDocuments = async function(userId) {
  return this.find({
    owner: userId,
    type: { $in: ['passport', 'nationalID', 'driverLicense', 'birthCertificate'] },
    verificationStatus: 'verified'
  });
};

// Static method to check if a user has valid KYC documents
DocumentSchema.statics.hasValidKycDocuments = async function(userId) {
  const verifiedIdentityDocs = await this.countDocuments({
    owner: userId,
    type: { $in: ['passport', 'nationalID', 'driverLicense'] },
    verificationStatus: 'verified',
    expiryDate: { $gt: new Date() }
  });
  
  return verifiedIdentityDocs > 0;
};

module.exports = mongoose.model('Document', DocumentSchema);
