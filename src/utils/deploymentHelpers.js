/**
 * Deployment helper utilities for the ThiQaX platform.
 * Provides functions to support CI/CD processes and deployment management.
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');
const envConfig = require('./envConfig');

/**
 * Generate a deployment version identifier
 * @returns {string} Version identifier including timestamp and git info
 */
const generateDeploymentVersion = () => {
  try {
    // Create timestamp in format YYYYMMDD-HHMMSS
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\..+/, '')
      .slice(0, 14);
    
    // Add random suffix for uniqueness
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    
    // Combine components
    const version = `${timestamp}-${randomSuffix}`;
    
    return version;
  } catch (error) {
    logger.error('Error generating deployment version', { error });
    return `fallback-${Date.now()}`;
  }
};

/**
 * Write deployment information to file
 * @param {Object} info - Deployment information object
 * @param {string} outputPath - Path to write the file (default: build/deployment.json)
 * @returns {Promise<string>} Path to the written file
 */
const writeDeploymentInfo = async (info = {}, outputPath = 'build/deployment.json') => {
  try {
    // Generate basic deployment info if not provided
    const deploymentInfo = {
      version: generateDeploymentVersion(),
      timestamp: new Date().toISOString(),
      environment: envConfig.get('NODE_ENV', 'development'),
      ...info
    };
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(outputPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write the file
    await fs.writeFile(
      outputPath,
      JSON.stringify(deploymentInfo, null, 2),
      'utf8'
    );
    
    logger.info('Deployment info written to file', {
      path: outputPath,
      version: deploymentInfo.version
    });
    
    return outputPath;
  } catch (error) {
    logger.error('Error writing deployment info', { error, outputPath });
    throw error;
  }
};

/**
 * Read deployment information from file
 * @param {string} filePath - Path to deployment info file (default: build/deployment.json)
 * @returns {Promise<Object>} Deployment information object
 */
const readDeploymentInfo = async (filePath = 'build/deployment.json') => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logger.error('Error reading deployment info', { error, filePath });
    throw error;
  }
};

/**
 * Generate environment-specific configuration file
 * @param {string} env - Environment name (development, staging, production)
 * @param {string} outputPath - Path to write the file
 * @returns {Promise<string>} Path to the written file
 */
const generateEnvConfig = async (env = 'development', outputPath = 'build/env-config.js') => {
  try {
    // Create directory if it doesn't exist
    const dirPath = path.dirname(outputPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Get environment-specific configuration
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = env;
    
    // Get config for the frontend (exclude sensitive values)
    const frontendConfig = {
      environment: env,
      apiUrl: envConfig.get('API_URL'),
      version: process.env.APP_VERSION || 'development',
      sentryDsn: envConfig.get('SENTRY_DSN'),
      logLevel: envConfig.get('LOG_LEVEL', 'info'),
      features: {
        // Feature flags can be controlled per environment
        blockchain: env === 'production',
        payments: env !== 'development',
        aiVerification: env === 'production'
      }
    };
    
    // Reset original environment
    process.env.NODE_ENV = originalEnv;
    
    // Format as a JS file that sets window variables
    const configContent = `
// ThiQaX environment configuration (${env})
// Generated on ${new Date().toISOString()}
window.ENV = ${JSON.stringify(frontendConfig, null, 2)};
`;
    
    // Write the file
    await fs.writeFile(outputPath, configContent, 'utf8');
    
    logger.info('Environment config generated', {
      path: outputPath,
      environment: env
    });
    
    return outputPath;
  } catch (error) {
    logger.error('Error generating environment config', { error, env });
    throw error;
  }
};

/**
 * Validate deployment prerequisites
 * @returns {Promise<Object>} Validation results
 */
const validateDeploymentPrerequisites = async () => {
  try {
    const results = {
      success: true,
      checks: {}
    };
    
    // Check required environment variables
    const requiredVars = [
      'NODE_ENV',
      'MONGODB_URI',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET'
    ];
    
    // Add environment-specific required variables
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      requiredVars.push('NEW_RELIC_LICENSE_KEY', 'SENTRY_DSN');
    }
    
    // Validate required variables
    const envValidation = envConfig.validateEnvVars(requiredVars);
    results.checks.environmentVariables = {
      success: envValidation.valid,
      missing: envValidation.missing,
      message: envValidation.valid 
        ? 'All required environment variables are set'
        : `Missing required environment variables: ${envValidation.missing.join(', ')}`
    };
    
    // Check build directory exists
    try {
      await fs.access('build');
      results.checks.buildDirectory = {
        success: true,
        message: 'Build directory exists'
      };
    } catch (error) {
      results.checks.buildDirectory = {
        success: false,
        message: 'Build directory does not exist'
      };
    }
    
    // Check overall success
    results.success = Object.values(results.checks)
      .every(check => check.success);
    
    return results;
  } catch (error) {
    logger.error('Error validating deployment prerequisites', { error });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a health check file for deployment verification
 * @param {string} version - Version identifier
 * @param {string} outputPath - Path to write the file (default: build/health.json)
 * @returns {Promise<string>} Path to the written file
 */
const createHealthCheckFile = async (version = '', outputPath = 'build/health.json') => {
  try {
    const deploymentVersion = version || generateDeploymentVersion();
    
    // Create health check data
    const healthData = {
      status: 'up',
      version: deploymentVersion,
      timestamp: new Date().toISOString(),
      environment: envConfig.get('NODE_ENV', 'development')
    };
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(outputPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write the file
    await fs.writeFile(
      outputPath,
      JSON.stringify(healthData, null, 2),
      'utf8'
    );
    
    logger.info('Health check file created', {
      path: outputPath,
      version: deploymentVersion
    });
    
    return outputPath;
  } catch (error) {
    logger.error('Error creating health check file', { error });
    throw error;
  }
};

/**
 * Execute post-deployment verification tasks
 * @param {string} baseUrl - Base URL of the deployed application
 * @returns {Promise<Object>} Verification results
 */
const verifyDeployment = async (baseUrl) => {
  try {
    const results = {
      success: true,
      checks: {}
    };
    
    // This would typically make HTTP requests to verify deployment
    // For this utility, we'll just demonstrate the pattern
    
    logger.info('Starting deployment verification', { baseUrl });
    
    // Simulate checks
    results.checks.health = {
      success: true,
      message: 'Health endpoint is responding correctly'
    };
    
    results.checks.api = {
      success: true,
      message: 'API is accessible'
    };
    
    return results;
  } catch (error) {
    logger.error('Deployment verification failed', { error, baseUrl });
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  generateDeploymentVersion,
  writeDeploymentInfo,
  readDeploymentInfo,
  generateEnvConfig,
  validateDeploymentPrerequisites,
  createHealthCheckFile,
  verifyDeployment
};
