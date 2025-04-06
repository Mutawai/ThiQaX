// src/services/notificationService.js

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
    // Verify recipient exists
    const recipient = await User.findById(data.recipient);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const notification = await Notification.create({
      recipient: data.recipient,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      sender: data.sender || null,
      read: false,
      readAt: null
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
  },

  /**
   * Send notification for job status changes
   * @param {string} jobId - ID of the job that changed
   * @param {string} oldStatus - Previous job status
   * @param {string} newStatus - New job status
   * @param {Array<string>} [applicantIds] - Optional array of applicant IDs to notify
   * @returns {Promise<Array>} Created notifications
   */
  jobStatusChanged: async (jobId, oldStatus, newStatus, applicantIds = []) => {
    try {
      const notifications = [];
      const Job = require('../models/Job'); // Import here to avoid circular dependencies
      const job = await Job.findById(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      // Notify job poster
      const posterNotification = await notificationService.createNotification({
        recipient: job.postedBy,
        type: 'job-status',
        title: 'Job Status Update',
        message: `Your job listing "${job.title}" status has changed from ${oldStatus} to ${newStatus}.`,
        data: { jobId, oldStatus, newStatus }
      });
      
      notifications.push(posterNotification);

      // Notify applicants if provided
      if (applicantIds.length > 0) {
        for (const applicantId of applicantIds) {
          const notification = await notificationService.createNotification({
            recipient: applicantId,
            type: 'job-status',
            title: 'Job Status Update',
            message: `A job you applied for "${job.title}" has changed status to ${newStatus}.`,
            data: { jobId, oldStatus, newStatus }
          });
          
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending job status notification:', error);
      throw error;
    }
  },

  /**
   * Send notification for application milestone events
   * @param {string} applicationId - ID of the application
   * @param {string} milestone - The milestone achieved
   * @param {Object} details - Additional milestone details
   * @returns {Promise<Array>} Created notifications
   */
  applicationMilestoneChanged: async (applicationId, milestone, details = {}) => {
    try {
      const notifications = [];
      const Application = require('../models/Application'); // Import here to avoid circular dependencies
      
      const application = await Application.findById(applicationId)
        .populate('jobId', 'title postedBy')
        .populate('applicantId', 'name');
      
      if (!application) {
        throw new Error('Application not found');
      }

      // Define milestone messages
      const milestoneMessages = {
        'INTERVIEW_SCHEDULED': `Your interview for "${application.jobId.title}" has been scheduled.`,
        'OFFER_EXTENDED': `Congratulations! You've received a job offer for "${application.jobId.title}".`,
        'ONBOARDING_STARTED': `Onboarding has begun for your position at "${application.jobId.title}".`,
        'VISA_PROCESSING': `Visa processing has started for your position at "${application.jobId.title}".`,
        'TRAVEL_ARRANGED': `Travel arrangements have been made for your position at "${application.jobId.title}".`,
        'SHORTLISTED': `Your application for "${application.jobId.title}" has been shortlisted.`,
        'REJECTED': `We regret to inform you that your application for "${application.jobId.title}" was not selected.`
      };

      const message = milestoneMessages[milestone] || 
        `Your application for "${application.jobId.title}" has reached the ${milestone} milestone.`;

      // Notify applicant
      const applicantNotification = await notificationService.createNotification({
        recipient: application.applicantId._id,
        type: 'application-milestone',
        title: `Application Update: ${milestone}`,
        message,
        data: { 
          applicationId,
          jobId: application.jobId._id,
          milestone,
          ...details
        }
      });
      
      notifications.push(applicantNotification);

      // Notify job poster
      const posterNotification = await notificationService.createNotification({
        recipient: application.jobId.postedBy,
        type: 'application-milestone',
        title: `Application Update: ${milestone}`,
        message: `${application.applicantId.name}'s application has reached the ${milestone} milestone.`,
        data: { 
          applicationId,
          jobId: application.jobId._id,
          applicantId: application.applicantId._id,
          milestone,
          ...details
        }
      });
      
      notifications.push(posterNotification);

      return notifications;
    } catch (error) {
      console.error('Error sending application milestone notification:', error);
      throw error;
    }
  },

  /**
   * Send profile update notification
   * @param {string} userId - User ID
   * @param {string} updateType - Type of profile update
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} Created notification
   */
  profileUpdated: async (userId, updateType, details = {}) => {
    try {
      const updateMessages = {
        'PROFILE_COMPLETED': 'Your profile has been completed successfully.',
        'PROFILE_INCOMPLETE': 'Your profile is incomplete. Please complete all required fields.',
        'PROFILE_APPROVED': 'Your profile has been approved by our administrators.',
        'PROFILE_REJECTED': 'Your profile requires changes before approval.',
        'KYC_PENDING': 'Your identity verification is pending. We will notify you once verified.'
      };
      
      const message = updateMessages[updateType] || 'Your profile has been updated.';
      
      return notificationService.createNotification({
        recipient: userId,
        type: 'profile-update',
        title: 'Profile Update',
        message,
        data: { updateType, ...details }
      });
    } catch (error) {
      console.error('Error sending profile update notification:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of unread notifications
   */
  getUnreadCount: async (userId) => {
    try {
      return await Notification.countDocuments({ 
        recipient: userId, 
        read: false 
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
};

module.exports = notificationService;
