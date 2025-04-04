// File: src/models/Document.js

const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Document', DocumentSchema);
