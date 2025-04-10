/**
 * Initial schema migration
 * Sets up the primary collections and indexes for the ThiQaX platform
 */

const mongoose = require('mongoose');
const dbConfig = require('../config');

/**
 * Apply the migration
 */
exports.up = async () => {
  console.log('Running initial schema migration');
  
  // Create the collections explicitly if they don't exist
  const collections = [
    'users',
    'documents',
    'jobs',
    'applications',
    'payments',
    'notifications'
  ];
  
  for (const collection of collections) {
    try {
      await mongoose.connection.createCollection(collection);
      console.log(`Created collection: ${collection}`);
    } catch (error) {
      // Collection may already exist, which is fine
      if (error.codeName !== 'NamespaceExists') {
        throw error;
      }
    }
  }
  
  // Create initial indexes
  const db = mongoose.connection.db;
  
  // Users collection indexes
  await db.collection('users').createIndex(
    { email: 1 },
    { unique: true, background: true }
  );
  
  await db.collection('users').createIndex(
    { role: 1 },
    { background: true }
  );
  
  // Documents collection indexes
  await db.collection('documents').createIndex(
    { userId: 1 },
    { background: true }
  );
  
  await db.collection('documents').createIndex(
    { type: 1 },
    { background: true }
  );
  
  await db.collection('documents').createIndex(
    { status: 1 },
    { background: true }
  );
  
  // Jobs collection indexes
  await db.collection('jobs').createIndex(
    { sponsorId: 1 },
    { background: true }
  );
  
  await db.collection('jobs').createIndex(
    { status: 1 },
    { background: true }
  );
  
  await db.collection('jobs').createIndex(
    { location: 1 },
    { background: true }
  );
  
  // Applications collection indexes
  await db.collection('applications').createIndex(
    { jobId: 1 },
    { background: true }
  );
  
  await db.collection('applications').createIndex(
    { jobSeekerId: 1 },
    { background: true }
  );
  
  await db.collection('applications').createIndex(
    { status: 1 },
    { background: true }
  );
  
  // Payments collection indexes
  await db.collection('payments').createIndex(
    { applicationId: 1 },
    { background: true }
  );
  
  await db.collection('payments').createIndex(
    { status: 1 },
    { background: true }
  );
  
  // Notifications collection indexes
  await db.collection('notifications').createIndex(
    { userId: 1 },
    { background: true }
  );
  
  await db.collection('notifications').createIndex(
    { read: 1 },
    { background: true }
  );
  
  console.log('Initial schema migration completed successfully');
};

/**
 * Revert the migration
 */
exports.down = async () => {
  console.log('Reverting initial schema migration');
  
  // Drop all indexes except _id
  const db = mongoose.connection.db;
  const collections = [
    'users',
    'documents',
    'jobs',
    'applications',
    'payments',
    'notifications'
  ];
  
  for (const collection of collections) {
    try {
      // Get all indexes
      const indexes = await db.collection(collection).indexes();
      
      // Drop all indexes except _id
      for (const index of indexes) {
        if (index.name !== '_id_') {
          await db.collection(collection).dropIndex(index.name);
          console.log(`Dropped index ${index.name} from ${collection}`);
        }
      }
    } catch (error) {
      console.error(`Error dropping indexes from ${collection}: ${error.message}`);
      throw error;
    }
  }
  
  console.log('Initial schema migration reverted successfully');
};
