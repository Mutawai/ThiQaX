/**
 * Environment configuration utilities for the ThiQaX platform.
 * Manages loading, validation, and access to environment-specific configuration.
 */
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Load environment variables from .env file
dotenv.config();

// Define required environment variables by category
const requiredEnvVars = {
  base: [
    'NODE_ENV',
    'PORT',
    'API_URL',
    'CLIENT_URL'
  ],
  database: [
    'MONGODB_URI'
  ],
  auth: [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ACCESS_EXPIRY',
    'JWT_REFRESH_EXPIRY'
  ],
  email: [
    'EMAIL_FROM',
    'EMAIL_SERVICE'
  ],
  storage: [
    'STORAGE_TYPE', // 'local', 's3', etc.
    'UPLOAD_DIR'
  ]
};

// Define environment-specific required variables
const envSpecificVars = {
  development: [],
  test: [],
  staging: [
    'NEW_RELIC_LICENSE_KEY'
  ],
  production: [
    'NEW_RELIC_LICENSE_KEY',
    'REDIS_URI',
    'ENCRYPTION_KEY'
  ]
};

/**
 * Validate required environment variables
 * @param {Array<string>} requiredVars - List of required environment variable names
 * @returns {Object} Validation result
 */
const validateEnvVars = (requiredVars) => {
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName] === undefined) {
      missing.push(varName);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Initialize environment configuration
 * @returns {Object} Environment configuration result
 */
const initializeEnv = () => {
  const env = process.env.NODE_ENV || 'development';
  
  // Check for environment-specific .env file
  const envFile = path.resolve(process.cwd(), `.env.${env}`);
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    logger.info(`Loaded environment-specific variables from ${envFile}`);
  }
  
  // Determine required variables based on environment
  const allRequiredVars = [
    ...requiredEnvVars.base,
    ...requiredEnvVars.database,
    ...requiredEnvVars.auth,
    ...requiredEnvVars.email,
    ...requiredEnvVars.storage,
    ...(envSpecificVars[env] || [])
  ];
  
  // Validate required variables
  const validationResult = validateEnvVars(allRequiredVars);
  
  if (!validationResult.valid) {
    logger.warn('Missing required environment variables', {
      missing: validationResult.missing
    });
  }
  
  return {
    environment: env,
    valid: validationResult.valid,
    missingVars: validationResult.missing
  };
};

/**
 * Get configuration value with type conversion
 * @param {string} key - Environment variable name
 * @param {any} defaultValue - Default value if not found
 * @param {string} type - Type to convert to (string, number, boolean, json)
 * @returns {any} Configuration value
 */
const get = (key, defaultValue = null, type = 'string') => {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  switch (type.toLowerCase()) {
    case 'number':
      return Number(value);
    
    case 'boolean':
      return value === 'true' || value === '1';
    
    case 'json':
      try {
        return JSON.parse(value);
      } catch (error) {
        logger.error(`Failed to parse JSON config value for ${key}`, { error });
        return defaultValue;
      }
    
    case 'string':
    default:
      return value;
  }
};

/**
 * Get configuration object for a specific category
 * @param {string} category - Configuration category
 * @returns {Object} Configuration object
 */
const getConfigObject = (category) => {
  switch (category) {
    case 'server':
      return {
        env: get('NODE_ENV', 'development'),
        port: get('PORT', 5000, 'number'),
        apiUrl: get('API_URL', 'http://localhost:5000'),
        clientUrl: get('CLIENT_URL', 'http://localhost:3000'),
        corsOrigins: get('CORS_ORIGINS', '*')
      };
    
    case 'database':
      return {
        uri: get('MONGODB_URI'),
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          autoIndex: get('NODE_ENV', 'development') !== 'production'
        }
      };
    
    case 'auth':
      return {
        accessToken: {
          secret: get('JWT_ACCESS_SECRET'),
          expiresIn: get('JWT_ACCESS_EXPIRY', '1h')
        },
        refreshToken: {
          secret: get('JWT_REFRESH_SECRET'),
          expiresIn: get('JWT_REFRESH_EXPIRY', '7d')
        },
        saltRounds: get('BCRYPT_SALT_ROUNDS', 10, 'number')
      };
    
    case 'email':
      return {
        from: get('EMAIL_FROM'),
        service: get('EMAIL_SERVICE'),
        host: get('EMAIL_HOST'),
        port: get('EMAIL_PORT', 587, 'number'),
        auth: {
          user: get('EMAIL_USER'),
          pass: get('EMAIL_PASSWORD')
        },
        secure: get('EMAIL_SECURE', false, 'boolean')
      };
    
    case 'storage':
      return {
        type: get('STORAGE_TYPE', 'local'),
        local: {
          uploadDir: get('UPLOAD_DIR', 'uploads')
        },
        s3: {
          bucket: get('S3_BUCKET'),
          region: get('S3_REGION'),
          accessKeyId: get('S3_ACCESS_KEY_ID'),
          secretAccessKey: get('S3_SECRET_ACCESS_KEY')
        }
      };
    
    case 'logging':
      return {
        level: get('LOG_LEVEL', 'info'),
        json: get('LOG_JSON', true, 'boolean'),
        colorize: get('LOG_COLORIZE', true, 'boolean'),
        timestamp: get('LOG_TIMESTAMP', true, 'boolean')
      };
    
    case 'monitoring':
      return {
        newRelic: {
          enabled: !!get('NEW_RELIC_LICENSE_KEY'),
          appName: get('NEW_RELIC_APP_NAME', 'ThiQaX API')
        },
        sentry: {
          enabled: !!get('SENTRY_DSN'),
          dsn: get('SENTRY_DSN'),
          environment: get('NODE_ENV', 'development')
        }
      };
    
    default:
      return {};
  }
};

/**
 * Get all configuration as a single object
 * @returns {Object} Complete configuration object
 */
const getAllConfig = () => {
  return {
    server: getConfigObject('server'),
    database: getConfigObject('database'),
    auth: getConfigObject('auth'),
    email: getConfigObject('email'),
    storage: getConfigObject('storage'),
    logging: getConfigObject('logging'),
    monitoring: getConfigObject('monitoring')
  };
};

/**
 * Check if current environment matches specific environment
 * @param {string} environment - Environment to check
 * @returns {boolean} True if matches
 */
const isEnv = (environment) => {
  return process.env.NODE_ENV === environment;
};

/**
 * Check if current environment is development
 * @returns {boolean} True if development
 */
const isDevelopment = () => isEnv('development');

/**
 * Check if current environment is test
 * @returns {boolean} True if test
 */
const isTest = () => isEnv('test');

/**
 * Check if current environment is staging
 * @returns {boolean} True if staging
 */
const isStaging = () => isEnv('staging');

/**
 * Check if current environment is production
 * @returns {boolean} True if production
 */
const isProduction = () => isEnv('production');

module.exports = {
  initializeEnv,
  validateEnvVars,
  get,
  getConfigObject,
  getAllConfig,
  isEnv,
  isDevelopment,
  isTest,
  isStaging,
  isProduction,
  requiredEnvVars
};
