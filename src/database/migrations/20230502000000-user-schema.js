/**
 * User schema migration
 * Creates the User schema and adds any required indexes
 */

const mongoose = require('mongoose');

/**
 * Apply the migration
 */
exports.up = async () => {
  console.log('Running user schema migration');
  
  const db = mongoose.connection.db;
  
  // Additional indexes for users collection
  await db.collection('users').createIndex(
    { 'firstName': 'text', 'lastName': 'text' },
    { 
      background: true,
      weights: {
        firstName: 1,
        lastName: 1
      },
      name: 'user_name_text'
    }
  );
  
  await db.collection('users').createIndex(
    { kycVerified: 1 },
    { background: true }
  );
  
  await db.collection('users').createIndex(
    { emailVerified: 1 },
    { background: true }
  );
  
  await db.collection('users').createIndex(
    { profileComplete: 1 },
    { background: true }
  );
  
  await db.collection('users').createIndex(
    { createdAt: 1 },
    { background: true }
  );
  
  await db.collection('users').createIndex(
    { 'emailVerificationToken': 1 },
    { 
      background: true,
      sparse: true // Only index documents that have this field
    }
  );
  
  await db.collection('users').createIndex(
    { 'resetPasswordToken': 1 },
    { 
      background: true,
      sparse: true // Only index documents that have this field
    }
  );
  
  // Create an admin user if it doesn't exist
  const adminExists = await db.collection('users').findOne({ 
    email: 'admin@thiqax.com',
    role: 'admin'
  });
  
  if (!adminExists) {
    // Require bcrypt for password hashing
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('ChangeMe123!', salt);
    
    await db.collection('users').insertOne({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@thiqax.com',
      role: 'admin',
      password: hashedPassword,
      profileComplete: true,
      kycVerified: true,
      emailVerified: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Created default admin user');
  }
  
  console.log('User schema migration completed successfully');
};

/**
 * Revert the migration
 */
exports.down = async () => {
  console.log('Reverting user schema migration');
  
  const db = mongoose.connection.db;
  
  // Drop the text index
  try {
    await db.collection('users').dropIndex('user_name_text');
    console.log('Dropped text index from users collection');
  } catch (error) {
    console.error(`Error dropping text index: ${error.message}`);
  }
  
  // Drop other indexes created in this migration
  const indexesToDrop = [
    'kycVerified_1',
    'emailVerified_1',
    'profileComplete_1',
    'createdAt_1',
    'emailVerificationToken_1',
    'resetPasswordToken_1'
  ];
  
  for (const indexName of indexesToDrop) {
    try {
      await db.collection('users').dropIndex(indexName);
      console.log(`Dropped index ${indexName} from users collection`);
    } catch (error) {
      console.error(`Error dropping index ${indexName}: ${error.message}`);
    }
  }
  
  // Remove the admin user if it was created by this migration
  try {
    await db.collection('users').deleteOne({ 
      email: 'admin@thiqax.com',
      role: 'admin'
    });
    console.log('Removed default admin user');
  } catch (error) {
    console.error(`Error removing admin user: ${error.message}`);
  }
  
  console.log('User schema migration reverted successfully');
};
