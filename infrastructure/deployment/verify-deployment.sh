#!/bin/bash
#==============================================================================
# verify-deployment.sh
# 
# Verifies a successful deployment of the ThiQaX platform.
# 
# This script performs comprehensive checks on:
#   - Service availability
#   - API endpoints
#   - Database connectivity
#   - SSL certificate validity
#   - Configuration integrity
#
# Usage:
#   ./verify-deployment.sh [environment] [deployment_id]
#   
#   environment:  The environment to verify (staging|production)
#   deployment_id: The deployment ID to verify (optional)
#
# Exit codes:
#   0 - Deployment verification successful
#   1 - Deployment verification failed
#   2 - Invalid arguments
#==============================================================================

set -e

# Load common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../utils/common.sh"

# Constants
MAX_RETRIES=10
RETRY_INTERVAL=5
LOG_FILE="deployment-verification-$(date +%Y%m%d-%H%M%S).log"
TIMEOUT=300 # 5 minutes timeout for verification

# Default values
ENVIRONMENT="staging"
DEPLOYMENT_ID=$(date +%Y%m%d%H%M%S)
START_TIME=$(date +%s)

# Parse arguments
function parse_args() {
  if [[ $# -gt 0 ]]; then
    ENVIRONMENT="$1"
  fi
  
  if [[ $# -gt 1 ]]; then
    DEPLOYMENT_ID="$2"
  fi
  
  # Validate environment
  if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 2
  fi
}

# Load environment-specific variables
function load_environment() {
  local env_file=".env.${ENVIRONMENT}"
  
  if [[ ! -f "$env_file" ]]; then
    log_error "Environment file not found: $env_file"
    exit 1
  fi
  
  log_info "Loading environment from $env_file"
  set -a
  source "$env_file"
  set +a
  
  # Set base URL
  if [[ "$ENVIRONMENT" == "staging" ]]; then
    BASE_URL="https://staging.thiqax.com"
  else
    BASE_URL="https://thiqax.com"
  fi
}

# Verify service availability
function verify_service() {
  log_info "Verifying service availability at $BASE_URL"
  
  local attempt=1
  local success=false
  
  while [[ $attempt -le $MAX_RETRIES ]]; do
    log_info "Attempt $attempt of $MAX_RETRIES..."
    
    if curl -s -f -o /dev/null "$BASE_URL"; then
      log_success "Service is available"
      success=true
      break
    else
      log_warning "Service not available, retrying in $RETRY_INTERVAL seconds..."
      sleep $RETRY_INTERVAL
      attempt=$((attempt + 1))
    fi
  done
  
  if [[ "$success" != "true" ]]; then
    log_error "Service verification failed after $MAX_RETRIES attempts"
    return 1
  fi
  
  return 0
}

# Verify API endpoints
function verify_api() {
  log_info "Verifying API endpoints"
  
  local endpoints=(
    "/api/v1/health"
    "/api/v1/status"
    "/api-docs"
  )
  
  for endpoint in "${endpoints[@]}"; do
    log_info "Checking endpoint: $endpoint"
    
    local response=$(curl -s -f -H "Content-Type: application/json" "${BASE_URL}${endpoint}")
    local status=$?
    
    if [[ $status -ne 0 ]]; then
      log_error "Failed to access endpoint: $endpoint"
      return 1
    fi
    
    if [[ "$endpoint" == "/api/v1/health" ]]; then
      if ! echo "$response" | grep -q '"status":"healthy"'; then
        log_error "Health check failed. Response: $response"
        return 1
      fi
    fi
    
    log_success "Endpoint $endpoint is accessible"
  done
  
  log_success "All API endpoints verified successfully"
  return 0
}

# Verify database connectivity
function verify_database() {
  log_info "Verifying database connectivity"
  
  # Execute database check via API
  local response=$(curl -s -f -H "Content-Type: application/json" "${BASE_URL}/api/v1/health/db")
  local status=$?
  
  if [[ $status -ne 0 ]]; then
    log_error "Failed to check database connectivity"
    return 1
  fi
  
  if ! echo "$response" | grep -q '"database":"connected"'; then
    log_error "Database connectivity check failed. Response: $response"
    return 1
  fi
  
  log_success "Database connectivity verified successfully"
  return 0
}

# Verify SSL certificate
function verify_ssl() {
  log_info "Verifying SSL certificate"
  
  # Check expiration date
  local domain="${BASE_URL#https://}"
  local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates)
  
  if [[ $? -ne 0 ]]; then
    log_error "Failed to check SSL certificate"
    return 1
  fi
  
  local expiry_date=$(echo "$ssl_info" | grep 'notAfter=' | cut -d= -f2)
  local expiry_timestamp=$(date -d "$expiry_date" +%s)
  local current_timestamp=$(date +%s)
  local days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
  
  if [[ $days_remaining -lt 30 ]]; then
    log_warning "SSL certificate will expire in $days_remaining days"
  else
    log_info "SSL certificate valid for $days_remaining days"
  fi
  
  log_success "SSL certificate verification completed"
  return 0
}

# Verify configuration integrity
function verify_configuration() {
  log_info "Verifying configuration integrity"
  
  # Check if all required environment variables are set
  local required_vars=(
    "NODE_ENV"
    "PORT"
    "BASE_URL"
    "MONGODB_URI"
    "JWT_SECRET"
  )
  
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
      log_error "Required environment variable not set: $var"
      return 1
    fi
  done
  
  # Check if environment matches
  if [[ "$NODE_ENV" != "$ENVIRONMENT" ]]; then
    log_error "Environment mismatch: NODE_ENV=$NODE_ENV, expected $ENVIRONMENT"
    return 1
  fi
  
  log_success "Configuration integrity verified successfully"
  return 0
}

# Check if verification has timed out
function check_timeout() {
  local current_time=$(date +%s)
  local elapsed_time=$((current_time - START_TIME))
  
  if [[ $elapsed_time -gt $TIMEOUT ]]; then
    log_error "Verification timed out after ${elapsed_time}s (timeout: ${TIMEOUT}s)"
    return 1
  fi
  
  return 0
}

# Run all verification checks
function run_verification() {
  local failed=false
  
  # Run verification checks
  check_timeout || failed=true
  verify_service || failed=true
  check_timeout || failed=true
  verify_api || failed=true
  check_timeout || failed=true
  verify_database || failed=true
  check_timeout || failed=true
  verify_ssl || failed=true
  check_timeout || failed=true
  verify_configuration || failed=true
  
  if [[ "$failed" == "true" ]]; then
    log_error "Deployment verification failed for deployment ID: $DEPLOYMENT_ID"
    return 1
  fi
  
  log_success "Deployment verification successful for deployment ID: $DEPLOYMENT_ID"
  return 0
}

# Save verification results
function save_results() {
  local status=$1
  local end_time=$(date +%s)
  local duration=$((end_time - START_TIME))
  
  log_info "Verification completed in ${duration}s"
  
  # Save verification results to database or file
  {
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Environment: $ENVIRONMENT"
    echo "Start Time: $(date -d @$START_TIME '+%Y-%m-%d %H:%M:%S')"
    echo "End Time: $(date -d @$end_time '+%Y-%m-%d %H:%M:%S')"
    echo "Duration: ${duration}s"
    echo "Status: $status"
  } > "verification-$DEPLOYMENT_ID.log"
  
  log_info "Verification results saved to verification-$DEPLOYMENT_ID.log"
}

# Main function
function main() {
  log_info "Starting deployment verification for $ENVIRONMENT (Deployment ID: $DEPLOYMENT_ID)"
  
  parse_args "$@"
  load_environment
  
  if run_verification; then
    save_results "SUCCESS"
    exit 0
  else
    save_results "FAILED"
    exit 1
  fi
}

# Execute main function
main "$@"
