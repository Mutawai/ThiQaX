// src/services/documentIntegrationService.js
const Document = require('../models/Document');
const Application = require('../models/Application');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Job = require('../models/Job');
const notificationService = require('./notificationService');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Links uploaded documents with job applications and handles verification status
 */
class DocumentIntegrationService {
  /**
   * Associate documents with an application
   * @param {string} applicationId - The ID of the application
   * @param {Array<string>} documentIds - Array of document IDs to associate
   * @param {string} [actionBy] - User ID who performed the action (optional)
   * @returns {Promise<Object>} Updated application with document references
   */
  async linkDocumentsToApplication(applicationId, documentIds, actionBy) {
    try {
      if (!applicationId) {
        throw createError('Application ID is required', 400);
      }

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        throw createError('At least one document ID is required', 400);
      }

      // Validate application exists
      const application = await Application.findById(applicationId)
        .populate('applicantId', 'firstName lastName email')
        .populate('jobId');
        
      if (!application) {
        throw createError('Application not found', 404);
      }

      // Validate all documents exist
      const documents = await Document.find({ _id: { $in: documentIds } });
      if (documents.length !== documentIds.length) {
        throw createError('One or more documents not found', 404);
      }

      // Verify ownership - documents should belong to the applicant
      const invalidDocuments = documents.filter(
        doc => doc.owner.toString() !== application.applicantId._id.toString()
      );
      
      if (invalidDocuments.length > 0) {
        throw createError('Some documents do not belong to the applicant', 403);
      }

      // Update application with document references
      const existingDocIds = application.documents?.map(d => d.toString()) || [];
      const uniqueDocIds = [...new Set([...existingDocIds, ...documentIds])];
      application.documents = uniqueDocIds;
      
      // Track when documents were added
      application.documentHistory = application.documentHistory || [];
      application.documentHistory.push({
        action: 'DOCUMENTS_ADDED',
        timestamp: new Date(),
        documentIds: documentIds,
        performedBy: actionBy || application.applicantId._id
      });
      
      await application.save();

      // Update each document with application reference using the model method
      await Promise.all(
        documents.map(doc => doc.linkToApplication(applicationId))
      );

      // Notify applicant that documents were linked
      await notificationService.sendNotification({
        recipientId: application.applicantId._id,
        type: 'DOCUMENT_LINKED',
        title: 'Documents Linked to Application',
        message: `${documents.length} document(s) have been linked to your application for ${application.jobId?.title || 'the position'}.`,
        relatedEntities: {
          applicationId,
          documentIds
        }
      });
      
      // If linked by agent or admin, also notify the job poster
      if (actionBy && actionBy !== application.applicantId._id.toString()) {
        const job = application.jobId;
        if (job && job.posterId) {
          await notificationService.sendNotification({
            recipientId: job.posterId,
            type: 'DOCUMENT_LINKED',
            title: 'Documents Added to Application',
            message: `${documents.length} document(s) have been added to the application from ${application.applicantId.firstName} ${application.applicantId.lastName}.`,
            relatedEntities: {
              applicationId,
              documentIds,
              jobId: job._id
            }
          });
        }
      }

      logger.info(`Linked ${documents.length} documents to application ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error linking documents to application: ${error.message}`, {
        applicationId,
        documentIds,
        error
      });
      throw error;
    }
  }

  /**
   * Update application status based on document verification results
   * @param {string} documentId - The document that was verified
   * @param {string} verificationStatus - The new verification status
   * @param {string} [verificationNotes] - Optional notes from the verifier
   * @param {string} [rejectionReason] - Reason for rejection if status is REJECTED
   * @param {string} verifierId - User ID who performed the verification
   * @returns {Promise<Object>} The updated document and affected application
   */
  async updateVerificationStatus(documentId, verificationStatus, verificationNotes = '', rejectionReason = null, verifierId) {
    try {
      if (!documentId) {
        throw createError('Document ID is required', 400);
      }

      if (!verificationStatus) {
        throw createError('Verification status is required', 400);
      }
      
      // Convert to lowercase to match our model enum
      const status = verificationStatus.toLowerCase();
      
      // Validate status value
      const validStatuses = ['pending', 'underReview', 'verified', 'rejected', 'expired'];
      if (!validStatuses.includes(status)) {
        throw createError(`Invalid verification status: ${verificationStatus}`, 400);
      }
      
      // Require rejection reason when rejecting a document
      if (status === 'rejected' && !rejectionReason) {
        throw createError('Rejection reason is required when rejecting a document', 400);
      }

      // Find the document
      const document = await Document.findById(documentId);
      if (!document) {
        throw createError('Document not found', 404);
      }
      
      // Perform verification status update using the document model method
      const notes = status === 'rejected' ? rejectionReason : verificationNotes;
      await document.updateVerificationStatus(status, verifierId, notes);
      
      // If document is expiring soon, reset expiry notification flag
      if (status === 'verified' && document.expiryDate) {
        document.expiryNotified = false;
        await document.save();
      }

      // Process application status updates if the document is linked to an application
      let application = null;
      let applicationUpdated = false;
      
      if (document.application) {
        application = await Application.findById(document.application)
          .populate('applicantId', 'firstName lastName email')
          .populate('jobId');
          
        if (application) {
          // Get all documents for this application
          const allAppDocuments = await Document.find({
            _id: { $in: application.documents || [] }
          });

          // Determine document verification status
          const allVerified = allAppDocuments.length > 0 && 
            allAppDocuments.every(doc => doc.verificationStatus === 'verified');
          
          const anyRejected = allAppDocuments.some(
            doc => doc.verificationStatus === 'rejected'
          );

          // Update application document status based on verification results
          if (allVerified && application.documentStatus !== 'VERIFIED') {
            application.documentStatus = 'VERIFIED';
            applicationUpdated = true;
          } else if (anyRejected && application.documentStatus !== 'REJECTED') {
            application.documentStatus = 'REJECTED';
            applicationUpdated = true;
          }

          // Update application status if document status affects it
          if (applicationUpdated) {
            // Log status change
            application.statusHistory = application.statusHistory || [];
            application.statusHistory.push({
              status: application.status,
              documentStatus: application.documentStatus,
              timestamp: new Date(),
              performedBy: verifierId,
              notes: `Document status change triggered application update`
            });
            
            await application.save();
            
            // Notify the applicant about application status change
            await notificationService.sendNotification({
              recipientId: application.applicantId._id,
              type: 'APPLICATION_STATUS_CHANGE',
              title: `Application Document Status Updated`,
              message: `Your application for ${application.jobId?.title || 'the position'} has had its document status updated to ${application.documentStatus}.`,
              relatedEntities: {
                applicationId: application._id,
                jobId: application.jobId?._id
              }
            });
          }
        }
      }

      // Process profile KYC status updates if applicable
      if ((status === 'verified' || status === 'rejected') && isIdentityDocument(document.type)) {
        await this._updateUserKycStatus(document.owner);
      }

      // Send notification about document verification
      await notificationService.sendNotification({
        recipientId: document.owner,
        type: 'DOCUMENT_VERIFICATION',
        title: `Document ${capitalizeFirstLetter(status)}`,
        message: getDocumentVerificationMessage(document, status, notes),
        relatedEntities: {
          documentId: document._id,
          applicationId: document.application
        }
      });

      logger.info(`Updated document ${documentId} verification status to ${status}`, {
        documentId,
        status,
        verifierId
      });
      
      return { document, application };
    } catch (error) {
      logger.error(`Error updating document verification status: ${error.message}`, {
        documentId,
        verificationStatus,
        error
      });
      throw error;
    }
  }

  /**
   * Handles document expiration checking and notifications
   * @param {number} [daysThreshold=30] - Days threshold for expiration warnings
   * @returns {Promise<Object>} Stats about processed documents
   */
  async checkDocumentExpirations(daysThreshold = 30) {
    try {
      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(today.getDate() + daysThreshold);

      // Use the static method added to Document model
      const expiringDocuments = await Document.findExpiringSoon(daysThreshold);
      
      let notifiedCount = 0;
      
      // Process each expiring document
      await Promise.all(
        expiringDocuments.map(async (document) => {
          // Calculate days until expiry
          const daysUntilExpiry = document.daysUntilExpiry;
          
          // Send notification to document owner
          await notificationService.sendNotification({
            recipientId: document.owner,
            type: 'DOCUMENT_EXPIRING',
            title: 'Document Expiring Soon',
            message: `Your ${document.type} document will expire in ${daysUntilExpiry} days. Please upload a new version before it expires.`,
            relatedEntities: {
              documentId: document._id
            }
          });

          // Update notification tracking
          await document.markExpiryNotified();
          notifiedCount++;

          // If document is linked to an application, notify relevant parties
          if (document.application) {
            const application = await Application.findById(document.application)
              .populate('jobId')
              .populate('applicantId', 'firstName lastName');
              
            if (application && application.jobId?.posterId) {
              // Notify job poster
              await notificationService.sendNotification({
                recipientId: application.jobId.posterId,
                type: 'DOCUMENT_EXPIRING',
                title: 'Applicant Document Expiring Soon',
                message: `A ${document.type} document from ${application.applicantId.firstName} ${application.applicantId.lastName} will expire in ${daysUntilExpiry} days.`,
                relatedEntities: {
                  documentId: document._id,
                  applicationId: application._id,
                  jobId: application.jobId._id
                }
              });
            }
          }
        })
      );

      // Also check for already expired documents that haven't been marked
      const expiredDocuments = await Document.find({
        expiryDate: { $lt: today },
        verificationStatus: { $ne: 'expired' }
      });
      
      let expiredCount = 0;
      
      // Update expired documents
      await Promise.all(
        expiredDocuments.map(async (document) => {
          // Update status to expired
          await document.updateVerificationStatus('expired', null, 'Document automatically marked as expired by system');
          expiredCount++;
          
          // Notify document owner
          await notificationService.sendNotification({
            recipientId: document.owner,
            type: 'DOCUMENT_EXPIRED',
            title: 'Document Expired',
            message: `Your ${document.type} document has expired. Please upload a new version as soon as possible.`,
            relatedEntities: {
              documentId: document._id
            }
          });
        })
      );

      logger.info(`Processed document expirations: ${expiringDocuments.length} expiring soon, ${expiredDocuments.length} already expired`);
      
      return {
        processedCount: expiringDocuments.length + expiredDocuments.length,
        notifiedCount,
        expiredCount
      };
    } catch (error) {
      logger.error(`Error checking document expirations: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Sync document verification status with user profile KYC status
   * @param {string} userId - User ID to sync documents for
   * @returns {Promise<Object>} Updated profile status
   */
  async syncProfileVerificationStatus(userId) {
    try {
      if (!userId) {
        throw createError('User ID is required', 400);
      }

      // Find user first to ensure they exist
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Find or create user profile
      let profile = await Profile.findOne({ user: userId });
      if (!profile) {
        throw createError('User profile not found', 404);
      }

      // Use the static method from the Document model
      const hasValidKyc = await Document.hasValidKycDocuments(userId);
      
      // Get more detailed verification status for different document types
      const identityDocStatus = await this._getDocumentTypeVerificationStatus(userId, ['passport', 'nationalID', 'driverLicense']);
      const addressDocStatus = await this._getDocumentTypeVerificationStatus(userId, ['addressProof', 'utilityBill', 'bankStatement']);
      const educationDocStatus = await this._getDocumentTypeVerificationStatus(userId, ['diploma', 'degree', 'certificate']);
      const professionalDocStatus = await this._getDocumentTypeVerificationStatus(userId, ['employmentLetter', 'referenceLetter', 'workPermit', 'visa']);
      
      // Update profile KYC status based on verified documents
      const previousKycStatus = profile.kycStatus;
      
      if (hasValidKyc) {
        profile.kycStatus = 'VERIFIED';
        
        // Only update user if KYC status changes
        if (user.kycVerified !== true) {
          user.kycVerified = true;
          await user.save();
        }
      } else {
        profile.kycStatus = identityDocStatus.verified ? 'PARTIAL' : 'PENDING';
        
        // If user was verified but no longer has valid docs
        if (user.kycVerified === true) {
          user.kycVerified = false;
          await user.save();
        }
      }
      
      // Update profile with detailed document status
      profile.documentVerification = {
        lastUpdated: new Date(),
        identity: identityDocStatus,
        address: addressDocStatus,
        education: educationDocStatus,
        professional: professionalDocStatus,
        overallStatus: hasValidKyc ? 'VERIFIED' : 'PENDING'
      };
      
      await profile.save();

      // Send notification if KYC status changed
      if (previousKycStatus !== profile.kycStatus) {
        await notificationService.sendNotification({
          recipientId: userId,
          type: 'KYC_STATUS_CHANGE',
          title: 'Identity Verification Status Updated',
          message: getKycStatusChangeMessage(previousKycStatus, profile.kycStatus),
          relatedEntities: {
            profileId: profile._id
          }
        });
      }

      logger.info(`Synced profile verification status for user ${userId}`, {
        userId,
        profileId: profile._id,
        kycStatus: profile.kycStatus
      });
      
      return profile;
    } catch (error) {
      logger.error(`Error syncing profile verification status: ${error.message}`, {
        userId,
        error
      });
      throw error;
    }
  }
  
  /**
   * Link document to a user profile (for KYC purposes)
   * @param {string} documentId - Document ID to link
   * @param {string} profileId - Profile ID to link to
   * @param {string} [actionBy] - User ID who performed the action
   * @returns {Promise<Object>} Updated document and profile
   */
  async linkDocumentToProfile(documentId, profileId, actionBy) {
    try {
      if (!documentId || !profileId) {
        throw createError('Document ID and Profile ID are required', 400);
      }
      
      // Find document and profile
      const document = await Document.findById(documentId);
      if (!document) {
        throw createError('Document not found', 404);
      }
      
      const profile = await Profile.findById(profileId);
      if (!profile) {
        throw createError('Profile not found', 404);
      }
      
      // Verify ownership
      if (document.owner.toString() !== profile.user.toString()) {
        throw createError('Document does not belong to profile user', 403);
      }
      
      // Update document with profile reference
      await document.linkToProfile(profileId);
      
      // Update profile with document reference
      if (!profile.documents) profile.documents = [];
      if (!profile.documents.includes(documentId)) {
        profile.documents.push(documentId);
        
        // Track document linking
        if (!profile.documentHistory) profile.documentHistory = [];
        profile.documentHistory.push({
          action: 'DOCUMENT_LINKED',
          documentId,
          timestamp: new Date(),
          performedBy: actionBy || profile.user
        });
        
        await profile.save();
      }
      
      // Sync profile verification status if this is an identity document
      if (isIdentityDocument(document.type)) {
        await this._updateUserKycStatus(profile.user);
      }
      
      logger.info(`Linked document ${documentId} to profile ${profileId}`);
      return { document, profile };
    } catch (error) {
      logger.error(`Error linking document to profile: ${error.message}`, {
        documentId,
        profileId,
        error
      });
      throw error;
    }
  }
  
  /**
   * Private helper to update user KYC status based on document verification
   * @param {string} userId - User ID to update
   * @private
   */
  async _updateUserKycStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;
      
      const profile = await Pro
