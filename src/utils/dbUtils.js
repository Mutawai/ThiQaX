/**
 * Database utility functions for the ThiQaX platform.
 * Provides connection management, transaction support, and common database operations.
 */
const mongoose = require('mongoose');
const logger = require('./logger');
const { measureDatabaseOperation } = require('./metricsCollector');

/**
 * Connect to MongoDB
 * @param {string} uri - MongoDB connection string (uses env var if not provided)
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectDatabase = async (uri = process.env.MONGODB_URI) => {
  try {
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      // Auto-index in development, not in production
      autoIndex: process.env.NODE_ENV !== 'production'
    };
    
    await mongoose.connect(uri, options);
    
    logger.info('Database connected successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
};

/**
 * Execute a function within a MongoDB transaction
 * @param {Function} callback - Async function that receives a session and executes within the transaction
 * @returns {Promise<any>} Result of the transaction
 */
const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  
  try {
    let result;
    
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    
    return result;
  } catch (error) {
    logger.error('Transaction failed', { error });
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Create a document with performance metrics
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} data - Document data
 * @param {Object} options - Additional options (session, etc.)
 * @returns {Promise<mongoose.Document>} Created document
 */
const createDocument = async (Model, data, options = {}) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('create', modelName, async () => {
    return await Model.create([data], options);
  });
};

/**
 * Find documents with performance metrics
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} projection - Fields to include/exclude
 * @param {Object} options - Query options (sort, limit, etc.)
 * @returns {Promise<Array<mongoose.Document>>} Found documents
 */
const findDocuments = async (Model, filter = {}, projection = {}, options = {}) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('find', modelName, async () => {
    return await Model.find(filter, projection, options);
  });
};

/**
 * Update a document with performance metrics
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} update - Update data
 * @param {Object} options - Update options
 * @returns {Promise<mongoose.Document>} Updated document
 */
const updateDocument = async (Model, filter, update, options = { new: true }) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('update', modelName, async () => {
    return await Model.findOneAndUpdate(filter, update, options);
  });
};

/**
 * Delete a document with performance metrics
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Delete options
 * @returns {Promise<mongoose.Document>} Deleted document
 */
const deleteDocument = async (Model, filter, options = {}) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('delete', modelName, async () => {
    return await Model.findOneAndDelete(filter, options);
  });
};

/**
 * Aggregate documents with performance metrics
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Array} pipeline - Aggregation pipeline
 * @param {Object} options - Aggregation options
 * @returns {Promise<Array>} Aggregation results
 */
const aggregateDocuments = async (Model, pipeline, options = {}) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('aggregate', modelName, async () => {
    return await Model.aggregate(pipeline, options);
  });
};

/**
 * Check if a document exists
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @returns {Promise<boolean>} True if document exists
 */
const documentExists = async (Model, filter) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('exists', modelName, async () => {
    const count = await Model.countDocuments(filter);
    return count > 0;
  });
};

/**
 * Count documents matching a filter
 * @param {mongoose.Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @returns {Promise<number>} Document count
 */
const countDocuments = async (Model, filter = {}) => {
  const modelName = Model.collection.collectionName;
  
  return measureDatabaseOperation('count', modelName, async () => {
    return await Model.countDocuments(filter);
  });
};

/**
 * Check MongoDB connection status
 * @returns {boolean} True if connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get MongoDB connection string without credentials (safe for logging)
 * @param {string} uri - MongoDB connection string (uses current connection if not provided)
 * @returns {string} Sanitized connection string
 */
const getSafeConnectionString = (uri = mongoose.connection.client.s.url) => {
  if (!uri) return 'Not connected';
  
  try {
    // Replace username:password with '***'
    return uri.replace(/\/\/(.*?@)/g, '//***/');
  } catch (error) {
    return 'Connection string unavailable';
  }
};

module.exports = {
  connectDatabase,
  withTransaction,
  createDocument,
  findDocuments,
  updateDocument,
  deleteDocument,
  aggregateDocuments,
  documentExists,
  countDocuments,
  isConnected,
  getSafeConnectionString
};
