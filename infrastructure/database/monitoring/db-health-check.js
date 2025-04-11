/**
 * ThiQaX Platform - Database Health Check Utility
 * 
 * This script performs comprehensive health checks on the MongoDB database,
 * including connection status, performance metrics, collection statistics,
 * index usage, and replica set status.
 * 
 * Usage: 
 *   node db-health-check.js [environment]
 * 
 * Example:
 *   node db-health-check.js staging
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Set up environment
const environment = process.argv[2] || 'development';
const scriptDir = path.dirname(require.main.filename);
const projectRoot = path.resolve(scriptDir, '..', '..', '..');

// Load environment configuration
let envPath = path.resolve(projectRoot, `.env.${environment}`);
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(projectRoot, '.env');
  if (!fs.existsSync(envPath)) {
    console.error(`Error: No .env file found for environment: ${environment}`);
    process.exit(1);
  }
}

dotenv.config({ path: envPath });

// Configure logging
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const logDir = path.resolve(projectRoot, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.resolve(logDir, `db-health-${environment}-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

/**
 * Custom logging function that writes to console and log file
 * @param {string} message - The message to log
 * @param {string} level - Log level (info, warning, error)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(formattedMessage);
  logStream.write(formattedMessage + '\n');
}

/**
 * Formats bytes to a human-readable string
 * @param {number} bytes - Bytes to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted string with units
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  log(`Starting database health check for ${environment} environment`);
  
  try {
    // Connect to MongoDB
    log('Connecting to MongoDB...');
    const startTime = Date.now();
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
      connectTimeoutMS: 10000, // 10 seconds connection timeout
    });
    
    const connectionTime = Date.now() - startTime;
    log(`Connected to MongoDB (${connectionTime}ms)`);
    
    // Get server information
    const admin = mongoose.connection.db.admin();
    const serverInfo = await admin.serverInfo();
    
    log(`MongoDB server version: ${serverInfo.version}`);
    log(`Server platform: ${serverInfo.buildEnvironment?.target_os || 'Unknown'}`);
    
    // Check server status
    const serverStatus = await admin.serverStatus();
    
    log('Connection pool status:');
    log(`  - Available connections: ${serverStatus.connections.available}`);
    log(`  - Current connections: ${serverStatus.connections.current}`);
    log(`  - Total created connections: ${serverStatus.connections.totalCreated}`);
    
    // Check memory usage
    log('Memory usage:');
    log(`  - Resident memory: ${formatBytes(serverStatus.mem.resident * 1024 * 1024)}`);
    log(`  - Virtual memory: ${formatBytes(serverStatus.mem.virtual * 1024 * 1024)}`);
    log(`  - Page faults: ${serverStatus.extra_info.page_faults}`);
    
    // Check operation statistics
    log('Operation statistics:');
    log(`  - Insert operations: ${serverStatus.opcounters.insert}`);
    log(`  - Query operations: ${serverStatus.opcounters.query}`);
    log(`  - Update operations: ${serverStatus.opcounters.update}`);
    log(`  - Delete operations: ${serverStatus.opcounters.delete}`);
    
    // Check database
    const dbStats = await mongoose.connection.db.stats();
    
    log('Database statistics:');
    log(`  - Database: ${mongoose.connection.db.databaseName}`);
    log(`  - Collections: ${dbStats.collections}`);
    log(`  - Views: ${dbStats.views}`);
    log(`  - Documents: ${dbStats.objects}`);
    log(`  - Data size: ${formatBytes(dbStats.dataSize)}`);
    log(`  - Storage size: ${formatBytes(dbStats.storageSize)}`);
    log(`  - Index size: ${formatBytes(dbStats.indexSize)}`);
    log(`  - Average document size: ${formatBytes(dbStats.avgObjSize)}`);
    
    // Get collection statistics
    log('Collection statistics:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collStats = await mongoose.connection.db.collection(collection.name).stats();
      
      log(`  - ${collection.name}:`);
      log(`    • Documents: ${collStats.count}`);
      log(`    • Size: ${formatBytes(collStats.size)}`);
      log(`    • Storage size: ${formatBytes(collStats.storageSize)}`);
      log(`    • Indexes: ${collStats.nindexes}`);
      log(`    • Index size: ${formatBytes(collStats.totalIndexSize)}`);
    }
    
    // Check index usage
    log('Index usage statistics:');
    
    for (const collection of collections) {
      const collIndexStats = await mongoose.connection.db.collection(collection.name).aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      if (collIndexStats.length > 0) {
        log(`  - ${collection.name} indexes:`);
        
        for (const indexStat of collIndexStats) {
          log(`    • ${indexStat.name}:`);
          log(`      - Operations: ${indexStat.accesses.ops}`);
          log(`      - Since: ${new Date(indexStat.accesses.since).toISOString()}`);
        }
      }
    }
    
    // Check for unused indexes
    log('Potentially unused indexes:');
    let unusedIndexesFound = false;
    
    for (const collection of collections) {
      const collIndexStats = await mongoose.connection.db.collection(collection.name).aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      const unusedIndexes = collIndexStats.filter(index => 
        index.name !== '_id_' && // Skip primary index
        index.accesses.ops === 0 // No operations using this index
      );
      
      if (unusedIndexes.length > 0) {
        unusedIndexesFound = true;
        log(`  - ${collection.name}:`);
        
        for (const unusedIndex of unusedIndexes) {
          log(`    • ${unusedIndex.name} (created: ${new Date(unusedIndex.accesses.since).toISOString()})`);
        }
      }
    }
    
    if (!unusedIndexesFound) {
      log('  - No unused indexes found');
    }
    
    // Check for slow queries
    log('Checking for slow queries...');
    
    try {
      const logData = await mongoose.connection.db.admin().command({ getLog: 'global' });
      const slowQueries = logData.log.filter(line => line.includes('command') && line.includes('slow query'));
      
      if (slowQueries.length > 0) {
        log(`Found ${slowQueries.length} slow queries:`);
        slowQueries.slice(0, 5).forEach((query, index) => { // Show only the first 5 slow queries
          log(`  - Slow query ${index + 1}: ${query}`);
        });
        
        if (slowQueries.length > 5) {
          log(`  ... and ${slowQueries.length - 5} more slow queries`);
        }
      } else {
        log('No slow queries found in recent logs');
      }
    } catch (error) {
      log(`Unable to check for slow queries: ${error.message}`, 'warning');
    }
    
    // Check for replica set status (if applicable)
    try {
      const replSetStatus = await admin.replSetGetStatus();
      
      log('Replica set status:');
      log(`  - Set name: ${replSetStatus.set}`);
      log(`  - Current state: ${replSetStatus.myState === 1 ? 'PRIMARY' : replSetStatus.myState === 2 ? 'SECONDARY' : 'OTHER'}`);
      log(`  - Members: ${replSetStatus.members.length}`);
      
      for (const member of replSetStatus.members) {
        const state = member.state === 1 ? 'PRIMARY' : member.state === 2 ? 'SECONDARY' : 'OTHER';
        const health = member.health === 1 ? 'healthy' : 'unhealthy';
        const lag = member.state === 1 ? 0 : Math.round((member.optimeDate - replSetStatus.members.find(m => m.state === 1).optimeDate) / 1000);
        
        log(`  - ${member.name} (${state}): ${health}${lag > 0 ? `, replication lag: ${lag}s` : ''}`);
      }
    } catch (error) {
      // Not a replica set or not authorized to check status
      log(`Not a replica set or not authorized to check replica status: ${error.message}`, 'info');
    }
    
    // Check connection response time
    log('Performing connection response time test...');
    const pingResults = [];
    
    for (let i = 0; i < 5; i++) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      pingResults.push(Date.now() - pingStart);
    }
    
    const avgPing = pingResults.reduce((a, b) => a + b, 0) / pingResults.length;
    const maxPing = Math.max(...pingResults);
    const minPing = Math.min(...pingResults);
    
    log(`  - Average response time: ${avgPing.toFixed(2)}ms`);
    log(`  - Min response time: ${minPing}ms`);
    log(`  - Max response time: ${maxPing}ms`);
    
    if (avgPing > 100) {
      log(`  - Warning: Average response time (${avgPing.toFixed(2)}ms) is higher than recommended (100ms)`, 'warning');
    }
    
    // Overall health assessment
    log('\nOverall health assessment:');
    
    const healthIssues = [];
    
    // Check connection health
    if (serverStatus.connections.available < 10) {
      healthIssues.push('Low number of available connections');
    }
    
    // Check memory pressure
    if (serverStatus.mem.resident > 1024 * 10) { // More than 10GB
      healthIssues.push('High memory usage');
    }
    
    // Check storage usage
    const storageUtilization = (dbStats.storageSize / dbStats.fsUsedSize) * 100;
    if (storageUtilization > 80) {
      healthIssues.push(`High storage utilization (${storageUtilization.toFixed(2)}%)`);
    }
    
    // High latency
    if (avgPing > 100) {
      healthIssues.push(`High average response time (${avgPing.toFixed(2)}ms)`);
    }
    
    if (healthIssues.length === 0) {
      log('✅ Database appears to be healthy');
    } else {
      log(`⚠️ Found ${healthIssues.length} potential issues:`);
      healthIssues.forEach(issue => log(`  - ${issue}`, 'warning'));
    }
    
  } catch (error) {
    log(`Error during health check: ${error.message}`, 'error');
    log(error.stack, 'error');
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      log('MongoDB connection closed');
    }
    
    log('Health check completed');
    logStream.end();
    
    // Output log file location
    console.log(`\nHealth check log saved to: ${logFile}`);
  }
}

// Run the health check
runHealthCheck().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
