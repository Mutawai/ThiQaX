/**
 * Notification model
 * Manages platform notifications for all user types
 */

const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - title
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user receiving the notification
 *         type:
 *           type: string
 *           enum: [APPLICATION, DOCUMENT, JOB, PAYMENT, SYSTEM, GENERAL]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title/heading
 *         message:
 *           type: string
 *           description: Notification message content
 *         read:
 *           type: boolean
 *           default: false
 *           description: Whether the notification has been read
 *         priority:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH]
 *           default: NORMAL
 *           description: Notification priority level
 *         entityId:
 *           type: string
 *           description: ID of the related entity (application, job, etc.)
 *         entityType:
 *           type: string
 *           description: Type of the related entity
 *         actionLabel:
 *           type: string
 *           description: Label for call-to-action button
 *         actionUrl:
 *           type: string
 *           description: URL for call-to-action button
 *       example:
 *         userId: "60d0fe4f5311236168a109ca"
 *         type: "APPLICATION"
 *         title: "Application Status Updated"
 *         message: "Your application for Housekeeping Supervisor has been shortlisted"
 *         read: false
 *         priority: "NORMAL"
 *         entityId: "60d0fe4f5311236168a109cb"
 *         entityType: "Application"
 *         actionLabel: "View Application"
 *         actionUrl: "/applications/60d0fe4f5311236168a109cb"
 */
const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  type: {
    type: String,
    enum: ['APPLICATION', 'DOCUMENT', 'JOB', 'PAYMENT', 'SYSTEM', 'GENERAL'],
    required: [true, 'Notification type is required'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  
  message: {
    type: String,
    trim: true
  },
  
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  priority: {
    type: String,
    enum: ['LOW', 'NORMAL', 'HIGH'],
    default: 'NORMAL'
  },
  
  // Related entity
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  
  entityType: {
    type: String,
    enum: ['Application', 'Document', 'Job', 'Payment', 'User']
  },
  
  // Call-to-action
  actionLabel: {
    type: String
  },
  
  actionUrl: {
    type: String
  },
  
  // For push notifications
  delivered: {
    type: Boolean,
    default: false
  },
  
  deliveredAt: {
    type: Date
  },
  
  // Additional data for rendering
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // For email notifications
  emailSent: {
    type: Boolean,
    default: false
  },
  
  emailSentAt: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiresAt: {
    type: Date,
    index: true
  }
});

// Set TTL index (automatically delete old notifications after 90 days)
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = Date.now();
  return this.save();
};

// Mark notification as delivered
NotificationSchema.methods.markAsDelivered = function() {
  this.delivered = true;
  this.deliveredAt = Date.now();
  return this.save();
};

// Mark notification email as sent
NotificationSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentAt = Date.now();
  return this.save();
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: Date.now() }
  );
};

// Static method to create a new notification
NotificationSchema.statics.createNotification = async function(notificationData) {
  return await this.create({
    ...notificationData,
    createdAt: Date.now()
  });
};

// Static method for creating application status notifications
NotificationSchema.statics.createApplicationStatusNotification = async function(
  userId,
  applicationId,
  status,
  jobTitle
) {
  let title, message;
  
  switch (status) {
    case 'SHORTLISTED':
      title = 'Application Shortlisted';
      message = `Your application for ${jobTitle} has been shortlisted.`;
      break;
    case 'INTERVIEW':
      title = 'Interview Invitation';
      message = `You have been invited for an interview for the ${jobTitle} position.`;
      break;
    case 'OFFERED':
      title = 'Job Offer Received';
      message = `Congratulations! You have received a job offer for the ${jobTitle} position.`;
      break;
    case 'ACCEPTED':
      title = 'Job Offer Accepted';
      message = `You have successfully accepted the offer for ${jobTitle}.`;
      break;
    case 'REJECTED':
      title = 'Application Status Update';
      message = `We regret to inform you that your application for ${jobTitle} was not successful.`;
      break;
    default:
      title = 'Application Status Update';
      message = `Your application for ${jobTitle} has been updated to ${status}.`;
  }
  
  return this.createNotification({
    userId,
    type: 'APPLICATION',
    title,
    message,
    entityId: applicationId,
    entityType: 'Application',
    actionLabel: 'View Application',
    actionUrl: `/applications/${applicationId}`,
    priority: status === 'OFFERED' ? 'HIGH' : 'NORMAL'
  });
};

// Static method for creating document verification notifications
NotificationSchema.statics.createDocumentVerificationNotification = async function(
  userId,
  documentId,
  documentType,
  status,
  reason
) {
  const title = status === 'VERIFIED' 
    ? 'Document Verified' 
    : 'Document Verification Failed';
    
  const message = status === 'VERIFIED'
    ? `Your ${documentType} document has been successfully verified.`
    : `Your ${documentType} document verification failed. Reason: ${reason}`;
  
  return this.createNotification({
    userId,
    type: 'DOCUMENT',
    title,
    message,
    entityId: documentId,
    entityType: 'Document',
    actionLabel: 'View Document',
    actionUrl: `/profile/documents/${documentId}`,
    priority: status === 'REJECTED' ? 'HIGH' : 'NORMAL'
  });
};

// Static method for creating job notifications
NotificationSchema.statics.createJobNotification = async function(
  userId,
  jobId,
  action,
  jobTitle
) {
  let title, message;
  
  switch (action) {
    case 'NEW_MATCH':
      title = 'New Job Match';
      message = `A new job matching your profile: ${jobTitle}`;
      break;
    case 'CLOSING_SOON':
      title = 'Job Closing Soon';
      message = `The job "${jobTitle}" is closing applications soon.`;
      break;
    case 'NEW_APPLICATION':
      title = 'New Job Application';
      message = `You have received a new application for the ${jobTitle} position.`;
      break;
    default:
      title = 'Job Update';
      message = `There is an update for the job: ${jobTitle}`;
  }
  
  return this.createNotification({
    userId,
    type: 'JOB',
    title,
    message,
    entityId: jobId,
    entityType: 'Job',
    actionLabel: action === 'NEW_APPLICATION' ? 'View Applications' : 'View Job',
    actionUrl: action === 'NEW_APPLICATION' ? `/jobs/${jobId}/applications` : `/jobs/${jobId}`,
    priority: action === 'NEW_MATCH' ? 'HIGH' : 'NORMAL'
  });
};

// Static method for creating payment notifications
NotificationSchema.statics.createPaymentNotification = async function(
  userId,
  paymentId,
  status,
  amount,
  currency
) {
  let title, message;
  
  switch (status) {
    case 'COMPLETED':
      title = 'Payment Completed';
      message = `Your payment of ${currency} ${amount} has been completed successfully.`;
      break;
    case 'RELEASED':
      title = 'Payment Released';
      message = `Escrow payment of ${currency} ${amount} has been released to your account.`;
      break;
    case 'REFUNDED':
      title = 'Payment Refunded';
      message = `Your payment of ${currency} ${amount} has been refunded.`;
      break;
    case 'DISPUTED':
      title = 'Payment Disputed';
      message = `A payment of ${currency} ${amount} has been disputed.`;
      break;
    default:
      title = 'Payment Update';
      message = `Your payment of ${currency} ${amount} has been updated to ${status}.`;
  }
  
  return this.createNotification({
    userId,
    type: 'PAYMENT',
    title,
    message,
    entityId: paymentId,
    entityType: 'Payment',
    actionLabel: 'View Payment',
    actionUrl: `/payments/${paymentId}`,
    priority: status === 'DISPUTED' ? 'HIGH' : 'NORMAL'
  });
};

module.exports = mongoose.model('Notification', NotificationSchema);
