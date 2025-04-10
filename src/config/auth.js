// src/config/auth.js
const jwt = require('jsonwebtoken');

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'thiqax-dev-secret',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'thiqax-api',
  audience: process.env.JWT_AUDIENCE || 'thiqax-client'
};

// Verify token and return decoded payload
const verifyToken = (token, options = {}) => {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      ...options
    });
  } catch (error) {
    return null;
  }
};

// Generate access token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.accessTokenExpiry,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
};

// Generate tokens for user
const generateTokens = (user) => {
  const basePayload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return {
    accessToken: generateAccessToken(basePayload),
    refreshToken: generateRefreshToken({ ...basePayload, tokenType: 'refresh' }),
    expiresIn: jwtConfig.accessTokenExpiry
  };
};

// Extract token from authorization header
const extractTokenFromHeader = (req) => {
  if (!req.headers.authorization) {
    return null;
  }

  const parts = req.headers.authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

module.exports = {
  jwtConfig,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  extractTokenFromHeader
};
