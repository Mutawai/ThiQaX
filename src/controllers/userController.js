const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { createLogger } = require('../utils/logger');
const config = require('../config');

const logger = createLogger('userController');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Build query with filtering, sorting and pagination
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    query = User.find(JSON.parse(queryStr));
    
    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Always exclude password
      query = query.select('-password -refreshToken');
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const users = await query;
    
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
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users
    });
  } catch (err) {
    logger.error(`Get all users error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Get single user by ID (admin only)
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`Get user by ID error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Create user (admin only)
 * @route   POST /api/v1/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }
    
    // Validate role if provided
    const validRoles = ['jobSeeker', 'agent', 'sponsor', 'admin'];
    if (role && !validRoles.includes(role)) {
      return next(new ErrorResponse('Invalid role specified', 400));
    }
    
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`Create user error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Update user (admin only)
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;
    
    // Build update object with only allowed fields
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (role !== undefined) updateFields.role = role;
    if (isActive !== undefined) updateFields.isActive = isActive;
    
    // If email is being updated
    if (email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return next(new ErrorResponse('Email already in use', 400));
      }
      
      // Reset email verification if email changes
      updateFields.isEmailVerified = false;
    }
    
    // Update the user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-password -refreshToken');
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    // Log the update
    logger.info(`User ${req.params.id} updated by admin ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`Update user error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/v1/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    // Make sure admin is not deleting themselves
    if (req.params.id === req.user.id) {
      return next(new ErrorResponse('You cannot delete your own account', 400));
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    // If implementing soft delete
    if (config.users.softDelete) {
      // Set to inactive instead of deleting
      user.isActive = false;
      user.deletedAt = Date.now();
      user.deletedBy = req.user.id;
      await user.save({ validateBeforeSave: false });
      
      logger.info(`User ${req.params.id} soft-deleted by admin ${req.user.id}`);
    } else {
      // Hard delete - remove from database
      await user.remove();
      logger.info(`User ${req.params.id} permanently deleted by admin ${req.user.id}`);
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Get users by role
 * @route   GET /api/v1/users/role/:role
 * @access  Private/Admin
 */
exports.getUsersByRole = async (req, res, next) => {
  try {
    const validRoles = ['jobSeeker', 'agent', 'sponsor', 'admin'];
    
    if (!validRoles.includes(req.params.role)) {
      return next(new ErrorResponse('Invalid role specified', 400));
    }
    
    const users = await User.find({ 
      role: req.params.role,
      isActive: true 
    }).select('-password -refreshToken');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    logger.error(`Get users by role error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Get user stats (count by role, active/inactive counts)
 * @route   GET /api/v1/users/stats
 * @access  Private/Admin
 */
exports.getUserStats = async (req, res, next) => {
  try {
    // Aggregate users by role
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // Get active/inactive counts
    const activeStats = await User.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]);
    
    // Format the stats for easy consumption
    const stats = {
      total: await User.countDocuments(),
      roles: {},
      status: {
        active: 0,
        inactive: 0
      }
    };
    
    // Process role stats
    roleStats.forEach(stat => {
      stats.roles[stat._id] = stat.count;
    });
    
    // Process active/inactive stats
    activeStats.forEach(stat => {
      if (stat._id === true) {
        stats.status.active = stat.count;
      } else {
        stats.status.inactive = stat.count;
      }
    });
    
    // Get count of users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    stats.recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    logger.error(`Get user stats error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Activate or deactivate user
 * @route   PATCH /api/v1/users/:id/status
 * @access  Private/Admin
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return next(new ErrorResponse('Please provide isActive status', 400));
    }
    
    // Prevent deactivating self
    if (req.params.id === req.user.id && !isActive) {
      return next(new ErrorResponse('You cannot deactivate your own account', 400));
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      {
        new: true,
        runValidators: true
      }
    ).select('-password -refreshToken');
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    
    const action = isActive ? 'activated' : 'deactivated';
    logger.info(`User ${req.params.id} ${action} by admin ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`Toggle user status error: ${err.message}`);
    next(err);
  }
};

module.exports = exports;
