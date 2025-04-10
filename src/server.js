// src/server.js
const config = require('./config');
const { app, initializeApp } = require('./app');
const { logger } = require('./config/logger');
const { generateDeploymentVersion, writeDeploymentInfo } = require('./utils/deploymentHelpers');
const { applyMigrations } = require('./utils/migrationUtils');
const { runMigrations } = require('./utils/migrations');

// Generate deployment version
const deploymentVersion = generateDeploymentVersion();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  logger.error('Unhandled Promise Rejection', { error: err.stack });
  
  // Don't crash in production, but exit in development for easier debugging
  if (config.env.isDevelopment) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  logger.error('Uncaught Exception', { error: err.stack });
  process.exit(1);
});

/**
 * Apply database migrations using both legacy and new migration systems
 * This function supports backward compatibility while transitioning to migrate-mongo
 */
async function performMigrations() {
  // Skip migrations in test mode unless explicitly enabled
  if (config.env.isTest && !process.env.FORCE_MIGRATIONS) {
    logger.debug('Skipping migrations in test environment');
    return { legacy: [], new: { applied: 0 } };
  }

  const results = { legacy: [], new: { applied: 0 } };
  
  try {
    // Apply legacy migrations if the function exists
    if (typeof applyMigrations === 'function') {
      console.log('\x1b[36m%s\x1b[0m', 'Checking legacy database migrations...');
      results.legacy = await applyMigrations();
      if (results.legacy.length > 0) {
        console.log('\x1b[32m%s\x1b[0m', `✓ Applied ${results.legacy.length} legacy migrations`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✓ No pending legacy migrations');
      }
    }
    
    // Apply new migrate-mongo migrations if available
    if (typeof runMigrations === 'function') {
      console.log('\x1b[36m%s\x1b[0m', 'Checking new database migrations...');
      results.new = await runMigrations();
      if (results.new.applied > 0) {
        console.log('\x1b[32m%s\x1b[0m', `✓ Applied ${results.new.applied} new migrations`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✓ No pending new migrations');
      }
    }
    
    return results;
  } catch (migrationError) {
    logger.error('Migration error', { error: migrationError });
    throw migrationError;
  }
}

// Main startup function
async function startServer() {
  try {
    // Initialize application and services
    console.log('\x1b[36m%s\x1b[0m', 'Initializing ThiQaX platform...');
    await initializeApp();
    console.log('\x1b[32m%s\x1b[0m', '✓ Application services initialized');
    
    // Apply database migrations if not in test environment or test env with migrations forced
    try {
      const migrationResults = await performMigrations();
      const totalMigrations = (migrationResults.legacy?.length || 0) + (migrationResults.new?.applied || 0);
      
      if (totalMigrations > 0) {
        logger.info('Database migrations applied', { 
          count: totalMigrations,
          legacy: migrationResults.legacy?.length || 0,
          new: migrationResults.new?.applied || 0
        });
      }
    } catch (migrationError) {
      // In production, continue startup even if migrations fail
      // In development, throw the error to help identify issues early
      if (config.env.isDevelopment) {
        throw migrationError;
      }
      console.error('\x1b[33m%s\x1b[0m', '⚠ Migration error, continuing startup');
      logger.error('Migration error, continuing startup', { error: migrationError });
    }
    
    // Write deployment info for monitoring
    await writeDeploymentInfo({
      version: deploymentVersion,
      environment: config.env.current,
      migrationStatus: 'completed'
    });
    
    // Start the server
    const PORT = config.server.port || 5000;
    const server = app.listen(PORT, () => {
      console.log('\x1b[36m%s\x1b[0m', `✓ ThiQaX API server running on port ${PORT}`);
      console.log('\x1b[36m%s\x1b[0m', `✓ API Documentation available at ${config.server.baseUrl}/api-docs`);
      console.log('\x1b[33m%s\x1b[0m', `✓ Environment: ${config.env.current}`);
      console.log('\x1b[33m%s\x1b[0m', `✓ Deployment: ${deploymentVersion}`);
      
      // Add extra info for development mode
      if (config.env.isDevelopment) {
        console.log('\x1b[36m%s\x1b[0m', '✓ Rate limiting: ' + 
          (config.security.enableRateLimit !== false ? 
            `Enabled (${config.rateLimiter.api._max} requests per ${config.rateLimiter.api._windowMs/60000} min)` : 
            'Disabled'));
        console.log('\x1b[36m%s\x1b[0m', '✓ Health check: ' + config.server.baseUrl + '/health');
        console.log('\x1b[36m%s\x1b[0m', '✓ Metrics: ' + config.server.baseUrl + '/metrics');
        
        // Add migration info in development
        console.log('\x1b[36m%s\x1b[0m', '✓ Migrations: Check with npm run migrate:status');
      }
      
      // Log to structured logger
      logger.info('Server started successfully', {
        port: PORT,
        environment: config.env.current,
        version: deploymentVersion,
        baseUrl: config.server.baseUrl
      });
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      // Close the HTTP server
      server.close(() => {
        console.log('HTTP server closed.');
      });
      
      // Close database connection if possible
      if (config.database && typeof config.database.disconnect === 'function') {
        try {
          await config.database.disconnect();
          console.log('Database connections closed.');
        } catch (err) {
          logger.error('Error closing database connection', { error: err });
        }
      }
      
      // Close Redis connection if available
      if (config.cache && typeof config.cache.closeRedisConnection === 'function') {
        try {
          await config.cache.closeRedisConnection();
          console.log('Redis connections closed.');
        } catch (err) {
          logger.error('Error closing Redis connection', { error: err });
        }
      }
      
      // Close migrate-mongo connections if available
      try {
        const migrateMongo = require('migrate-mongo');
        const { client } = await migrateMongo.database.connect();
        if (client) {
          await client.close();
          console.log('Migration database connection closed.');
        }
      } catch (err) {
        // Silently ignore - migrate-mongo might not be available yet
      }
      
      logger.info('Server shutdown complete');
      
      // Give a moment for logger to flush
      setTimeout(() => {
        process.exit(0);
      }, 500);
      
      // Force close after 10s
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Server startup failed:');
    console.error(err);
    logger.error('Server startup failed', { error: err.stack });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer, performMigrations };
