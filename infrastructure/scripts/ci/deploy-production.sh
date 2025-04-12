#!/bin/bash
#
# ThiQaX Platform Production Deployment Script
# This script deploys the application to the production environment
#
# Usage: ./deploy-production.sh

set -e

# Check if environment variables are set
if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_PATH" ]; then
  echo "Error: Required environment variables are not set"
  echo "Required: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d%H%M%S)
DEPLOY_FOLDER="$DEPLOY_PATH"
BACKUP_FOLDER="$DEPLOY_PATH/backups/$TIMESTAMP"
LOG_FILE="deployment-$TIMESTAMP.log"

echo "Starting deployment to production environment at $(date)"
echo "Deployment host: $DEPLOY_HOST"
echo "Deployment path: $DEPLOY_PATH"

# Create backup directory
echo "Creating backup directory..."
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $BACKUP_FOLDER"

# Backup current deployment
echo "Backing up current deployment..."
ssh $DEPLOY_USER@$DEPLOY_HOST "if [ -d $DEPLOY_FOLDER/current ]; then cp -R $DEPLOY_FOLDER/current/* $BACKUP_FOLDER/; fi"

# Create releases directory if it doesn't exist
echo "Setting up deployment structure..."
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_FOLDER/releases/$TIMESTAMP"

# Upload deployment package
echo "Uploading deployment package..."
scp thiqax-deployment.zip $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_FOLDER/releases/$TIMESTAMP/

# Extract deployment package
echo "Extracting deployment package..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/releases/$TIMESTAMP && unzip -q thiqax-deployment.zip && rm thiqax-deployment.zip"

# Copy environment file
echo "Setting up environment configuration..."
ssh $DEPLOY_USER@$DEPLOY_HOST "if [ -f $DEPLOY_FOLDER/shared/.env.production ]; then cp $DEPLOY_FOLDER/shared/.env.production $DEPLOY_FOLDER/releases/$TIMESTAMP/.env; else cp $DEPLOY_FOLDER/releases/$TIMESTAMP/.env.example $DEPLOY_FOLDER/releases/$TIMESTAMP/.env; fi"

# Install dependencies
echo "Installing dependencies..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/releases/$TIMESTAMP && npm ci --production"

# Create symlinks to shared resources
echo "Creating symlinks to shared resources..."
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_FOLDER/shared/logs $DEPLOY_FOLDER/shared/uploads $DEPLOY_FOLDER/shared/security-reports"
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/shared/logs $DEPLOY_FOLDER/releases/$TIMESTAMP/logs"
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/shared/uploads $DEPLOY_FOLDER/releases/$TIMESTAMP/uploads"
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/shared/security-reports $DEPLOY_FOLDER/releases/$TIMESTAMP/security-reports"

# Run pre-deployment checks
echo "Running pre-deployment checks..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/releases/$TIMESTAMP && NODE_ENV=production node scripts/ci/pre-deployment-check.js"

if [ $? -ne 0 ]; then
  echo "Pre-deployment checks failed. Aborting deployment."
  exit 1
fi

# Gracefully stop the current application
echo "Stopping current application..."
ssh $DEPLOY_USER@$DEPLOY_HOST "if pm2 list | grep -q thiqax-api; then pm2 stop thiqax-api; fi"

# Update symlink to current release
echo "Updating current release symlink..."
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/releases/$TIMESTAMP $DEPLOY_FOLDER/current"

# Start the application
echo "Starting application services..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/current && pm2 start ecosystem.config.js --env production"

# Run post-deployment verification
echo "Running post-deployment verification..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/current && NODE_ENV=production node scripts/ci/post-deployment-check.js"

if [ $? -ne 0 ]; then
  echo "Post-deployment verification failed. Rolling back..."
  # Get previous release
  PREVIOUS_RELEASE=$(ssh $DEPLOY_USER@$DEPLOY_HOST "ls -t $DEPLOY_FOLDER/releases | sed -n 2p")
  
  if [ -n "$PREVIOUS_RELEASE" ]; then
    echo "Rolling back to previous release: $PREVIOUS_RELEASE"
    ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/releases/$PREVIOUS_RELEASE $DEPLOY_FOLDER/current"
    ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/current && pm2 restart ecosystem.config.js --env production"
    echo "Rollback completed. Deployment failed."
    exit 1
  else
    echo "No previous release found for rollback. Current deployment remains active despite verification failure."
  fi
fi

# Clean up old releases (keep last 3)
echo "Cleaning up old releases..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/releases && ls -t | tail -n +4 | xargs rm -rf"

echo "Deployment to production completed successfully at $(date)"
echo "Deployed version: $TIMESTAMP"
