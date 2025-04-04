// File: src/controllers/documentController.js

const Document = require('../models/Document');
const Profile = require('../models/Profile');
const User = require('../models/User');
const documentUploadService = require('../services/documentUploadService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Upload a new document
// @route   POST /api/v1/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  // Process file upload (handled by multer middleware)
  const fileInfo = documentUploadService.processUpload(req);
  
  // Validate document type
  if (!req.body.type || !documentUploadService.validateDocumentType(req.body.type)) {
    // Delete uploaded file if type is invalid
    await documentUploadService.deleteFile(fileInfo.filePath);
    return next(new ErrorResponse('Invalid document type', 400));
  }
  
  // Validate document metadata
  const metadataValidation = documentUploadService.validateDocumentMetadata({
    type: req.body.type,
    issuingCountry: req.body.issuingCountry,
    documentNumber: req.body.documentNumber,
    issueDate: req.body.issueDate,
    expiryDate: req.body.expiryDate
  });
  
  if (!metadataValidation.isValid) {
    // Delete uploaded file if metadata is invalid
    await documentUploadService.deleteFile(fileInfo.filePath);
    return next(new ErrorResponse('Invalid document metadata: ' + 
      JSON.stringify(metadataValidation.errors), 400));
  }
  
  // Create document record
  const document = await Document.create({
    owner: req.user.id,
    type: req.body.type,
    subType: req.body.subType,
    documentNumber: req.body.documentNumber,
    issuingCountry: req.body.issuingCountry,
    issuingAuthority: req.body.issuingAuthority,
    issueDate: req.body.issueDate,
    expiryDate: req.body.expiryDate,
    fileURL: documentUploadService.generateFileURL(fileInfo.fileName),
    fileType: fileInfo.fileType,
    fileSize: fileInfo.fileSize,
    fileName: fileInfo.fileName,
    originalFilename: fileInfo.originalFilename,
    metadata: {
      requiresTranslation: req.body.requiresTranslation === 'true',
      isCritical: req.body.isCritical === 'true',
      isPublic: req.body.isPublic === 'true',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
    }
  });
  
  // Update user profile KYC status if needed
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (profile) {
    // If this is the first document upload, change KYC status
    if (profile.kycStatus === 'notStarted') {
      profile.kycStatus = 'inProgress';
      await profile.save();
    }
  }
  
  res.status(201).json({
    success: true,
    data: document
  });
});

// @desc    Get all documents for current user
// @route   GET /api/v1/documents
// @access  Private
exports.getMyDocuments = asyncHandler(async (req, res, next) => {
  const documents = await Document.find({ owner: req.user.id })
    .sort({ uploadDate: -1 });
  
  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Get a single document by ID
// @route   GET /api/v1/documents/:id
// @access  Private
exports.getDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id)
    .populate('owner', 'name email role')
    .populate('verificationDetails.verifiedBy', 'name email role');
  
  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
  }
  
  // Check if user is authorized to access this document
  if (document.owner._id.toString() !== req.user.id && 
      !['admin', 'agent'].includes(req.user.role) && 
      !document.metadata.isPublic) {
    return next(new ErrorResponse('Not authorized to access this document', 403));
  }
  
  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Update document metadata
// @route   PUT /api/v1/documents/:id
// @access  Private
exports.updateDocument = asyncHandler(async (req, res, next) => {
  let document = await Document.findById(req.params.id);
  
  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
  }
  
  // Check if user is authorized to update this document
  if (document.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this document', 403));
  }
  
  // Check if document is in a status that allows updates
  if (!['pending', 'rejected'].includes(document.verificationStatus)) {
    return next(new ErrorResponse(`Document cannot be updated when in ${document.verificationStatus} status`, 400));
  }
  
  // Fields that can be updated
  const updatableFields = [
    'subType', 'documentNumber', 'issuingCountry', 'issuingAuthority',
    'issueDate', 'expiryDate', 'metadata.requiresTranslation',
    'metadata.isPublic', 'metadata.tags'
  ];
  
  // Create update object with only allowed fields
  const updateData = {};
  
  for (const field of updatableFields) {
    if (field.includes('.')) {
      // Handle nested fields (e.g., metadata.isPublic)
      const [parent, child] = field.split('.');
      if (!updateData[parent]) updateData[parent] = {};
      
      if (req.body[field] !== undefined) {
        updateData[parent][child] = req.body[field];
      }
    } else {
      // Handle top-level fields
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
  }
  
  // Handle tags as a special case if they're provided as a comma-separated string
  if (req.body.tags) {
    if (!updateData.metadata) updateData.metadata = {};
    updateData.metadata.tags = req.body.tags.split(',').map(tag => tag.trim());
  }
  
  // Update document
  document = await Document.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
  
  // Add history entry for the update
  document.history.push({
    status: document.verificationStatus,
    timestamp: Date.now(),
    performedBy: req.user.id,
    notes: 'Document metadata updated by user'
  });
  
  await document.save();
  
  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Delete a document
// @route   DELETE /api/v1/documents/:id
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id);
  
  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
  }
  
  // Check if user is authorized to delete this document
  if (document.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this document', 403));
  }
  
  // Check if document is in a status that allows deletion
  if (!['pending', 'rejected'].includes(document.verificationStatus)) {
    return next(new ErrorResponse(`Document cannot be deleted when in ${document.verificationStatus} status`, 400));
  }
  
  // Get file path
  const fileNameFromURL = document.fileURL.split('/').pop();
  const filePath = path.join(
    process.env.NODE_ENV === 'production' 
      ? process.env.UPLOAD_PATH || 'uploads/'
      : 'uploads/',
    fileNameFromURL
  );
  
  // Delete file from storage
  await documentUploadService.deleteFile(filePath);
  
  // Remove document from database
  await document.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// ADMIN ROUTES

// @desc    Get all documents in the verification queue
// @route   GET /api/v1/documents/verification-queue
// @access  Private (Admin only)
exports.getVerificationQueue = asyncHandler(async (req, res, next) => {
  // Query parameters for filtering
  const { status, type, search } = req.query;
  
  // Build query
  let query = {};
  
  // Filter by status if provided, otherwise only get pending and underReview
  if (status) {
    query.verificationStatus = status;
  } else {
    query.verificationStatus = { $in: ['pending', 'underReview'] };
  }
  
  // Filter by document type if provided
  if (type) {
    query.type = type;
  }
  
  // Search by document number or owner
  if (search) {
    // If search looks like an ID, search by document number
    if (/^[A-Z0-9-]+$/i.test(search)) {
      query.documentNumber = { $regex: search, $options: 'i' };
    } else {
      // Find users matching the name
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      // Get their IDs
      const userIds = users.map(user => user._id);
      
      // Add to query
      query.owner = { $in: userIds };
    }
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Document.countDocuments(query);
  
  // Get documents with pagination
  const documents = await Document.find(query)
    .populate('owner', 'name email role')
    .sort({ uploadDate: -1 })
    .skip(startIndex)
    .limit(limit);
  
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
  
  // Get counts for each status for the sidebar
  const statusCounts = await Document.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
  ]);
  
  // Convert to object for easier consumption
  const counts = {};
  statusCounts.forEach(status => {
    counts[status._id] = status.count;
  });
  
  res.status(200).json({
    success: true,
    count: documents.length,
    pagination,
    counts,
    data: documents
  });
});

// @desc    Update document verification status
// @route   PUT /api/v1/documents/:id/verify
// @access  Private (Admin only)
exports.verifyDocument = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;
  
  // Validate status
  if (!['pending', 'underReview', 'verified', 'rejected'].includes(status)) {
    return next(new ErrorResponse('Invalid verification status', 400));
  }
  
  let document = await Document.findById(req.params.id);
  
  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.id}`, 404));
  }
  
  // Update document verification status
  await document.updateVerificationStatus(status, req.user.id, notes);
  
  // If document is verified or rejected, update profile KYC status
  if (['verified', 'rejected'].includes(status)) {
    const profile = await Profile.findOne({ user: document.owner });
    
    if (profile) {
      if (status === 'verified') {
        // Check if all required documents are verified
        const requiredDocTypes = ['passport', 'nationalID']; // Example required documents
        const userDocuments = await Document.find({ 
          owner: document.owner,
          type: { $in: requiredDocTypes }
        });
        
        const allVerified = userDocuments.every(doc => doc.verificationStatus === 'verified');
        
        if (allVerified) {
          profile.kycStatus = 'verified';
          await profile.save();
        }
      } else if (status === 'rejected') {
        // If critical document is rejected, update KYC status
        if (document.metadata.isCritical) {
          profile.kycStatus = 'rejected';
          await profile.save();
        }
      }
    }
  }
  
  // Reload document with populated fields
  document = await Document.findById(req.params.id)
    .populate('owner', 'name email role')
    .populate('verificationDetails.verifiedBy', 'name email role');
  
  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Get verification statistics
// @route   GET /api/v1/documents/verification-stats
// @access  Private (Admin only)
exports.getVerificationStats = asyncHandler(async (req, res, next) => {
  // Get counts for each status
  const statusCounts = await Document.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
  ]);
  
  // Get counts by document type
  const typeCounts = await Document.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  // Get verification counts by admin
  const adminCounts = await Document.aggregate([
    { $match: { 'verificationDetails.verifiedBy': { $exists: true } } },
    { $group: { 
      _id: '$verificationDetails.verifiedBy', 
      count: { $sum: 1 },
      verified: { 
        $sum: { 
          $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] 
        }
      },
      rejected: { 
        $sum: { 
          $cond: [{ $eq: ['$verificationStatus', 'rejected'] }, 1, 0] 
        }
      }
    }}
  ]);
  
  // Populate admin names
  const adminsWithCounts = [];
  for (const adminCount of adminCounts) {
    const admin = await User.findById(adminCount._id).select('name email');
    if (admin) {
      adminsWithCounts.push({
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email
        },
        count: adminCount.count,
        verified: adminCount.verified,
        rejected: adminCount.rejected
      });
    }
  }
  
  // Get daily verification counts for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailyCounts = await Document.aggregate([
    { 
      $match: { 
        'verificationDetails.verificationDate': { 
          $gte: thirtyDaysAgo 
        } 
      } 
    },
    {
      $group: {
        _id: { 
          date: { $dateToString: { format: '%Y-%m-%d', date: '$verificationDetails.verificationDate' } },
          status: '$verificationStatus'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
  
  // Format daily counts for charting
  const dailyStats = {};
  dailyCounts.forEach(day => {
    if (!dailyStats[day._id.date]) {
      dailyStats[day._id.date] = { verified: 0, rejected: 0 };
    }
    dailyStats[day._id.date][day._id.status] = day.count;
  });
  
  // Convert to array format for charting
  const dailyStatsArray = Object.keys(dailyStats).map(date => ({
    date,
    verified: dailyStats[date].verified || 0,
    rejected: dailyStats[date].rejected || 0
  }));
  
  res.status(200).json({
    success: true,
    data: {
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      typeCounts: typeCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      adminStats: adminsWithCounts,
      dailyStats: dailyStatsArray
    }
  });
});
