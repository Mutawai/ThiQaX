/**
 * Database initialization and management module
 * Centralizes database connection, error handling, and exposes models
 */

const mongoose = require('mongoose');
const dbConfig = require('./config');
const { connectDB, disconnectDB, getConnectionStatus } = require('./connection');

// Import models
const User = require('../models/User');
const Document = require('./models/Document');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Payment = require('./models/Payment');
const Notification = require('./models/Notification');

// Import utilities
const migrationRunner = require('./migrations');
const healthCheck = require('./operations/healthCheck');

/**
 * Initialize the database connection and set up event handlers
 * @param {Object} options - Optional configuration overrides
 * @returns {Promise<mongoose.Connection>} The database connection
 */
const initializeDatabase = async (options = {}) => {
  try {
    // Connect to MongoDB
    const connection = await connectDB(options);
    
    // Log successful connection
    console.log(`MongoDB Connected: ${connection.connection.host}`.cyan.underline.bold);
    
    return connection;
  } catch (error) {
    console.error(`Error connecting to database: ${error.message}`.red);
    // Exit with failure
    process.exit(1);
  }
};

/**
 * Run database migrations
 * @param {Object} options - Migration options
 * @returns {Promise<Array>} Results of completed migrations
 */
const runMigrations = async (options = {}) => {
  try {
    console.log('Running database migrations...');
    const migrationResults = await migrationRunner.up(options);
    console.log(`Completed ${migrationResults.length} migrations successfully`);
    return migrationResults;
  } catch (error) {
    console.error(`Migration failed: ${error.message}`.red);
    throw error;
  }
};

// Export database components
module.exports = {
  // Connection management
  initializeDatabase,
  connectDB,
  disconnectDB,
  getConnectionStatus,
  
  // Migration utilities
  runMigrations,
  migrationRunner,
  
  // Health and operations
  healthCheck,
  
  // Models
  models: {
    User,
    Document,
    Job,
    Application,
    Payment,
    Notification
  }
};
