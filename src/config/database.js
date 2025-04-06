const mongoose = require('mongoose');
const config = require('./index');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database');

/**
 * Connect to MongoDB
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  try {
    const connectionString = `${config.database.uri}?${config.database.options}`;
    
    logger.info(`Connecting to MongoDB at ${config.database.uri}`);
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
