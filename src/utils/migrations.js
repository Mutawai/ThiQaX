// src/utils/migrations.js

const migrateMongo = require('migrate-mongo');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Run pending migrations
 * @returns {Promise<Object>} Migration results
 */
async function runMigrations() {
  try {
    // Get migrate-mongo database connection
    const { db, client } = await migrateMongo.database.connect();
    
    // Get pending migrations
    const migrationStatus = await migrateMongo.status(db);
    const pendingMigrations = migrationStatus.filter(migration => 
      migration.appliedAt === 'PENDING'
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to run');
      await client.close();
      return { applied: 0, pendingCount: 0 };
    }
    
    // Apply pending migrations
    logger.info(`Running ${pendingMigrations.length} pending migrations`);
    const results = await migrateMongo.up(db);
    
    await client.close();
    
    logger.info(`Successfully applied ${results.length} migrations`);
    return { 
      applied: results.length,
      pendingCount: pendingMigrations.length,
      migrations: results 
    };
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}

module.exports = {
  runMigrations
};
