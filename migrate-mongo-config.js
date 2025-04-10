// migrate-mongo-config.js
const config = require('./src/config');

// This configuration automatically uses your existing database connection
// from the main application config
const getConnectionString = () => {
  // Support different environments
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/thiqax-test';
  }
  
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/thiqax';
};

module.exports = {
  mongodb: {
    url: getConnectionString(),
    
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // The migrations collection keeps track of which migrations have been applied
  migrationsCollection: "migrations",
  
  // Migrations directory relative to your project root
  migrationsDir: "src/migrations",
  
  // Whether to change the modified time of the migration file when migrations are applied
  changelogCollectionName: "changelog",
  
  // Include your application models to use in migrations
  moduleSystem: 'commonjs'
};
