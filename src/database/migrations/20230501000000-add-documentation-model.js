// src/database/migrations/20230501000000-add-documentation-model.js
/**
 * Migration to add Documentation model
 */
module.exports = {
  async up(db) {
    await db.createCollection('documentation');
    
    // Create indexes
    await db.collection('documentation').createIndex({ type: 1 });
    await db.collection('documentation').createIndex({ componentId: 1 }, { sparse: true });
    await db.collection('documentation').createIndex({ roles: 1 }, { sparse: true });
    await db.collection('documentation').createIndex({ workflow: 1 }, { sparse: true });
    await db.collection('documentation').createIndex({ category: 1 }, { sparse: true });
    
    console.log('Created documentation collection with indexes');
  },

  async down(db) {
    await db.collection('documentation').drop();
    console.log('Dropped documentation collection');
  }
};

// src/database/migrations/20230501000001-add-notification-model.js
/**
 * Migration to add Notification model and indexes
 */
module.exports = {
  async up(db) {
    await db.createCollection('notifications');
    
    // Create indexes
    await db.collection('notifications').createIndex({ recipient: 1 });
    await db.collection('notifications').createIndex({ read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    await db.collection('notifications').createIndex({ recipient: 1, read: 1 });
    
    console.log('Created notifications collection with indexes');
  },

  async down(db) {
    await db.collection('notifications').drop();
    console.log('Dropped notifications collection');
  }
};

// src/database/migrations/20230501000002-update-document-model.js
/**
 * Migration to update Document model with verification fields
 */
module.exports = {
  async up(db) {
    await db.collection('documents').updateMany(
      {},
      { 
        $set: { 
          status: 'PENDING',
          uploadedAt: new Date()
        } 
      }
    );
    
    // Create indexes for verification queues
    await db.collection('documents').createIndex({ status: 1, uploadedAt: 1 });
    await db.collection('documents').createIndex({ user: 1, status: 1 });
    await db.collection('documents').createIndex({ documentType: 1, status: 1 });
    
    console.log('Updated document model with verification fields and indexes');
  },

  async down(db) {
    await db.collection('documents').updateMany(
      {},
      { 
        $unset: { 
          status: "",
          verifiedAt: "",
          verifiedBy: "",
          rejectedAt: "",
          rejectedBy: "",
          rejectionReason: "",
          verificationNotes: ""
        } 
      }
    );
    
    // Drop indexes
    await db.collection('documents').dropIndex({ status: 1, uploadedAt: 1 });
    await db.collection('documents').dropIndex({ user: 1, status: 1 });
    await db.collection('documents').dropIndex({ documentType: 1, status: 1 });
    
    console.log('Reverted document model changes');
  }
};

// src/database/migrations/20230501000003-update-job-model.js
/**
 * Migration to update Job model with additional fields
 */
module.exports = {
  async up(db) {
    // Add new fields with default values
    await db.collection('jobs').updateMany(
      {},
      {
        $set: {
          status: 'PUBLISHED',
          featured: false,
          verified: false,
          applicationCount: 0,
          views: 0,
          updatedAt: new Date()
        }
      }
    );
    
    // Create indexes for job search
    await db.collection('jobs').createIndex({ title: 'text', description: 'text', location: 'text', tags: 'text' });
    await db.collection('jobs').createIndex({ status: 1, deadline: 1 });
    await db.collection('jobs').createIndex({ createdBy: 1, status: 1 });
    await db.collection('jobs').createIndex({ employer: 1, status: 1 });
    await db.collection('jobs').createIndex({ featured: 1, createdAt: -1 });
    await db.collection('jobs').createIndex({ jobType: 1, location: 1 });
    
    console.log('Updated job model with additional fields and indexes');
  },

  async down(db) {
    // Remove added fields
    await db.collection('jobs').updateMany(
      {},
      {
        $unset: {
          status: "",
          featured: "",
          verified: "",
          verifiedBy: "",
          verifiedAt: "",
          applicationCount: "",
          views: "",
          updatedAt: ""
        }
      }
    );
    
    // Drop indexes
    await db.collection('jobs').dropIndex({ title: 'text', description: 'text', location: 'text', tags: 'text' });
    await db.collection('jobs').dropIndex({ status: 1, deadline: 1 });
    await db.collection('jobs').dropIndex({ createdBy: 1, status: 1 });
    await db.collection('jobs').dropIndex({ employer: 1, status: 1 });
    await db.collection('jobs').dropIndex({ featured: 1, createdAt: -1 });
    await db.collection('jobs').dropIndex({ jobType: 1, location: 1 });
    
    console.log('Reverted job model changes');
  }
};

// src/database/migrations/20230501000004-update-application-model.js
/**
 * Migration to update Application model with improved status tracking
 */
module.exports = {
  async up(db) {
    // Convert any existing status values to the new enum format
    await db.collection('applications').updateMany(
      { status: 'pending' },
      { $set: { status: 'SUBMITTED' } }
    );
    
    await db.collection('applications').updateMany(
      { status: 'accepted' },
      { $set: { status: 'OFFER_EXTENDED' } }
    );
    
    await db.collection('applications').updateMany(
      { status: 'rejected' },
      { $set: { status: 'REJECTED' } }
    );
    
    // Set updatedAt for all records
    await db.collection('applications').updateMany(
      {},
      { $set: { updatedAt: new Date() } }
    );
    
    // Create indexes
    await db.collection('applications').createIndex({ user: 1, job: 1 }, { unique: true });
    await db.collection('applications').createIndex({ job: 1, status: 1 });
    await db.collection('applications').createIndex({ user: 1, status: 1 });
    await db.collection('applications').createIndex({ createdAt: -1 });
    
    console.log('Updated application model with improved status tracking and indexes');
  },

  async down(db) {
    // Revert status values to previous format
    await db.collection('applications').updateMany(
      { status: 'SUBMITTED' },
      { $set: { status: 'pending' } }
    );
    
    await db.collection('applications').updateMany(
      { status: 'OFFER_EXTENDED' },
      { $set: { status: 'accepted' } }
    );
    
    await db.collection('applications').updateMany(
      { status: 'REJECTED' },
      { $set: { status: 'rejected' } }
    );
    
    // Remove added fields
    await db.collection('applications').updateMany(
      {},
      {
        $unset: {
          updatedAt: "",
          interviewDate: "",
          rejectionReason: ""
        }
      }
    );
    
    // Drop indexes
    await db.collection('applications').dropIndex({ user: 1, job: 1 });
    await db.collection('applications').dropIndex({ job: 1, status: 1 });
    await db.collection('applications').dropIndex({ user: 1, status: 1 });
    
    console.log('Reverted application model changes');
  }
};

// src/database/migrations/20230501000005-update-user-profile-completeness.js
/**
 * Migration to add profile completeness tracking to user model
 */
module.exports = {
  async up(db) {
    // Add profile completeness field to all users
    await db.collection('users').updateMany(
      {},
      {
        $set: {
          profileComplete: false,
          lastLogin: new Date()
        }
      }
    );
    
    // Set profileComplete to true for users with complete profiles
    const profiles = await db.collection('profiles').find({}).toArray();
    
    for (const profile of profiles) {
      // Check if profile has all required fields
      const isComplete = profile.firstName && 
                        profile.lastName && 
                        profile.email && 
                        profile.phone && 
                        profile.address && 
                        profile.city && 
                        profile.country && 
                        (profile.education && profile.education.length > 0) &&
                        (profile.experience && profile.experience.length > 0) &&
                        (profile.skills && profile.skills.length > 0) &&
                        profile.bio;
      
      if (isComplete) {
        await db.collection('users').updateOne(
          { _id: profile.user },
          { $set: { profileComplete: true } }
        );
      }
    }
    
    console.log('Updated user model with profile completeness tracking');
  },

  async down(db) {
    // Remove added fields
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          profileComplete: "",
          lastLogin: ""
        }
      }
    );
    
    console.log('Reverted user model changes');
  }
};

// src/database/seeder.js
/**
 * Database seeder for ThiQaX platform
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const Documentation = require('../models/Documentation');

// Documentation content
const documentationContent = require('./data/documentation');

// Connect to database
mongoose.connect(config.database.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Clear database
const clearDatabase = async () => {
  if (process.env.NODE_ENV === 'development') {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Document.deleteMany({});
    await Notification.deleteMany({});
    await Documentation.deleteMany({});
    console.log('Database cleared');
  } else {
    console.log('Database clear skipped in non-development environment');
  }
};

// Create users
const createUsers = async () => {
  // Create hashed password
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('Test123!', salt);
  
  const users = [
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@thiqax.com',
      password,
      role: 'admin',
      emailVerified: true,
      kycVerified: true,
      profileComplete: true,
      phoneVerified: true,
      active: true
    },
    {
      firstName: 'Job',
      lastName: 'Seeker',
      email: 'jobseeker@example.com',
      password,
      role: 'jobSeeker',
      emailVerified: true,
      kycVerified: true,
      profileComplete: true,
      phoneVerified: true,
      active: true
    },
    {
      firstName: 'Recruitment',
      lastName: 'Agent',
      email: 'agent@example.com',
      password,
      role: 'agent',
      emailVerified: true,
      kycVerified: true,
      profileComplete: true,
      phoneVerified: true,
      active: true
    },
    {
      firstName: 'Company',
      lastName: 'Sponsor',
      email: 'sponsor@example.com',
      password,
      role: 'sponsor',
      emailVerified: true,
      kycVerified: true,
      profileComplete: true,
      phoneVerified: true,
      active: true
    }
  ];
  
  await User.insertMany(users);
  console.log(`${users.length} users created`);
  
  return User.find();
};

// Create documentation
const createDocumentation = async () => {
  await Documentation.insertMany([
    ...documentationContent.userGuides,
    ...documentationContent.helpContent,
    ...documentationContent.faqs,
    ...documentationContent.tooltips
  ]);
  
  console.log(`${documentationContent.userGuides.length} user guides created`);
  console.log(`${documentationContent.helpContent.length} help items created`);
  console.log(`${documentationContent.faqs.length} FAQs created`);
  console.log(`${documentationContent.tooltips.length} tooltips created`);
};

// Run seeder
const seed = async () => {
  try {
    await clearDatabase();
    const users = await createUsers();
    await createDocumentation();
    
    console.log('Database seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run seeder if this module is executed directly
if (require.main === module) {
  seed();
}

module.exports = seed;
