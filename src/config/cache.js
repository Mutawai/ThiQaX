// src/config/cache.js
const Redis = require('ioredis');
const { logger } = require('./logger');
const { getEnvironment } = require('./environment');

// Redis client instance
let redisClient = null;

// Initialize Redis connection with retries
const initializeRedis = async () => {
  const { isProduction, isStaging, isDevelopment } = getEnvironment();
  
  // Skip Redis in development unless specifically configured
  if (isDevelopment && !process.env.REDIS_URL) {
    logger.info('Redis not configured for development environment');
    return null;
  }
  
  // Require Redis in production and staging
  if ((isProduction || isStaging) && !process.env.REDIS_URL) {
    logger.error('Redis connection string required in production/staging');
    throw new Error('Redis connection string missing');
  }
  
  // Connection options
  const options = {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.info(`Redis connection retry in ${delay}ms (attempt ${times})`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000
  };
  
  try {
    // Create new Redis instance
    const client = new Redis(process.env.REDIS_URL, options);
    
    // Handle connection events
    client.on('connect', () => {
      logger.info('Redis connection established');
    });
    
    client.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    client.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
    
    client.on('close', () => {
      logger.warn('Redis connection closed');
    });
    
    // Test connection
    await client.ping();
    
    // Set global client
    redisClient = client;
    
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    
    // In development, continue without Redis
    if (isDevelopment) {
      logger.warn('Continuing without Redis in development mode');
      return null;
    }
    
    // In production/staging, rethrow the error
    throw error;
  }
};

// Get Redis client (initialize if not already done)
const getRedisClient = async () => {
  if (!redisClient) {
    return await initializeRedis();
  }
  return redisClient;
};

// Close Redis connection
const closeRedisConnection = async () => {
  if (redisClient) {
    logger.info('Closing Redis connection');
    await redisClient.quit();
    redisClient = null;
  }
};

// Store value in cache
const cacheSet = async (key, value, expireSeconds = 3600) => {
  const client = await getRedisClient();
  
  if (!client) {
    return false;
  }
  
  try {
    // If value is an object, stringify it
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    // Set with expiration
    await client.set(key, stringValue, 'EX', expireSeconds);
    
    return true;
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    return false;
  }
};

// Get value from cache
const cacheGet = async (key, parseJson = true) => {
  const client = await getRedisClient();
  
  if (!client) {
    return null;
  }
  
  try {
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }
    
    // Parse JSON if requested and possible
    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Not JSON, return as is
        return value;
      }
    }
    
    return value;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
};

// Delete value from cache
const cacheDelete = async (key) => {
  const client = await getRedisClient();
  
  if (!client) {
    return false;
  }
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
};

// Clear cache with pattern
const cacheClear = async (pattern = '*') => {
  const client = await getRedisClient();
  
  if (!client) {
    return false;
  }
  
  try {
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(...keys);
      logger.info(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Cache clear error for pattern ${pattern}:`, error);
    return false;
  }
};

// Check if Redis is available
const isRedisAvailable = async () => {
  const client = await getRedisClient();
  return !!client;
};

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedisConnection,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheClear,
  isRedisAvailable
};
