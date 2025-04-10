// database/init-mongo.js
// This script is executed when the MongoDB container is initialized
// It creates necessary users, databases, and initial collections

db = db.getSiblingDB('admin');

// Create admin user if not exists
if (db.getUser(process.env.MONGO_USERNAME) == null) {
  db.createUser({
    user: process.env.MONGO_USERNAME,
    pwd: process.env.MONGO_PASSWORD,
    roles: [
      { role: 'root', db: 'admin' }
    ]
  });
}

// Setup production database
db = db.getSiblingDB('thiqax');
db.createCollection('users');
db.createCollection('documents');
db.createCollection('jobs');
db.createCollection('applications');
db.createCollection('transactions');
db.createCollection('notifications');
db.createCollection('logs');

// Create indexes for common queries
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "createdAt": 1 });
db.users.createIndex({ "kycVerified": 1 });

db.documents.createIndex({ "userId": 1 });
db.documents.createIndex({ "type": 1 });
db.documents.createIndex({ "verificationStatus": 1 });
db.documents.createIndex({ "expiryDate": 1 });

db.jobs.createIndex({ "status": 1 });
db.jobs.createIndex({ "sponsorId": 1 });
db.jobs.createIndex({ "agentId": 1 });
db.jobs.createIndex({ "createdAt": 1 });
db.jobs.createIndex({ "location": 1 });
db.jobs.createIndex({ "jobType": 1 });
db.jobs.createIndex({ "jobCategory": 1 });

db.applications.createIndex({ "jobId": 1 });
db.applications.createIndex({ "applicantId": 1 });
db.applications.createIndex({ "status": 1 });
db.applications.createIndex({ "createdAt": 1 });

db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "status": 1 });
db.transactions.createIndex({ "type": 1 });
db.transactions.createIndex({ "createdAt": 1 });

db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "read": 1 });
db.notifications.createIndex({ "createdAt": 1 });

db.logs.createIndex({ "timestamp": 1 });
db.logs.createIndex({ "level": 1 });
db.logs.createIndex({ "service": 1 });

// Setup staging database
db = db.getSiblingDB('thiqax-staging');
db.createCollection('users');
db.createCollection('documents');
db.createCollection('jobs');
db.createCollection('applications');
db.createCollection('transactions');
db.createCollection('notifications');
db.createCollection('logs');

// Create the same indexes for staging
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "createdAt": 1 });
db.users.createIndex({ "kycVerified": 1 });

db.documents.createIndex({ "userId": 1 });
db.documents.createIndex({ "type": 1 });
db.documents.createIndex({ "verificationStatus": 1 });
db.documents.createIndex({ "expiryDate": 1 });

db.jobs.createIndex({ "status": 1 });
db.jobs.createIndex({ "sponsorId": 1 });
db.jobs.createIndex({ "agentId": 1 });
db.jobs.createIndex({ "createdAt": 1 });
db.jobs.createIndex({ "location": 1 });
db.jobs.createIndex({ "jobType": 1 });
db.jobs.createIndex({ "jobCategory": 1 });

db.applications.createIndex({ "jobId": 1 });
db.applications.createIndex({ "applicantId": 1 });
db.applications.createIndex({ "status": 1 });
db.applications.createIndex({ "createdAt": 1 });

db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "status": 1 });
db.transactions.createIndex({ "type": 1 });
db.transactions.createIndex({ "createdAt": 1 });

db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "read": 1 });
db.notifications.createIndex({ "createdAt": 1 });

db.logs.createIndex({ "timestamp": 1 });
db.logs.createIndex({ "level": 1 });
db.logs.createIndex({ "service": 1 });

// database/migrations/schema-validation.js
/**
 * MongoDB schema validation rules for ThiQaX collections
 * This ensures data integrity and enforces type consistency
 */

// User schema validation
db.runCommand({
  collMod: "users",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password", "role"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "must be a valid email address and is required"
        },
        password: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        role: {
          enum: ["jobSeeker", "agent", "sponsor", "admin"],
          description: "must be one of the defined roles and is required"
        },
        profileComplete: {
          bsonType: "bool",
          description: "must be a boolean"
        },
        kycVerified: {
          bsonType: "bool",
          description: "must be a boolean"
        },
        createdAt: {
          bsonType: "date",
          description: "must be a date"
        },
        updatedAt: {
          bsonType: "date",
          description: "must be a date"
        }
      }
    }
  },
  validationLevel: "moderate"
});

// Document schema validation
db.runCommand({
  collMod: "documents",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "type", "path", "originalName", "verificationStatus"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "must be an objectId and is required"
        },
        type: {
          enum: ["identity", "education", "professional", "address", "medical", "other"],
          description: "must be one of the defined document types and is required"
        },
        path: {
          bsonType: "string",
          description: "must be a string path and is required"
        },
        originalName: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        mimeType: {
          bsonType: "string",
          description: "must be a string"
        },
        size: {
          bsonType: "number",
          description: "must be a number"
        },
        verificationStatus: {
          enum: ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
          description: "must be one of the defined statuses and is required"
        },
        verifiedBy: {
          bsonType: "objectId",
          description: "must be an objectId"
        },
        verifiedAt: {
          bsonType: "date",
          description: "must be a date"
        },
        rejectionReason: {
          bsonType: "string",
          description: "must be a string"
        },
        expiryDate: {
          bsonType: "date",
          description: "must be a date"
        },
        issuedBy: {
          bsonType: "string",
          description: "must be a string"
        },
        createdAt: {
          bsonType: "date",
          description: "must be a date"
        },
        updatedAt: {
          bsonType: "date",
          description: "must be a date"
        }
      }
    }
  },
  validationLevel: "moderate"
});

// Job schema validation
db.runCommand({
  collMod: "jobs",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "description", "location", "salary", "sponsorId", "status"],
      properties: {
        title: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        description: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        location: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        jobCategory: {
          bsonType: "string",
          description: "must be a string"
        },
        jobType: {
          enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"],
          description: "must be one of the defined job types"
        },
        salary: {
          bsonType: "object",
          required: ["amount", "currency"],
          properties: {
            amount: {
              bsonType: "number",
              description: "must be a number and is required"
            },
            currency: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            period: {
              enum: ["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
              description: "must be one of the defined periods"
            }
          }
        },
        skills: {
          bsonType: "array",
          description: "must be an array of strings"
        },
        requirements: {
          bsonType: "array",
          description: "must be an array of strings"
        },
        sponsorId: {
          bsonType: "objectId",
          description: "must be an objectId and is required"
        },
        agentId: {
          bsonType: "objectId",
          description: "must be an objectId"
        },
        status: {
          enum: ["DRAFT", "OPEN", "CLOSED", "FILLED", "CANCELLED"],
          description: "must be one of the defined statuses and is required"
        },
        applicationDeadline: {
          bsonType: "date",
          description: "must be a date"
        },
        createdAt: {
          bsonType: "date",
          description: "must be a date"
        },
        updatedAt: {
          bsonType: "date",
          description: "must be a date"
        }
      }
    }
  },
  validationLevel: "moderate"
});

// Additional validations for applications, transactions, and notifications...

// database/migrations/indexes.js
/**
 * MongoDB index optimization script for ThiQaX collections
 * Creates and updates indexes for optimal query performance
 */

// User collection indexes
db.users.createIndex({ "email": 1 }, { unique: true, background: true });
db.users.createIndex({ "role": 1 }, { background: true });
db.users.createIndex({ "createdAt": 1 }, { background: true });
db.users.createIndex({ "kycVerified": 1 }, { background: true });
// Compound indexes for common queries
db.users.createIndex({ "role": 1, "kycVerified": 1 }, { background: true });
db.users.createIndex({ "profileComplete": 1, "kycVerified": 1 }, { background: true });

// Document collection indexes
db.documents.createIndex({ "userId": 1 }, { background: true });
db.documents.createIndex({ "type": 1 }, { background: true });
db.documents.createIndex({ "verificationStatus": 1 }, { background: true });
db.documents.createIndex({ "expiryDate": 1 }, { background: true });
// Compound indexes for common queries
db.documents.createIndex({ "userId": 1, "type": 1 }, { background: true });
db.documents.createIndex({ "userId": 1, "verificationStatus": 1 }, { background: true });
db.documents.createIndex({ "type": 1, "verificationStatus": 1 }, { background: true });
db.documents.createIndex({ "verificationStatus": 1, "expiryDate": 1 }, { background: true });

// Job collection indexes
db.jobs.createIndex({ "status": 1 }, { background: true });
db.jobs.createIndex({ "sponsorId": 1 }, { background: true });
db.jobs.createIndex({ "agentId": 1 }, { background: true });
db.jobs.createIndex({ "createdAt": 1 }, { background: true });
db.jobs.createIndex({ "location": 1 }, { background: true });
db.jobs.createIndex({ "jobType": 1 }, { background: true });
db.jobs.createIndex({ "jobCategory": 1 }, { background: true });
// Text search index
db.jobs.createIndex({ 
  "title": "text", 
  "description": "text", 
  "skills": "text" 
}, { 
  weights: { 
    "title": 10, 
    "skills": 5, 
    "description": 1 
  },
  background: true,
  name: "jobs_text_search"
});
// Compound indexes for common queries
db.jobs.createIndex({ "status": 1, "location": 1 }, { background: true });
db.jobs.createIndex({ "status": 1, "jobCategory": 1 }, { background: true });
db.jobs.createIndex({ "status": 1, "createdAt": -1 }, { background: true });
db.jobs.createIndex({ "sponsorId": 1, "status": 1 }, { background: true });
db.jobs.createIndex({ "agentId": 1, "status": 1 }, { background: true });

// Application collection indexes
db.applications.createIndex({ "jobId": 1 }, { background: true });
db.applications.createIndex({ "applicantId": 1 }, { background: true });
db.applications.createIndex({ "status": 1 }, { background: true });
db.applications.createIndex({ "createdAt": 1 }, { background: true });
// Compound indexes for common queries
db.applications.createIndex({ "jobId": 1, "status": 1 }, { background: true });
db.applications.createIndex({ "applicantId": 1, "status": 1 }, { background: true });
db.applications.createIndex({ "jobId": 1, "applicantId": 1 }, { unique: true, background: true });
db.applications.createIndex({ "status": 1, "createdAt": -1 }, { background: true });

// Transaction collection indexes
db.transactions.createIndex({ "userId": 1 }, { background: true });
db.transactions.createIndex({ "status": 1 }, { background: true });
db.transactions.createIndex({ "type": 1 }, { background: true });
db.transactions.createIndex({ "createdAt": 1 }, { background: true });
// Compound indexes
db.transactions.createIndex({ "userId": 1, "status": 1 }, { background: true });
db.transactions.createIndex({ "userId": 1, "type": 1 }, { background: true });
db.transactions.createIndex({ "userId": 1, "createdAt": -1 }, { background: true });

// Notification collection indexes
db.notifications.createIndex({ "userId": 1 }, { background: true });
db.notifications.createIndex({ "read": 1 }, { background: true });
db.notifications.createIndex({ "createdAt": 1 }, { background: true });
// Compound indexes
db.notifications.createIndex({ "userId": 1, "read": 1 }, { background: true });
db.notifications.createIndex({ "userId": 1, "createdAt": -1 }, { background: true });
db.notifications.createIndex({ "userId": 1, "read": 1, "createdAt": -1 }, { background: true });

// Logs collection indexes
db.logs.createIndex({ "timestamp": 1 }, { background: true });
db.logs.createIndex({ "level": 1 }, { background: true });
db.logs.createIndex({ "service": 1 }, { background: true });
// Compound indexes
db.logs.createIndex({ "level": 1, "timestamp": -1 }, { background: true });
db.logs.createIndex({ "service": 1, "timestamp": -1 }, { background: true });

// Print confirmation
print("Indexes successfully created or updated.");

// database/backup/backup.sh
#!/bin/bash

set -e

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <environment> <output_directory>"
    echo "Example: $0 production /opt/thiqax/backups/production/db_backup"
    exit 1
fi

DEPLOY_ENV=$1
BACKUP_DIR=$2
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/thiqax/db-backup-$DEPLOY_ENV-$DATE.log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

# Start logging
exec > >(tee -a $LOG_FILE) 2>&1

echo "=== ThiQaX Database Backup Started at $(date) ==="

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Determine database name based on environment
if [ "$DEPLOY_ENV" == "production" ]; then
    DB_NAME="thiqax"
else
    DB_NAME="thiqax-$DEPLOY_ENV"
fi

# Get MongoDB container name
MONGO_CONTAINER="thiqax-mongo"
if [ "$DEPLOY_ENV" != "production" ]; then
    MONGO_CONTAINER="$MONGO_CONTAINER-$DEPLOY_ENV"
fi

# Extract MongoDB credentials from environment file
if [ -f "/opt/thiqax/$DEPLOY_ENV/.env" ]; then
    source <(grep -E "MONGO_USERNAME|MONGO_PASSWORD" /opt/thiqax/$DEPLOY_ENV/.env)
else
    echo "ERROR: Environment file not found at /opt/thiqax/$DEPLOY_ENV/.env"
    exit 1
fi

# Backup MongoDB database
echo "Backing up $DB_NAME database..."
docker exec $MONGO_CONTAINER mongodump \
    --authenticationDatabase admin \
    --username $MONGO_USERNAME \
    --password $MONGO_PASSWORD \
    --db $DB_NAME \
    --out /tmp/backup

# Copy backup from container to host
echo "Copying backup files from container..."
docker cp $MONGO_CONTAINER:/tmp/backup $BACKUP_DIR/

# Clean up temporary files in container
docker exec $MONGO_CONTAINER rm -rf /tmp/backup

# Compress backup
echo "Compressing backup..."
ARCHIVE_NAME="$BACKUP_DIR/mongodb_backup_$DB_NAME-$DATE.tar.gz"
tar -czf $ARCHIVE_NAME -C $BACKUP_DIR backup
rm -rf $BACKUP_DIR/backup

# Set appropriate permissions
chmod 600 $ARCHIVE_NAME

echo "Backup completed successfully: $ARCHIVE_NAME"
echo "Backup size: $(du -h $ARCHIVE_NAME | cut -f1)"
echo "=== Backup completed at $(date) ==="

exit 0

// database/restore/restore.sh
#!/bin/bash

set -e

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <environment> <backup_directory>"
    echo "Example: $0 production /opt/thiqax/backups/production/db_backup"
    exit 1
fi

DEPLOY_ENV=$1
BACKUP_DIR=$2
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/thiqax/db-restore-$DEPLOY_ENV-$DATE.log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

# Start logging
exec > >(tee -a $LOG_FILE) 2>&1

echo "=== ThiQaX Database Restore Started at $(date) ==="

# Verify backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "ERROR: Backup directory $BACKUP_DIR does not exist!"
    exit 1
fi

# Find most recent backup archive
LATEST_BACKUP=$(ls -t $BACKUP_DIR/mongodb_backup_*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "ERROR: No backup archives found in $BACKUP_DIR"
    exit 1
fi

echo "Using backup: $LATEST_BACKUP"

# Determine database name based on environment
if [ "$DEPLOY_ENV" == "production" ]; then
    DB_NAME="thiqax"
else
    DB_NAME="thiqax-$DEPLOY_ENV"
fi

# Get MongoDB container name
MONGO_CONTAINER="thiqax-mongo"
if [ "$DEPLOY_ENV" != "production" ]; then
    MONGO_CONTAINER="$MONGO_CONTAINER-$DEPLOY_ENV"
fi

# Extract MongoDB credentials from environment file
if [ -f "/opt/thiqax/$DEPLOY_ENV/.env" ]; then
    source <(grep -E "MONGO_USERNAME|MONGO_PASSWORD" /opt/thiqax/$DEPLOY_ENV/.env)
else
    echo "ERROR: Environment file not found at /opt/thiqax/$DEPLOY_ENV/.env"
    exit 1
fi

# Extract backup to temporary directory
echo "Extracting backup archive..."
TEMP_DIR=$(mktemp -d)
tar -xzf $LATEST_BACKUP -C $TEMP_DIR

# Copy backup to container
echo "Copying backup to container..."
docker cp $TEMP_DIR/backup $MONGO_CONTAINER:/tmp/

# Restore database
echo "Restoring database $DB_NAME..."
docker exec $MONGO_CONTAINER mongorestore \
    --authenticationDatabase admin \
    --username $MONGO_USERNAME \
    --password $MONGO_PASSWORD \
    --db $DB_NAME \
    --drop \
    /tmp/backup/$DB_NAME

# Clean up
echo "Cleaning up temporary files..."
docker exec $MONGO_CONTAINER rm -rf /tmp/backup
rm -rf $TEMP_DIR

echo "Restore completed successfully."
echo "=== Restore completed at $(date) ==="

exit 0

// database/test-data/generators.js
/**
 * Test data generation utilities for ThiQaX platform
 * 
 * This module provides functions to generate realistic test data for all collections
 * in the ThiQaX database. It's used for development, testing, and staging environments.
 */

const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

// Configure faker
faker.setLocale('en');

/**
 * Generate a random user with realistic data
 * @param {Object} options - Customization options
 * @returns {Object} User object ready for insertion
 */
const generateUser = (options = {}) => {
  const role = options.role || faker.helpers.arrayElement(['jobSeeker', 'agent', 'sponsor', 'admin']);
  const profileComplete = options.profileComplete ?? faker.datatype.boolean();
  const kycVerified = options.kycVerified ?? faker.datatype.boolean();
  
  // Generate different profiles based on role
  let profile = {};
  if (role === 'jobSeeker') {
    profile = {
      skills: Array.from({ length: faker.datatype.number({ min: 1, max: 6 }) }, 
        () => faker.name.jobArea()),
      experience: Array.from({ length: faker.datatype.number({ min: 0, max: 3 }) }, 
        () => ({
          title: faker.name.jobTitle(),
          company: faker.company.name(),
          location: faker.address.country(),
