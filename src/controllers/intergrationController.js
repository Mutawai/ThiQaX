// src/controllers/integrationController.js
const documentIntegrationService = require('../services/documentIntegrationService');
const profileIntegrationService = require('../services/profileIntegrationService');
const notificationService = require('../services/notificationService');
const { catchAsync } = require('../utils/errorHandler');

/**
 * Controller for handling integrated operations across system components
 */
const integrationController = {
  /**
   * Link documents to an application
   */
  linkDocumentsToApplication: catchAsync(async (req, res) => {
    const { applicationId } = req.params;
    const { documentIds } = req.body;

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
   */
  updateDocumentVerification: catchAsync(async (req, res) => {
    const { documentId } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    const result = await documentIntegrationService.updateVerificationStatus(
      documentId,
      verificationStatus,
      verificationNotes
    );

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * Check and process document expirations
   */
  checkDocumentExpirations: catchAsync(async (req, res) => {
    // This could be triggered by a scheduled job or admin action
    const count = await documentIntegrationService.checkDocumentExpirations();

    res.status(200).json({
      success: true,
      message: `Processed ${count} documents for expiration notifications`
    });
  }),

  /**
   * Sync document verification with profile KYC status
   */
  syncProfileVerification: catchAsync(async (req, res) => {
    const { userId } = req.params;

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
   */
  checkApplicationEligibility: catchAsync(async (req, res) => {
    const { profileId, jobId } = req.params;

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
   */
  syncProfileWithApplications: catchAsync(async (req, res) => {
    const { profileId } = req.params;

    const result = await profileIntegrationService.syncProfileWithApplications(profileId);

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * Update profile completeness status
   */
  updateProfileCompleteness: catchAsync(async (req, res) => {
    const { profileId } = req.params;

    const result = await profileIntegrationService.updateProfileCompleteness(profileId);

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * Check KYC verification status
   */
  checkKycStatus: catchAsync(async (req, res) => {
    const { userId } = req.params;

    const kycStatus = await profileIntegrationService.checkKycVerificationStatus(userId);

    res.status(200).json({
      success: true,
      data: kycStatus
    });
  }),

  /**
   * Send notification for job status change
   */
  jobStatusChangeNotification: catchAsync(async (req, res) => {
    const { jobId } = req.params;
    const { oldStatus, newStatus, applicantIds } = req.body;

    const notifications = await notificationService.jobStatusChangeNotification(
      jobId,
      oldStatus,
      newStatus,
      applicantIds
    );

    res.status(200).json({
      success: true,
      message: `Sent ${notifications.length} notifications`,
      data: { notificationCount: notifications.length }
    });
  }),

  /**
   * Send notification for application milestone
   */
  applicationMilestoneNotification: catchAsync(async (req, res) => {
    const { applicationId } = req.params;
    const { milestone, details } = req.body;

    const notification = await notificationService.applicationMilestoneNotification(
      applicationId,
      milestone,
      details
    );

    res.status(200).json({
      success: true,
      data: notification
    });
  }),

  /**
   * Get unread notification count
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
   */
  getUserNotifications: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        unreadOnly: unreadOnly === 'true'
      }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  }),

  /**
   * Mark notifications as read
   */
  markNotificationsAsRead: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    const count = await notificationService.markAsRead(userId, notificationIds);

    res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read`
    });
  }),

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: catchAsync(async (req, res) => {
    const userId = req.user.id;

    const count = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: `Marked ${count} notifications as read`
    });
  })
};

module.exports = integrationController;
