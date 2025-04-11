/**
 * ThiQaX Platform - Configuration Validation Utility
 * 
 * This module provides utilities for validating environment configuration,
 * ensuring required variables are present and correctly formatted.
 */

/**
 * Required environment variables for all environments
 * If any of these are missing, the application will not start
 */
const REQUIRED_VARIABLES = [
  'NODE_ENV',
  'PORT',
  'BASE_URL',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'JWT_REFRESH_SECRET',
  'CORS_ALLOWED_ORIGINS',
  'STORAGE_TYPE',
  'LOG_LEVEL'
];

/**
 * Type validation functions for different variable types
 */
const typeValidators = {
  string: (value) => typeof value === 'string' && value.trim() !== '',
  number: (value) => !isNaN(Number(value)),
  boolean: (value) => value === 'true' || value === 'false',
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  },
  email: (value) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value),
  mongoUri: (value) => /^mongodb(\+srv)?:\/\//.test(value),
  commaSeparated: (value) => typeof value === 'string' && value.split(',').every(item => item.trim() !== '')
};

/**
 * Type definitions for common environment variables
 */
const variableTypes = {
  NODE_ENV: 'string',
  PORT: 'number',
  BASE_URL: 'url',
  MONGODB_URI: 'mongoUri',
  JWT_SECRET: 'string',
  JWT_EXPIRE: 'string',
  JWT_REFRESH_SECRET: 'string',
  CORS_ALLOWED_ORIGINS: 'commaSeparated',
  ENABLE_RATE_LIMIT: 'boolean',
  RATE_LIMIT_WINDOW_MS: 'number',
  RATE_LIMIT_MAX: 'number',
  HELMET_ENABLED: 'boolean',
  LOG_LEVEL: 'string',
  REDIS_URL: 'string',
  SMTP_HOST: 'string',
  SMTP_PORT: 'number',
  SMTP_EMAIL: 'email',
  FROM_EMAIL: 'email'
};

/**
 * Validates a configuration object against required variables and type definitions
 * @param {Object} config - The configuration object to validate
 * @param {Object} customRules - Optional custom validation rules
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateConfig(config, customRules = {}) {
  const errors = [];
  
  // Check required variables
  for (const variable of REQUIRED_VARIABLES) {
    if (!config[variable]) {
      errors.push(`Required environment variable ${variable} is missing`);
    }
  }
  
  // Validate variable types for all present variables
  for (const [key, value] of Object.entries(config)) {
    const type = variableTypes[key];
    
    // Skip validation if no type definition exists
    if (!type) continue;
    
    const validator = typeValidators[type];
    if (validator && !validator(value)) {
      errors.push(`Environment variable ${key} is not a valid ${type}`);
    }
  }
  
  // Apply custom validation rules
  for (const [key, rule] of Object.entries(customRules)) {
    if (config[key] && !rule.validator(config[key])) {
      errors.push(rule.message);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates and sanitizes a specific environment variable
 * @param {string} name - The variable name
 * @param {string} value - The variable value
 * @param {string} type - The expected type
 * @returns {Object} Validation result with valid flag and sanitized value
 */
function validateVariable(name, value, type) {
  const validator = typeValidators[type];
  
  if (!validator) {
    return {
      valid: false,
      value: null,
      error: `Unknown validation type: ${type}`
    };
  }
  
  const isValid = validator(value);
  
  if (!isValid) {
    return {
      valid: false,
      value: null,
      error: `Variable ${name} fails validation as ${type}`
    };
  }
  
  // Sanitize and convert value based on type
  let sanitizedValue = value;
  
  if (type === 'number') {
    sanitizedValue = Number(value);
  } else if (type === 'boolean') {
    sanitizedValue = value === 'true';
  } else if (type === 'commaSeparated') {
    sanitizedValue = value.split(',').map(item => item.trim());
  }
  
  return {
    valid: true,
    value: sanitizedValue,
    error: null
  };
}

/**
 * Checks if the current environment matches a specific environment
 * @param {string} env - The environment to check against
 * @returns {boolean} True if current environment matches
 */
function isEnvironment(env) {
  return process.env.NODE_ENV === env;
}

module.exports = {
  validateConfig,
  validateVariable,
  isEnvironment,
  REQUIRED_VARIABLES
};
