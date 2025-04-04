// File: src/models/Notification.js

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'document-status',  // Document verification status changed
      'new-document',     // New document uploaded (for admins)
      'kyc-verified',     // KYC verification completed
      'kyc-rejected',     // KYC verification rejected
      'job-application',  // Job application status changed
      'new-message',      // New message received
      'system'            // System notification
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    // Additional data related to the notification
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  sender: {
    // User who triggered the notification (if applicable)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Indexes for faster queries
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, recipient: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
