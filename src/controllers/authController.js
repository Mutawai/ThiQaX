const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { createLogger } = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
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

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    
    await user.save({ validateBeforeSave: false });

    // Create verification url
    const verificationUrl = `${config.api.frontendUrl}/verify-email/${verificationToken}`;

    const message = `Welcome to ThiQaX! Please verify your email address by clicking the link below: \n\n ${verificationUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ThiQaX Email Verification',
        message
      });
      
      logger.info(`Verification email sent to ${user.email}`);
    } catch (err) {
      logger.error(`Email sending error: ${err.message}`);
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

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

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

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
      
      // Generate new email verification token if email verification is enabled
      if (config.auth.requireEmailVerification) {
        const user = await User.findById(req.user.id);
        const verificationToken = user.getEmailVerificationToken();
        await user.save({ validateBeforeSave: false });
        
        // Create verification url
        const verificationUrl = `${config.api.frontendUrl}/verify-email/${verificationToken}`;
        
        // Send verification email
        try {
          await sendEmail({
            email: fieldsToUpdate.email,
            subject: 'ThiQaX Email Verification',
            message: `Please verify your new email address by clicking the link below: \n\n ${verificationUrl}`
          });
          
          logger.info(`Verification email sent to new address: ${fieldsToUpdate.email}`);
        } catch (err) {
          logger.error(`Email sending error: ${err.message}`);
          user.emailVerificationToken = undefined;
          user.emailVerificationExpire = undefined;
          await user.save({ validateBeforeSave: false });
        }
      }
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

    try {
      await sendEmail({
        email: user.email,
        subject: 'ThiQaX Password Reset',
        message: `You are receiving this email because you (or someone else) has requested to reset your password. Please click the link below to reset your password: \n\n ${resetUrl} \n\nIf you did not request this, please ignore this email and your password will remain unchanged.`
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
        data: config.server.isDevelopment ? { resetToken, resetUrl } : undefined
      });
    } catch (err) {
      logger.error(`Forgot password email error: ${err.message}`);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    logger.error(`Forgot password error: ${err.message}`);
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

    // Log password reset
    logger.info(`Password reset successful for user: ${user.email}`);

    sendTokenResponse(user, 200, res);
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Verify email
 * @route   GET /api/v1/auth/verifyemail/:verificationtoken
 * @access  Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.verificationtoken)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Set email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Log verification
    logger.info(`Email verified for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    logger.error(`Email verification error: ${err.message}`);
    next(err);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/v1/auth/resendverification
 * @access  Public
 */
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }

    if (user.isEmailVerified) {
      return next(new ErrorResponse('Email already verified', 400));
    }

    // Generate email verification token
    const verificationToken = user.getEmailVerificationToken();
    
    await user.save({ validateBeforeSave: false });

    // Create verification url
    const verificationUrl = `${config.api.frontendUrl}/verify-email/${verificationToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ThiQaX Email Verification',
        message: `Please verify your email address by clicking the link below: \n\n ${verificationUrl}`
      });

      res.status(200).json({ 
        success: true, 
        message: 'Verification email sent',
        data: config.server.isDevelopment ? { verificationToken, verificationUrl } : undefined
      });
    } catch (err) {
      logger.error(`Email sending error: ${err.message}`);
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    logger.error(`Resend verification error: ${err.message}`);
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

    if (!user.isActive) {
      return next(new ErrorResponse('This account has been deactivated', 401));
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

    // Clear cookie if using cookie auth
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
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
 * @desc    Check email availability
 * @route   POST /api/v1/auth/check-email
 * @access  Public
 */
exports.checkEmailAvailability = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse('Please provide an email address', 400));
    }

    const existingUser = await User.findOne({ email });
    
    res.status(200).json({
      success: true,
      available: !existingUser
    });
  } catch (err) {
    logger.error(`Check email availability error: ${err.message}`);
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
    options.sameSite = 'strict';
  }

  // Prepare response data
  const responseData = {
    success: true,
    token,
    refreshToken
  };

  // Add user info if in development
  if (config.server.isDevelopment) {
    responseData.user = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json(responseData);
};

module.exports = exports;
