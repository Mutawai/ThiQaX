require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const config = require('./config'); // Centralized config

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Validate critical configuration
if (!config.database.uri) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: MongoDB connection string is not defined.');
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB');
    
    // Start the server
    const server = app.listen(config.server.port, () => {
      console.log('\x1b[36m%s\x1b[0m', `✓ ThiQaX API server running on port ${config.server.port}`);
      console.log('\x1b[36m%s\x1b[0m', `✓ API Documentation available at http://localhost:${config.server.port}/api-docs`);
      console.log('\x1b[33m%s\x1b[0m', `✓ Environment: ${config.server.nodeEnv}`);
      
      // Add extra info for development mode
      if (config.server.isDevelopment) {
        console.log('\x1b[36m%s\x1b[0m', '✓ Rate limiting: ' + 
          (config.security.enableRateLimit ? 
            `Enabled (${config.security.rateLimitMax} requests per ${config.security.rateLimitWindowMs/60000} min)` : 
            'Disabled'));
      }
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(() => {
        console.log('HTTP server closed.');
        
        // Close database connection
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
        
        // Force close after 10s
        setTimeout(() => {
          console.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      });
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch(err => {
    console.error('\x1b[31m%s\x1b[0m', 'MongoDB connection error:');
    console.error(err);
    process.exit(1);
  });
