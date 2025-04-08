/**
 * Database migration utilities for the ThiQaX platform.
 * Provides functions to manage database schema migrations and data transformations.
 */
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { connectDatabase } = require('./dbUtils');

// Define Migration schema for tracking applied migrations
const MigrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    required: true
  },
  description: String,
  executionTime: Number // in milliseconds
});

// Create model if it doesn't exist
let Migration;
try {
  Migration = mongoose.model('Migration');
} catch (e) {
  Migration = mongoose.model('Migration', MigrationSchema);
}

/**
 * Load migration files from directory
 * @param {string} migrationsDir - Path to migrations directory
 * @returns {Promise<Array<Object>>} Array of migration file objects sorted by version
 */
const loadMigrationFiles = async (migrationsDir = 'migrations') => {
  try {
    const absolutePath = path.resolve(process.cwd(), migrationsDir);
    const files = await fs.readdir(absolutePath);
    
    // Filter for JS files and parse version number from filename
    const migrationFiles = files
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const filePath = path.join(absolutePath, file);
        // Extract version number from filename (e.g., 001_create_users.js)
        const versionMatch = file.match(/^(\d+)_/);
        const version = versionMatch ? parseInt(versionMatch[1], 10) : 0;
        
        return {
          name: file.replace('.js', ''),
          path: filePath,
          version
        };
      })
      .sort((a, b) => a.version - b.version); // Sort by version number
    
    return migrationFiles;
  } catch (error) {
    logger.error('Error loading migration files', { error, migrationsDir });
    throw error;
  }
};

/**
 * Get list of applied migrations
 * @returns {Promise<Array<Object>>} Array of applied migrations
 */
const getAppliedMigrations = async () => {
  try {
    return await Migration.find().sort({ version: 1 });
  } catch (error) {
    logger.error('Error getting applied migrations', { error });
    throw error;
  }
};

/**
 * Apply pending migrations
 * @param {string} migrationsDir - Path to migrations directory
 * @returns {Promise<Array<Object>>} Applied migrations results
 */
const applyMigrations = async (migrationsDir = 'migrations') => {
  try {
    // Ensure database connection
    if (!mongoose.connection.readyState) {
      await connectDatabase();
    }
    
    // Load migration files and get applied migrations
    const migrationFiles = await loadMigrationFiles(migrationsDir);
    const appliedMigrations = await getAppliedMigrations();
    const appliedNames = appliedMigrations.map(m => m.name);
    
    // Filter for pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedNames.includes(file.name)
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to apply');
      return [];
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`);
    
    // Apply each pending migration
    const results = [];
    for (const migration of pendingMigrations) {
      logger.info(`Applying migration: ${migration.name} (v${migration.version})`);
      
      // Import migration module
      const migrationModule = require(migration.path);
      
      if (typeof migrationModule.up !== 'function') {
        throw new Error(`Migration ${migration.name} does not export an 'up' function`);
      }
      
      // Start timer
      const startTime = Date.now();
      
      try {
        // Execute migration in a session
        const session = await mongoose.startSession();
        let migrationResult;
        
        await session.withTransaction(async () => {
          // Execute the migration's 'up' function
          migrationResult = await migrationModule.up(mongoose);
          
          // Record the migration
          await Migration.create([{
            name: migration.name,
            version: migration.version,
            description: migrationModule.description || '',
            appliedAt: new Date(),
            executionTime: 0 // Will update after completion
          }], { session });
        });
        
        session.endSession();
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        // Update the execution time
        await Migration.updateOne(
          { name: migration.name },
          { executionTime }
        );
        
        logger.info(`Migration ${migration.name} applied successfully (${executionTime}ms)`);
        
        results.push({
          name: migration.name,
          version: migration.version,
          success: true,
          executionTime
        });
      } catch (error) {
        logger.error(`Migration ${migration.name} failed`, { error });
        
        results.push({
          name: migration.name,
          version: migration.version,
          success: false,
          error: error.message
        });
        
        // Stop executing further migrations after failure
        break;
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Migration process failed', { error });
    throw error;
  }
};

/**
 * Rollback the last applied migration
 * @returns {Promise<Object>} Rollback result
 */
const rollbackLastMigration = async () => {
  try {
    // Ensure database connection
    if (!mongoose.connection.readyState) {
      await connectDatabase();
    }
    
    // Get the last applied migration
    const lastMigration = await Migration.findOne().sort({ appliedAt: -1 });
    
    if (!lastMigration) {
      logger.info('No migrations to rollback');
      return { success: false, reason: 'No migrations to rollback' };
    }
    
    // Load the migration file
    const migrationsDir = 'migrations';
    const migrationPath = path.resolve(
      process.cwd(),
      migrationsDir,
      `${lastMigration.name}.js`
    );
    
    // Import migration module
    const migrationModule = require(migrationPath);
    
    if (typeof migrationModule.down !== 'function') {
      throw new Error(`Migration ${lastMigration.name} does not export a 'down' function`);
    }
    
    // Start timer
    const startTime = Date.now();
    
    // Execute rollback in a session
    const session = await mongoose.startSession();
    let rollbackResult;
    
    try {
      await session.withTransaction(async () => {
        // Execute the migration's 'down' function
        rollbackResult = await migrationModule.down(mongoose);
        
        // Remove the migration record
        await Migration.deleteOne({ _id: lastMigration._id }, { session });
      });
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      logger.info(`Migration ${lastMigration.name} rolled back successfully (${executionTime}ms)`);
      
      return {
        name: lastMigration.name,
        version: lastMigration.version,
        success: true,
        executionTime
      };
    } catch (error) {
      logger.error(`Rollback of migration ${lastMigration.name} failed`, { error });
      
      return {
        name: lastMigration.name,
        version: lastMigration.version,
        success: false,
        error: error.message
      };
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error('Rollback process failed', { error });
    throw error;
  }
};

/**
 * Create a new migration file
 * @param {string} name - Migration name (without version prefix)
 * @param {string} migrationsDir - Path to migrations directory
 * @returns {Promise<string>} Path to the created migration file
 */
const createMigration = async (name, migrationsDir = 'migrations') => {
  try {
    const absolutePath = path.resolve(process.cwd(), migrationsDir);
    
    // Ensure migrations directory exists
    try {
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Get highest version from existing migrations
    const migrationFiles = await loadMigrationFiles(migrationsDir);
    const highestVersion = migrationFiles.length > 0
      ? Math.max(...migrationFiles.map(m => m.version))
      : 0;
    
    // Create new version number (padded with zeros)
    const newVersion = (highestVersion + 1).toString().padStart(3, '0');
    const fileName = `${newVersion}_${name}.js`;
    const filePath = path.join(absolutePath, fileName);
    
    // Migration file template
    const template = `/**
 * Migration: ${name}
 * Created at: ${new Date().toISOString()}
 * Version: ${newVersion}
 */

/**
 * Description of this migration
 */
exports.description = '${name}';

/**
 * Apply the migration
 * @param {Object} mongoose - Mongoose instance
 * @returns {Promise<void>}
 */
exports.up = async (mongoose) => {
  // Implementation for applying the migration
  // Example:
  // await mongoose.model('User').updateMany({ active: { $exists: false } }, { $set: { active: true } });
};

/**
 * Revert the migration
 * @param {Object} mongoose - Mongoose instance
 * @returns {Promise<void>}
 */
exports.down = async (mongoose) => {
  // Implementation for reverting the migration
  // Example:
  // await mongoose.model('User').updateMany({}, { $unset: { active: 1 } });
};
`;
    
    // Write the file
    await fs.writeFile(filePath, template);
    
    logger.info(`Migration file created: ${fileName}`);
    
    return filePath;
  } catch (error) {
    logger.error('Error creating migration file', { error, name });
    throw error;
  }
};

/**
 * Get migration status
 * @param {string} migrationsDir - Path to migrations directory
 * @returns {Promise<Object>} Migration status object
 */
const getMigrationStatus = async (migrationsDir = 'migrations') => {
  try {
    // Ensure database connection
    if (!mongoose.connection.readyState) {
      await connectDatabase();
    }
    
    // Load migration files and get applied migrations
    const migrationFiles = await loadMigrationFiles(migrationsDir);
    const appliedMigrations = await getAppliedMigrations();
    const appliedNames = appliedMigrations.map(m => m.name);
    
    // Identify pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedNames.includes(file.name)
    );
    
    // Check for migration files missing from file system
    const missingMigrations = appliedMigrations.filter(
      migration => !migrationFiles.some(file => file.name === migration.name)
    );
    
    return {
      total: migrationFiles.length,
      applied: appliedMigrations.length,
      pending: pendingMigrations.length,
      missing: missingMigrations.length,
      migrations: {
        applied: appliedMigrations.map(m => ({
          name: m.name,
          version: m.version,
          appliedAt: m.appliedAt,
          executionTime: m.executionTime
        })),
        pending: pendingMigrations.map(m => ({
          name: m.name,
          version: m.version,
          path: m.path
        })),
        missing: missingMigrations.map(m => ({
          name: m.name,
          version: m.version,
          appliedAt: m.appliedAt
        }))
      }
    };
  } catch (error) {
    logger.error('Error getting migration status', { error });
    throw error;
  }
};

module.exports = {
  applyMigrations,
  rollbackLastMigration,
  createMigration,
  getMigrationStatus,
  loadMigrationFiles,
  getAppliedMigrations
};
