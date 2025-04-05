const Job = require('../models/Job');
const Application = require('../models/Application');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Job Controller
 * Handles all operations related to job listings
 */
const jobController = {
  /**
   * Create a new job listing
   * @route POST /api/jobs
   * @access Private (Sponsors and Agents only)
   */
  createJob: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Ensure user is a sponsor or agent
      if (req.user.role !== 'sponsor' && req.user.role !== 'agent' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only sponsors and agents can create job listings'
        });
      }

      // Create job object from request body
      const jobData = { ...req.body };

      // Set the creator based on role
      if (req.user.role === 'sponsor') {
        jobData.sponsor = req.user.id;
        
        // If agent ID is provided, validate it exists
        if (!jobData.agent) {
          return res.status(400).json({
            success: false,
            message: 'Agent ID is required'
          });
        }
      } else if (req.user.role === 'agent') {
        jobData.agent = req.user.id;
        
        // If sponsor ID is provided, validate it exists
        if (!jobData.sponsor) {
          return res.status(400).json({
            success: false,
            message: 'Sponsor ID is required'
          });
        }
      }

      // Set initial status based on role
      jobData.status = req.user.role === 'sponsor' ? 'pending' : 'draft';

      // Create the job
      const job = await Job.create(jobData);

      // If file uploads were included, process them
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map(file => ({
          name: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: Date.now()
        }));

        job.attachments = attachments;
        await job.save();
      }

      res.status(201).json({
        success: true,
        data: job,
        message: 'Job created successfully'
      });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get all jobs with filtering, sorting, and pagination
   * @route GET /api/jobs
   * @access Public
   */
  getJobs: async (req, res) => {
    try {
      // Build query
      const query = {};

      // Filter by status (default to active for public users)
      if (req.user && (req.user.role === 'admin' || req.user.role === 'agent' || req.user.role === 'sponsor')) {
        if (req.query.status) {
          query.status = req.query.status;
        }
      } else {
        // Public users can only see active jobs
        query.status = 'active';
      }

      // Filter by verified
      if (req.query.verified) {
        query.verified = req.query.verified === 'true';
      }

      // Filter by location
      if (req.query.country) {
        query['location.country'] = req.query.country;
      }

      if (req.query.city) {
        query['location.city'] = req.query.city;
      }

      // Filter by contract type
      if (req.query.contractType) {
        query.contractType = req.query.contractType;
      }

      // Filter by salary range
      if (req.query.minSalary) {
        query['salary.amount'] = { $gte: parseInt(req.query.minSalary) };
      }

      if (req.query.maxSalary) {
        if (query['salary.amount']) {
          query['salary.amount'].$lte = parseInt(req.query.maxSalary);
        } else {
          query['salary.amount'] = { $lte: parseInt(req.query.maxSalary) };
        }
      }

      // Filter by expiry (only non-expired jobs)
      if (req.query.nonExpired === 'true') {
        query.expiresAt = { $gt: new Date() };
      }

      // Filter by sponsor
      if (req.query.sponsor) {
        query.sponsor = req.query.sponsor;
      }

      // Filter by agent
      if (req.query.agent) {
        query.agent = req.query.agent;
      }

      // Full-text search
      if (req.query.search) {
        query.$text = { $search: req.query.search };
      }

      // Skills filter (partial match)
      if (req.query.skills) {
        const skillsArray = req.query.skills.split(',');
        query.skills = { $in: skillsArray };
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

      // Execute query with pagination
      const jobs = await Job.find(query)
        .populate('sponsor', 'name email company profileImage')
        .populate('agent', 'name email company profileImage')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get total count for pagination
      const total = await Job.countDocuments(query);

      // Calculate the minimum amount of data needed for front-end pagination
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
        success: true,
        count: jobs.length,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage
        },
        data: jobs
      });
    } catch (error) {
      console.error('Error getting jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve jobs',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get a single job by ID
   * @route GET /api/jobs/:id
   * @access Public (with restrictions)
   */
  getJobById: async (req, res) => {
    try {
      const job = await Job.findById(req.params.id)
        .populate('sponsor', 'name email company profileImage')
        .populate('agent', 'name email company profileImage');

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Check access rights for non-active jobs
      if (job.status !== 'active') {
        // If user is not logged in or not an admin/agent/sponsor
        if (!req.user || (req.user.role !== 'admin' && 
            req.user.id !== job.sponsor.toString() && 
            req.user.id !== job.agent.toString())) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this job'
          });
        }
      }

      res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('Error getting job by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Update a job
   * @route PUT /api/jobs/:id
   * @access Private (Sponsors, Agents, Admin)
   */
  updateJob: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      let job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Check if user has permission to update
      if (req.user.role !== 'admin' && 
          req.user.id !== job.sponsor.toString() && 
          req.user.id !== job.agent.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this job'
        });
      }

      // Create update data
      const updateData = { ...req.body };
      
      // Special handling for status changes
      if (updateData.status && updateData.status !== job.status) {
        // Verify the status transition is valid
        const validTransitions = {
          'draft': ['pending', 'closed'],
          'pending': ['active', 'rejected', 'closed'],
          'active': ['filled', 'closed'],
          'filled': ['closed'],
          'rejected': ['pending', 'closed'],
          'closed': []
        };

        if (!validTransitions[job.status].includes(updateData.status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status transition from ${job.status} to ${updateData.status}`
          });
        }

        // Special permissions for certain status changes
        const adminOnlyTransitions = ['rejected', 'active'];
        if (adminOnlyTransitions.includes(updateData.status) && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: `Only admins can change status to ${updateData.status}`
          });
        }
      }

      // Handle verification
      if (updateData.verified !== undefined && updateData.verified !== job.verified) {
        // Only admins can verify jobs
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Only admins can verify jobs'
          });
        }

        // If verifying, add verification details
        if (updateData.verified) {
          updateData.verificationDetails = {
            verifiedBy: req.user.id,
            verifiedAt: Date.now(),
            comments: updateData.verificationComments || 'Verified by admin'
          };
        }
      }

      // Perform the update
      job = await Job.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('sponsor', 'name email company profileImage')
       .populate('agent', 'name email company profileImage');

      res.status(200).json({
        success: true,
        data: job,
        message: 'Job updated successfully'
      });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Delete a job
   * @route DELETE /api/jobs/:id
   * @access Private (Sponsors, Agents, Admin)
   */
  deleteJob: async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Check if user has permission to delete
      if (req.user.role !== 'admin' && 
          req.user.id !== job.sponsor.toString() && 
          req.user.id !== job.agent.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this job'
        });
      }

      // Check if there are applications for this job
      const applications = await Application.find({ job: req.params.id });
      
      if (applications.length > 0) {
        // Can't delete a job with applications
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a job with applications. Consider closing it instead.'
        });
      }

      await job.remove();

      res.status(200).json({
        success: true,
        message: 'Job deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete job',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get job applications
   * @route GET /api/jobs/:id/applications
   * @access Private (Sponsors, Agents, Admin)
   */
  getJobApplications: async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      // Check if user has permission to view applications
      if (req.user.role !== 'admin' && 
          req.user.id !== job.sponsor.toString() && 
          req.user.id !== job.agent.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view applications for this job'
        });
      }

      // Set up pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Build query
      const query = { job: req.params.id };

      // Filter by status
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Filter by verification status
      if (req.query.verificationStatus) {
        query.verificationStatus = req.query.verificationStatus;
      }

      // Fetch applications
      const applications = await Application.find(query)
        .populate('applicant', 'name email profileImage')
        .sort({ createdAt: -1 })
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
      console.error('Error getting job applications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve job applications',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get job statistics
   * @route GET /api/jobs/statistics
   * @access Private (Admin only)
   */
  getJobStatistics: async (req, res) => {
    try {
      // Verify admin access
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin only resource.'
        });
      }

      // Get job counts by status
      const statusCounts = await Job.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      // Get job counts by country
      const countryCounts = await Job.aggregate([
        { $group: { _id: '$location.country', count: { $sum: 1 } } }
      ]);

      // Get job counts by contract type
      const contractTypeCounts = await Job.aggregate([
        { $group: { _id: '$contractType', count: { $sum: 1 } } }
      ]);

      // Get verification stats
      const verificationStats = await Job.aggregate([
        { $group: { _id: '$verified', count: { $sum: 1 } } }
      ]);

      // Get average salary
      const averageSalary = await Job.aggregate([
        { $group: { _id: '$salary.currency', average: { $avg: '$salary.amount' } } }
      ]);

      // Format data for response
      const formatCountData = (data) => {
        return data.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});
      };

      res.status(200).json({
        success: true,
        data: {
          totalJobs: await Job.countDocuments(),
          statusDistribution: formatCountData(statusCounts),
          countryDistribution: formatCountData(countryCounts),
          contractTypeDistribution: formatCountData(contractTypeCounts),
          verificationDistribution: formatCountData(verificationStats),
          averageSalaryByCurrency: averageSalary.reduce((acc, item) => {
            acc[item._id] = item.average;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Error getting job statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve job statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = jobController;
