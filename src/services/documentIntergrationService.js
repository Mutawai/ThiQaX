// src/services/documentIntegrationService.js
const Document = require('../models/Document');
const Application = require('../models/Application');
const Profile = require('../models/Profile');
const notificationService = require('./notificationService');
const { createError } = require('../utils/errorHandler');

/**
 * Links uploaded documents with job applications and handles verification status
 */
class DocumentIntegrationService {
  /**
   * Associate documents with an application
   * @param {string} applicationId - The ID of the application
   * @param {Array<string>} documentIds - Array of document IDs to associate
   * @returns {Promise<Object>} Updated application with document references
   */
  async linkDocumentsToApplication(applicationId, documentIds) {
    try {
      // Validate application exists
      const application = await Application.findById(applicationId);
      if (!application) {
        throw createError('Application not found', 404);
      }

      // Validate all documents exist
      const documents = await Document.find({ _id: { $in: documentIds } });
      if (documents.length !== documentIds.length) {
        throw createError('One or more documents not found', 404);
      }

      // Update application with document references
      application.documents = [...new Set([...application.documents, ...documentIds])];
      await application.save();

      // Update each document with application reference
      await Promise.all(
        documents.map(doc => {
          doc.applicationId = applicationId;
          return doc.save();
        })
      );

      // Notify applicant that documents were linked
      await notificationService.sendNotification({
        recipientId: application.applicantId,
        type: 'DOCUMENT_LINKED',
        title: 'Documents Linked to Application',
        message: `${documents.length} document(s) have been linked to your application.`,
        relatedEntities: {
          applicationId,
          documentIds
        }
      });

      return application;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update application status based on document verification results
   * @param {string} documentId - The document that was verified
   * @param {string} verificationStatus - The new verification status
   * @param {string} verificationNotes - Optional notes from the verifier
   * @returns {Promise<Object>} The updated document and affected application
   */
  async updateVerificationStatus(documentId, verificationStatus, verificationNotes = '') {
    try {
      // Find and update the document
      const document = await Document.findByIdAndUpdate(
        documentId,
        {
          $set: {
            verificationStatus,
            verificationNotes,
            verifiedAt: verificationStatus === 'VERIFIED' ? new Date() : null,
            updatedAt: new Date()
          },
          $push: {
            statusHistory: {
              status: verificationStatus,
              notes: verificationNotes,
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );

      if (!document) {
        throw createError('Document not found', 404);
      }

      // If no application is linked, just return the updated document
      if (!document.applicationId) {
        return { document, application: null };
      }

      // Find the application this document belongs to
      const application = await Application.findById(document.applicationId);
      if (!application) {
        return { document, application: null };
      }

      // Get all documents for this application
      const allAppDocuments = await Document.find({
        _id: { $in: application.documents }
      });

      // Determine if all required documents are verified
      const allVerified = allAppDocuments.every(
        doc => doc.verificationStatus === 'VERIFIED'
      );
      
      const anyRejected = allAppDocuments.some(
        doc => doc.verificationStatus === 'REJECTED'
      );

      // Update application status if needed
      let applicationUpdated = false;
      if (allVerified && application.status === 'DOCUMENTS_PENDING') {
        application.status = 'DOCUMENTS_VERIFIED';
        applicationUpdated = true;
      } else if (anyRejected && application.status === 'DOCUMENTS_PENDING') {
        application.status = 'DOCUMENTS_REJECTED';
        applicationUpdated = true;
      }

      if (applicationUpdated) {
        await application.save();
        
        // Notify the applicant about application status change
        await notificationService.sendNotification({
          recipientId: application.applicantId,
          type: 'APPLICATION_STATUS_CHANGE',
          title: `Application Status Updated`,
          message: `Your application status has been updated to ${application.status}.`,
          relatedEntities: {
            applicationId: application._id
          }
        });
      }

      // Send notification about document verification
      await notificationService.sendNotification({
        recipientId: document.uploadedBy,
        type: 'DOCUMENT_VERIFICATION',
        title: 'Document Verification Update',
        message: `Your document "${document.name}" has been ${verificationStatus.toLowerCase()}.`,
        relatedEntities: {
          documentId: document._id,
          applicationId: document.applicationId
        }
      });

      return { document, application };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handles document expiration checking and notifications
   * @returns {Promise<number>} Count of processed documents
   */
  async checkDocumentExpirations() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Find documents that are about to expire (within 30 days) or have expired
      const documents = await Document.find({
        expiryDate: { $lte: thirtyDaysFromNow, $gt: today },
        expirationNotified: false
      });

      // Send notifications for each document
      await Promise.all(
        documents.map(async (document) => {
          // Mark as notified
          document.expirationNotified = true;
          await document.save();

          // Get days until expiration
          const daysUntilExpiry = Math.ceil(
            (document.expiryDate - today) / (1000 * 60 * 60 * 24)
          );

          // Notify document owner
          await notificationService.sendNotification({
            recipientId: document.uploadedBy,
            type: 'DOCUMENT_EXPIRING',
            title: 'Document Expiring Soon',
            message: `Your document "${document.name}" will expire in ${daysUntilExpiry} days.`,
            relatedEntities: {
              documentId: document._id
            }
          });

          // Notify any linked application owner
          if (document.applicationId) {
            const application = await Application.findById(document.applicationId);
            if (application) {
              await notificationService.sendNotification({
                recipientId: application.applicantId,
                type: 'DOCUMENT_EXPIRING',
                title: 'Application Document Expiring Soon',
                message: `A document for your application will expire in ${daysUntilExpiry} days.`,
                relatedEntities: {
                  documentId: document._id,
                  applicationId: document.applicationId
                }
              });
            }
          }
        })
      );

      return documents.length;
    } catch (error) {
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
      // Find user profile
      const profile = await Profile.findOne({ userId });
      if (!profile) {
        throw createError('User profile not found', 404);
      }

      // Find all verified identity documents for this user
      const verifiedIdentityDocs = await Document.find({
        uploadedBy: userId,
        documentType: { $in: ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'] },
        verificationStatus: 'VERIFIED'
      });

      // Update profile KYC status based on verified documents
      if (verifiedIdentityDocs.length > 0) {
        profile.kycStatus = 'VERIFIED';
        profile.lastKycUpdate = new Date();
        await profile.save();

        // Notify user about KYC verification
        await notificationService.sendNotification({
          recipientId: userId,
          type: 'KYC_VERIFICATION',
          title: 'Identity Verification Complete',
          message: 'Your identity documents have been verified successfully.',
          relatedEntities: {
            profileId: profile._id
          }
        });
      }

      return profile;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DocumentIntegrationService();
