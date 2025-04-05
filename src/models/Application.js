const mongoose = require('mongoose');

/**
 * Application Schema
 * Comprehensive data model for job applications on the ThiQaX platform
 */
const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant reference is required']
  },
  status: {
    type: String,
    enum: [
      'submitted',      // Initial state
      'under-review',   // Being reviewed by agent/sponsor
      'shortlisted',    // Selected for further consideration
      'interview',      // Selected for interview
      'offer-pending',  // Job offer being prepared
      'offered',        // Job offered to applicant
      'accepted',       // Offer accepted by applicant
      'rejected',       // Application rejected
      'withdrawn'       // Withdrawn by applicant
    ],
    default: 'submitted'
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required']
  },
  expectedSalary: {
    amount: {
      type: Number
    },
    currency: {
      type: String,
      default: 'USD'
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  availableFromDate: {
    type: Date,
    required: [true, 'Availability date is required']
  },
  documents: [{
    type: {
      type: String,
      enum: [
        'resume',
        'certificate',
        'recommendation',
        'identification',
        'other'
      ],
      required: [true, 'Document type is required']
    },
    name: {
      type: String,
      required: [true, 'Document name is required']
    },
    path: {
      type: String,
      required: [true, 'Document path is required']
    },
    mimeType: String,
    size: Number,
    verified: {
      type: Boolean,
      default: false
    },
    verificationDetails: {
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date,
      comments: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  interviewDetails: [{
    scheduledDate: Date,
    location: String,
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    notes: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    }
  }],
  feedback: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    visibility: {
      type: String,
      enum: ['private', 'team', 'all'],
      default: 'private'
    }
  }],
  offerDetails: {
    offerDate: Date,
    salary: {
      amount: Number,
      currency: String,
      period: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'monthly'
      }
    },
    benefits: [String],
    startDate: Date,
    expiryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending'
    },
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: String
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ApplicationSchema.pre('save', function(next) {
  // If this is new or the status has changed
  if (this.isNew || this.isModified('status')) {
    // Add to status history
    this.statusHistory.push({
      status: this.status,
      changedBy: this.updatedBy || this.applicant, // Fallback to applicant if updatedBy not set
      timestamp: Date.now()
    });

    // If we're modifying a document, not creating new
    if (!this.isNew) {
      // Update the job's application count
      const Job = mongoose.model('Job');
      Job.findById(this.job)
        .then(job => {
          if (job && this.isNew) {
            return job.incrementApplications();
          }
          return null;
        })
        .catch(err => console.error('Error updating job application count:', err));
    }
  }

  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ 'documents.verified': 1 });
ApplicationSchema.index({ createdAt: -1 });

// Virtual for calculating application age
ApplicationSchema.virtual('applicationAge').get(function() {
  return Date.now() - this.createdAt;
});

// Ensure virtuals are included when converted to JSON
ApplicationSchema.set('toJSON', { virtuals: true });
ApplicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Application', ApplicationSchema);
