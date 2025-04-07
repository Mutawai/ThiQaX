/**
 * ThiQaX Backend Notification System
 * 
 * This artifact contains the backend components for the real-time notification system:
 * 1. Notification controllers for API endpoints
 * 2. WebSocket server setup and management
 * 3. Notification manager utility for creating and sending notifications
 */

// =======================================
// src/controllers/notification.js
// =======================================
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../models/Notification');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res, next) => {
  // Add filter for current user
  req.query.recipient = req.user.id;
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  // Get read status filter if provided
  const readFilter = req.query.read === 'true' ? true : 
                     req.query.read === 'false' ? false : null;
  
  // Build query
  let query = Notification.find({ recipient: req.user.id });
  
  // Apply read filter if provided
  if (readFilter !== null) {
    query = query.find({ read: readFilter });
  }
  
  // Execute query with pagination
  const results = await query
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);
    
  // Get total count
  const total = await Notification.countDocuments({ 
    recipient: req.user.id,
    ...(readFilter !== null ? { read: readFilter } : {})
  });
  
  // Get unread count
  const unreadCount = await Notification.countDocuments({ 
    recipient: req.user.id,
    read: false
  });
  
  // Pagination result
  const pagination = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  };
  
  res.status(200).json({
    success: true,
    data: {
      items: results,
      pagination,
      unreadCount
    }
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/v1/notifications/count
 * @access  Private
 */
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  // Get unread count
  const unreadCount = await Notification.countDocuments({ 
    recipient: req.user.id,
    read: false
  });
  
  res.status(200).json({
    success: true,
    data: {
      unreadCount
    }
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/mark-read
 * @access  Private
 */
exports.markNotificationAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check ownership
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to modify this notification`, 403)
    );
  }
  
  notification.read = true;
  await notification.save();
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/mark-all-read
 * @access  Private
 */
exports.markAllNotificationsAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  
  if (!notification) {
    return next(
      new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404)
    );
  }
  
  // Check ownership
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`Not authorized to delete this notification`, 403)
    );
  }
  
  await notification.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Clear all notifications
 * @route   DELETE /api/v1/notifications
 * @access  Private
 */
exports.clearAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ recipient: req.user.id });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// =======================================
// src/backend/websocket/socket.js
// =======================================
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Initialize socket server
const initSocketServer = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST']
    }
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      
      // Get user from database
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: ' + err.message));
    }
  });
  
  // Connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    
    // Join user-specific room
    socket.join(`user:${socket.user._id}`);
    
    // Join role-specific room
    socket.join(`role:${socket.user.role}`);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });
  
  return io;
};

// Function to emit notification to specific user
const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

// Function to emit notification to all users with specific role
const emitRoleNotification = (io, role, notification) => {
  io.to(`role:${role}`).emit('notification', notification);
};

// Function to emit notification to all users
const emitBroadcast = (io, notification) => {
  io.emit('notification', notification);
};

module.exports = {
  initSocketServer,
  emitNotification,
  emitRoleNotification,
  emitBroadcast
};

// =======================================
// src/backend/utils/notificationManager.js
// =======================================
const Notification = require('../models/Notification');
const { emitNotification } = require('../websocket/socket');

/**
 * Create and send notification
 * @param {Object} io Socket.io instance
 * @param {Object} data Notification data
 * @param {string} data.recipient Recipient user ID
 * @param {string} data.type Notification type
 * @param {string} data.title Notification title
 * @param {string} data.message Notification message
 * @param {Object} data.data Additional data
 * @returns {Promise<Object>} Created notification
 */
exports.createNotification = async (io, data) => {
  try {
    // Create notification in database
    const notification = await Notification.create(data);
    
    // Emit notification via WebSocket
    emitNotification(io, data.recipient, notification);
    
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

/**
 * Send document verification notification
 * @param {Object} io Socket.io instance
 * @param {Object} document Document object
 * @param {string} status Verification status (VERIFIED or REJECTED)
 */
exports.sendDocumentVerificationNotification = async (io, document, status) => {
  const type = status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED';
  const title = status === 'VERIFIED' ? 'Document Verified' : 'Document Rejected';
  const message = status === 'VERIFIED'
    ? `Your ${document.documentType.replace('_', ' ').toLowerCase()} document has been verified.`
    : `Your ${document.documentType.replace('_', ' ').toLowerCase()} document has been rejected. Please check the rejection reason and upload a new document.`;
  
  await this.createNotification(io, {
    recipient: document.user,
    type,
    title,
    message,
    data: {
      documentId: document._id,
      documentType: document.documentType,
      rejectionReason: document.rejectionReason
    }
  });
};

/**
 * Send application status notification
 * @param {Object} io Socket.io instance
 * @param {Object} application Application object
 * @param {string} previousStatus Previous application status
 */
exports.sendApplicationStatusNotification = async (io, application, previousStatus) => {
  let title = 'Application Status Updated';
  let message = '';
  
  switch (application.status) {
    case 'UNDER_REVIEW':
      message = `Your application for ${application.job.title} is now under review.`;
      break;
    case 'SHORTLISTED':
      message = `Congratulations! You've been shortlisted for ${application.job.title}.`;
      break;
    case 'INTERVIEW_SCHEDULED':
      message = `Interview scheduled for ${application.job.title}. Please check details.`;
      break;
    case 'OFFER_EXTENDED':
      title = 'Job Offer Received';
      message = `Congratulations! You've received a job offer for ${application.job.title}.`;
      break;
    case 'HIRED':
      title = 'Hired!';
      message = `Congratulations! You've been hired for ${application.job.title}.`;
      break;
    case 'REJECTED':
      title = 'Application Not Selected';
      message = `We regret to inform you that your application for ${application.job.title} was not selected.`;
      break;
    default:
      message = `Your application for ${application.job.title} has been updated to ${application.status.replace('_', ' ').toLowerCase()}.`;
  }
  
  await this.createNotification(io, {
    recipient: application.user,
    type: 'APPLICATION_STATUS',
    title,
    message,
    data: {
      applicationId: application._id,
      jobId: application.job._id,
      status: application.status,
      previousStatus
    }
  });
};

/**
 * Send document expiration notification
 * @param {Object} io Socket.io instance
 * @param {Object} document Document object
 * @param {number} daysToExpiry Days until document expires
 */
exports.sendDocumentExpiryNotification = async (io, document, daysToExpiry) => {
  await this.createNotification(io, {
    recipient: document.user,
    type: 'DOCUMENT_EXPIRING',
    title: 'Document Expiring Soon',
    message: `Your ${document.documentType.replace('_', ' ').toLowerCase()} document will expire in ${daysToExpiry} days. Please upload a new document.`,
    data: {
      documentId: document._id,
      documentType: document.documentType,
      expiryDate: document.expiryDate
    }
  });
};

/**
 * Send job match notification
 * @param {Object} io Socket.io instance
 * @param {Object} user User object
 * @param {Object} job Job object
 * @param {number} matchScore Match percentage score
 */
exports.sendJobMatchNotification = async (io, user, job, matchScore) => {
  await this.createNotification(io, {
    recipient: user._id,
    type: 'JOB_MATCH',
    title: 'New Job Match',
    message: `We found a job that matches your profile: ${job.title} with ${matchScore}% match.`,
    data: {
      jobId: job._id,
      matchScore
    }
  });
};

// =======================================
// src/backend/routes/notification.js
// =======================================
const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notification');

const router = express.Router();

// Protect all routes
const { protect } = require('../middleware/auth');
router.use(protect);

router.route('/')
  .get(getNotifications)
  .delete(clearAllNotifications);

router.route('/count')
  .get(getUnreadCount);

router.route('/mark-all-read')
  .put(markAllNotificationsAsRead);

router.route('/:id/mark-read')
  .put(markNotificationAsRead);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;

// =======================================
// src/backend/models/Notification.js
// =======================================
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
      'DOCUMENT_VERIFIED',
      'DOCUMENT_REJECTED',
      'APPLICATION_STATUS',
      'JOB_MATCH',
      'DOCUMENT_EXPIRING',
      'SYSTEM'
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
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index on recipient and read status for faster queries
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

// =======================================
// Integration with server.js
// =======================================
/**
 * Add this to your server.js file to initialize the WebSocket server
 */
/*
const http = require('http');
const express = require('express');
const { initSocketServer } = require('./websocket/socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
const io = initSocketServer(server);

// Make io available to the rest of the application
app.set('io', io);

// Your routes and middleware here...

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

*/

// =======================================
// Usage in application controllers
// =======================================
/**
 * Example of using the notification manager in a controller
 */
/*
const asyncHandler = require('../middleware/async');
const Document = require('../models/Document');
const { sendDocumentVerificationNotification } = require('../utils/notificationManager');

exports.verifyDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id);
  
  // Update document verification status
  document.verificationStatus = req.body.status;
  document.verifiedBy = req.user.id;
  document.verifiedAt = Date.now();
  
  if (req.body.status === 'REJECTED') {
    document.rejectionReason = req.body.rejectionReason;
  }
  
  await document.save();
  
  // Get io instance from app
  const io = req.app.get('io');
  
  // Send notification to document owner
  await sendDocumentVerificationNotification(io, document, req.body.status);
  
  res.status(200).json({
    success: true,
    data: document
  });
});
*/
