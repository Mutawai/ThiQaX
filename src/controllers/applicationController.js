const Application = require('../models/Application');
const Job = require('../models/Job');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');

/**
 * Application Controller
 * Handles all operations related to job applications
 */
const applicationController = {
  /**
   * Submit a new job application
   * @route POST /api/applications
   * @access Private (Job Seekers only)
   */
  submitApplication: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Ensure user is a job seeker
      if (req.user.role !== 'jobSeeker') {
        return res.status(403).json({
          success: false,
          message: 'Only job seekers can submit applications'
        });
      }

      // Check if job exists and is active
      const job = await Job.findById(req.body.job);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Verify job is active
      if (job.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot apply to a job that is not active'
        });
      }

      // Check if job is expired
      if (new Date() > job.expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Cannot apply to an expired job'
        });
      }

      // Check if user already applied to this job
      const existingApplication = await Application.findOne({
        job: req.body.job,
        applicant: req.user.id
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied to this job'
        });
      }

      // Create application data
      const applicationData = {
        ...req.body,
        applicant: req.user.id,
        status: 'submitted'
      };

      // Process uploaded documents
      if (req.files && req.files.length > 0) {
        const documents = req.files.map(file => {
          const fileType = file.fieldname || 'other';
          return {
            type: fileType,
            name: file.originalname,
            path: file.path,
            mimeType: file.mimetype,
            size: file.size,
            verified: false,
            uploadedAt: Date.now()
          };
        });

        applicationData.documents = documents;
      }

      // Create the application
      const application = await Application.create(applicationData);

      // Increment the job's application count
      await job.incrementApplications();

      // Populate the applicant info for the response
      await application.populate('applicant', 'name email profileImage');

      res.status(201).json({
        success: true,
        data: application,
        message: 'Application submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get all applications for a user with filtering
   * @route GET /api/applications
   * @access Private
   */
  getApplications: async (req, res) => {
    try {
      // Build query based on user role
      let query = {};

      if (req.user.role === 'jobSeeker') {
        // Job seekers can only see their own applications
        query.applicant = req.user.id;
      } else if (req.user.role === 'sponsor') {
        // Sponsors can see applications for jobs they sponsor
        const sponsoredJobs = await Job.find({ sponsor: req.user.id }).select('_id');
        const jobIds = sponsoredJobs.map(job => job._id);
        query.job = { $in: jobIds };
      } else if (req.user.role === 'agent') {
        // Agents can see applications for jobs they manage
        const managedJobs = await Job.find({ agent: req.user.id }).select('_id');
        const jobIds = managedJobs.map(job => job._id);
        query.job = { $in: jobIds };
      }
      // Admins can see all applications (no additional query filters)

      // Filter by job ID if provided
      if (req.query.job) {
        // If already filtered by job array, ensure this job is in the array
        if (query.job && query.job.$in) {
          if (!query.job.$in.includes(mongoose.Types.ObjectId(req.query.job))) {
            return res.status(403).json({
              success: false,
              message: 'You do not have access to applications for this job'
            });
          }
        }
        query.job = req.query.job;
      }

      // Filter by application status
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Filter by verification status
      if (req.query.verificationStatus) {
        query.verificationStatus = req.query.verificationStatus;
      }

      // Set up pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Set up sorting
      let sort = {};
      if (req.query.sort) {
        const sortField = req.query.sort.startsWith('-') ? 
          req.query.sort.substring(1) : req.query.sort;
        const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
        sort[sortField] = sortOrder;
      } else {
        // Default sort by creation date (newest first)
        sort = { createdAt: -1 };
      }

      // Execute query with pagination and sorting
      const applications = await Application.find(query)
        .populate('job', 'title location.country location.city salary.amount salary.currency contractType')
        .populate('applicant', 'name email profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Application.countDocuments(query);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        count: applications.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: applications
      });
    } catch (error) {
      console.error('Error getting applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve applications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get a single application by ID
   * @route GET /api/applications/:id
   * @access Private (with role-based restrictions)
   */
  getApplicationById: async (req, res) => {
    try {
      const application = await Application.findById(req.params.id)
        .populate('job', 'title location.country location.city salary.amount salary.currency contractType status agent sponsor')
        .populate('applicant', 'name email profileImage')
        .populate('statusHistory.changedBy', 'name role');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check user permissions to view this application
      let hasPermission = false;

      if (req.user.role === 'admin') {
        hasPermission = true;
      } else if (req.user.role === 'jobSeeker' && application.applicant._id.toString() === req.user.id) {
        hasPermission = true;
      } else if (req.user.role === 'sponsor' && application.job.sponsor.toString() === req.user.id) {
        hasPermission = true;
      } else if (req.user.role === 'agent' && application.job.agent.toString() === req.user.id) {
        hasPermission = true;
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this application'
        });
      }

      res.status(200).json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Error getting application by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Update application status
   * @route PATCH /api/applications/:id/status
   * @access Private (with role-based restrictions)
   */
  updateApplicationStatus: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { status, notes } = req.body;

      const application = await Application.findById(req.params.id)
        .populate('job', 'sponsor agent status');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Verify job is not closed
      if (application.job.status === 'closed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update application for a closed job'
        });
      }

      // Check user permissions to update this application
      let hasPermission = false;
      
      if (req.user.role === 'admin') {
        hasPermission = true;
      } else if (req.user.role === 'jobSeeker' && application.applicant.toString() === req.user.id) {
        // Job seekers can only withdraw their applications
        hasPermission = status === 'withdrawn';
      } else if (req.user.role === 'sponsor' && application.job.sponsor.toString() === req.user.id) {
        // Sponsors can update to certain statuses
        const allowedStatuses = ['under-review', 'shortlisted', 'interview', 'offer-pending', 'offered', 'rejected'];
        hasPermission = allowedStatuses.includes(status);
      } else if (req.user.role === 'agent' && application.job.agent.toString() === req.user.id) {
        // Agents can update to certain statuses
        const allowedStatuses = ['under-review', 'shortlisted', 'rejected'];
        hasPermission = allowedStatuses.includes(status);
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this application status'
        });
      }

      // Verify status transition is valid
      const validTransitions = {
        'submitted': ['under-review', 'rejected', 'withdrawn'],
        'under-review': ['shortlisted', 'rejected', 'withdrawn'],
        'shortlisted': ['interview', 'rejected', 'withdrawn'],
        'interview': ['offer-pending', 'rejected', 'withdrawn'],
        'offer-pending': ['offered', 'rejected', 'withdrawn'],
        'offered': ['accepted', 'rejected', 'withdrawn'],
        'accepted': ['withdrawn'],
        'rejected': [],
        'withdrawn': []
      };

      if (!validTransitions[application.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${application.status} to ${status}`
        });
      }

      // Update the application status
      application.status = status;
      application.updatedBy = req.user.id; // For the pre-save hook

      // Add status history entry
      application.statusHistory.push({
        status,
        changedBy: req.user.id,
        notes: notes || '',
        timestamp: Date.now()
      });

      // Special handling for certain status transitions
      if (status === 'offered') {
        // Create the offer details
        if (!req.body.offerDetails) {
          return res.status(400).json({
            success: false,
            message: 'Offer details are required when setting status to offered'
          });
        }

        application.offerDetails = {
          ...req.body.offerDetails,
          offerDate: Date.now(),
          status: 'pending'
        };
      } else if (status === 'accepted') {
        // Update offer status
        if (application.offerDetails) {
          application.offerDetails.status = 'accepted';
          application.offerDetails.acceptedAt = Date.now();
        }

        // Mark the job as filled
        await Job.findByIdAndUpdate(application.job._id, { status: 'filled' });
      } else if (status === 'rejected' && application.offerDetails) {
        // If rejecting after offer
        application.offerDetails.status = 'rejected';
        application.offerDetails.rejectedAt = Date.now();
        application.offerDetails.rejectionReason = req.body.rejectionReason || 'No reason provided';
      }

      await application.save();

      // Reload the application with populated fields
      const updatedApplication = await Application.findById(req.params.id)
        .populate('job', 'title location.country location.city salary.amount salary.currency contractType status')
        .populate('applicant', 'name email profileImage')
        .populate('statusHistory.changedBy', 'name role');

      res.status(200).json({
        success: true,
        data: updatedApplication,
        message: 'Application status updated successfully'
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update application status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Add feedback to an application
   * @route POST /api/applications/:id/feedback
   * @access Private (Sponsors and Agents only)
   */
  addFeedback: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { comment, rating, visibility } = req.body;

      const application = await Application.findById(req.params.id)
        .populate('job', 'sponsor agent');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check user permissions to add feedback
      let hasPermission = false;
      
      if (req.user.role === 'admin') {
        hasPermission = true;
      } else if (req.user.role === 'sponsor' && application.job.sponsor.toString() === req.user.id) {
        hasPermission = true;
      } else if (req.user.role === 'agent' && application.job.agent.toString() === req.user.id) {
        hasPermission = true;
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to add feedback to this application'
        });
      }

      // Add feedback to the application
      application.feedback.push({
        from: req.user.id,
        comment,
        rating,
        visibility: visibility || 'private',
        createdAt: Date.now()
      });

      await application.save();

      // Reload the application with populated fields
      const updatedApplication = await Application.findById(req.params.id)
        .populate('job', 'title location.country location.city salary.amount salary.currency contractType status')
        .populate('applicant', 'name email profileImage')
        .populate('feedback.from', 'name role');

      res.status(200).json({
        success: true,
        data: updatedApplication,
        message: 'Feedback added successfully'
      });
    } catch (error) {
      console.error('Error adding feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Schedule an interview
   * @route POST /api/applications/:id/interviews
   * @access Private (Sponsors and Agents only)
   */
  scheduleInterview: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { scheduledDate, location, interviewers, notes } = req.body;

      const application = await Application.findById(req.params.id)
        .populate('job', 'sponsor agent status');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      // Check user permissions to schedule interview
      let hasPermission = false;
      
      if (req.user.role === 'admin') {
        hasPermission = true;
      } else if (req.user.role === 'sponsor' && application.job.sponsor.toString() === req.user.id) {
        hasPermission = true;
      } else if (req.user.role === 'agent' && application.job.agent.toString() === req.user.id) {
        hasPermission = true;
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to schedule an interview for this application'
        });
      }

      // Verify job and application status
      if (application.job.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot schedule interviews for inactive jobs'
        });
      }

      if (application.status !== 'shortlisted' && application.status !== 'interview') {
        return res.status(400).json({
          success: false,
          message: 'Can only schedule interviews for shortlisted applications or update existing interviews'
        });
      }

      // Add interview to the application
      application.interviewDetails.push({
        scheduledDate,
        location,
        interviewers: interviewers || [req.user.id],
        notes,
        status: 'scheduled'
      });

      // Update application status if it's not already in interview stage
      if (application.status !== 'interview') {
        application.status = 'interview';
        application.updatedBy = req.user.id;
        
        // Add status history entry
        application.statusHistory.push({
          status: 'interview',
          changedBy: req.user.id,
          notes: `Interview scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
          timestamp: Date.now()
        });
      }

      await application.save();

      // Reload the application with populated fields
      const updatedApplication = await Application.findById(req.params.id)
        .populate('job', 'title location.country location.city salary.amount salary.currency contractType status')
        .populate('applicant', 'name email profileImage')
        .populate('interviewDetails.interviewers', 'name role');

      res.status(200).json({
        success: true,
        data: updatedApplication,
        message: 'Interview scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule interview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Update interview status
   * @route PATCH /api/applications/:id/interviews/:interviewId
   * @access Priv
