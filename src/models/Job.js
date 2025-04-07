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
  qualifications: {
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
    },
    // For simplified location queries
    formatted: {
      type: String,
      default: function() {
        return `${this.location.city}, ${this.location.country}`;
      }
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
    },
    // Adding min/max for advanced filtering
    min: {
      type: Number,
      get: function() {
        return this.amount; // Default to amount if min not explicitly set
      }
    },
    max: {
      type: Number
    },
    // For display and filtering
    formatted: {
      type: String,
      default: function() {
        let result = `${this.salary.currency} ${this.salary.amount}`;
        if (this.salary.max) {
          result += ` - ${this.salary.currency} ${this.salary.max}`;
        }
        result += ` per ${this.salary.period}`;
        return result;
      }
    }
  },
  contractType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'temporary', 'internship'],
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
  // Enhanced fields for improved functionality
  featured: {
    type: Boolean,
    default: false
  },
  requiredDocuments: {
    type: [String],
    enum: ['IDENTITY', 'ADDRESS_PROOF', 'EDUCATIONAL', 'PROFESSIONAL', 'OTHER'],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  views: {
    type: Number,
    default: 0
  },
  experience: {
    type: String,
    enum: ['Entry Level', '1-3 years', '3-5 years', '5+ years'],
    default: 'Entry Level'
  },
  vacancies: {
    type: Number,
    default: 1
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  // Job matching algorithm fields
  matchScore: {
    type: Number,
    default: 0,
    select: false // Not returned in normal queries
  },
  matchKeywords: {
    type: [String],
    default: [],
    select: false // Not returned in normal queries
  },
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
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
  'location.formatted': 'text',
  skills: 'text',
  tags: 'text'
});

// Additional indexes for common queries
JobSchema.index({ status: 1, expiresAt: 1 });
JobSchema.index({ createdBy: 1, status: 1 });
JobSchema.index({ sponsor: 1, status: 1 });
JobSchema.index({ featured: 1, createdAt: -1 });
JobSchema.index({ contractType: 1, 'location.country': 1, 'location.city': 1 });

// Update the updatedAt field before saving
JobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate match keywords for improved search relevance
  this.matchKeywords = [
    ...this.title.split(' '),
    ...this.skills,
    ...this.tags,
    this.location.city,
    this.location.country,
    this.contractType
  ].filter(Boolean).map(kw => kw.toLowerCase());
  
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

// Virtual for checking if job is active and available for applications
JobSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Virtual for job age in days
JobSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24));
});

// Virtual for applications
JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'job',
  justOne: false
});

// Cascade delete applications when job is removed
JobSchema.pre('remove', async function(next) {
  await this.model('Application').deleteMany({ job: this._id });
  next();
});

// Ensure virtuals are included when converted to JSON
JobSchema.set('toJSON', { virtuals: true });
JobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', JobSchema);
