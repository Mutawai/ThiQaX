/**
 * ThiQaX Platform - Production Environment Configuration Manager
 * 
 * This module validates and loads environment variables for the production environment.
 * It implements strict validation of all required variables and security settings
 * to ensure the application is properly configured before startup.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { validateConfig } = require('./config-validator');
const { secureConfigAccess } = require('./secrets-manager');

// Define production-specific configuration requirements and defaults
const productionDefaults = {
  NODE_ENV: 'production',
  PORT: '5000',
  BASE_URL: 'https://thiqax.com',
  HOST: 'thiqax.com',
  TRUST_PROXY: 'true',
  CORS_ALLOWED_ORIGINS: 'https://thiqax.com,https://api.thiqax.com',
  LOG_LEVEL: 'warn',
  ENABLE_METRICS: 'true',
  ENABLE_RATE_LIMIT: 'true',
  HELMET_ENABLED: 'true'
};

// Define production-specific validation rules with stricter requirements
const productionValidationRules = {
  // Database must use the production database
  MONGODB_URI: {
    validator: (value) => value.includes('prod') && !value.includes('localhost'),
    message: 'MONGODB_URI must point to a production database and not localhost'
  },
  // JWT security settings
  JWT_SECRET: {
    validator: (value) => value.length >= 32,
    message: 'JWT_SECRET must be at least 32 characters for production'
  },
  JWT_REFRESH_SECRET: {
    validator: (value) => value.length >= 32,
    message: 'JWT_REFRESH_SECRET must be at least 32 characters for production'
  },
  // Security features must be enabled
  ENABLE_RATE_LIMIT: {
    validator: (value) => value === 'true',
    message: 'ENABLE_RATE_LIMIT must be true for production environment'
  },
  HELMET_ENABLED: {
    validator: (value) => value === 'true',
    message: 'HELMET_ENABLED must be true for production environment'
  },
  // File storage must be cloud-based
  STORAGE_TYPE: {
    validator: (value) => ['gcp', 's3'].includes(value),
    message: 'STORAGE_TYPE must be cloud-based (gcp or s3) for production'
  },
  // CORS settings must be restrictive
  CORS_ALLOWED_ORIGINS: {
    validator: (value) => value.split(',').every(origin => 
      origin.startsWith('https://') && !origin.includes('localhost')),
    message: 'CORS_ALLOWED_ORIGINS must only contain HTTPS URLs and no localhost'
  },
  // Redis must be configured
  REDIS_URL: {
    validator: (value) => value && !value.includes('localhost'),
    message: 'REDIS_URL must be configured and not point to localhost'
  }
};

/**
 * Loads and validates the production environment configuration
 * @returns {Object} The validated configuration object
 * @throws {Error} If configuration validation fails
 */
function loadProductionConfig() {
  // Determine environment file path - with fallbacks
  let envPath = path.resolve(process.cwd(), '.env.production');
  
  if (!fs.existsSync(envPath)) {
    console.warn('No .env.production file found, falling back to .env');
    envPath = path.resolve(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      throw new Error('No environment configuration file found');
    }
  }

  // Load environment configuration
  const envConfig = dotenv.config({ path: envPath }).parsed;
  
  // Apply production defaults for missing values
  const config = { ...productionDefaults, ...envConfig };
  
  // Enforce NODE_ENV to be production regardless of what's in the file
  config.NODE_ENV = 'production';
  
  // Validate configuration with strict rules
  const validationResult = validateConfig(config, productionValidationRules);
  
  if (!validationResult.valid) {
    throw new Error(`Production environment validation failed: ${validationResult.errors.join(', ')}`);
  }
  
  // Apply secure access policies to sensitive configuration
  return secureConfigAccess(config);
}

// Load configuration immediately upon importing this module
const productionConfig = loadProductionConfig();

module.exports = productionConfig;
