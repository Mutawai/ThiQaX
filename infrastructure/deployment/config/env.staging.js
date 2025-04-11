/**
 * ThiQaX Platform - Staging Environment Configuration Manager
 * 
 * This module validates and loads environment variables for the staging environment.
 * It ensures all required variables are present and properly formatted before
 * allowing the application to start.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { validateConfig } = require('./config-validator');
const { secureConfigAccess } = require('./secrets-manager');

// Define staging-specific configuration requirements and defaults
const stagingDefaults = {
  NODE_ENV: 'staging',
  PORT: '5000',
  BASE_URL: 'https://staging.thiqax.com',
  HOST: 'staging.thiqax.com',
  TRUST_PROXY: 'true',
  CORS_ALLOWED_ORIGINS: 'https://staging.thiqax.com,https://api.staging.thiqax.com',
  LOG_LEVEL: 'info',
  ENABLE_METRICS: 'true',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100'
};

// Define staging-specific validation rules
const stagingValidationRules = {
  // Database must use the staging database
  MONGODB_URI: {
    validator: (value) => value.includes('staging') || value.includes('stg'),
    message: 'MONGODB_URI must point to a staging database'
  },
  // Stronger rate limiting in staging to match production behavior
  RATE_LIMIT_MAX: {
    validator: (value) => parseInt(value, 10) <= 100,
    message: 'RATE_LIMIT_MAX must not exceed 100 for staging environment'
  },
  // JWT settings must be properly configured
  JWT_EXPIRE: {
    validator: (value) => /^\d+[dhms]$/.test(value),
    message: 'JWT_EXPIRE must be in format of Xd, Xh, Xm, or Xs'
  },
  // Security features must be enabled
  HELMET_ENABLED: {
    validator: (value) => value === 'true',
    message: 'HELMET_ENABLED must be true for staging environment'
  },
  // Ensure file storage is properly configured
  STORAGE_TYPE: {
    validator: (value) => ['local', 'gcp', 's3'].includes(value),
    message: 'STORAGE_TYPE must be one of: local, gcp, s3'
  }
};

/**
 * Loads and validates the staging environment configuration
 * @returns {Object} The validated configuration object
 * @throws {Error} If configuration validation fails
 */
function loadStagingConfig() {
  // Determine environment file path - with fallbacks
  let envPath = path.resolve(process.cwd(), '.env.staging');
  
  if (!fs.existsSync(envPath)) {
    console.warn('No .env.staging file found, falling back to .env');
    envPath = path.resolve(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      throw new Error('No environment configuration file found');
    }
  }

  // Load environment configuration
  const envConfig = dotenv.config({ path: envPath }).parsed;
  
  // Apply staging defaults for missing values
  const config = { ...stagingDefaults, ...envConfig };
  
  // Validate configuration
  const validationResult = validateConfig(config, stagingValidationRules);
  
  if (!validationResult.valid) {
    throw new Error(`Staging environment validation failed: ${validationResult.errors.join(', ')}`);
  }
  
  // Apply secure access policies to sensitive configuration
  return secureConfigAccess(config);
}

// Load configuration immediately upon importing this module
const stagingConfig = loadStagingConfig();

module.exports = stagingConfig;
