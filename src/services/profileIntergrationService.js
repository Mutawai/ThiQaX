// src/services/profileIntegrationService.js
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Document = require('../models/Document');
const notificationService = require('./notificationService');
const { createError } = require('../utils/errorHandler');

/**
 * Handles integrations between profiles, applications, and document verification
 */
class ProfileIntegrationService {
  /**
   * Check if a profile meets the requirements for a job application
   * @param {string} profileId - ID of the profile to check
   * @param {string} jobId - ID of the job to check against
   * @returns {Promise<Object>} Validation result with eligibility status
   */
  async checkApplicationEligibility(profileId, jobId) {
    try {
      // Get profile and job
      const [profile, job] = await Promise.all([
        Profile.findById(profileId).populate('userId', 'role'),
        Job.findById(jobId)
      ]);

      if (!profile) {
        throw createError('Profile not found', 404);
      }

      if (!job) {
        throw createError('Job not found', 404);
      }

      // Initialize result object
      const result = {
        eligible: true,
        reasons: [],
        missingRequirements: [],
        warnings: []
      };

      // Check if profile is a job seeker
      if (profile.userId.role !== 'jobSeeker') {
        result.eligible = false;
        result.reasons.push('Only job seekers can apply for jobs');
      }

      // Check KYC verification
      if (profile.kycStatus !== 'VERIFIED') {
        result.eligible = false;
        result.reasons.push('KYC verification is required');
        result.missingRequirements.push('KYC verification');
      }

      // Check profile completion
      if (!profile.profileComplete) {
        result.eligible = false;
        result.reasons.push('Profile must be complete');
        
        // Identify missing profile sections
        const requiredSections = ['personalInfo', 'education', 'experience', 'skills'];
        for (const section of requiredSections) {
          if (!profile[section] || !Object.keys(profile[section]).length) {
            result.missingRequirements.push(`Complete profile section: ${section}`);
          }
        }
      }
      
      // Check if profile has required skills
      if (job.requiredSkills && job.requiredSkills.length > 0) {
        const profileSkills = profile.skills || [];
        const missingSkills = job.requiredSkills.filter(
          skill => !profileSkills.includes(skill)
        );
        
        if (missingSkills.length > 0) {
          result.warnings.push('Profile is missing some preferred skills');
          result.missingRequirements.push(
            `Skills: ${missingSkills.join(', ')}`
          );
        }
      }
      
      // Check if experience matches requirements
      if (job.experienceYears > 0) {
        const profileExperience = profile.experience || [];
        const totalExperienceMonths = profileExperience.reduce(
          (total, exp) => {
            const startDate = new Date(exp.startDate);
            const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
            const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth());
            return total + months;
          }, 0
        );
        
        const totalExperienceYears = Math.floor(totalExperienceMonths / 12);
        
        if (totalExperienceYears < job.experienceYears) {
          result.warnings.push(`Job requires ${job.experienceYears} years of experience`);
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync user profile data with their applications
   * @param {string} profileId - ID of the profile that was updated
   * @returns {Promise<Object>} Sync results
   */
  async syncProfileWithApplications(profileId) {
    try {
      const profile = await Profile.findById(profileId).populate('userId');
      
      if (!profile) {
        throw createError('Profile not found', 404);
      }

      // Find all active applications for this user
      const applications = await Application.find({
        applicantId: profile.userId._id,
        status: { $nin: ['WITHDRAWN', 'REJECTED', 'CLOSED'] }
      }).populate('jobId');

      if (!applications.length) {
        return { synced: 0, message: 'No active applications to sync' };
      }

      // Update each application with latest profile data
      const updatePromises = applications.map(application => {
        // Update application with latest profile data
        application.applicantData = {
          name: profile.personalInfo.fullName,
          email: profile.personalInfo.email,
          phone: profile.personalInfo.phone,
          currentLocation: profile.personalInfo.currentLocation,
          education: profile.education,
          experience: profile.experience,
          skills: profile.skills,
          lastSyncedAt: new Date()
        };
        
        return application.save();
      });

      await Promise.all(updatePromises);

      return {
        synced: applications.length,
        message: `Successfully synced profile data with ${applications.length} applications`
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update profile completeness status based on required fields
   * @param {string} profileId - ID of the profile to check
   * @returns {Promise<Object>} Updated profile with completeness info
   */
  async updateProfileCompleteness(profileId) {
    try {
      const profile = await Profile.findById(profileId);
      
      if (!profile) {
        throw createError('Profile not found', 404);
      }

      // Define required sections and fields
      const requiredSections = {
        personalInfo: ['fullName', 'email', 'phone', 'dateOfBirth', 'currentLocation'],
        education: ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate'],
        experience: ['company', 'position', 'startDate']
      };

      const missingFields = [];
      let allRequiredFieldsPresent = true;

      // Check personal info fields
      for (const field of requiredSections.personalInfo) {
        if (!profile.personalInfo || !profile.personalInfo[field]) {
          missingFields.push(`personalInfo.${field}`);
          allRequiredFieldsPresent = false;
        }
      }

      // Check if at least one education entry exists with all required fields
      if (!profile.education || !profile.education.length) {
        missingFields.push('education');
        allRequiredFieldsPresent = false;
      } else {
        const hasCompleteEducation = profile.education.some(edu => 
          requiredSections.education.every(field => edu[field])
        );
        
        if (!hasCompleteEducation) {
          missingFields.push('education (complete all required fields)');
          allRequiredFieldsPresent = false;
        }
      }

      // Check if at least one experience entry exists with all required fields
      if (!profile.experience || !profile.experience.length) {
        missingFields.push('experience');
        allRequiredFieldsPresent = false;
      } else {
        const hasCompleteExperience = profile.experience.some(exp => 
          requiredSections.experience.every(field => exp[field])
        );
        
        if (!hasCompleteExperience) {
          missingFields.push('experience (complete all required fields)');
          allRequiredFieldsPresent = false;
        }
      }

      // Check if profile has skills
      if (!profile.skills || !profile.skills.length) {
        missingFields.push('skills');
        allRequiredFieldsPresent = false;
      }

      // Check if profile photo exists
      if (!profile.photoUrl) {
        missingFields.push('profile photo');
        allRequiredFieldsPresent = false;
      }

      // Update profile completeness
      const previousCompletionStatus = profile.profileComplete;
      profile.profileComplete = allRequiredFieldsPresent;
      profile.completionDetails = {
        isComplete: allRequiredFieldsPresent,
        missingFields: missingFields,
        lastChecked: new Date()
      };
      
      await profile.save();

      // Send notification if profile becomes complete
      if (!previousCompletionStatus && allRequiredFieldsPresent) {
        await notificationService.sendNotification({
          recipientId: profile.userId,
          type: 'PROFILE_COMPLETE',
          title: 'Profile Completion',
          message: 'Congratulations! Your profile is now complete.',
          relatedEntities: { profileId: profile._id }
        });
      }

      return {
        profile,
        isComplete: allRequiredFieldsPresent,
        missingFields
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check KYC verification status by examining verified documents
   * @param {string} userId - ID of the user to check
   * @returns {Promise<Object>} KYC verification status and results
   */
  async checkKycVerificationStatus(userId) {
    try {
      // Get profile
      const profile = await Profile.findOne({ userId });
      
      if (!profile) {
        throw createError('Profile not found', 404);
      }

      // Define required document types for KYC
      const requiredDocumentTypes = ['PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'];
      
      // Check if user has at least one verified identity document
      const verifiedIdentityDocs = await Document.find({
        uploadedBy: userId,
        documentType: { $in: requiredDocumentTypes },
        verificationStatus: 'VERIFIED'
      });

      const hasPrimaryIdentity = verifiedIdentityDocs.length > 0;
      
      // Check for proof of address document
      const verifiedAddressDocs = await Document.find({
        uploadedBy: userId,
        documentType: 'PROOF_OF_ADDRESS',
        verificationStatus: 'VERIFIED'
      });

      const hasAddressProof = verifiedAddressDocs.length > 0;
      
      // Determine overall KYC status
      let kycStatus = 'UNVERIFIED';
      const missingDocuments = [];
      
      if (hasPrimaryIdentity && hasAddressProof) {
        kycStatus = 'VERIFIED';
      } else {
        kycStatus = 'INCOMPLETE';
        
        if (!hasPrimaryIdentity) {
          missingDocuments.push('Primary Identity Document (Passport, National ID, or Driver\'s License)');
        }
        
        if (!hasAddressProof) {
          missingDocuments.push('Proof of Address');
        }
      }
      
      // Update profile KYC status if it has changed
      if (profile.kycStatus !== kycStatus) {
        profile.kycStatus = kycStatus;
        profile.lastKycUpdate = new Date();
        await profile.save();
        
        // Notify user of KYC status change
        if (kycStatus === 'VERIFIED') {
          await notificationService.sendNotification({
            recipientId: userId,
            type: 'KYC_VERIFICATION',
            title: 'KYC Verification Complete',
            message: 'Your identity has been verified successfully. You can now apply for jobs.',
            relatedEntities: { profileId: profile._id }
          });
        } else if (kycStatus === 'INCOMPLETE') {
          await notificationService.sendNotification({
            recipientId: userId,
            type: 'KYC_VERIFICATION',
            title: 'KYC Verification Incomplete',
            message: `Your KYC verification is incomplete. Missing documents: ${missingDocuments.join(', ')}`,
            relatedEntities: { profileId: profile._id }
          });
        }
      }
      
      return {
        userId,
        profileId: profile._id,
        kycStatus,
        hasPrimaryIdentity,
        hasAddressProof,
        missingDocuments,
        verifiedDocuments: [
          ...verifiedIdentityDocs.map(doc => ({
            id: doc._id,
            type: doc.documentType,
            name: doc.name,
            verifiedAt: doc.verifiedAt
          })),
          ...verifiedAddressDocs.map(doc => ({
            id: doc._id,
            type: doc.documentType,
            name: doc.name,
            verifiedAt: doc.verifiedAt
          }))
        ]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProfileIntegrationService();
