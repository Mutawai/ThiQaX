/**
 * Utility functions for JWT token management in the ThiQaX platform.
 * Provides methods for generating, validating, refreshing tokens with proper security practices.
 */
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const logger = require('./logger');

// Convert jwt.sign and jwt.verify to Promise-based functions
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

/**
 * Generate JWT access token
 * @param {Object} payload - User data to include in token
 * @param {String} expiresIn - Token expiration time (default: '1h')
 * @returns {Promise<String>} Generated JWT token
 */
const generateAccessToken = async (payload, expiresIn = '1h') => {
  try {
    // Remove sensitive data from payload
    const tokenPayload = {
      id: payload.id,
      role: payload.role,
      email: payload.email
    };
    
    return await signAsync(
      tokenPayload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn }
    );
  } catch (error) {
    logger.error('Error generating access token', { error });
    throw error;
  }
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to include in token
 * @param {String} expiresIn - Token expiration time (default: '7d')
 * @returns {Promise<String>} Generated refresh token
 */
const generateRefreshToken = async (payload, expiresIn = '7d') => {
  try {
    // Minimal payload for refresh token
    const tokenPayload = {
      id: payload.id,
      version: payload.tokenVersion || 0 // For token invalidation
    };
    
    return await signAsync(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn }
    );
  } catch (error) {
    logger.error('Error generating refresh token', { error });
    throw error;
  }
};

/**
 * Verify JWT token and return decoded payload
 * @param {String} token - JWT token to verify
 * @param {Boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyToken = async (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken 
      ? process.env.JWT_REFRESH_SECRET 
      : process.env.JWT_ACCESS_SECRET;
      
    return await verifyAsync(token, secret);
  } catch (error) {
    // Don't log 'expired' as error since it's expected
    if (error.name === 'TokenExpiredError') {
      logger.info('Token expired', { isRefreshToken });
    } else {
      logger.error('Token verification failed', { error: error.message, isRefreshToken });
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {String|null} Extracted token or null
 */
const extractTokenFromHeader = (req) => {
  if (!req.headers.authorization) {
    return null;
  }
  
  const authHeader = req.headers.authorization;
  const [bearer, token] = authHeader.split(' ');
  
  if (bearer !== 'Bearer' || !token) {
    return null;
  }
  
  return token;
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Promise<Object>} Object containing both tokens
 */
const generateAuthTokens = async (user) => {
  const accessToken = await generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken
  };
};

/**
 * Refresh access token using refresh token
 * @param {String} refreshToken - Refresh token
 * @returns {Promise<Object>} Object containing new access token and user data
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = await verifyToken(refreshToken, true);
    
    // Get user from database to ensure it still exists
    const User = require('../models/User');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check token version for invalidation
    if (user.tokenVersion !== decoded.version) {
      throw new Error('Token invalidated');
    }
    
    // Generate new access token
    const accessToken = await generateAccessToken(user);
    
    return {
      accessToken,
      user
    };
  } catch (error) {
    logger.error('Error refreshing access token', { error });
    throw error;
  }
};

/**
 * Invalidate user's refresh tokens by incrementing token version
 * @param {String} userId - User ID
 * @returns {Promise<void>}
 */
const invalidateUserTokens = async (userId) => {
  try {
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
    logger.info('User tokens invalidated', { userId });
  } catch (error) {
    logger.error('Error invalidating user tokens', { error, userId });
    throw error;
  }
};

/**
 * Create authentication middleware
 * @param {Array<String>} roles - Allowed roles (optional)
 * @returns {Function} Express middleware
 */
const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Extract token
      const token = extractTokenFromHeader(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Verify token
      const decoded = await verifyToken(token);
      
      // Check if user has required role
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      
      // Attach user to request
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          expired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication'
      });
    }
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  generateAuthTokens,
  refreshAccessToken,
  invalidateUserTokens,
  authMiddleware
};
