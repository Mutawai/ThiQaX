/**
 * Job model
 * Represents job listings posted by sponsors on the platform
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - location
 *         - sponsorId
 *       properties:
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Detailed job description
 *         location:
 *           type: string
 *           description: Job location (country/city)
 *         sponsorId:
 *           type: string
 *           description: ID of the sponsor who posted the job
 *         agentId:
 *           type: string
 *           description: ID of the agent who manages this job (if applicable)
 *         salary:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *             period:
 *               type: string
 *               enum: [hourly, daily, weekly, monthly, yearly]
 *           description: Salary information
 *         contractType:
 *           type: string
 *           enum: [fullTime, partTime, contract, temporary]
 *           description: Type of employment contract
 *         contractDuration:
 *           type: number
 *           description: Contract duration in months
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of job requirements
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           description: List of job benefits
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills for the job
 *         status:
 *           type: string
 *           enum: [DRAFT, OPEN, CLOSED, FILLED, CANCELLED]
 *           default: DRAFT
 *           description: Current status of the job listing
 *         openDate:
 *           type: string
 *           format: date-time
 *           description: When the job opens for applications
 *         closeDate:
 *           type: string
 *           format: date-time
 *           description: When the job closes for applications
 *         verified:
 *           type: boolean
 *           description: Whether the job has been verified by platform admins
 *         featured:
 *           type: boolean
 *           description: Whether the job is featured in listings
 *       example:
 *         title: "Housekeeping Supervisor"
 *         description: "Supervising a team of housekeepers in a 5-star hotel..."
 *         location: "Dubai, UAE"
 *         sponsorId: "60d0fe4f5311236168a109ca"
 *         salary:
 *           amount: 2500
 *           currency: "USD"
 *           period: "monthly"
 *         contractType: "fullTime"
 *         contractDuration: 24
 *         status: "OPEN"
 *         verified: true
 */
const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot be more than 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Job description cannot be more than 5000 characters']
  },
  
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true,
    index: true
  },
  
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sponsor is required'],
    index: true
  },
  
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  salary: {
    amount: {
      type: Number,
      required: [true, 'Salary amount is required']
    },
    currency: {
      type: String,
      required: [true, 'Salary currency is required'],
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    }
  },
  
  contractType: {
    type: String,
    enum: ['fullTime', 'partTime', 'contract', 'temporary'],
    default: 'fullTime'
  },
  
  contractDuration: {
    type: Number, // Duration in months
    default: 12
  },
  
  requirements: [{
    type: String,
    trim: true
  }],
  
  benefits: [{
    type: String,
    trim: true
  }],
  
  skills: [{
    type: String,
    trim: true
  }],
  
  status: {
    type: String,
    enum: ['DRAFT', 'OPEN', 'CLOSED', 'FILLED', 'CANCELLED'],
    default: 'DRAFT',
    index: true
  },
  
  openDate: {
    type: Date
  },
  
  closeDate: {
    type: Date
  },
  
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  applicationCount: {
    type: Number,
    default: 0
  },
  
  // Application process settings
  applicationProcess: {
    requiresDocuments: {
      type: Boolean,
      default: true
    },
    requiredDocumentTypes: [{
      type: String,
      enum: ['identification', 'passport', 'certificate', 'workPermit', 'address', 'education', 'other']
    }],
    requiresKYC: {
      type: Boolean,
      default: true
    },
    questions: [{
      question: String,
      required: Boolean
    }]
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create text index for searching
JobSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  'skills': 'text'
}, {
  weights: {
    title: 10,
    location: 5,
    skills: 3,
    description: 1
  }
});

// Update the updatedAt field on document update
JobSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Automatically set openDate when status changes to OPEN
JobSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'OPEN' && !this.openDate) {
    this.openDate = Date.now();
  }
  
  if (this.isModified('status') && this.status === 'CLOSED' && !this.closeDate) {
    this.closeDate = Date.now();
  }
  
  next();
});

// Virtual for applications
JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
  justOne: false
});

// Virtual to check if job is active
JobSchema.virtual('isActive').get(function() {
  return this.status === 'OPEN';
});

// Virtual for salary display
JobSchema.virtual('salaryDisplay').get(function() {
  return `${this.salary.currency} ${this.salary.amount} per ${this.salary.period}`;
});

// Static method to find active jobs
JobSchema.statics.findActive = function() {
  return this.find({
    status: 'OPEN',
    verified: true
  });
};

// Static method to find featured jobs
JobSchema.statics.findFeatured = function(limit = 5) {
  return this.find({
    status: 'OPEN',
    verified: true,
    featured: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to search jobs
JobSchema.statics.search = function(query, options = {}) {
  const searchOptions = {
    status: 'OPEN',
    verified: true,
    ...options
  };
  
  if (query) {
    return this.find({
      $text: { $search: query },
      ...searchOptions
    })
    .sort({ score: { $meta: 'textScore' } });
  }
  
  return this.find(searchOptions).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Job', JobSchema);
