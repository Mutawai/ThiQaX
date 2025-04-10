/**
 * Application model
 * Represents job applications submitted by job seekers
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       required:
 *         - jobId
 *         - jobSeekerId
 *       properties:
 *         jobId:
 *           type: string
 *           description: ID of the job being applied for
 *         jobSeekerId:
 *           type: string
 *           description: ID of the job seeker
 *         status:
 *           type: string
 *           enum: [PENDING, SHORTLISTED, INTERVIEW, OFFERED, ACCEPTED, REJECTED, WITHDRAWN]
 *           default: PENDING
 *           description: Current status of the application
 *         documents:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of documents attached to application
 *         coverLetter:
 *           type: string
 *           description: Cover letter text
 *         expectedSalary:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *           description: Expected salary if different from job posting
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               answer:
 *                 type: string
 *           description: Answers to job application questions
 *         notes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               userId:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *           description: Internal notes on the application
 *       example:
 *         jobId: "60d0fe4f5311236168a109ca"
 *         jobSeekerId: "60d0fe4f5311236168a109cb"
 *         status: "PENDING"
 *         documents: ["60d0fe4f5311236168a109cc", "60d0fe4f5311236168a109cd"]
 *         coverLetter: "I am writing to express my interest in the Housekeeping Supervisor position..."
 */
const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required'],
    index: true
  },
  
  jobSeekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Job seeker ID is required'],
    index: true
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
    default: 'PENDING',
    index: true
  },
  
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot be more than 2000 characters']
  },
  
  expectedSalary: {
    amount: {
      type: Number
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  answers: [{
    questionId: String,
    answer: String
  }],
  
  notes: [{
    text: {
      type: String,
      required: [true, 'Note text is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for notes']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tracks status history
  statusHistory: [{
    status: {
      type: String,
      enum: ['PENDING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Interview details (if applicable)
  interview: {
    scheduledDate: Date,
    location: String,
    interviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    type: {
      type: String,
      enum: ['inPerson', 'phone', 'video'],
      default: 'video'
    },
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  },
  
  // Job offer details (if applicable)
  offer: {
    salary: {
      amount: Number,
      currency: String,
      period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
      }
    },
    startDate: Date,
    expiryDate: Date,
    additionalDetails: String,
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date
  },
  
  // Verification status for all required docs
  verificationStatus: {
    complete: {
      type: Boolean,
      default: false
    },
    pendingDocuments: [{
      type: String
    }],
    verifiedDocuments: [{
      type: String
    }],
    rejectedDocuments: [{
      type: String
    }]
  },
  
  // Payment and escrow tracking
  payment: {
    escrowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'RELEASED', 'REFUNDED', 'DISPUTED'],
      default: 'PENDING'
    }
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

// Update the updatedAt field on document update
ApplicationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Add status to history when status changes
ApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.isNew ? this.jobSeekerId : undefined, // Default to job seeker for new applications
      createdAt: Date.now()
    });
  }
  
  next();
});

// Virtual for job data
ApplicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true
});

// Virtual for job seeker data
ApplicationSchema.virtual('jobSeeker', {
  ref: 'User',
  localField: 'jobSeekerId',
  foreignField: '_id',
  justOne: true
});

// Method to add a note
ApplicationSchema.methods.addNote = function(text, userId) {
  this.notes.push({
    text,
    userId,
    createdAt: Date.now()
  });
  return this.save();
};

// Method to schedule an interview
ApplicationSchema.methods.scheduleInterview = function(interviewData) {
  this.interview = {
    ...this.interview,
    ...interviewData
  };
  
  if (this.status !== 'INTERVIEW') {
    this.status = 'INTERVIEW';
  }
  
  return this.save();
};

// Method to create an offer
ApplicationSchema.methods.createOffer = function(offerData) {
  this.offer = {
    ...this.offer,
    ...offerData,
    accepted: false
  };
  
  if (this.status !== 'OFFERED') {
    this.status = 'OFFERED';
  }
  
  return this.save();
};

// Method to accept an offer
ApplicationSchema.methods.acceptOffer = function() {
  if (!this.offer) {
    throw new Error('No offer exists for this application');
  }
  
  this.offer.accepted = true;
  this.offer.acceptedAt = Date.now();
  this.status = 'ACCEPTED';
  
  return this.save();
};

// Static method to find applications by status
ApplicationSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('jobId jobSeekerId');
};

// Static method to check if user has applied to job
ApplicationSchema.statics.hasApplied = async function(jobId, jobSeekerId) {
  const count = await this.countDocuments({ 
    jobId, 
    jobSeekerId,
    status: { $ne: 'WITHDRAWN' }
  });
  
  return count > 0;
};

// Static method to get application statistics
ApplicationSchema.statics.getStats = async function(userId, role) {
  const match = {};
  
  if (role === 'jobSeeker') {
    match.jobSeekerId = userId;
  } else if (role === 'sponsor') {
    // First get all jobs by this sponsor
    const mongoose = require('mongoose');
    const Job = mongoose.model('Job');
    const jobs = await Job.find({ sponsorId: userId }).select('_id');
    const jobIds = jobs.map(job => job._id);
    
    match.jobId = { $in: jobIds };
  } else if (role === 'agent') {
    // First get all jobs managed by this agent
    const mongoose = require('mongoose');
    const Job = mongoose.model('Job');
    const jobs = await Job.find({ agentId: userId }).select('_id');
    const jobIds = jobs.map(job => job._id);
    
    match.jobId = { $in: jobIds };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    { $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  // Convert to an object
  const result = {
    total: 0
  };
  
  stats.forEach(item => {
    result[item.status.toLowerCase()] = item.count;
    result.total += item.count;
  });
  
  return result;
};

module.exports = mongoose.model('Application', ApplicationSchema);
