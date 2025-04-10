/**
 * Database connection management
 * Handles MongoDB connection establishment, monitoring, and disconnection
 */

const mongoose = require('mongoose');
const dbConfig = require('./config');

// Track connection state
let connectionState = {
  isConnected: false,
  connectionTime: null,
  lastError: null,
  reconnectAttempts: 0
};

/**
 * Connect to MongoDB
 * @param {Object} options - Optional connection configuration overrides
 * @returns {Promise<mongoose.Connection>} Mongoose connection object
 */
const connectDB = async (options = {}) => {
  try {
    // Use provided options or defaults from config
    const uri = options.uri || dbConfig.mongodb.uri;
    const connectionOptions = {
      ...dbConfig.mongodb.options,
      ...options.mongoOptions
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(uri, connectionOptions);
    
    // Update connection state
    connectionState = {
      isConnected: true,
      connectionTime: new Date(),
      lastError: null,
      reconnectAttempts: 0
    };

    // Set up connection event handlers
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err.message}`);
      connectionState.lastError = err;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      connectionState.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      connectionState.isConnected = true;
      connectionState.reconnectAttempts = 0;
    });

    return conn;
  } catch (error) {
    connectionState.lastError = error;
    connectionState.reconnectAttempts += 1;
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    connectionState.isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Get current connection status
 * @returns {Object} Current connection state
 */
const getConnectionStatus = () => {
  return {
    ...connectionState,
    connectionString: dbConfig.mongodb.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') // Mask credentials
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus
};
