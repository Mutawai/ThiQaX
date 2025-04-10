/**
 * Application Configuration
 * Centralizes all environment variables and configuration settings
 */
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { logger } = require('./logger');

// Load environment-specific configuration
const loadEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  let envFile = '.env';
  
  // Try environment-specific file first
  if (nodeEnv !== 'production') {
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
    console.warn(`Error loading ${envFile}: ${result.error.message}`);
    console.warn('Continuing with existing environment variables');
  } else {
    console.info(`Loaded environment from ${envFile}`);
  }
  
  // Always set NODE_ENV to ensure consistency
  process.env.NODE_ENV = nodeEnv;
  
  return { nodeEnv, envFile };
};

// Initialize environment
loadEnvironment();

const config = {
  // Server Configuration
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    isStaging: process.env.NODE_ENV === 'staging',
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
    hostname: process.env.HOST || 'localhost',
    trustProxy: process.env.TRUST_PROXY === 'true',
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/thiqax',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    },
    maxConnectRetries: parseInt(process.env.DB_MAX_CONNECT_RETRIES, 10) || 5,
    connectRetryInterval: parseInt(process.env.DB_CONNECT_RETRY_INTERVAL, 10) || 5000,
    
    // Connect to database with retries
    async connect() {
      let retries = 0;
      const maxRetries = this.maxConnectRetries;
      
      const tryConnect = async () => {
        try {
          logger.info(`Connecting to MongoDB: ${this.uri.split('@').pop()}`);
          await mongoose.connect(this.uri, this.options);
          logger.info('MongoDB connected successfully');
          return true;
        } catch (error) {
          if (retries < maxRetries) {
            retries++;
            const retryDelay = this.connectRetryInterval;
            logger.warn(`MongoDB connection failed (attempt ${retries}/${maxRetries}). Retrying in ${retryDelay}ms...`);
            logger.error(error.message);
            
            return new Promise(resolve => {
              setTimeout(async () => {
                resolve(await tryConnect());
              }, retryDelay);
            });
          }
          
          logger.error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
          throw error;
        }
      };
      
      return tryConnect();
    }
  },

  // Authentication & Security
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '30d',
    jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '90d',
    jwtIssuer: process.env.JWT_ISSUER || 'thiqax-api',
    jwtAudience: process.env.JWT_AUDIENCE || 'thiqax-client',
    
    // Generate authentication tokens for a user
    generateTokens(user) {
      const jwt = require('jsonwebtoken');
      
      if (!user || !user.id) {
        throw new Error('Invalid user object for token generation');
      }
      
      const basePayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };
      
      const accessToken = jwt.sign(basePayload, this.jwtSecret, {
        expiresIn: this.jwtExpire,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience
      });
      
      const refreshToken = jwt.sign({ ...basePayload, tokenType: 'refresh' }, this.jwtRefreshSecret, {
        expiresIn: this.jwtRefreshExpire,
        issuer: this.jwtIssuer,
        audience: this.jwtAudience
      });
      
      return {
        accessToken,
        refreshToken,
        expiresIn: this.jwtExpire
      };
    },
    
    // Verify a JWT token
    verifyToken(token, options = {}) {
      const jwt = require('jsonwebtoken');
      
      try {
        return jwt.verify(token, this.jwtSecret, {
          issuer: this.jwtIssuer,
          audience: this.jwtAudience,
          ...options
        });
      } catch (error) {
        logger.debug(`Token verification failed: ${error.message}`);
        return null;
      }
    }
  },

  // Security Settings
  security: {
    corsOrigin: process.env.CORS_ORIGIN || process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Default 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    
    // Initialize Redis for rate limiting if available
    async initializeRedis() {
      if (process.env.REDIS_URL) {
        try {
          const Redis = require('ioredis');
          const client = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            connectTimeout: 10000,
            retryStrategy: (times) => Math.min(times * 100, 3000)
          });
          
          // Test connection
          await client.ping();
          logger.info('Redis connected successfully for rate limiting');
          return client;
        } catch (error) {
          logger.error('Redis connection failed, using memory store for rate limiting', error);
          return null;
        }
      }
      
      return null;
    },
    
    // Initialize express security middleware
    initializeMiddleware(app) {
      const helmet = require('helmet');
      const cors = require('cors');
      const rateLimit = require('express-rate-limit');
      const RedisStore = require('rate-limit-redis');
      
      if (this.helmetEnabled) {
        app.use(helmet({
          contentSecurityPolicy: process.env.NODE_ENV === 'production'
        }));
        logger.info('Helmet security middleware enabled');
      }
      
      // Configure CORS
      let corsOptions = {};
      
      if (typeof this.corsOrigin === 'string' && this.corsOrigin.includes(',')) {
        const origins = this.corsOrigin.split(',').map(origin => origin.trim());
        
        corsOptions = {
          origin: (origin, callback) => {
            if (!origin || origins.includes('*') || origins.includes(origin)) {
              callback(null, true);
            } else {
              logger.warn(`CORS blocked request from origin: ${origin}`);
              callback(new Error('Not allowed by CORS'));
            }
          },
          credentials: true
        };
      } else {
        corsOptions = {
          origin: this.corsOrigin === '*' ? true : this.corsOrigin,
          credentials: true
        };
      }
      
      app.use(cors(corsOptions));
      logger.info(`CORS configured with origin: ${this.corsOrigin}`);
      
      // Configure rate limiting
      if (this.enableRateLimit) {
        this.initializeRedis().then(redisClient => {
          const limiter = rateLimit({
            windowMs: this.rateLimitWindowMs,
            max: this.rateLimitMax,
            standardHeaders: true,
            message: {
              error: 'Too many requests',
              message: 'You have exceeded the request rate limit. Please try again later.'
            },
            skip: (req) => req.path === '/health' || req.path === '/api/health',
            ...redisClient ? { 
              store: new RedisStore({
                sendCommand: (...args) => redisClient.call(...args)
              })
            } : {}
          });
          
          app.use(limiter);
          logger.info(`Rate limiting enabled: ${this.rateLimitMax} requests per ${this.rateLimitWindowMs / 60000} minutes`);
        });
      }
      
      return app;
    }
  },

  // File Handling & Document Verification
  files: {
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
    documentBaseUrl: process.env.DOCUMENT_BASE_URL || process.env.BASE_URL ? `${process.env.BASE_URL}/uploads` : 'http://localhost:5000/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB default
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()) : 
      ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'],
    documentRetentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS, 10) || 90,
    storageType: process.env.STORAGE_TYPE || 'local', // 'local', 'gcp', 's3'
    gcpBucket: process.env.GCP_BUCKET || 'thiqax-documents',
    
    // Initialize storage provider based on configuration
    initializeStorage() {
      // Create uploads directory if using local storage
      if (this.storageType === 'local' && !fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
        logger.info(`Created local upload directory: ${this.uploadPath}`);
      }
      
      // Initialize GCP storage if configured
      if (this.storageType === 'gcp') {
        try {
          const { Storage } = require('@google-cloud/storage');
          const storage = new Storage();
          const bucket = storage.bucket(this.gcpBucket);
          
          logger.info(`GCP Storage initialized with bucket: ${this.gcpBucket}`);
          return { storage, bucket };
        } catch (error) {
          logger.error('Failed to initialize GCP storage', error);
          throw error;
        }
      }
      
      // Add S3 initialization here if needed
      
      return null;
    }
  },

  // Notifications
  notifications: {
    email: {
      enabled: process.env.EMAIL_ENABLED !== 'false',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
      smtpEmail: process.env.SMTP_EMAIL,
      smtpPassword: process.env.SMTP_PASSWORD,
      fromEmail: process.env.FROM_EMAIL || 'noreply@thiqax.com',
      fromName: process.env.FROM_NAME || 'ThiQaX',
      templateDir: process.env.EMAIL_TEMPLATE_DIR || path.join(process.cwd(), 'src', 'templates', 'email'),
      
      // Initialize email transport
      initializeTransport() {
        if (!this.enabled) {
          logger.info('Email notifications are disabled');
          return null;
        }
        
        try {
          const nodemailer = require('nodemailer');
          
          if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
            if (!this.smtpHost || !this.smtpEmail || !this.smtpPassword) {
              logger.error('SMTP configuration incomplete, email notifications will not work');
              return null;
            }
            
            const transport = nodemailer.createTransport({
              host: this.smtpHost,
              port: this.smtpPort,
              secure: this.smtpPort === 465,
              auth: {
                user: this.smtpEmail,
                pass: this.smtpPassword
              }
            });
            
            logger.info(`Email transport initialized with ${this.smtpHost}:${this.smtpPort}`);
            return transport;
          } else {
            // Use ethereal for development/testing
            logger.info('Using Ethereal for email testing in development');
            return nodemailer.createTransport({
              host: 'smtp.ethereal.email',
              port: 587,
              secure: false,
              auth: {
                user: this.smtpEmail || 'ethereal.user@ethereal.email',
                pass: this.smtpPassword || 'ethereal_pass'
              }
            });
          }
        } catch (error) {
          logger.error('Failed to initialize email transport', error);
          return null;
        }
      }
    },
    push: {
      enabled: process.env.PUSH_ENABLED === 'true',
      fcmServerKey: process.env.FCM_SERVER_KEY,
      
      // Initialize push notification provider
      initializeProvider() {
        if (!this.enabled) {
          logger.info('Push notifications are disabled');
          return null;
        }
        
        if (!this.fcmServerKey) {
          logger.error('FCM server key not provided, push notifications will not work');
          return null;
        }
        
        try {
          const admin = require('firebase-admin');
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(this.fcmServerKey))
          });
          
          logger.info('Firebase Admin SDK initialized for push notifications');
          return admin.messaging();
        } catch (error) {
          logger.error('Failed to initialize Firebase Admin SDK', error);
          return null;
        }
      }
    },
    expiry: {
      checkDays: parseInt(process.env.EXPIRY_CHECK_DAYS, 10) || 30,
      reminderInterval: parseInt(process.env.EXPIRY_REMINDER_INTERVAL, 10) || 7,
      cronSchedule: process.env.EXPIRY_CHECK_CRON || '0 0 * * *', // Default: daily at midnight
    },
  },

  // Logging & Monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || 'logs/',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 7,
    
    // Get logger instance
    getLogger() {
      return logger;
    },
    
    // Initialize Prometheus metrics if configured
    initializeMetrics() {
      if (process.env.ENABLE_METRICS !== 'true') {
        return null;
      }
      
      try {
        const promClient = require('prom-client');
        const registry = new promClient.Registry();
        
        // Start collecting default metrics
        promClient.collectDefaultMetrics({
          register: registry,
          labels: {
            app: 'thiqax-api',
            environment: process.env.NODE_ENV
          }
        });
        
        // HTTP request counter
        const httpRequestCounter = new promClient.Counter({
          name: 'http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'route', 'status_code'],
          registers: [registry]
        });
        
        // HTTP request duration histogram
        const httpRequestDuration = new promClient.Histogram({
          name: 'http_request_duration_seconds',
          help: 'HTTP request duration in seconds',
          labelNames: ['method', 'route', 'status_code'],
          buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
          registers: [registry]
        });
        
        logger.info('Prometheus metrics initialized');
        
        return {
          registry,
          httpRequestCounter,
          httpRequestDuration,
          
          // Middleware for metrics collection
          middleware: (req, res, next) => {
            const start = Date.now();
            const path = req.route ? req.route.path : req.path;
            
            res.on('finish', () => {
              const duration = (Date.now() - start) / 1000;
              
              httpRequestCounter.inc({
                method: req.method,
                route: path,
                status_code: res.statusCode
              });
              
              httpRequestDuration.observe({
                method: req.method,
                route: path,
                status_code: res.statusCode
              }, duration);
            });
            
            next();
          },
          
          // Endpoint for Prometheus scraping
          metricsMiddleware: (req, res) => {
            res.set('Content-Type', registry.contentType);
            registry.metrics()
              .then(metrics => res.end(metrics))
              .catch(err => {
                logger.error('Error generating metrics', err);
                res.status(500).send('Error generating metrics');
              });
          }
        };
      } catch (error) {
        logger.error('Failed to initialize Prometheus metrics', error);
        return null;
      }
    }
  },

  // API Configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000',
    
    // Initialize Swagger documentation
    initializeSwagger(app) {
      if (!this.enableSwagger) {
        return app;
      }
      
      try {
        const swaggerJsDoc = require('swagger-jsdoc');
        const swaggerUi = require('swagger-ui-express');
        
        const options = {
          definition: {
            openapi: '3.0.0',
            info: {
              title: 'ThiQaX API',
              version: this.version,
              description: 'API Documentation for ThiQaX Platform'
            },
            servers: [
              {
                url: `${config.server.baseUrl}/api/${this.version}`,
                description: `${config.server.nodeEnv} server`
              }
            ],
            components: {
              securitySchemes: {
                bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT'
                }
              }
            },
            security: [
              {
                bearerAuth: []
              }
            ]
          },
          apis: ['./src/routes/*.js', './src/models/*.js']
        };
        
        const specs = swaggerJsDoc(options);
        
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
          explorer: true
        }));
        
        logger.info('Swagger documentation initialized at /api-docs');
        return app;
      } catch (error) {
        logger.error('Failed to initialize Swagger', error);
        return app;
      }
    }
  },

  // Blockchain Integration (Phase II)
  blockchain: {
    enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
    providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL,
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
    
    // Initialize blockchain connection
    initialize() {
      if (!this.enabled) {
        logger.info('Blockchain integration is disabled');
        return null;
      }
      
      if (!this.providerUrl || !this.contractAddress) {
        logger.error('Blockchain configuration incomplete');
        return null;
      }
      
      try {
        const ethers = require('ethers');
        const provider = new ethers.providers.JsonRpcProvider(this.providerUrl);
        
        // Initialize wallet if private key is provided
        let wallet = null;
        if (this.privateKey) {
          wallet = new ethers.Wallet(this.privateKey, provider);
        }
        
        logger.info('Blockchain provider initialized');
        
        return {
          provider,
          wallet,
          ethers
        };
      } catch (error) {
        logger.error('Failed to initialize blockchain provider', error);
        return null;
      }
    }
}
