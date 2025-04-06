/**
 * Application Configuration
 * Centralizes all environment variables and configuration settings
 */
require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/thiqax',
    options: process.env.MONGODB_OPTIONS || 'retryWrites=true&w=majority',
  },

  // Authentication & Security
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '90d',
  },

  // Security Settings
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) * 60 * 1000 || 15 * 60 * 1000, // Convert minutes to ms
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    helmetEnabled: process.env.HELMET_ENABLED === 'true',
  },

  // File Handling & Document Verification
  files: {
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    documentBaseUrl: process.env.DOCUMENT_BASE_URL || 'http://localhost:5000/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB default
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'],
    documentRetentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS, 10) || 90,
  },

  // Notifications
  notifications: {
    email: {
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
      smtpEmail: process.env.SMTP_EMAIL,
      smtpPassword: process.env.SMTP_PASSWORD,
      fromEmail: process.env.FROM_EMAIL || 'noreply@thiqax.com',
      fromName: process.env.FROM_NAME || 'ThiQaX',
    },
    push: {
      enabled: process.env.PUSH_ENABLED === 'true',
      fcmServerKey: process.env.FCM_SERVER_KEY,
    },
    expiry: {
      checkDays: parseInt(process.env.EXPIRY_CHECK_DAYS, 10) || 30,
      reminderInterval: parseInt(process.env.EXPIRY_REMINDER_INTERVAL, 10) || 7,
    },
  },

  // Logging & Monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 7,
  },

  // API Configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Blockchain Integration (Phase II)
  blockchain: {
    providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL,
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
  },

  // Helper function to validate critical config values
  validate() {
    const requiredConfigs = [
      { key: 'auth.jwtSecret', value: this.auth.jwtSecret, message: 'JWT_SECRET must be provided' },
    ];

    const missingConfigs = requiredConfigs.filter(config => !config.value);
    
    if (missingConfigs.length > 0) {
      missingConfigs.forEach(config => {
        console.error(`Configuration Error: ${config.message}`);
      });
      return false;
    }
    return true;
  }
};

module.exports = config;
