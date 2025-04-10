// src/config/environment.js
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { logger } = require('./logger');

// Define environment types
const ENV_TYPES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  TEST: 'test',
  PRODUCTION: 'production'
};

// Load environment variables from the appropriate .env file
const loadEnvironment = () => {
  // Get environment from NODE_ENV, defaulting to development
  const nodeEnv = process.env.NODE_ENV || ENV_TYPES.DEVELOPMENT;
  
  // Determine which .env file to load
  let envFile = '.env';
  
  // If not in production, try to load environment-specific file
  if (nodeEnv !== ENV_TYPES.PRODUCTION) {
    const envSpecificFile = `.env.${nodeEnv}`;
    const envSpecificPath = path.resolve(process.cwd(), envSpecificFile);
    
    if (fs.existsSync(envSpecificPath)) {
      envFile = envSpecificFile;
    }
  }
  
  // Load the environment file
  const envPath = path.resolve(process.cwd(), envFile);
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    logger.warn(`Error loading ${envFile}: ${result.error.message}`);
    logger.warn('Continuing with existing environment variables');
  } else {
    logger.info(`Loaded environment from ${envFile}`);
  }
  
  // Always set NODE_ENV to ensure consistency
  process.env.NODE_ENV = nodeEnv;
  
  return {
    nodeEnv,
    envFile
  };
};

// Return current environment settings
const getEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV || ENV_TYPES.DEVELOPMENT;
  
  return {
    current: nodeEnv,
    isDevelopment: nodeEnv === ENV_TYPES.DEVELOPMENT,
    isStaging: nodeEnv === ENV_TYPES.STAGING,
    isTest: nodeEnv === ENV_TYPES.TEST,
    isProduction: nodeEnv === ENV_TYPES.PRODUCTION
  };
};

// Get base URL according to the environment
const getBaseUrl = () => {
  const { current } = getEnvironment();
  
  // Use environment-specific URLs or fall back to defaults
  switch(current) {
    case ENV_TYPES.PRODUCTION:
      return process.env.BASE_URL || 'https://api.thiqax.com';
    case ENV_TYPES.STAGING:
      return process.env.BASE_URL || 'https://api-staging.thiqax.com';
    case ENV_TYPES.TEST:
      return process.env.BASE_URL || 'http://localhost:5000';
    default:
      return process.env.BASE_URL || 'http://localhost:5000';
  }
};

// Get client URLs for CORS configuration
const getClientUrls = () => {
  const { current } = getEnvironment();
  
  // Use environment-specific URLs or fall back to defaults
  switch(current) {
    case ENV_TYPES.PRODUCTION:
      return process.env.CLIENT_URL || 'https://thiqax.com';
    case ENV_TYPES.STAGING:
      return process.env.CLIENT_URL || 'https://staging.thiqax.com';
    case ENV_TYPES.TEST:
      return process.env.CLIENT_URL || 'http://localhost:3000';
    default:
      return process.env.CLIENT_URL || 'http://localhost:3000';
  }
};

module.exports = {
  ENV_TYPES,
  loadEnvironment,
  getEnvironment,
  getBaseUrl,
  getClientUrls
};
