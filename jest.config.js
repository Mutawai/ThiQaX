/**
 * Jest Configuration File for ThiQaX API Tests
 * 
 * This configuration optimizes Jest for both unit and integration tests,
 * with special accommodations for MongoDB testing using mongodb-memory-server.
 */

module.exports = {
  // Use the Node.js environment for testing
  testEnvironment: 'node',
  
  // Look for test files that end with .test.js or .spec.js
  testMatch: [
    "**/?(*.)+(spec|test).js"
  ],
  
  // Set a higher timeout for integration tests that may take longer
  testTimeout: 30000,
  
  // Display individual test results with the test suite hierarchy
  verbose: true,
  
  // Enable jest-extended for additional matchers
  setupFilesAfterEnv: ['jest-extended/all'],
  
  // Configure coverage collection
  collectCoverage: false, // Set to true with --coverage flag
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/server.js', // Main entry point
    '!**/node_modules/**'
  ],
  
  // Set coverage thresholds to ensure adequate test coverage
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  
  // Ignore node_modules when transforming code
  transformIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Allow tests to be organized in folders
  moduleDirectories: ['node_modules', 'src'],
  
  // Clear all mocks between tests for cleaner testing
  clearMocks: true,
  
  // Configure Jest to work with MongoDB memory server
  // This allows tests to run faster and in isolation
  globals: {
    // Increase timeout for MongoDB memory server operations
    mongoDBMemoryServerOptions: {
      instance: {
        dbName: 'thiqax-test'
      },
      binary: {
        version: '5.0.5',
        skipMD5: true
      },
      autoStart: false
    }
  },
  
  // Custom environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Notify terminal if tests are running more than 10 seconds
  slowTestThreshold: 10
};
