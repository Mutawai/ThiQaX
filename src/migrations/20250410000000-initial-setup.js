// src/migrations/20250410000000-initial-setup.js

module.exports = {
  async up(db) {
    // Create collections with validation schemas
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            name: { bsonType: 'string' },
            email: { bsonType: 'string' },
            password: { bsonType: 'string' },
            role: { 
              enum: ['jobSeeker', 'agent', 'sponsor', 'admin'] 
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    await db.createCollection('profiles', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['user'],
          properties: {
            user: { bsonType: 'objectId' },
            personalInfo: { bsonType: 'object' },
            education: { bsonType: 'array' },
            experience: { bsonType: 'array' },
            skills: { bsonType: 'array' },
            completionStatus: { bsonType: 'int' }
          }
        }
      }
    });

    await db.createCollection('documents', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'owner', 'fileUrl'],
          properties: {
            title: { bsonType: 'string' },
            type: { 
              enum: ['IDENTIFICATION', 'ADDRESS', 'EDUCATION', 'PROFESSIONAL', 'OTHER'] 
            },
            owner: { bsonType: 'objectId' },
            fileUrl: { bsonType: 'string' },
            status: { 
              enum: ['PENDING', 'VERIFIED', 'REJECTED'] 
            }
          }
        }
      }
    });

    await db.createCollection('jobs', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'description', 'status'],
          properties: {
            title: { bsonType: 'string' },
            description: { bsonType: 'string' },
            location: { bsonType: 'object' },
            salary: { bsonType: 'object' },
            requirements: { bsonType: 'array' },
            skills: { bsonType: 'array' },
            status: { 
              enum: ['DRAFT', 'ACTIVE', 'CLOSED', 'FILLED'] 
            },
            createdBy: { bsonType: 'objectId' }
          }
        }
      }
    });

    await db.createCollection('applications', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['jobSeeker', 'job', 'status'],
          properties: {
            jobSeeker: { bsonType: 'objectId' },
            job: { bsonType: 'objectId' },
            status: {
              enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']
            },
            documents: { bsonType: 'array' },
            coverLetter: { bsonType: 'string' }
          }
        }
      }
    });

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('profiles').createIndex({ user: 1 }, { unique: true });
    await db.collection('documents').createIndex({ owner: 1 });
    await db.collection('jobs').createIndex({ status: 1, location: 1 });
    await db.collection('applications').createIndex({ jobSeeker: 1, job: 1 }, { unique: true });
    await db.collection('applications').createIndex({ job: 1 });
  },

  async down(db) {
    // Drop collections in reverse order to avoid reference issues
    await db.collection('applications').drop();
    await db.collection('jobs').drop();
    await db.collection('documents').drop();
    await db.collection('profiles').drop();
    await db.collection('users').drop();
  }
};
