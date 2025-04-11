#!/bin/bash
#==============================================================================
# rollback-staging.sh
# 
# Performs an automated rollback of the ThiQaX platform in the staging environment.
# 
# This script:
#   - Retrieves the previous stable deployment
#   - Stops current services
#   - Restores previous deployment files and database
#   - Restarts services
#   - Verifies rollback success
#
# Usage:
#   ./rollback-staging.sh [deployment_id]
#   
#   deployment_id: Specific deployment ID to roll back to (optional)
#                  If not provided, rolls back to the last stable deployment
#
# Exit codes:
#   0 - Rollback successful
#   1 - Rollback failed
#   2 - Invalid arguments
#==============================================================================

set -e

# Load common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../utils/common.sh"

# Constants
ENVIRONMENT="staging"
DEPLOY_ROOT="/var/www/thiqax/staging"
BACKUP_DIR="${DEPLOY_ROOT}/backups"
DOCKER_COMPOSE_FILE="${DEPLOY_ROOT}/docker-compose.yml"
DB_BACKUP_PREFIX="mongodb-backup-staging"
MAX_RETRIES=3
LOG_FILE="rollback-staging-$(date +%Y%m%d-%H%M%S).log"

# Initialize variables
TARGET_DEPLOYMENT=""
CURRENT_DEPLOYMENT=""
ROLLBACK_START_TIME=$(date +%s)

# Parse arguments
function parse_args() {
  if [[ $# -gt 0 ]]; then
    TARGET_DEPLOYMENT="$1"
    log_info "Target deployment ID specified: $TARGET_DEPLOYMENT"
  else
    log_info "No target deployment specified, will roll back to last stable deployment"
  fi
}

# Load environment configuration
function load_environment() {
  local env_file="${DEPLOY_ROOT}/.env.${ENVIRONMENT}"
  
  if [[ ! -f "$env_file" ]]; then
    log_error "Environment file not found: $env_file"
    exit 1
  fi
  
  log_info "Loading environment from $env_file"
  set -a
  source "$env_file"
  set +a
}

# Find the last stable deployment
function find_stable_deployment() {
  if [[ -n "$TARGET_DEPLOYMENT" ]]; then
    # Check if the specified deployment exists
    if [[ ! -d "${BACKUP_DIR}/${TARGET_DEPLOYMENT}" ]]; then
      log_error "Specified deployment not found: ${TARGET_DEPLOYMENT}"
      exit 1
    fi
    
    log_info "Using specified deployment: ${TARGET_DEPLOYMENT}"
    return
  fi
  
  log_info "Looking for the last stable deployment..."
  
  # Find all deployments with "STABLE" status
  local stable_deployments=($(ls -1t "${BACKUP_DIR}" | grep -v "current" | xargs -I{} grep -l "STATUS=STABLE" "${BACKUP_DIR}/{}/deploy.info" 2>/dev/null | xargs -I{} basename $(dirname {})))
  
  if [[ ${#stable_deployments[@]} -eq 0 ]]; then
    log_error "No stable deployments found"
    exit 1
  fi
  
  TARGET_DEPLOYMENT="${stable_deployments[0]}"
  log_info "Last stable deployment found: ${TARGET_DEPLOYMENT}"
}

# Get current deployment information
function get_current_deployment() {
  if [[ -L "${DEPLOY_ROOT}/current" ]]; then
    CURRENT_DEPLOYMENT=$(basename $(readlink -f "${DEPLOY_ROOT}/current"))
    log_info "Current deployment: ${CURRENT_DEPLOYMENT}"
  else
    log_error "Current deployment link not found"
    exit 1
  fi
}

# Backup current deployment
function backup_current_deployment() {
  log_info "Backing up current deployment: ${CURRENT_DEPLOYMENT}"
  
  # Create backup directory if it doesn't exist
  local current_backup_dir="${BACKUP_DIR}/${CURRENT_DEPLOYMENT}"
  mkdir -p "$current_backup_dir"
  
  # Backup environment file
  cp "${DEPLOY_ROOT}/.env.${ENVIRONMENT}" "${current_backup_dir}/"
  
  # Backup database
  local db_backup_file="${current_backup_dir}/${DB_BACKUP_PREFIX}-$(date +%Y%m%d-%H%M%S).gz"
  log_info "Backing up database to ${db_backup_file}"
  
  if ! mongodump --uri="$MONGODB_URI" --gzip --archive="$db_backup_file"; then
    log_warning "Database backup failed, continuing with rollback"
  fi
  
  # Save deployment status
  echo "DEPLOYMENT_ID=${CURRENT_DEPLOYMENT}" > "${current_backup_dir}/deploy.info"
  echo "TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)" >> "${current_backup_dir}/deploy.info"
  echo "STATUS=ROLLED_BACK" >> "${current_backup_dir}/deploy.info"
  echo "ROLLED_BACK_TO=${TARGET_DEPLOYMENT}" >> "${current_backup_dir}/deploy.info"
  
  log_success "Current deployment backed up successfully"
}

# Stop current services
function stop_services() {
  log_info "Stopping current services"
  
  if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    exit 1
  fi
  
  log_info "Running docker-compose down"
  cd "$DEPLOY_ROOT" && docker-compose -f "$DOCKER_COMPOSE_FILE" down
  
  log_success "Services stopped successfully"
}

# Restore previous deployment
function restore_deployment() {
  log_info "Restoring deployment: ${TARGET_DEPLOYMENT}"
  
  local target_dir="${BACKUP_DIR}/${TARGET_DEPLOYMENT}"
  
  if [[ ! -d "$target_dir" ]]; then
    log_error "Target deployment directory not found: $target_dir"
    exit 1
  fi
  
  # Restore application files
  log_info "Restoring application files"
  
  # Remove current symlink
  rm -f "${DEPLOY_ROOT}/current"
  
  # Create new symlink to target deployment
  ln -sf "${target_dir}" "${DEPLOY_ROOT}/current"
  
  # Restore environment file
  cp "${target_dir}/.env.${ENVIRONMENT}" "${DEPLOY_ROOT}/"
  
  # Find latest database backup for target deployment
  local db_backup=$(ls -1t "${target_dir}/${DB_BACKUP_PREFIX}"* 2>/dev/null | head -1)
  
  if [[ -n "$db_backup" ]]; then
    log_info "Restoring database from ${db_backup}"
    if ! mongorestore --uri="$MONGODB_URI" --gzip --drop --archive="$db_backup"; then
      log_error "Database restore failed"
      exit 1
    fi
  else
    log_warning "No database backup found for target deployment"
  fi
  
  log_success "Deployment restored successfully"
}

# Start services
function start_services() {
  log_info "Starting services"
  
  if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
    log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    exit 1
  fi
  
  log_info "Running docker-compose up -d"
  cd "$DEPLOY_ROOT" && docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
  
  log_success "Services started successfully"
}

# Verify rollback
function verify_rollback() {
  log_info "Verifying rollback"
  
  # Wait for services to be fully up
  log_info "Waiting for services to be fully up..."
  sleep 10
  
  # Run verification script
  if "${SCRIPT_DIR}/verify-deployment.sh" "$ENVIRONMENT"; then
    log_success "Rollback verification successful"
    return 0
  else
    log_error "Rollback verification failed"
    return 1
  fi
}

# Update deployment status
function update_deployment_status() {
  local status=$1
  local end_time=$(date +%s)
  local duration=$((end_time - ROLLBACK_START_TIME))
  
  log_info "Rollback completed in ${duration}s"
  
  # Update target deployment status
  local target_dir="${BACKUP_DIR}/${TARGET_DEPLOYMENT}"
  echo "DEPLOYMENT_ID=${TARGET_DEPLOYMENT}" > "${target_dir}/deploy.info"
  echo "TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)" >> "${target_dir}/deploy.info"
  echo "STATUS=${status}" >> "${target_dir}/deploy.info"
  echo "ROLLED_BACK_FROM=${CURRENT_DEPLOYMENT}" >> "${target_dir}/deploy.info"
  
  # Send notification
  "${SCRIPT_DIR}/notify-deployment.sh" "rollback" "$ENVIRONMENT" "$TARGET_DEPLOYMENT" "$status" "$duration"
}

# Main function
function main() {
  log_info "Starting rollback process for ${ENVIRONMENT} environment"
  
  parse_args "$@"
  load_environment
  find_stable_deployment
  get_current_deployment
  
  # Check if we're already on the target deployment
  if [[ "$CURRENT_DEPLOYMENT" == "$TARGET_DEPLOYMENT" ]]; then
    log_warning "Current deployment is already ${TARGET_DEPLOYMENT}, no rollback needed"
    exit 0
  fi
  
  backup_current_deployment
  stop_services
  restore_deployment
  start_services
  
  if verify_rollback; then
    update_deployment_status "STABLE"
    log_success "Rollback to ${TARGET_DEPLOYMENT} completed successfully"
    exit 0
  else
    update_deployment_status "FAILED"
    log_error "Rollback to ${TARGET_DEPLOYMENT} failed"
    exit 1
  fi
}

# Execute main function
main "$@"
