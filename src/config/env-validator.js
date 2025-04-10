// src/config/env-validator.js
const { logger } = require('./logger');
const { getEnvironment, ENV_TYPES } = require('./environment');

// Define required environment variables by environment
const getRequiredVariables = () => {
  const { current } = getEnvironment();
  
  // Common required variables for all environments
  const common = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  // Environment-specific required variables
  const envSpecific = {
    [ENV_TYPES.PRODUCTION]: [
      'BASE_URL',
      'CLIENT_URL',
      'CORS_ALLOWED_ORIGINS',
      'REDIS_URL',
      'EMAIL_FROM',
      'EMAIL_SERVICE',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'STORAGE_BUCKET'
    ],
    [ENV_TYPES.STAGING]: [
      'BASE_URL',
      'CLIENT_URL',
      'CORS_ALLOWED_ORIGINS',
      'REDIS_URL',
      'EMAIL_FROM',
      'EMAIL_SERVICE',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'STORAGE_BUCKET'
    ],
    [ENV_TYPES.TEST]: [],
    [ENV_TYPES.DEVELOPMENT]: []
  };
  
  return [...common, ...(envSpecific[current] || [])];
};

// Define variables with default values
const getVariablesWithDefaults = () => {
  return {
    'PORT': '5000',
    'LOG_LEVEL': 'info',
    'JWT_ACCESS_EXPIRY': '15m',
    'JWT_REFRESH_EXPIRY': '7d',
    'RATE_LIMIT_WINDOW_MS': '900000', // 15 minutes
    'RATE_LIMIT_MAX': '100'
  };
};

// Validate that all required environment variables are set
const validateEnvironment = () => {
  const requiredVars = getRequiredVariables();
  const missingVars = [];
  
  // Check for missing required variables
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  // Set default values for variables with defaults
  const defaultVars = getVariablesWithDefaults();
  Object.entries(defaultVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      logger.info(`Environment variable ${varName} not set, using default: ${defaultValue}`);
    }
  });
  
  // Handle missing required variables
  if (missingVars.length > 0) {
    const { isProduction, isStaging } = getEnvironment();
    
    // In production or staging, missing variables are fatal
    if (isProduction || isStaging) {
      const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      // In development or test, just warn
      logger.warn(`Missing recommended environment variables: ${missingVars.join(', ')}`);
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVariables: missingVars
  };
};

module.exports = {
  validateEnvironment,
  getRequiredVariables,
  getVariablesWithDefaults
};
