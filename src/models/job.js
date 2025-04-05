const mongoose = require('mongoose');

/**
 * Job Schema
 * Comprehensive data model for job listings on the ThiQaX platform
 */
const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  responsibilities: {
    type: [String],
    default: []
  },
  requirements: {
    type: [String],
    default: []
  },
  location: {
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    address: {
      type: String
    }
  },
  salary: {
    amount: {
      type: Number,
      required: [true, 'Salary amount is required']
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'monthly'
    }
  },
  contractType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary'],
    required: [true, 'Contract type is required']
  },
  contractDuration: {
    type: Number, // Duration in months
    required: function() {
      return this.contractType === 'contract' || this.contractType === 'temporary';
    }
  },
  benefits: {
    type: [String],
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sponsor is required']
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Agent is required']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'filled', 'closed', 'rejected'],
    default: 'draft'
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationDetails: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    comments: {
      type: String
    }
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  attachments: [{
    name: String,
    path: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
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
  },
  expiresAt: {
    type: Date,
    required: [true, 'Job expiration date is required']
  }
});

// Index for text search
JobSchema.index({ 
  title: 'text', 
  description: 'text', 
  'location.country': 'text', 
  'location.city': 'text',
  skills: 'text'
});

// Update the updatedAt field before saving
JobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Increment applicationsCount when a new application is submitted
JobSchema.methods.incrementApplications = function() {
  this.applicationsCount += 1;
  return this.save();
};

// Virtual for calculating time until expiration
JobSchema.virtual('timeUntilExpiration').get(function() {
  return this.expiresAt - new Date();
});

// Virtual for checking if job is expired
JobSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Ensure virtuals are included when converted to JSON
JobSchema.set('toJSON', { virtuals: true });
JobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', JobSchema);
