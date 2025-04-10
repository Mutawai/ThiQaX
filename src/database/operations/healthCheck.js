/**
 * Database health check utility
 * Provides functions to monitor and report on database health
 */

const mongoose = require('mongoose');

/**
 * Perform a comprehensive database health check
 * @returns {Promise<Object>} Health check results
 */
const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    const results = {
      status: 'healthy',
      connection: {
        connected: mongoose.connection.readyState === 1,
        readyState: getReadyStateString(mongoose.connection.readyState)
      },
      responseTime: null,
      collections: {},
      indexes: {}
    };
    
    // Skip other checks if not connected
    if (!results.connection.connected) {
      results.status = 'error';
      results.error = 'Database connection unavailable';
      return results;
    }
    
    // Perform a simple ping to check responsiveness
    const pingResult = await mongoose.connection.db.admin().ping();
    results.ping = pingResult.ok === 1;
    
    if (!results.ping) {
      results.status = 'degraded';
      results.error = 'Database ping failed';
      return results;
    }
    
    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    results.collections.count = collections.length;
    
    // Check each core collection
    const requiredCollections = ['users', 'documents', 'jobs', 'applications', 'payments', 'notifications'];
    const availableCollections = collections.map(c => c.name);
    
    const missingCollections = requiredCollections.filter(name => !availableCollections.includes(name));
    results.collections.missing = missingCollections;
    
    if (missingCollections.length > 0) {
      results.status = 'degraded';
      results.error = `Missing collections: ${missingCollections.join(', ')}`;
    }
    
    // Check collection counts
    for (const collection of collections) {
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        results.collections[collection.name] = { count };
      } catch (err) {
        results.collections[collection.name] = { error: err.message };
      }
    }
    
    // Check indexes
    for (const requiredCollection of requiredCollections) {
      if (availableCollections.includes(requiredCollection)) {
        try {
          const indexes = await mongoose.connection.db.collection(requiredCollection).indexes();
          results.indexes[requiredCollection] = {
            count: indexes.length,
            indexes: indexes.map(idx => idx.name)
          };
        } catch (err) {
          results.indexes[requiredCollection] = { error: err.message };
        }
      }
    }
    
    // Calculate operation time
    results.responseTime = Date.now() - startTime;
    
    return results;
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};

/**
 * Perform a quick database health check
 * @returns {Promise<Object>} Health check results
 */
const quickHealthCheck = async () => {
  try {
    const startTime = Date.now();
    const results = {
      status: 'healthy',
      connection: {
        connected: mongoose.connection.readyState === 1,
        readyState: getReadyStateString(mongoose.connection.readyState)
      },
      responseTime: null
    };
    
    // Skip other checks if not connected
    if (!results.connection.connected) {
      results.status = 'error';
      results.error = 'Database connection unavailable';
      return results;
    }
    
    // Perform a simple ping to check responsiveness
    const pingResult = await mongoose.connection.db.admin().ping();
    results.ping = pingResult.ok === 1;
    
    if (!results.ping) {
      results.status = 'degraded';
      results.error = 'Database ping failed';
    }
    
    // Calculate operation time
    results.responseTime = Date.now() - startTime;
    
    return results;
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * Get a string representation of the mongoose connection state
 * @param {Number} state Mongoose connection state code
 * @returns {String} Human-readable connection state
 */
const getReadyStateString = (state) => {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    case 99: return 'uninitialized';
    default: return 'unknown';
  }
};

/**
 * Check if a specific collection is available and accessible
 * @param {String} collectionName Name of the collection to check
 * @returns {Promise<Object>} Collection check results
 */
const checkCollection = async (collectionName) => {
  try {
    const exists = await mongoose.connection.db.listCollections({ name: collectionName }).hasNext();
    
    if (!exists) {
      return {
        status: 'error',
        collection: collectionName,
        error: 'Collection does not exist'
      };
    }
    
    // Try to count documents to check access
    const count = await mongoose.connection.db.collection(collectionName).countDocuments();
    
    return {
      status: 'healthy',
      collection: collectionName,
      count,
      exists: true,
      accessible: true
    };
  } catch (error) {
    return {
      status: 'error',
      collection: collectionName,
      error: error.message
    };
  }
};

/**
 * Repair database connection if needed
 * @returns {Promise<Object>} Repair result
 */
const repairConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Try to reconnect
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      return {
        status: 'success',
        message: 'Database connection reestablished',
        readyState: getReadyStateString(mongoose.connection.readyState)
      };
    }
    
    return {
      status: 'success',
      message: 'Database connection already active',
      readyState: getReadyStateString(mongoose.connection.readyState)
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      readyState: getReadyStateString(mongoose.connection.readyState)
    };
  }
};

module.exports = {
  checkDatabaseHealth,
  quickHealthCheck,
  checkCollection,
  repairConnection
};
