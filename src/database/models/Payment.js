const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - currency
 *         - payerId
 *       properties:
 *         transactionId:
 *           type: string
 *           description: Unique transaction ID
 *         amount:
 *           type: number
 *           description: Payment amount
 *         currency:
 *           type: string
 *           description: Payment currency code
 *         type:
 *           type: string
 *           enum: [ESCROW, DIRECT, FEE, REFUND]
 *           description: Type of payment
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, RELEASED, DISPUTED]
 *           description: Payment status
 *         payerId:
 *           type: string
 *           description: ID of the user making the payment
 *         payeeId:
 *           type: string
 *           description: ID of the user receiving the payment
 *         applicationId:
 *           type: string
 *           description: ID of the application this payment is for (if applicable)
 *         jobId:
 *           type: string
 *           description: ID of the job this payment is for (if applicable)
 *         paymentMethod:
 *           type: string
 *           enum: [CREDIT_CARD, MOBILE_MONEY, BANK_TRANSFER, PLATFORM_CREDIT]
 *           description: Method of payment
 *       example:
 *         transactionId: "TXN123456789"
 *         amount: 500
 *         currency: "USD"
 *         type: "ESCROW"
 *         status: "COMPLETED"
 *         payerId: "60d0fe4f5311236168a109ca"
 *         payeeId: "60d0fe4f5311236168a109cb"
 *         applicationId: "60d0fe4f5311236168a109cc"
 *         paymentMethod: "CREDIT_CARD"
 */
const PaymentSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: [true, 'Payment amount is required']
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD'
  },
  
  type: {
    type: String,
    enum: ['ESCROW', 'DIRECT', 'FEE', 'REFUND'],
    default: 'ESCROW'
  },
  
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'RELEASED', 'DISPUTED'],
    default: 'PENDING',
    index: true
  },
  
  payerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payer ID is required'],
    index: true
  },
  
  payeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // References to related entities
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    index: true
  },
  
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    index: true
  },
  
  // Payment method details
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'PLATFORM_CREDIT'],
    required: [true, 'Payment method is required']
  },
  
  paymentMethodDetails: {
    // Credit card
    cardLast4: String,
    cardBrand: String,
    
    // Mobile money
    phoneNumber: String,
    provider: String,
    
    // Bank transfer
    bankAccount: String,
    bankName: String,
    
    // Platform credit
    creditId: String
  },
  
  // External payment provider information
  providerData: {
    providerId: String,
    providerName: String,
    providerTransactionId: String,
    providerFee: Number
  },
  
  // For escrow payments
  escrow: {
    releaseDate: Date,
    releasedAt: Date,
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    releaseConditions: [{
      type: {
        type: String,
        enum: ['DOCUMENT_VERIFICATION', 'APPLICATION_STATUS', 'TIMEFRAME', 'MANUAL'],
        required: true
      },
      value: String,
      status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
      },
      completedAt: Date
    }]
  },
  
  // For disputes
  dispute: {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    raisedAt: Date,
    reason: String,
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    resolvedAt: Date,
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
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
  },
  
  completedAt: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate transaction ID before saving
PaymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const prefix = 'TXN';
    const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    
    this.transactionId = `${prefix}${timestamp}${randomPart}`.substring(0, 16);
  }
  
  this.updatedAt = Date.now();
  if (this.isModified('status') && this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = Date.now();
  }
  
  next();
});

// Methods for payment actions
PaymentSchema.methods.markAsCompleted = function() {
  this.status = 'COMPLETED';
  this.completedAt = Date.now();
  return this.save();
};

PaymentSchema.methods.refund = function(amount, reason, userId) {
  if (!amount) {
    amount = this.amount;
  }
  
  if (amount > this.amount) {
    throw new Error('Refund amount cannot be greater than payment amount');
  }
  
  this.status = 'REFUNDED';
  this.refund = {
    amount,
    reason,
    refundedAt: Date.now(),
    refundedBy: userId
  };
  
  return this.save();
};

PaymentSchema.methods.releaseEscrow = function(userId) {
  if (this.type !== 'ESCROW') {
    throw new Error('Only escrow payments can be released');
  }
  
  if (this.status !== 'COMPLETED') {
    throw new Error('Cannot release escrow for incomplete payment');
  }
  
  this.status = 'RELEASED';
  this.escrow.releasedAt = Date.now();
  this.escrow.releasedBy = userId;
  
  return this.save();
};

// Static method to calculate platform fees
PaymentSchema.statics.calculatePlatformFee = function(amount, percentageFee = 5) {
  const feeAmount = (amount * percentageFee) / 100;
  return {
    amount: feeAmount,
    percentage: percentageFee
  };
};

module.exports = mongoose.model('Payment', PaymentSchema);
