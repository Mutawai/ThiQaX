/**
 * Database configuration settings
 * Centralizes all database-related configuration to make environment switching easier
 */

module.exports = {
  // Main database connection
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/thiqax',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
      serverSelectionTimeoutMS: 5000, // Timeout after 5s of server selection
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip IPv6
    }
  },
  
  // MongoDB connection for tests (separate from main DB)
  testDb: {
    uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/thiqax_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Migration configuration
  migrations: {
    directory: 'migrations',
    tableName: 'migrations',
    extension: '.js',
    sortDirection: 'ASC'
  },
  
  // Indexes configuration
  indexes: {
    // Define default index options
    defaultOptions: {
      background: true // Build indexes in the background
    }
  },
  
  // Connection pool settings
  poolSize: process.env.DB_POOL_SIZE || 10,
  
  // Backup configuration
  backup: {
    path: process.env.BACKUP_PATH || './backups',
    cronExpression: process.env.BACKUP_CRON || '0 0 * * *', // Default: daily at midnight
    retention: process.env.BACKUP_RETENTION || 7 // Keep backups for 7 days
  }
};
