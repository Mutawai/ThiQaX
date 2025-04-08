require('dotenv').config();
const app = require('./app');
const config = require('./config'); // Centralized config
const { connectDatabase } = require('./utils/dbUtils');
const logger = require('./utils/logger');
const { generateDeploymentVersion, writeDeploymentInfo } = require('./utils/deploymentHelpers');
const { applyMigrations } = require('./utils/migrationUtils');

// Generate deployment version
const deploymentVersion = generateDeploymentVersion();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  logger.error('Unhandled Promise Rejection', { error: err });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  logger.error('Uncaught Exception', { error: err });
  process.exit(1);
});

// Validate critical configuration
if (!config.database.uri) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: MongoDB connection string is not defined.');
  process.exit(1);
}

// Main startup function
async function startServer() {
  try {
    // Connect to MongoDB using the utility
    console.log('\x1b[36m%s\x1b[0m', 'Connecting to MongoDB...');
    await connectDatabase(config.database.uri);
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB');
    
    // Apply database migrations if not in test environment
    if (config.server.nodeEnv !== 'test') {
      console.log('\x1b[36m%s\x1b[0m', 'Checking database migrations...');
      try {
        const migrations = await applyMigrations();
        if (migrations.length > 0) {
          console.log('\x1b[32m%s\x1b[0m', `✓ Applied ${migrations.length} database migrations`);
        } else {
          console.log('\x1b[32m%s\x1b[0m', '✓ No pending migrations');
        }
      } catch (migrationError) {
        console.error('\x1b[33m%s\x1b[0m', '⚠ Migration error, continuing startup');
        logger.error('Migration error, continuing startup', { error: migrationError });
      }
    }
    
    // Write deployment info for monitoring
    await writeDeploymentInfo({
      version: deploymentVersion,
      environment: config.server.nodeEnv
    });
    
    // Start the server
    const server = app.listen(config.server.port, () => {
      console.log('\x1b[36m%s\x1b[0m', `✓ ThiQaX API server running on port ${config.server.port}`);
      console.log('\x1b[36m%s\x1b[0m', `✓ API Documentation available at http://localhost:${config.server.port}/api-docs`);
      console.log('\x1b[33m%s\x1b[0m', `✓ Environment: ${config.server.nodeEnv}`);
      console.log('\x1b[33m%s\x1b[0m', `✓ Deployment: ${deploymentVersion}`);
      
      // Add extra info for development mode
      if (config.server.isDevelopment) {
        console.log('\x1b[36m%s\x1b[0m', '✓ Rate limiting: ' + 
          (config.security.enableRateLimit ? 
            `Enabled (${config.security.rateLimitMax} requests per ${config.security.rateLimitWindowMs/60000} min)` : 
            'Disabled'));
        console.log('\x1b[36m%s\x1b[0m', '✓ Health check: http://localhost:' + config.server.port + '/health');
        console.log('\x1b[36m%s\x1b[0m', '✓ Metrics: http://localhost:' + config.server.port + '/metrics');
      }
      
      // Log to structured logger
      logger.info('Server started successfully', {
        port: config.server.port,
        environment: config.server.nodeEnv,
        version: deploymentVersion
      });
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      logger.info(`${signal} received. Shutting down gracefully...`);
      
      server.close(() => {
        console.log('HTTP server closed.');
        
        // Connection will be closed by dbUtils handlers
        logger.info('Server shutdown complete');
        process.exit(0);
        
        // Force close after 10s
        setTimeout(() => {
          console.error('Could not close connections in time, forcefully shutting down');
          logger.error('Forced shutdown due to timeout');
          process.exit(1);
        }, 10000);
      });
    };
    
    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', 'Server startup failed:');
    console.error(err);
    logger.error('Server startup failed', { error: err });
    process.exit(1);
  }
}

// Start the server
startServer();
