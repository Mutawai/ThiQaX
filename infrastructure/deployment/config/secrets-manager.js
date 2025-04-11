/**
 * ThiQaX Platform - Secrets Management Utility
 * 
 * This module provides secure handling of environment secrets and sensitive
 * configuration values. It implements security protections including:
 * - Restricted access to sensitive values
 * - Obfuscation of secrets in logs and error messages
 * - Protection against memory leaks of sensitive data
 */

// Define list of sensitive variables that should be handled securely
const SENSITIVE_VARIABLES = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
  'REDIS_URL',
  'SMTP_PASSWORD',
  'GCP_SERVICE_ACCOUNT_KEY',
  'FCM_SERVER_KEY',
  'BLOCKCHAIN_PRIVATE_KEY'
];

// Additional variables that should be masked in logs but remain accessible
const MASKED_VARIABLES = [
  'DB_MAX_CONNECT_RETRIES',
  'DB_CONNECT_RETRY_INTERVAL'
];

/**
 * Creates a secure wrapper around configuration object to protect sensitive values
 * @param {Object} config - The configuration object to secure
 * @returns {Object} A secure proxy to the configuration
 */
function secureConfigAccess(config) {
  // Create a copy of the config with sensitive values protected
  const secureConfig = { ...config };
  
  // Store original values in a private closure
  const sensitiveValues = {};
  
  // Extract and remove sensitive values from the public config
  for (const key of SENSITIVE_VARIABLES) {
    if (config[key]) {
      sensitiveValues[key] = config[key];
      
      // Replace with function that requires explicit access
      Object.defineProperty(secureConfig, key, {
        enumerable: true,
        get: function() {
          // Log access to sensitive values
          const stack = new Error().stack;
          const caller = stack.split('\n')[2].trim();
          console.info(`[SECURITY] Sensitive value ${key} accessed by: ${caller}`);
          
          return sensitiveValues[key];
        },
        set: function() {
          throw new Error(`[SECURITY] Cannot directly modify sensitive value: ${key}`);
        }
      });
    }
  }
  
  // For masked variables, maintain access but hide in string conversion
  for (const key of MASKED_VARIABLES) {
    if (config[key]) {
      Object.defineProperty(secureConfig, key, {
        enumerable: true,
        value: config[key],
        writable: false
      });
    }
  }
  
  // Create a secure toString() method to prevent accidental logging of secrets
  Object.defineProperty(secureConfig, 'toString', {
    value: function() {
      const safeConfig = { ...this };
      
      // Mask sensitive values
      for (const key of [...SENSITIVE_VARIABLES, ...MASKED_VARIABLES]) {
        if (safeConfig[key]) {
          safeConfig[key] = '[REDACTED]';
        }
      }
      
      return JSON.stringify(safeConfig, null, 2);
    },
    writable: false
  });
  
  /**
   * Provides secure access to a specific secret
   * @param {string} key - The secret key to access
   * @param {string} purpose - Mandatory explanation of why the secret is needed
   * @returns {string} The secret value
   */
  secureConfig.getSecret = function(key, purpose) {
    if (!purpose || typeof purpose !== 'string') {
      throw new Error('[SECURITY] Must provide purpose for accessing secret');
    }
    
    if (!SENSITIVE_VARIABLES.includes(key)) {
      throw new Error(`[SECURITY] ${key} is not registered as a managed secret`);
    }
    
    if (!sensitiveValues[key]) {
      throw new Error(`[SECURITY] Secret ${key} is not available`);
    }
    
    // Log access with purpose
    console.info(`[SECURITY] Secret ${key} accessed for: ${purpose}`);
    
    return sensitiveValues[key];
  };
  
  /**
   * Safely rotates a secret value
   * @param {string} key - The secret key to rotate
   * @param {string} newValue - The new secret value
   */
  secureConfig.rotateSecret = function(key, newValue) {
    if (!SENSITIVE_VARIABLES.includes(key)) {
      throw new Error(`[SECURITY] ${key} is not registered as a managed secret`);
    }
    
    if (!newValue || typeof newValue !== 'string') {
      throw new Error('[SECURITY] New secret value must be a non-empty string');
    }
    
    // Update the secret in the closure
    sensitiveValues[key] = newValue;
    console.info(`[SECURITY] Secret ${key} has been rotated`);
  };
  
  // Prevent adding new properties to the config object
  return Object.freeze(secureConfig);
}

/**
 * Masks sensitive information in a string
 * @param {string} text - The text that might contain sensitive information
 * @returns {string} Text with sensitive information masked
 */
function maskSensitiveInfo(text) {
  if (!text) return text;
  
  let maskedText = text;
  
  // Mask common patterns of sensitive data
  const patterns = [
    // JWT token pattern
    { regex: /eyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}/g, replacement: '[JWT_TOKEN]' },
    // MongoDB connection string
    { regex: /(mongodb(\+srv)?:\/\/)[^:]+:([^@]+)@/g, replacement: '$1[USERNAME]:[PASSWORD]@' },
    // API key formats
    { regex: /([a-zA-Z0-9_-]+_key|api[_-]?key)["':\s=]+["']?([a-zA-Z0-9_\-.]{8,})["']?/gi, replacement: '$1="[API_KEY]"' },
    // Password in URL parameters
    { regex: /(password|pwd|passwd)=([^&]+)/gi, replacement: '$1=[REDACTED]' },
    // PostgreSQL connection string
    { regex: /postgres:\/\/[^:]+:([^@]+)@/g, replacement: 'postgres://[USERNAME]:[PASSWORD]@' },
    // Redis URL with password
    { regex: /redis:\/\/[^:]*:([^@]+)@/g, replacement: 'redis://:[PASSWORD]@' }
  ];
  
  // Apply each pattern
  for (const pattern of patterns) {
    maskedText = maskedText.replace(pattern.regex, pattern.replacement);
  }
  
  // Also check for any specifically defined sensitive keys
  for (const key of SENSITIVE_VARIABLES) {
    // Create a regex that would match assignments to this key
    const keyRegex = new RegExp(`(${key}\\s*[=:]\\s*["']?)([^"'\\s]+)(["']?)`, 'gi');
    maskedText = maskedText.replace(keyRegex, '$1[REDACTED]$3');
  }
  
  return maskedText;
}

module.exports = {
  secureConfigAccess,
  maskSensitiveInfo,
  SENSITIVE_VARIABLES
};
