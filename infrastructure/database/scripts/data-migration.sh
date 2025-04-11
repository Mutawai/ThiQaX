#!/bin/bash
#
# ThiQaX Platform - Data Migration Script
# 
# This script facilitates safe data migration between environments
# (e.g., from staging to production). It includes data validation,
# transformation rules, and automated backup procedures.
#
# Usage: ./data-migration.sh [source-env] [target-env] [options]
# Example: ./data-migration.sh staging production --collections=users,jobs

set -e

# Default parameters
SOURCE_ENV=${1:-staging}
TARGET_ENV=${2:-production}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="${PROJECT_ROOT}/logs"
LOG_FILE="${LOG_DIR}/migration_log_${TIMESTAMP}.txt"
TEMP_DIR="${PROJECT_ROOT}/temp/migration_${TIMESTAMP}"
COLLECTIONS_TO_MIGRATE=""
SKIP_BACKUP=false
SKIP_VALIDATION=false
TRANSFORM_SCRIPT=""
DRY_RUN=false

# Create required directories
mkdir -p "$LOG_DIR" "$TEMP_DIR"

# Parse additional options
for arg in "${@:3}"; do
  case $arg in
    --collections=*)
      COLLECTIONS_TO_MIGRATE="${arg#*=}"
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      ;;
    --skip-validation)
      SKIP_VALIDATION=true
      ;;
    --transform=*)
      TRANSFORM_SCRIPT="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --help)
      echo "Usage: ./data-migration.sh [source-env] [target-env] [options]"
      echo ""
      echo "Options:"
      echo "  --collections=col1,col2    Specify collections to migrate (comma-separated)"
      echo "  --skip-backup              Skip automatic backup of target database"
      echo "  --skip-validation          Skip data validation step"
      echo "  --transform=script.js      Apply custom transformation script to the data"
      echo "  --dry-run                  Simulate migration without applying changes"
      echo "  --help                     Show this help message"
      exit 0
      ;;
  esac
done

echo "Starting data migration from ${SOURCE_ENV} to ${TARGET_ENV} at $(date)" | tee -a "$LOG_FILE"
echo "Options: collections='${COLLECTIONS_TO_MIGRATE}', skip-backup=${SKIP_BACKUP}, skip-validation=${SKIP_VALIDATION}, transform='${TRANSFORM_SCRIPT}', dry-run=${DRY_RUN}" | tee -a "$LOG_FILE"

# Load source environment variables
if [ -f "$PROJECT_ROOT/.env.$SOURCE_ENV" ]; then
  source <(grep -v '^#' "$PROJECT_ROOT/.env.$SOURCE_ENV" | sed 's/^/export SOURCE_/')
elif [ -f "$PROJECT_ROOT/.env" ]; then
  source <(grep -v '^#' "$PROJECT_ROOT/.env" | sed 's/^/export SOURCE_/')
else
  echo "Error: No .env file found for source environment: $SOURCE_ENV" | tee -a "$LOG_FILE"
  exit 1
fi

# Load target environment variables
if [ -f "$PROJECT_ROOT/.env.$TARGET_ENV" ]; then
  source <(grep -v '^#' "$PROJECT_ROOT/.env.$TARGET_ENV" | sed 's/^/export TARGET_/')
elif [ -f "$PROJECT_ROOT/.env" ]; then
  source <(grep -v '^#' "$PROJECT_ROOT/.env" | sed 's/^/export TARGET_/')
else
  echo "Error: No .env file found for target environment: $TARGET_ENV" | tee -a "$LOG_FILE"
  exit 1
fi

# Parse MongoDB connection strings
if [[ "$SOURCE_MONGODB_URI" =~ mongodb(\+srv)?://([^:]+):([^@]+)@([^/]+)/([^?]+) ]]; then
  SOURCE_DB_USER="${BASH_REMATCH[2]}"
  SOURCE_DB_PASS="${BASH_REMATCH[3]}"
  SOURCE_DB_HOST="${BASH_REMATCH[4]}"
  SOURCE_DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse source MongoDB connection string" | tee -a "$LOG_FILE"
  exit 1
fi

if [[ "$TARGET_MONGODB_URI" =~ mongodb(\+srv)?://([^:]+):([^@]+)@([^/]+)/([^?]+) ]]; then
  TARGET_DB_USER="${BASH_REMATCH[2]}"
  TARGET_DB_PASS="${BASH_REMATCH[3]}"
  TARGET_DB_HOST="${BASH_REMATCH[4]}"
  TARGET_DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse target MongoDB connection string" | tee -a "$LOG_FILE"
  exit 1
fi

# Safety checks for production target
if [ "$TARGET_ENV" == "production" ]; then
  echo "⚠️ WARNING: You are about to migrate data to the PRODUCTION environment ⚠️" | tee -a "$LOG_FILE"
  echo "This may OVERWRITE existing data in the production database!" | tee -a "$LOG_FILE"
  
  if [ "$DRY_RUN" == "false" ]; then
    echo "Please type 'CONFIRM PRODUCTION MIGRATION' to proceed:"
    read confirmation
    
    if [ "$confirmation" != "CONFIRM PRODUCTION MIGRATION" ]; then
      echo "Migration cancelled" | tee -a "$LOG_FILE"
      exit 1
    fi
  else
    echo "Running in dry-run mode, no confirmation needed" | tee -a "$LOG_FILE"
  fi
fi

# Backup target database before migration (unless skipped)
if [ "$SKIP_BACKUP" == "false" ] && [ "$DRY_RUN" == "false" ]; then
  echo "Creating backup of target database before migration..." | tee -a "$LOG_FILE"
  PRE_MIGRATION_BACKUP=$("$SCRIPT_DIR/backup-db.sh" "$TARGET_ENV")
  echo "Pre-migration backup created: $PRE_MIGRATION_BACKUP" | tee -a "$LOG_FILE"
fi

# Identify collections to migrate if not explicitly provided
if [ -z "$COLLECTIONS_TO_MIGRATE" ]; then
  echo "No collections specified, identifying collections from source database..." | tee -a "$LOG_FILE"
  
  COLLECTIONS_JSON="$TEMP_DIR/collections.json"
  
  if [[ "$SOURCE_MONGODB_URI" == *+srv* ]]; then
    # Handle MongoDB Atlas connection string (SRV format)
    mongosh --quiet --uri="$SOURCE_MONGODB_URI" --eval "JSON.stringify(db.getCollectionNames())" > "$COLLECTIONS_JSON"
  else
    # Standard MongoDB connection
    mongosh --quiet --host="$SOURCE_DB_HOST" --username="$SOURCE_DB_USER" --password="$SOURCE_DB_PASS" \
      --authenticationDatabase="$SOURCE_DB_NAME" "$SOURCE_DB_NAME" \
      --eval "JSON.stringify(db.getCollectionNames())" > "$COLLECTIONS_JSON"
  fi
  
  # Parse JSON array of collections
  COLLECTIONS_TO_MIGRATE=$(cat "$COLLECTIONS_JSON" | tr -d '[]"' | tr ',' ' ')
  echo "Found collections: $COLLECTIONS_TO_MIGRATE" | tee -a "$LOG_FILE"
fi

# Process each collection for migration
for COLLECTION in ${COLLECTIONS_TO_MIGRATE//,/ }; do
  echo "Processing collection: $COLLECTION" | tee -a "$LOG_FILE"
  
  # Skip system collections
  if [[ "$COLLECTION" == "system."* ]]; then
    echo "Skipping system collection: $COLLECTION" | tee -a "$LOG_FILE"
    continue
  fi
  
  COLLECTION_EXPORT="$TEMP_DIR/${COLLECTION}.json"
  
  # Export data from source database
  echo "Exporting data from $SOURCE_ENV database for collection: $COLLECTION" | tee -a "$LOG_FILE"
  
  if [[ "$SOURCE_MONGODB_URI" == *+srv* ]]; then
    # Handle MongoDB Atlas connection string (SRV format)
    mongoexport --uri="$SOURCE_MONGODB_URI" --collection="$COLLECTION" \
      --out="$COLLECTION_EXPORT" --jsonArray 2>> "$LOG_FILE"
  else
    # Standard MongoDB connection
    mongoexport --host="$SOURCE_DB_HOST" --username="$SOURCE_DB_USER" --password="$SOURCE_DB_PASS" \
      --db="$SOURCE_DB_NAME" --collection="$COLLECTION" \
      --out="$COLLECTION_EXPORT" --jsonArray 2>> "$LOG_FILE"
  fi
  
  # Apply transformations if specified
  if [ ! -z "$TRANSFORM_SCRIPT" ] && [ -f "$TRANSFORM_SCRIPT" ]; then
    echo "Applying data transformations using script: $TRANSFORM_SCRIPT" | tee -a "$LOG_FILE"
    TRANSFORMED_EXPORT="${COLLECTION_EXPORT}.transformed"
    
    # Run transformation script - assumes a Node.js script that reads input file and writes to output
    NODE_ENV="$TARGET_ENV" node "$TRANSFORM_SCRIPT" "$COLLECTION_EXPORT" "$TRANSFORMED_EXPORT" "$COLLECTION" 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ] && [ -f "$TRANSFORMED_EXPORT" ]; then
      mv "$TRANSFORMED_EXPORT" "$COLLECTION_EXPORT"
      echo "Transformation successful for collection: $COLLECTION" | tee -a "$LOG_FILE"
    else
      echo "Error: Transformation failed for collection: $COLLECTION" | tee -a "$LOG_FILE"
      continue
    fi
  fi
  
  # Validate data if required
  if [ "$SKIP_VALIDATION" == "false" ]; then
    echo "Validating data for collection: $COLLECTION" | tee -a "$LOG_FILE"
    
    # Use a simple validation check based on the schema
    VALIDATION_SCRIPT="$PROJECT_ROOT/scripts/validate-collection.js"
    
    if [ -f "$VALIDATION_SCRIPT" ]; then
      NODE_ENV="$TARGET_ENV" node "$VALIDATION_SCRIPT" "$COLLECTION_EXPORT" "$COLLECTION" 2>> "$LOG_FILE"
      
      if [ $? -ne 0 ]; then
        echo "Error: Validation failed for collection: $COLLECTION" | tee -a "$LOG_FILE"
        echo "Migration will continue with other collections. Fix validation issues and try again." | tee -a "$LOG_FILE"
        continue
      fi
    else
      echo "Warning: Validation script not found, skipping validation" | tee -a "$LOG_FILE"
    fi
  fi
  
  # If this is a dry run, skip the actual import
  if [ "$DRY_RUN" == "true" ]; then
    echo "[DRY RUN] Would import $(jq length "$COLLECTION_EXPORT") documents to $TARGET_ENV.$COLLECTION" | tee -a "$LOG_FILE"
    continue
  fi
  
  # Import data to target database
  echo "Importing data to $TARGET_ENV database for collection: $COLLECTION" | tee -a "$LOG_FILE"
  
  if [[ "$TARGET_MONGODB_URI" == *+srv* ]]; then
    # Handle MongoDB Atlas connection string (SRV format)
    mongoimport --uri="$TARGET_MONGODB_URI" --collection="$COLLECTION" \
      --file="$COLLECTION_EXPORT" --drop 2>> "$LOG_FILE"
  else
    # Standard MongoDB connection
    mongoimport --host="$TARGET_DB_HOST" --username="$TARGET_DB_USER" --password="$TARGET_DB_PASS" \
      --db="$TARGET_DB_NAME" --collection="$COLLECTION" \
      --file="$COLLECTION_EXPORT" --drop 2>> "$LOG_FILE"
  fi
  
  if [ $? -eq 0 ]; then
    echo "Successfully migrated collection: $COLLECTION" | tee -a "$LOG_FILE"
  else
    echo "Error: Failed to import collection: $COLLECTION" | tee -a "$LOG_FILE"
  fi
done

# Run post-migration tasks
if [ "$DRY_RUN" == "false" ]; then
  echo "Running database migrations to ensure schema consistency..." | tee -a "$LOG_FILE"
  NODE_ENV="$TARGET_ENV" npm run --prefix "$PROJECT_ROOT" migrate:up 2>> "$LOG_FILE"
  
  echo "Rebuilding indexes..." | tee -a "$LOG_FILE"
  if [[ "$TARGET_MONGODB_URI" == *+srv* ]]; then
    mongosh --quiet --uri="$TARGET_MONGODB_URI" --eval "db.getCollectionNames().forEach(col => db[col].reIndex())" 2>> "$LOG_FILE"
  else
    mongosh --quiet --host="$TARGET_DB_HOST" --username="$TARGET_DB_USER" --password="$TARGET_DB_PASS" \
      --authenticationDatabase="$TARGET_DB_NAME" "$TARGET_DB_NAME" \
      --eval "db.getCollectionNames().forEach(col => db[col].reIndex())" 2>> "$LOG_FILE"
  fi
else
  echo "[DRY RUN] Would run post-migration tasks (migrations and index rebuild)" | tee -a "$LOG_FILE"
fi

# Clean up temporary files
echo "Cleaning up temporary files..." | tee -a "$LOG_FILE"
rm -rf "$TEMP_DIR"

# Provide summary
echo "Data migration process completed at $(date)" | tee -a "$LOG_FILE"
if [ "$DRY_RUN" == "true" ]; then
  echo "[DRY RUN] No actual changes were made to the target database" | tee -a "$LOG_FILE"
else
  echo "Data has been successfully migrated from $SOURCE_ENV to $TARGET_ENV" | tee -a "$LOG_FILE"
  
  if [ "$SKIP_BACKUP" == "false" ]; then
    echo "Pre-migration backup is available at: $PRE_MIGRATION_BACKUP" | tee -a "$LOG_FILE"
  fi
fi

echo "Log file: $LOG_FILE"
