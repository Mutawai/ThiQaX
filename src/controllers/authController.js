const crypto = require('crypto');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { createLogger } = require('../utils/logger');
const config = require('../config');

const logger = createLogger('authController');

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }

    // Validate role if provided
    const validRoles = ['jobSeeker', 'agent', 'sponsor'];
    if (role && !validRoles.includes(role)) {
      return next(new ErrorResponse('Invalid role specified', 400));
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'jobSeeker'
    });

    // Return token
    sendTokenResponse(user, 201, res);
  } catch (err) {
    logger.error(`Registration error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new ErrorResponse('This account has been deactivated', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Return token
    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`Get current user error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/v1/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Check if email is being updated
    if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email: fieldsToUpdate.email });
      if (existingUser) {
        return next(new ErrorResponse('Email already in use', 400));
      }
      
      // Reset email verification status
      fieldsToUpdate.isEmailVerified = false;
    }

    // Check if phone is being updated
    if (fieldsToUpdate.phone && fieldsToUpdate.phone !== req.user.phone) {
      // Reset phone verification status
      fieldsToUpdate.isPhoneVerified = false;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error(`Update details error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`Update password error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${config.api.frontendUrl}/reset-password/${resetToken}`;

    // In a real implementation, you would send an email here
    // For now, we'll just log the token and URL
    logger.info(`Password reset token: ${resetToken}`);
    logger.info(`Reset URL: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      data: config.server.isDevelopment ? { resetToken, resetUrl } : undefined
    });
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);

    // If there's an error, clear the reset token fields
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }

    next(err);
  }
};

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Refresh token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new ErrorResponse('Please provide a refresh token', 400));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.auth.jwtRefreshSecret);

    // Get user
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }

    // Generate new tokens
    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`Refresh token error: ${err.message}`);
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Invalid or expired refresh token', 401));
    }
    
    next(err);
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    // Remove refresh token from database
    await User.findByIdAndUpdate(req.user.id, {
      refreshToken: null
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    next(err);
  }
};

/**
 * Get token from model, create cookie and send response
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Create access token
  const token = user.getSignedJwtToken();
  
  // Create refresh token
  const refreshToken = user.getRefreshToken();
  
  // Save refresh token to database
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });
  
  // Set cookie options
  const options = {
    expires: new Date(
      Date.now() + config.auth.jwtCookieExpire * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Set secure flag in production
  if (config.server.isProduction) {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      refreshToken
    });
};
