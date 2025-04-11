#!/bin/bash
#
# ThiQaX Platform - MongoDB Restore Script
# 
# This script restores a MongoDB backup to the ThiQaX platform database.
# It supports different environments and provides safety checks to prevent
# accidental data loss in production environments.
#
# Usage: ./restore-db.sh [backup-file] [environment]
# Example: ./restore-db.sh thiqax_staging_20250418_120000.gz staging

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Error: Backup file not specified"
  echo "Usage: ./restore-db.sh [backup-file] [environment]"
  exit 1
fi

BACKUP_FILE="$1"
ENV=${2:-development}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.$ENV" ]; then
  source <(grep -v '^#' "$PROJECT_ROOT/.env.$ENV" | sed 's/^/export /')
elif [ -f "$PROJECT_ROOT/.env" ]; then
  source <(grep -v '^#' "$PROJECT_ROOT/.env" | sed 's/^/export /')
else
  echo "Error: No .env file found for environment: $ENV"
  exit 1
fi

# Set backup directory
BACKUP_DIR="${PROJECT_ROOT}/backups/${ENV}"
LOG_DIR="${PROJECT_ROOT}/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${LOG_DIR}/restore_log_${TIMESTAMP}.txt"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo "Starting database restore from ${BACKUP_FILE} to ${ENV} environment at $(date)" | tee -a "$LOG_FILE"

# Parse MongoDB connection string to extract components
if [[ "$MONGODB_URI" =~ mongodb(\+srv)?://([^:]+):([^@]+)@([^/]+)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[2]}"
  DB_PASS="${BASH_REMATCH[3]}"
  DB_HOST="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse MongoDB connection string" | tee -a "$LOG_FILE"
  exit 1
fi

# Safety checks for production environment
if [ "$ENV" == "production" ]; then
  echo "⚠️ WARNING: You are about to restore data to the PRODUCTION environment ⚠️" | tee -a "$LOG_FILE"
  echo "This will OVERWRITE all existing data in the production database!" | tee -a "$LOG_FILE"
  echo "Please type 'CONFIRM PRODUCTION RESTORE' to proceed:"
  read confirmation
  
  if [ "$confirmation" != "CONFIRM PRODUCTION RESTORE" ]; then
    echo "Restore cancelled" | tee -a "$LOG_FILE"
    exit 1
  fi
  
  # Create a pre-restore backup for production
  echo "Creating a pre-restore backup of the production database..." | tee -a "$LOG_FILE"
  PRE_RESTORE_BACKUP=$("$SCRIPT_DIR/backup-db.sh" production)
  echo "Pre-restore backup created: $PRE_RESTORE_BACKUP" | tee -a "$LOG_FILE"
fi

# Check if backup file is a full path or just a filename
if [[ "$BACKUP_FILE" != /* ]]; then
  # If it's just a filename, look in the appropriate backup directory
  BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
else
  BACKUP_PATH="$BACKUP_FILE"
fi

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
  # If not found locally, check if it might be in cloud storage
  if [ "${STORAGE_TYPE:-local}" != "local" ]; then
    echo "Backup file not found locally, attempting to download from cloud storage..." | tee -a "$LOG_FILE"
    
    TEMP_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
    mkdir -p "$(dirname "$TEMP_BACKUP_PATH")"
    
    if [ "${STORAGE_TYPE}" == "gcp" ] && [ ! -z "${GCP_BUCKET:-}" ]; then
      # Download from Google Cloud Storage
      gsutil cp "gs://${GCP_BUCKET}/backups/${ENV}/${BACKUP_FILE}" "$TEMP_BACKUP_PATH" 2>> "$LOG_FILE"
      
      if [ $? -eq 0 ]; then
        echo "Backup downloaded from Google Cloud Storage" | tee -a "$LOG_FILE"
        BACKUP_PATH="$TEMP_BACKUP_PATH"
      else
        echo "Error: Could not download backup from Google Cloud Storage" | tee -a "$LOG_FILE"
        exit 1
      fi
    elif [ "${STORAGE_TYPE}" == "s3" ] && [ ! -z "${AWS_S3_BUCKET:-}" ]; then
      # Download from AWS S3
      aws s3 cp "s3://${AWS_S3_BUCKET}/backups/${ENV}/${BACKUP_FILE}" "$TEMP_BACKUP_PATH" 2>> "$LOG_FILE"
      
      if [ $? -eq 0 ]; then
        echo "Backup downloaded from AWS S3" | tee -a "$LOG_FILE"
        BACKUP_PATH="$TEMP_BACKUP_PATH"
      else
        echo "Error: Could not download backup from AWS S3" | tee -a "$LOG_FILE"
        exit 1
      fi
    fi
  fi
  
  # Final check if backup exists after download attempts
  if [ ! -f "$BACKUP_PATH" ]; then
    echo "Error: Backup file not found: $BACKUP_PATH" | tee -a "$LOG_FILE"
    exit 1
  fi
fi

# Check if backup is encrypted
if [[ "$BACKUP_PATH" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "Error: Backup is encrypted but no encryption key provided" | tee -a "$LOG_FILE"
    echo "Please set BACKUP_ENCRYPTION_KEY in your .env file" | tee -a "$LOG_FILE"
    exit 1
  fi
  
  echo "Decrypting backup..." | tee -a "$LOG_FILE"
  DECRYPTED_PATH="${BACKUP_PATH%.enc}.tmp"
  openssl enc -aes-256-cbc -d -salt -pbkdf2 -in "$BACKUP_PATH" \
    -out "$DECRYPTED_PATH" -pass pass:"$BACKUP_ENCRYPTION_KEY" 2>> "$LOG_FILE"
  
  if [ $? -eq 0 ]; then
    echo "Decryption successful" | tee -a "$LOG_FILE"
    BACKUP_PATH="$DECRYPTED_PATH"
  else
    echo "Error: Failed to decrypt backup" | tee -a "$LOG_FILE"
    exit 1
  fi
fi

# Perform the restore
echo "Restoring database from backup..." | tee -a "$LOG_FILE"

if [[ "$MONGODB_URI" == *+srv* ]]; then
  # Handle MongoDB Atlas connection string (SRV format)
  mongorestore --uri="$MONGODB_URI" --gzip --archive="$BACKUP_PATH" --drop 2>> "$LOG_FILE"
else
  # Standard MongoDB connection
  mongorestore --host="$DB_HOST" --username="$DB_USER" --password="$DB_PASS" \
    --db="$DB_NAME" --gzip --archive="$BACKUP_PATH" --drop 2>> "$LOG_FILE"
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
  echo "Database restore completed successfully" | tee -a "$LOG_FILE"
else
  echo "Error: Database restore failed!" | tee -a "$LOG_FILE"
  
  if [ "$ENV" == "production" ]; then
    echo "⚠️ WARNING: Production restore failed! You may need to manually restore from the pre-restore backup" | tee -a "$LOG_FILE"
    echo "Pre-restore backup file: $PRE_RESTORE_BACKUP" | tee -a "$LOG_FILE"
  fi
  
  exit 1
fi

# Clean up temporary decrypted file if it was created
if [[ "$BACKUP_PATH" == *.tmp ]]; then
  rm "$BACKUP_PATH"
  echo "Temporary decrypted backup removed" | tee -a "$LOG_FILE"
fi

# If this was a cloud-downloaded backup and not in production, clean it up
if [[ "$BACKUP_PATH" == "$BACKUP_DIR"/* ]] && [[ "$BACKUP_PATH" != *".tmp" ]] && [ "$ENV" != "production" ]; then
  if [ "${STORAGE_TYPE:-local}" != "local" ]; then
    rm "$BACKUP_PATH"
    echo "Temporary downloaded backup removed" | tee -a "$LOG_FILE"
  fi
fi

echo "Running database migrations to ensure schema is up to date..." | tee -a "$LOG_FILE"
NODE_ENV="$ENV" npm run --prefix "$PROJECT_ROOT" migrate:up 2>> "$LOG_FILE"

echo "Database restore process completed at $(date)" | tee -a "$LOG_FILE"
