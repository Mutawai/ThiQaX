// src/migrations/20250410143022-add-document-verification-fields.js

module.exports = {
  async up(db) {
    // Update schema validation for documents collection
    await db.command({
      collMod: 'documents',
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
            },
            // New fields
            verifiedBy: { bsonType: ['objectId', 'null'] },
            verificationDate: { bsonType: ['date', 'null'] },
            verificationNotes: { bsonType: 'string' },
            expiryDate: { bsonType: ['date', 'null'] },
            expiryNotified: { bsonType: 'bool' },
            application: { bsonType: ['objectId', 'null'] }
          }
        }
      }
    });
    
    // Add default values to existing documents
    await db.collection('documents').updateMany({}, {
      $set: {
        verificationNotes: '',
        expiryNotified: false
      }
    });
    
    // Create index for verification queries
    await db.collection('documents').createIndex({ 
      status: 1, 
      expiryDate: 1 
    });
  },

  async down(db) {
    // Revert schema validation
    await db.command({
      collMod: 'documents',
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
    
    // Remove fields from documents
    await db.collection('documents').updateMany({}, {
      $unset: {
        verifiedBy: '',
        verificationDate: '',
        verificationNotes: '',
        expiryDate: '',
        expiryNotified: '',
        application: ''
      }
    });
    
    // Drop the index
    await db.collection('documents').dropIndex({ 
      status: 1, 
      expiryDate: 1 
    });
  }
};
