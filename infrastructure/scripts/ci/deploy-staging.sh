#!/bin/bash
#
# ThiQaX Platform Staging Deployment Script
# This script deploys the application to the staging environment
#
# Usage: ./deploy-staging.sh

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

echo "Starting deployment to staging environment at $(date)"
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
ssh $DEPLOY_USER@$DEPLOY_HOST "if [ -f $DEPLOY_FOLDER/shared/.env.staging ]; then cp $DEPLOY_FOLDER/shared/.env.staging $DEPLOY_FOLDER/releases/$TIMESTAMP/.env; else cp $DEPLOY_FOLDER/releases/$TIMESTAMP/.env.example $DEPLOY_FOLDER/releases/$TIMESTAMP/.env; fi"

# Install dependencies
echo "Installing dependencies..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/releases/$TIMESTAMP && npm ci --production"

# Create symlinks to shared resources
echo "Creating symlinks to shared resources..."
ssh $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_FOLDER/shared/logs $DEPLOY_FOLDER/shared/uploads $DEPLOY_FOLDER/shared/security-reports"
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/shared/logs $DEPLOY_FOLDER/releases/$TIMESTAMP/logs"
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/shared/uploads $DEPLOY_FOLDER/releases/$TIMESTAMP/uploads"
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/shared/security-reports $DEPLOY_FOLDER/releases/$TIMESTAMP/security-reports"

# Update symlink to current release
echo "Updating current release symlink..."
ssh $DEPLOY_USER@$DEPLOY_HOST "ln -sfn $DEPLOY_FOLDER/releases/$TIMESTAMP $DEPLOY_FOLDER/current"

# Restart the application
echo "Restarting application services..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/current && pm2 reload ecosystem.config.js --env staging || pm2 start ecosystem.config.js --env staging"

# Clean up old releases (keep last 5)
echo "Cleaning up old releases..."
ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_FOLDER/releases && ls -t | tail -n +6 | xargs rm -rf"

echo "Deployment to staging completed successfully at $(date)"
echo "Deployed version: $TIMESTAMP"
