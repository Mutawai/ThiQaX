/**
 * Test helper utilities for the ThiQaX platform.
 * Provides common functions and utilities for testing.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const supertest = require('supertest');
const app = require('../app'); // Adjust path as needed
const logger = require('./logger');
const mockGenerator = require('./mockGenerator');

// Hold reference to the in-memory MongoDB instance
let mongoServer;

/**
 * Setup in-memory MongoDB for testing
 * @returns {Promise<string>} MongoDB URI
 */
const setupTestDB = async () => {
  try {
    // Create new instance of in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Set up mongoose connection
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('Connected to in-memory test database', { uri });
    
    return uri;
  } catch (error) {
    logger.error('Failed to setup test database', { error });
    throw error;
  }
};

/**
 * Teardown in-memory MongoDB
 */
const teardownTestDB = async () => {
  try {
    if (mongoose.connection.readyState) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    logger.info('Test database connection closed');
  } catch (error) {
    logger.error('Error tearing down test database', { error });
    throw error;
  }
};

/**
 * Clear all collections in the database
 */
const clearDatabase = async () => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error('No MongoDB connection');
    }
    
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    logger.info('All collections cleared');
  } catch (error) {
    logger.error('Failed to clear database', { error });
    throw error;
  }
};

/**
 * Initialize a test request client with supertest
 * @returns {Object} Supertest request object
 */
const initTestServer = () => {
  return supertest(app);
};

/**
 * Create a user and get auth token for testing
 * @param {Object} userOverrides - Properties to override in the generated user
 * @returns {Promise<Object>} Object containing user and token
 */
const getAuthenticatedUser = async (userOverrides = {}) => {
  try {
    // Create a user with provided overrides
    const userModel = mongoose.model('User');
    const userData = await mockGenerator.generateUser(userOverrides);
    const user = await userModel.create(userData);
    
    // Generate tokens
    const tokenUtils = require('./tokenUtils');
    const token = await tokenUtils.generateAccessToken(user);
    
    return {
      user: user.toObject(),
      token
    };
  } catch (error) {
    logger.error('Failed to create authenticated user', { error });
    throw error;
  }
};

/**
 * Create authenticated supertest request
 * @param {string} token - JWT token
 * @returns {Object} Supertest request with auth headers
 */
const authRequest = (token) => {
  const request = initTestServer();
  return request.set('Authorization', `Bearer ${token}`);
};

/**
 * Helper to mock controller functions for testing
 * @param {string} modulePath - Path to the controller module
 * @param {Object} mocks - Object containing functions to mock and their implementations
 * @returns {Object} Original module with mocked functions
 */
const mockController = (modulePath, mocks = {}) => {
  try {
    // Load the controller module
    const controller = require(modulePath);
    const originalFunctions = {};
    
    // Store original functions and replace with mocks
    Object.keys(mocks).forEach(funcName => {
      if (typeof controller[funcName] !== 'function') {
        throw new Error(`Function ${funcName} does not exist in controller`);
      }
      
      originalFunctions[funcName] = controller[funcName];
      controller[funcName] = mocks[funcName];
    });
    
    // Return function to restore original functions
    return {
      controller,
      restore: () => {
        Object.keys(originalFunctions).forEach(funcName => {
          controller[funcName] = originalFunctions[funcName];
        });
      }
    };
  } catch (error) {
    logger.error('Failed to mock controller', { error, modulePath });
    throw error;
  }
};

/**
 * Helper to mock service functions for testing
 * @param {string} modulePath - Path to the service module
 * @param {Object} mocks - Object containing functions to mock and their implementations
 * @returns {Object} Original module with mocked functions
 */
const mockService = (modulePath, mocks = {}) => {
  return mockController(modulePath, mocks); // Reuse controller mocking logic
};

/**
 * Helper to mock middleware functions for testing
 * @param {string} modulePath - Path to the middleware module
 * @param {Object} mocks - Object containing middleware functions to mock
 * @returns {Object} Original module with mocked functions
 */
const mockMiddleware = (modulePath, mocks = {}) => {
  return mockController(modulePath, mocks); // Reuse controller mocking logic
};

/**
 * Wait for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} Promise that resolves after the specified time
 */
const wait = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock Express middleware for testing
 * @param {Function} implementation - Middleware implementation
 * @returns {Function} Express middleware function
 */
const createMockMiddleware = (implementation = (req, res, next) => next()) => {
  return (req, res, next) => {
    try {
      return implementation(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Test an Express middleware function
 * @param {Function} middleware - Middleware function to test
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result with req, res, and error if any
 */
const testMiddleware = async (middleware, options = {}) => {
  // Default options
  const {
    reqOverrides = {},
    resOverrides = {},
    nextError = false,
    nextCalled = true
  } = options;
  
  // Create mock req, res, next
  const { req, res } = mockGenerator.generateExpressMocks(reqOverrides, resOverrides);
  let error = null;
  let nextWasCalled = false;
  
  const next = (err) => {
    nextWasCalled = true;
    error = err || null;
  };
  
  // Execute middleware
  try {
    await middleware(req, res, next);
  } catch (err) {
    error = err;
  }
  
  // Validate next was called as expected
  if (nextCalled !== nextWasCalled) {
    throw new Error(`Expected next to ${nextCalled ? 'be' : 'not be'} called, but it ${nextWasCalled ? 'was' : 'was not'}`);
  }
  
  // Validate error expectations
  if (nextError && !error) {
    throw new Error('Expected next to be called with an error, but no error was passed');
  }
  
  return { req, res, error };
};

/**
 * Check if an object matches expected schema
 * @param {Object} object - Object to validate
 * @param {Object} schema - Expected schema
 * @returns {boolean} True if object matches schema
 */
const matchesSchema = (object, schema) => {
  try {
    if (!object || typeof object !== 'object') {
      return false;
    }
    
    // Check each key in the schema
    for (const key in schema) {
      if (!schema.hasOwnProperty(key)) continue;
      
      const schemaType = schema[key];
      
      // Handle optional properties
      if (schemaType.optional && object[key] === undefined) {
        continue;
      }
      
      // Check if property exists
      if (!object.hasOwnProperty(key)) {
        return false;
      }
      
      // Check property type
      const type = typeof schemaType === 'string' ? schemaType : schemaType.type;
      
      if (type === 'array') {
        if (!Array.isArray(object[key])) {
          return false;
        }
        
        // If array has item type defined, check each item
        if (schemaType.items) {
          for (const item of object[key]) {
            if (typeof schemaType.items === 'object') {
              if (!matchesSchema(item, schemaType.items)) {
                return false;
              }
            } else if (typeof item !== schemaType.items) {
              return false;
            }
          }
        }
      } else if (type === 'object' && schemaType.properties) {
        if (typeof object[key] !== 'object' || Array.isArray(object[key])) {
          return false;
        }
        
        // Recursively check nested object
        if (!matchesSchema(object[key], schemaType.properties)) {
          return false;
        }
      } else if (typeof object[key] !== type) {
        // Skip type check for null values if allowed
        if (!(object[key] === null && schemaType.nullable)) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error validating schema', { error });
    return false;
  }
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  initTestServer,
  getAuthenticatedUser,
  authRequest,
  mockController,
  mockService,
  mockMiddleware,
  wait,
  createMockMiddleware,
  testMiddleware,
  matchesSchema
};
