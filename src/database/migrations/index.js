/**
 * Migration runner utility
 * Manages database migrations to ensure schema consistency across environments
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dbConfig = require('../config');

// Migration model schema
const MigrationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  executionTime: {
    type: Number,
    required: true,
    default: 0
  },
  success: {
    type: Boolean,
    required: true
  }
});

// Get or create the Migration model
const getMigrationModel = () => {
  try {
    return mongoose.model('Migration');
  } catch (error) {
    return mongoose.model('Migration', MigrationSchema);
  }
};

/**
 * Get a list of all migration files
 * @returns {Promise<Array>} Array of migration file names
 */
const getMigrationFiles = async () => {
  const directory = path.join(__dirname, dbConfig.migrations.directory || '');
  const extension = dbConfig.migrations.extension || '.js';
  
  // Read directory contents
  const files = fs.readdirSync(directory)
    .filter(file => file.endsWith(extension) && !file.startsWith('index'))
    .sort();
  
  // Sort by direction if specified
  if (dbConfig.migrations.sortDirection === 'DESC') {
    files.reverse();
  }
  
  return files;
};

/**
 * Get executed migrations from database
 * @returns {Promise<Array>} Array of completed migration records
 */
const getExecutedMigrations = async () => {
  const Migration = getMigrationModel();
  return await Migration.find({}).sort({ name: 1 }).lean();
};

/**
 * Run pending migrations
 * @param {Object} options - Migration options
 * @returns {Promise<Array>} Results of completed migrations
 */
const up = async (options = {}) => {
  const Migration = getMigrationModel();
  const migrationFiles = await getMigrationFiles();
  const executedMigrations = await getExecutedMigrations();
  const executedNames = executedMigrations.map(m => m.name);
  
  const pendingMigrations = migrationFiles.filter(file => !executedNames.includes(file));
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations to run');
    return [];
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  const results = [];
  
  // Run migrations in sequence
  for (const migrationFile of pendingMigrations) {
    console.log(`Running migration: ${migrationFile}`);
    const startTime = Date.now();
    
    try {
      const migration = require(path.join(__dirname, migrationFile));
      
      if (typeof migration.up !== 'function') {
        throw new Error(`Migration ${migrationFile} does not export an 'up' function`);
      }
      
      // Execute the migration
      await migration.up();
      
      const executionTime = Date.now() - startTime;
      
      // Record successful migration
      const migrationRecord = await Migration.create({
        name: migrationFile,
        timestamp: new Date(),
        executionTime,
        success: true
      });
      
      results.push({
        name: migrationFile,
        executionTime,
        success: true
      });
      
      console.log(`Completed migration ${migrationFile} in ${executionTime}ms`);
    } catch (error) {
      console.error(`Migration ${migrationFile} failed: ${error.message}`);
      
      // Record failed migration
      await Migration.create({
        name: migrationFile,
        timestamp: new Date(),
        executionTime: Date.now() - startTime,
        success: false
      });
      
      results.push({
        name: migrationFile,
        error: error.message,
        success: false
      });
      
      // Stop on first failure unless options specify otherwise
      if (!options.continueOnFailure) {
        throw error;
      }
    }
  }
  
  return results;
};

/**
 * Rollback migrations
 * @param {Object} options - Migration options
 * @returns {Promise<Array>} Results of rolled back migrations
 */
const down = async (options = {}) => {
  const Migration = getMigrationModel();
  const executedMigrations = await getExecutedMigrations();
  
  if (executedMigrations.length === 0) {
    console.log('No migrations to roll back');
    return [];
  }
  
  // Determine how many migrations to roll back
  const limit = options.steps || 1;
  const migrationsToRollback = executedMigrations
    .slice(-limit)
    .reverse();
  
  console.log(`Rolling back ${migrationsToRollback.length} migrations`);
  
  const results = [];
  
  // Roll back migrations in reverse order
  for (const migrationRecord of migrationsToRollback) {
    console.log(`Rolling back migration: ${migrationRecord.name}`);
    const startTime = Date.now();
    
    try {
      const migration = require(path.join(__dirname, migrationRecord.name));
      
      if (typeof migration.down !== 'function') {
        throw new Error(`Migration ${migrationRecord.name} does not export a 'down' function`);
      }
      
      // Execute the rollback
      await migration.down();
      
      const executionTime = Date.now() - startTime;
      
      // Remove migration record
      await Migration.deleteOne({ name: migrationRecord.name });
      
      results.push({
        name: migrationRecord.name,
        executionTime,
        success: true
      });
      
      console.log(`Rolled back migration ${migrationRecord.name} in ${executionTime}ms`);
    } catch (error) {
      console.error(`Rollback of ${migrationRecord.name} failed: ${error.message}`);
      
      results.push({
        name: migrationRecord.name,
        error: error.message,
        success: false
      });
      
      // Stop on first failure unless options specify otherwise
      if (!options.continueOnFailure) {
        throw error;
      }
    }
  }
  
  return results;
};

/**
 * Get migration status
 * @returns {Promise<Object>} Migration status information
 */
const status = async () => {
  const migrationFiles = await getMigrationFiles();
  const executedMigrations = await getExecutedMigrations();
  const executedNames = executedMigrations.map(m => m.name);
  
  const pending = migrationFiles.filter(file => !executedNames.includes(file));
  const executed = migrationFiles.filter(file => executedNames.includes(file));
  
  return {
    total: migrationFiles.length,
    executed: executed.length,
    pending: pending.length,
    executedMigrations,
    pendingMigrations: pending
  };
};

module.exports = {
  up,
  down,
  status,
  getMigrationFiles,
  getExecutedMigrations
};
