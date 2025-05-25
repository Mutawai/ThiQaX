// client/src/services/integrationService.js
import api from './api';

/**
 * Integration Service
 * Handles all integration-related API calls for connecting platform components
 */
class IntegrationService {
  /**
   * Link documents to a job application
   * @param {string} applicationId - Application ID
   * @param {string[]} documentIds - Array of document IDs to link
   * @returns {Promise} API response
   */
  async linkDocumentsToApplication(applicationId, documentIds) {
    const response = await api.post(
      `/integrations/applications/${applicationId}/documents`,
      { documentIds }
    );
    return response.data;
  }

  /**
   * Update document verification status
   * @param {string} documentId - Document ID
   * @param {Object} verificationData - Verification details
   * @returns {Promise} API response
   */
  async updateDocumentVerification(documentId, verificationData) {
    const response = await api.put(
      `/integrations/documents/${documentId}/verification`,
      verificationData
    );
    return response.data;
  }

  /**
   * Check for document expirations and send notifications
   * @returns {Promise} API response with expiration check results
   */
  async checkDocumentExpirations() {
    const response = await api.post('/integrations/documents/check-expirations');
    return response.data;
  }

  /**
   * Sync document verification with profile KYC status
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async syncProfileVerification(userId) {
    const response = await api.post(`/integrations/users/${userId}/sync-verification`);
    return response.data;
  }

  /**
   * Check if a user is eligible to apply for a job
   * @param {string} profileId - Profile ID
   * @param {string} jobId - Job ID
   * @returns {Promise} API response with eligibility details
   */
  async checkApplicationEligibility(profileId, jobId) {
    const response = await api.get(
      `/integrations/profiles/${profileId}/jobs/${jobId}/eligibility`
    );
    return response.data;
  }

  /**
   * Sync profile data with applications
   * @param {string} profileId - Profile ID
   * @returns {Promise} API response
   */
  async syncProfileWithApplications(profileId) {
    const response = await api.post(`/integrations/profiles/${profileId}/sync-applications`);
    return response.data;
  }

  /**
   * Update profile completeness status
   * @param {string} profileId - Profile ID
   * @returns {Promise} API response
   */
  async updateProfileCompleteness(profileId) {
    const response = await api.post(`/integrations/profiles/${profileId}/update-completeness`);
    return response.data;
  }

  /**
   * Check KYC verification status
   * @param {string} userId - User ID
   * @returns {Promise} API response with KYC status
   */
  async checkKycStatus(userId) {
    const response = await api.get(`/integrations/users/${userId}/kyc-status`);
    return response.data;
  }

  /**
   * Send job status change notification
   * @param {string} jobId - Job ID
   * @param {Object} statusData - Status change details
   * @returns {Promise} API response
   */
  async sendJobStatusNotification(jobId, statusData) {
    const response = await api.post(
      `/integrations/jobs/${jobId}/status-notification`,
      statusData
    );
    return response.data;
  }

  /**
   * Send application milestone notification
   * @param {string} applicationId - Application ID
   * @param {Object} milestoneData - Milestone details
   * @returns {Promise} API response
   */
  async sendApplicationMilestoneNotification(applicationId, milestoneData) {
    const response = await api.post(
      `/integrations/applications/${applicationId}/milestone-notification`,
      milestoneData
    );
    return response.data;
  }

  /**
   * Get unread notification count
   * @returns {Promise} API response with unread count
   */
  async getUnreadNotificationCount() {
    const response = await api.get('/integrations/notifications/unread-count');
    return response.data;
  }

  /**
   * Get user notifications with pagination
   * @param {Object} options - Pagination and filter options
   * @returns {Promise} API response with notifications
   */
  async getUserNotifications(options = {}) {
    const response = await api.get('/integrations/notifications', { params: options });
    return response.data;
  }

  /**
   * Mark notifications as read
   * @param {string[]} notificationIds - Array of notification IDs
   * @returns {Promise} API response
   */
  async markNotificationsAsRead(notificationIds) {
    const response = await api.put('/integrations/notifications/mark-read', {
      notificationIds
    });
    return response.data;
  }

  /**
   * Mark all notifications as read
   * @returns {Promise} API response
   */
  async markAllNotificationsAsRead() {
    const response = await api.put('/integrations/notifications/mark-all-read');
    return response.data;
  }
}

export default new IntegrationService();