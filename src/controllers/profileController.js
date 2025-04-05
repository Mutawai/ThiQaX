const Profile = require('../models/Profile');
const User = require('../models/User');
const Document = require('../models/Document');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create or update user profile
// @route   POST /api/v1/profile
// @access  Private
exports.createOrUpdateProfile = asyncHandler(async (req, res, next) => {
  // Get fields from request body
  const profileFields = { ...req.body };
  
  // Add user ID from auth middleware
  profileFields.user = req.user.id;
  
  // Check if profile exists
  let profile = await Profile.findOne({ user: req.user.id });
  
  if (profile) {
    // Update existing profile
    profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileFields },
      { new: true, runValidators: true }
    );
  } else {
    // Create new profile
    profile = await Profile.create(profileFields);
    
    // Update user's profileComplete status if needed
    await User.findByIdAndUpdate(req.user.id, { 
      profileComplete: true 
    });
  }
  
  // Populate associated user data
  await profile.populate('user', 'name email role');
  
  // Calculate profile completion percentage
  const completionPercentage = profile.calculateCompletionPercentage();
  
  res.status(200).json({
    success: true,
    data: profile,
    completionPercentage
  });
});

// @desc    Get current user's profile
// @route   GET /api/v1/profile/me
// @access  Private
exports.getCurrentProfile = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id })
    .populate('user', 'name email role')
    .populate('documents');
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  // Calculate profile completion percentage
  const completionPercentage = profile.calculateCompletionPercentage();
  
  res.status(200).json({
    success: true,
    data: profile,
    completionPercentage
  });
});

// @desc    Get profile by user ID
// @route   GET /api/v1/profile/user/:userId
// @access  Private
exports.getProfileByUserId = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.params.userId })
    .populate('user', 'name email role')
    .populate('documents');
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Get all profiles (with filters)
// @route   GET /api/v1/profile
// @access  Private (Admin/Agent)
exports.getAllProfiles = asyncHandler(async (req, res, next) => {
  // Check if user has appropriate role
  if (req.user.role !== 'admin' && req.user.role !== 'agent') {
    return next(new ErrorResponse('Not authorized to access this route', 403));
  }
  
  // Build query with filters
  let query = {};
  
  // Add role filter if provided
  if (req.query.role) {
    // We need to find users with the specified role first
    const users = await User.find({ role: req.query.role }).select('_id');
    const userIds = users.map(user => user._id);
    query.user = { $in: userIds };
  }
  
  // Add other filters as needed
  // Example: filter by nationality
  if (req.query.nationality) {
    query.nationality = req.query.nationality;
  }
  
  // Execute query with pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  const profiles = await Profile.find(query)
    .populate('user', 'name email role')
    .skip(startIndex)
    .limit(limit);
  
  const total = await Profile.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: profiles.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    },
    data: profiles
  });
});

// @desc    Delete profile
// @route   DELETE /api/v1/profile
// @access  Private
exports.deleteProfile = asyncHandler(async (req, res, next) => {
  // Find and remove profile
  await Profile.findOneAndRemove({ user: req.user.id });
  
  // Update user's profileComplete status
  await User.findByIdAndUpdate(req.user.id, { 
    profileComplete: false 
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add education to profile
// @route   PUT /api/v1/profile/education
// @access  Private
exports.addEducation = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  profile.education.unshift(req.body);
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Delete education from profile
// @route   DELETE /api/v1/profile/education/:eduId
// @access  Private
exports.deleteEducation = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  // Get remove index
  const removeIndex = profile.education
    .map(item => item.id)
    .indexOf(req.params.eduId);
  
  if (removeIndex === -1) {
    return next(new ErrorResponse('Education not found', 404));
  }
  
  profile.education.splice(removeIndex, 1);
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Add work experience to profile
// @route   PUT /api/v1/profile/experience
// @access  Private
exports.addExperience = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  profile.workExperience.unshift(req.body);
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Delete work experience from profile
// @route   DELETE /api/v1/profile/experience/:expId
// @access  Private
exports.deleteExperience = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  // Get remove index
  const removeIndex = profile.workExperience
    .map(item => item.id)
    .indexOf(req.params.expId);
  
  if (removeIndex === -1) {
    return next(new ErrorResponse('Experience not found', 404));
  }
  
  profile.workExperience.splice(removeIndex, 1);
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Upload profile picture
// @route   PUT /api/v1/profile/picture
// @access  Private
exports.uploadProfilePicture = asyncHandler(async (req, res, next) => {
  // This assumes you have a file upload middleware like multer
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }
  
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  // In a production environment, you would:
  // 1. Upload to cloud storage (S3, Cloudinary, etc.)
  // 2. Save URL and public ID in the profile
  
  // For this example, we'll assume the file is saved locally
  profile.profilePicture = {
    url: `${process.env.DOCUMENT_BASE_URL}/${req.file.filename}`,
    publicId: req.file.filename
  };
  
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Link document to profile
// @route   PUT /api/v1/profile/documents/:documentId
// @access  Private
exports.linkDocument = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id });
  const document = await Document.findById(req.params.documentId);
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  if (!document) {
    return next(new ErrorResponse('Document not found', 404));
  }
  
  // Verify the document belongs to the current user
  if (document.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this document', 401));
  }
  
  // Check if document is already linked
  if (profile.documents.includes(req.params.documentId)) {
    return next(new ErrorResponse('Document already linked to profile', 400));
  }
  
  profile.documents.push(req.params.documentId);
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

// @desc    Unlink document from profile
// @route   DELETE /api/v1/profile/documents/:documentId
// @access  Private
exports.unlinkDocument = asyncHandler(async (req, res, next) => {
  const profile = await Profile.findOne({ user: req.user.id });
  
  if (!profile) {
    return next(new ErrorResponse('Profile not found', 404));
  }
  
  // Check if document is linked
  const documentIndex = profile.documents.findIndex(
    doc => doc.toString() === req.params.documentId
  );
  
  if (documentIndex === -1) {
    return next(new ErrorResponse('Document not linked to profile', 404));
  }
  
  profile.documents.splice(documentIndex, 1);
  await profile.save();
  
  res.status(200).json({
    success: true,
    data: profile
  });
});
