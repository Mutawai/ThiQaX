require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Exit if MongoDB URI is not provided
if (!MONGODB_URI) {
  console.error('\x1b[31m%s\x1b[0m', 'FATAL ERROR: MongoDB connection string is not defined.');
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MongoDB');
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log('\x1b[36m%s\x1b[0m', `✓ ThiQaX API server running on port ${PORT}`);
      console.log('\x1b[36m%s\x1b[0m', `✓ API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log('\x1b[33m%s\x1b[0m', `✓ Environment: ${process.env.NODE_ENV || 'development'}`);
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

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('\x1b[31m%s\x1b[0m', 'UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      
      // Close server & exit process
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('\x1b[31m%s\x1b[0m', 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });
  })
  .catch(err => {
    console.error('\x1b[31m%s\x1b[0m', 'MongoDB connection error:');
    console.error(err);
    process.exit(1);
  });
