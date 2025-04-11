#!/bin/bash
#
# ThiQaX Platform - MongoDB Backup Script
# 
# This script creates a backup of the MongoDB database used by the ThiQaX platform.
# It supports different environments (development, staging, production) and includes
# compression, encryption, and upload to cloud storage.
#
# Usage: ./backup-db.sh [environment]
# Example: ./backup-db.sh staging

set -e

# Default environment is development
ENV=${1:-development}
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

# Set backup directory and filename
BACKUP_DIR="${PROJECT_ROOT}/backups/${ENV}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="thiqax_${ENV}_${TIMESTAMP}.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# Parse MongoDB connection string to extract components
if [[ "$MONGODB_URI" =~ mongodb(\+srv)?://([^:]+):([^@]+)@([^/]+)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[2]}"
  DB_PASS="${BASH_REMATCH[3]}"
  DB_HOST="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse MongoDB connection string"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log file for backup operations
LOG_FILE="${BACKUP_DIR}/backup_log_${TIMESTAMP}.txt"

echo "Starting backup of ${ENV} database at $(date)" | tee -a "$LOG_FILE"
echo "Backup target: ${BACKUP_PATH}" | tee -a "$LOG_FILE"

# Perform the backup with compression
echo "Executing MongoDB dump..." | tee -a "$LOG_FILE"
if [[ "$MONGODB_URI" == *+srv* ]]; then
  # Handle MongoDB Atlas connection string (SRV format)
  mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_PATH" 2>> "$LOG_FILE"
else
  # Standard MongoDB connection
  mongodump --host="$DB_HOST" --username="$DB_USER" --password="$DB_PASS" \
    --db="$DB_NAME" --gzip --archive="$BACKUP_PATH" 2>> "$LOG_FILE"
fi

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully: ${BACKUP_FILENAME}" | tee -a "$LOG_FILE"
  echo "Backup size: $(du -h "$BACKUP_PATH" | cut -f1)" | tee -a "$LOG_FILE"
else
  echo "Error: Backup failed!" | tee -a "$LOG_FILE"
  exit 1
fi

# Encrypt the backup if encryption key is provided
if [ ! -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "Encrypting backup..." | tee -a "$LOG_FILE"
  ENCRYPTED_PATH="${BACKUP_PATH}.enc"
  openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_PATH" \
    -out "$ENCRYPTED_PATH" -pass pass:"$BACKUP_ENCRYPTION_KEY" 2>> "$LOG_FILE"
  
  if [ $? -eq 0 ]; then
    rm "$BACKUP_PATH"
    BACKUP_PATH="$ENCRYPTED_PATH"
    BACKUP_FILENAME="${BACKUP_FILENAME}.enc"
    echo "Encryption completed successfully" | tee -a "$LOG_FILE"
  else
    echo "Warning: Encryption failed, keeping unencrypted backup" | tee -a "$LOG_FILE"
  fi
fi

# Upload to cloud storage if configured
if [ "${STORAGE_TYPE:-local}" != "local" ] && [ ! -z "${GCP_BUCKET:-}" ]; then
  echo "Uploading backup to cloud storage..." | tee -a "$LOG_FILE"
  
  if [ "${STORAGE_TYPE}" == "gcp" ]; then
    # Upload to Google Cloud Storage
    gsutil cp "$BACKUP_PATH" "gs://${GCP_BUCKET}/backups/${ENV}/${BACKUP_FILENAME}" 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
      echo "Backup uploaded to gs://${GCP_BUCKET}/backups/${ENV}/${BACKUP_FILENAME}" | tee -a "$LOG_FILE"
      
      # Remove local backup if cloud upload successful and not in development
      if [ "$ENV" != "development" ]; then
        rm "$BACKUP_PATH"
        echo "Local backup removed after successful cloud upload" | tee -a "$LOG_FILE"
      fi
    else
      echo "Warning: Cloud upload failed, keeping local backup" | tee -a "$LOG_FILE"
    fi
  elif [ "${STORAGE_TYPE}" == "s3" ] && [ ! -z "${AWS_S3_BUCKET:-}" ]; then
    # Upload to AWS S3
    aws s3 cp "$BACKUP_PATH" "s3://${AWS_S3_BUCKET}/backups/${ENV}/${BACKUP_FILENAME}" 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
      echo "Backup uploaded to s3://${AWS_S3_BUCKET}/backups/${ENV}/${BACKUP_FILENAME}" | tee -a "$LOG_FILE"
      
      # Remove local backup if cloud upload successful and not in development
      if [ "$ENV" != "development" ]; then
        rm "$BACKUP_PATH"
        echo "Local backup removed after successful cloud upload" | tee -a "$LOG_FILE"
      fi
    else
      echo "Warning: Cloud upload failed, keeping local backup" | tee -a "$LOG_FILE"
    fi
  fi
fi

# Implement backup retention policy
if [ "$ENV" != "production" ]; then
  # Keep only last 7 local backups for non-production environments
  echo "Applying backup retention policy..." | tee -a "$LOG_FILE"
  
  # List backups older than the last 7, sorted by date
  OLD_BACKUPS=$(find "$BACKUP_DIR" -name "thiqax_${ENV}_*.gz*" -type f | sort | head -n -7)
  
  if [ ! -z "$OLD_BACKUPS" ]; then
    echo "Removing old backups:" | tee -a "$LOG_FILE"
    for backup in $OLD_BACKUPS; do
      echo "  - $(basename "$backup")" | tee -a "$LOG_FILE"
      rm "$backup"
    done
  else
    echo "No old backups to remove" | tee -a "$LOG_FILE"
  fi
fi

echo "Backup process completed at $(date)" | tee -a "$LOG_FILE"

# Return the backup filename (useful when this script is called from other scripts)
echo "$BACKUP_FILENAME"
