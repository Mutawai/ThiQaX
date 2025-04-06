// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Added missing import
const config = require('../config');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (unique)
 *         phone:
 *           type: string
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [jobSeeker, agent, sponsor, admin]
 *           description: User's role in the system
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (hashed, not returned in queries)
 *         profileComplete:
 *           type: boolean
 *           description: Whether the user has completed their profile
 *         kycVerified:
 *           type: boolean
 *           description: Whether the user's KYC is verified
 *         emailVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         active:
 *           type: boolean
 *           description: Whether the user account is active
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *       example:
 *         firstName: John
 *         lastName: Doe
 *         email: john.doe@example.com
 *         phone: "+254712345678"
 *         role: jobSeeker
 *         profileComplete: false
 *         kycVerified: false
 *         emailVerified: false
 *         active: true
 */
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^(\+\d{1,3}[- ]?)?\d{10,15}$/,
      'Please add a valid phone number'
    ]
  },
  role: {
    type: String,
    enum: ['jobSeeker', 'agent', 'sponsor', 'admin'],
    default: 'jobSeeker'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password in queries
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  kycVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
    select: false
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  // Update 'updatedAt' whenever a document is saved
  this.updatedAt = Date.now();
  
  // Only hash password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Update the updatedAt field on document update
UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.auth.jwtSecret,
    {
      expiresIn: config.auth.jwtExpire
    }
  );
};

// Generate refresh token
UserSchema.methods.getRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    config.auth.jwtRefreshSecret,
    { expiresIn: config.auth.jwtRefreshExpire }
  );

  return refreshToken;
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

module.exports = mongoose.model('User', UserSchema);
