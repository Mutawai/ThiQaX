// src/controllers/integrationController.js
const documentIntegrationService = require('../services/documentIntegrationService');
const profileIntegrationService = require('../services/profileIntegrationService');
const notificationService = require('../services/notificationService');
const { catchAsync } = require('../utils/errorHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Controller for handling integrated operations across system components
 */
const integrationController = {
  /**
   * Link documents to an application
   * @desc    Connects uploaded documents to a specific job application
   * @route   POST /api/v1/integrations/applications/:applicationId/documents
   * @access  Private (JobSeeker, Agent, Admin)
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and updated application data
   */
  linkDocumentsToApplication: catchAsync(async (req, res) => {
    const { applicationId } = req.params;
    const { documentIds } = req.body;

    if (!applicationId) {
      throw new ErrorResponse('Application ID is required', 400);
    }

    if (!documentIds || !documentIds.length) {
      throw new ErrorResponse('At least one document ID is required', 400);
    }

    const result = await documentIntegrationService.linkDocumentsToApplication(
      applicationId,
      documentIds
    );

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * Update document verification status
   * @desc    Updates the verification status of a document
   * @route   PUT /api/v1/integrations/documents/:documentId/verification
   * @access  Private (Admin, Agent)
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and updated document data
   */
  updateDocumentVerification: catchAsync(async (req, res) => {
    const { documentId } = req.params;
    const { verificationStatus, verificationNotes, rejectionReason } = req.body;
    const verifierId = req.user.id;

    if (!documentId) {
      throw new ErrorResponse('Document ID is required', 400);
    }

    if (!verificationStatus) {
      throw new ErrorResponse('Verification status is required', 400);
    }

    // If rejecting a document, rejection reason is required
    if (verificationStatus === 'REJECTED' && !rejectionReason) {
      throw new ErrorResponse('Rejection reason is required when rejecting a document', 400);
    }

    const result = await documentIntegrationService.updateVerificationStatus(
      documentId,
      verificationStatus,
      verificationNotes,
      rejectionReason,
      verifierId
    );

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * Check and process document expirations
   * @desc    Identifies documents approaching expiration and sends notifications
   * @route   POST /api/v1/integrations/documents/check-expirations
   * @access  Private (Admin)
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and processing results
   */
  checkDocumentExpirations: catchAsync(async (req, res) => {
    const result = await documentIntegrationService.checkDocumentExpirations();

    res.status(200).json({
      success: true,
      data: {
        checked: result.processedCount || 0,
        notified: result.notifiedCount || 0
      }
    });
  }),

  /**
   * Sync document verification with profile KYC status
   * @desc    Updates a user's KYC status based on their verified documents
   * @route   POST /api/v1/integrations/users/:userId/sync-verification
   * @access  Private (Admin, Agent)
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and updated profile data
   */
  syncProfileVerification: catchAsync(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw new ErrorResponse('User ID is required', 400);
    }

    const profile = await documentIntegrationService.syncProfileVerificationStatus(userId);

    res.status(200).json({
      success: true,
      data: {
        profile,
        kycStatus: profile.kycStatus
      }
    });
  }),

  /**
   * Check if a user is eligible to apply for a job
   * @desc    Verifies if a user profile meets requirements for a specific job
   * @route   GET /api/v1/integrations/profiles/:profileId/jobs/:jobId/eligibility
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and eligibility details
   */
  checkApplicationEligibility: catchAsync(async (req, res) => {
    const { profileId, jobId } = req.params;

    if (!profileId) {
      throw new ErrorResponse('Profile ID is required', 400);
    }

    if (!jobId) {
      throw new ErrorResponse('Job ID is required', 400);
    }

    // Ensure the user has permission to check this profile
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      const profile = await profileIntegrationService.getProfileById(profileId);
      if (profile.user.toString() !== req.user.id) {
        throw new ErrorResponse('Not authorized to access this profile', 403);
      }
    }

    const eligibility = await profileIntegrationService.checkApplicationEligibility(
      profileId,
      jobId
    );

    res.status(200).json({
      success: true,
      data: eligibility
    });
  }),

  /**
   * Sync profile data with applications
   * @desc    Updates all applications associated with a profile when profile data changes
   * @route   POST /api/v1/integrations/profiles/:profileId/sync-applications
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and sync results
   */
  syncProfileWithApplications: catchAsync(async (req, res) => {
    const { profileId } = req.params;

    if (!profileId) {
      throw new ErrorResponse('Profile ID is required', 400);
    }

    // Ensure the user has permission to sync this profile
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      const profile = await profileIntegrationService.getProfileById(profileId);
      if (profile.user.toString() !== req.user.id) {
        throw new ErrorResponse('Not authorized to sync this profile', 403);
      }
    }

    const result = await profileIntegrationService.syncProfileWithApplications(profileId);

    res.status(200).json({
      success: true,
      data: {
        updatedCount: result.updatedCount || 0,
        applications: result.applications || []
      }
    });
  }),

  /**
   * Update profile completeness status
   * @desc    Recalculates and updates profile completion percentage
   * @route   POST /api/v1/integrations/profiles/:profileId/update-completeness
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and updated profile data
   */
  updateProfileCompleteness: catchAsync(async (req, res) => {
    const { profileId } = req.params;

    if (!profileId) {
      throw new ErrorResponse('Profile ID is required', 400);
    }

    // Ensure the user has permission to update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      const profile = await profileIntegrationService.getProfileById(profileId);
      if (profile.user.toString() !== req.user.id) {
        throw new ErrorResponse('Not authorized to update this profile', 403);
      }
    }

    const result = await profileIntegrationService.updateProfileCompleteness(profileId);

    res.status(200).json({
      success: true,
      data: {
        completionPercentage: result.completionPercentage,
        missingFields: result.missingFields,
        isComplete: result.isComplete
      }
    });
  }),

  /**
   * Check KYC verification status
   * @desc    Retrieves the current KYC verification status for a user
   * @route   GET /api/v1/integrations/users/:userId/kyc-status
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and KYC verification details
   */
  checkKycStatus: catchAsync(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw new ErrorResponse('User ID is required', 400);
    }

    // Ensure the user has permission to check this KYC status
    if (req.user.role !== 'admin' && req.user.role !== 'agent' && req.user.id !== userId) {
      throw new ErrorResponse('Not authorized to check this KYC status', 403);
    }

    const kycStatus = await profileIntegrationService.checkKycVerificationStatus(userId);

    res.status(200).json({
      success: true,
      data: kycStatus
    });
  }),

  /**
   * Send notification for job status change
   * @desc    Notifies relevant users when a job's status changes
   * @route   POST /api/v1/integrations/jobs/:jobId/status-notification
   * @access  Private (Admin, Agent, Sponsor)
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and notification results
   */
  jobStatusChangeNotification: catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const { oldStatus, newStatus, applicantIds, message } = req.body;
    const actionByUserId = req.user.id;

    if (!jobId) {
      throw new ErrorResponse('Job ID is required', 400);
    }

    if (!oldStatus || !newStatus) {
      throw new ErrorResponse('Old and new status values are required', 400);
    }

    const notifications = await notificationService.jobStatusChangeNotification(
      jobId,
      oldStatus,
      newStatus,
      applicantIds,
      message,
      actionByUserId
    );

    res.status(200).json({
      success: true,
      data: { 
        notificationCount: notifications.length,
        notifications: notifications.map(n => ({
          id: n._id,
          recipient: n.recipient,
          title: n.title
        }))
      }
    });
  }),

  /**
   * Send notification for application milestone
   * @desc    Notifies relevant users when an application reaches a milestone
   * @route   POST /api/v1/integrations/applications/:applicationId/milestone-notification
   * @access  Private (Admin, Agent, Sponsor)
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and notification details
   */
  applicationMilestoneNotification: catchAsync(async (req, res) => {
    const { applicationId } = req.params;
    const { milestone, details } = req.body;
    const actionByUserId = req.user.id;

    if (!applicationId) {
      throw new ErrorResponse('Application ID is required', 400);
    }

    if (!milestone) {
      throw new ErrorResponse('Milestone is required', 400);
    }

    const notifications = await notificationService.applicationMilestoneNotification(
      applicationId,
      milestone,
      details,
      actionByUserId
    );

    res.status(200).json({
      success: true,
      data: { 
        notifications,
        milestone,
        timestamp: new Date().toISOString()
      }
    });
  }),

  /**
   * Get unread notification count
   * @desc    Retrieves the count of unread notifications for the current user
   * @route   GET /api/v1/integrations/notifications/unread-count
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and unread notification count
   */
  getUnreadNotificationCount: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  }),

  /**
   * Get user notifications with pagination
   * @desc    Retrieves notifications for the current user with filtering options
   * @route   GET /api/v1/integrations/notifications
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status, notifications data, and pagination details
   */
  getUserNotifications: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, read } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      read: read === 'true' ? true : (read === 'false' ? false : undefined)
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  }),

  /**
   * Mark notifications as read
   * @desc    Updates specified notifications to read status
   * @route   PUT /api/v1/integrations/notifications/mark-read
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and updated count
   */
  markNotificationsAsRead: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !notificationIds.length) {
      throw new ErrorResponse('At least one notification ID is required', 400);
    }

    const result = await notificationService.markAsRead(userId, notificationIds);

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result,
        markedIds: notificationIds
      }
    });
  }),

  /**
   * Mark all notifications as read
   * @desc    Updates all of the current user's notifications to read status
   * @route   PUT /api/v1/integrations/notifications/mark-all-read
   * @access  Private
   * @param   {Object} req - Express request object
   * @param   {Object} res - Express response object
   * @returns {Object} Success status and updated count
   */
  markAllNotificationsAsRead: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const count = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: count
      }
    });
  })
};

module.exports = integrationController;
