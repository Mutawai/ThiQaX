// File: src/controllers/notificationController.js

const notificationService = require('../services/notificationService');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user's notifications with pagination
// @route   GET /api/v1/notifications
// @access  Private
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  
  const result = await notificationService.getUserNotifications(
    req.user.id,
    page,
    limit
  );
  
  res.status(200).json({
    success: true,
    count: result.data.length,
    pagination: result.pagination,
    data: result.data
  });
});

// @desc    Get user's unread notifications
// @route   GET /api/v1/notifications/unread
// @access  Private
exports.getUnreadNotifications = asyncHandler(async (req, res, next) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const notifications = await notificationService.getUnreadNotifications(
    req.user.id,
    limit
  );
  
  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.id
    );
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 404));
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      modified: result.nModified
    }
  });
});

// @desc    Create a test notification (development only)
// @route   POST /api/v1/notifications/test
// @access  Private (Development only)
exports.createTestNotification = asyncHandler(async (req, res, next) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return next(new ErrorResponse('Not available in production', 403));
  }
  
  const { type, title, message, data } = req.body;
  
  if (!type || !title || !message) {
    return next(new ErrorResponse('Please provide type, title and message', 400));
  }
  
  const notification = await notificationService.createNotification({
    recipient: req.user.id,
    type,
    title,
    message,
    data: data || {},
    sender: req.user.id
  });
  
  res.status(201).json({
    success: true,
    data: notification
  });
});
