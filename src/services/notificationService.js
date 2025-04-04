// File: src/services/notificationService.js

const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification service for managing system notifications
 */
const notificationService = {
  /**
   * Creates a new notification
   * @param {Object} data - Notification data
   * @param {String} data.recipient - User ID of the recipient
   * @param {String} data.type - Type of notification
   * @param {String} data.title - Notification title
   * @param {String} data.message - Notification message
   * @param {Object} data.data - Additional data related to the notification
   * @param {String} data.sender - User ID of the sender (optional)
   * @returns {Promise<Object>} Created notification
   */
  createNotification: async (data) => {
    const notification = await Notification.create({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      sender: data.sender || null
    });
    
    return notification;
  },
  
  /**
   * Creates notifications for document status changes
   * @param {Object} document - Document object
   * @param {String} status - New status
   * @param {String} adminId - Admin user ID
   * @param {String} notes - Admin notes (optional)
   * @returns {Promise<Object>} Created notification
   */
  documentStatusChanged: async (document, status, adminId, notes = '') => {
    const admin = await User.findById(adminId).select('name');
    const adminName = admin ? admin.name : 'An administrator';
    
    let title = '';
    let message = '';
    
    switch (status) {
      case 'underReview':
        title = 'Document Under Review';
        message = `Your ${document.type} document is now being reviewed by our team.`;
        break;
      case 'verified':
        title = 'Document Verified';
        message = `Your ${document.type} document has been verified by ${adminName}.`;
        break;
      case 'rejected':
        title = 'Document Rejected';
        message = `Your ${document.type} document was rejected: ${notes || 'Please check the document details and upload again if needed.'}`;
        break;
      case 'expired':
        title = 'Document Expired';
        message = `Your ${document.type} document has expired. Please upload a valid document.`;
        break;
      default:
        title = 'Document Status Update';
        message = `Your ${document.type} document status has been updated to ${status}.`;
    }
    
    // Create notification for document owner
    return notificationService.createNotification({
      recipient: document.owner,
      type: 'document-status',
      title,
      message,
      data: {
        documentId: document._id,
        documentType: document.type,
        status,
        notes
      },
      sender: adminId
    });
  },
  
  /**
   * Notifies admin team about new document upload
   * @param {Object} document - Document object
   * @returns {Promise<Array>} Created notifications
   */
  newDocumentUploaded: async (document) => {
    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('_id');
    
    // Create notifications for all admins
    const notifications = [];
    
    for (const admin of admins) {
      const notification = await notificationService.createNotification({
        recipient: admin._id,
        type: 'new-document',
        title: 'New Document Uploaded',
        message: `A new ${document.type} document has been uploaded and is waiting for verification.`,
        data: {
          documentId: document._id,
          documentType: document.type,
          uploadedBy: document.owner
        }
      });
      
      notifications.push(notification);
    }
    
    return notifications;
  },
  
  /**
   * Notifies user when all required documents are verified (KYC complete)
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Created notification
   */
  kycVerificationComplete: async (userId) => {
    return notificationService.createNotification({
      recipient: userId,
      type: 'kyc-verified',
      title: 'KYC Verification Complete',
      message: 'Congratulations! Your identity verification is complete. You now have full access to all platform features.',
      data: {
        verificationStatus: 'verified'
      }
    });
  },
  
  /**
   * Notifies user when critical document is rejected (KYC rejected)
   * @param {String} userId - User ID
   * @param {String} reason - Rejection reason
   * @returns {Promise<Object>} Created notification
   */
  kycVerificationRejected: async (userId, reason = '') => {
    return notificationService.createNotification({
      recipient: userId,
      type: 'kyc-rejected',
      title: 'Identity Verification Issue',
      message: `Your identity verification could not be completed. ${reason}`,
      data: {
        verificationStatus: 'rejected',
        reason
      }
    });
  },
  
  /**
   * Gets unread notifications for a user
   * @param {String} userId - User ID
   * @param {Number} limit - Maximum number of notifications to return
   * @returns {Promise<Array>} Unread notifications
   */
  getUnreadNotifications: async (userId, limit = 10) => {
    return Notification.find({
      recipient: userId,
      read: false
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name');
  },
  
  /**
   * Gets all notifications for a user with pagination
   * @param {String} userId - User ID
   * @param {Number} page - Page number
   * @param {Number} limit - Results per page
   * @returns {Promise<Object>} Notifications with pagination data
   */
  getUserNotifications: async (userId, page = 1, limit = 20) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const total = await Notification.countDocuments({ recipient: userId });
    
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('sender', 'name');
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    return {
      total,
      pagination,
      data: notifications
    };
  },
  
  /**
   * Marks a notification as read
   * @param {String} notificationId - Notification ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId, userId) => {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.read = true;
    notification.readAt = Date.now();
    
    await notification.save();
    
    return notification;
  },
  
  /**
   * Marks all notifications for a user as read
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  markAllAsRead: async (userId) => {
    return Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: Date.now() }
    );
  }
};

module.exports = notificationService;
