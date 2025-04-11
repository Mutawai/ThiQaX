#!/bin/bash
#==============================================================================
# ThiQaX Platform - SSL Certificate Renewal Script
# 
# Description:
#   Handles the automated renewal of SSL certificates for ThiQaX environments.
#   This script checks for certificates nearing expiration and renews them
#   automatically, with proper notification and service reloading.
#
# Usage:
#   ./renew-certificates.sh [--force] [--notify-only] [--environment=ENV]
#
# Options:
#   --force          Force renewal regardless of expiration date
#   --notify-only    Check expiration and notify only, don't renew
#   --environment    Specify environment (staging|production), defaults to all
#
# Examples:
#   ./renew-certificates.sh
#   ./renew-certificates.sh --force
#   ./renew-certificates.sh --notify-only
#   ./renew-certificates.sh --environment=production
#
# Cron Usage:
#   0 3 * * * /path/to/renew-certificates.sh >> /var/log/thiqax/ssl/renewal.log 2>&1
#
# Dependencies:
#   - certbot
#   - openssl
#   - nginx
#==============================================================================

set -e

# Default values
FORCE_RENEWAL=false
NOTIFY_ONLY=false
ENVIRONMENT="all"
EXPIRY_THRESHOLD=30  # Days before expiration to trigger renewal
CRITICAL_THRESHOLD=7 # Days before expiration to trigger critical alert

# Log file location
LOG_DIR="/var/log/thiqax/ssl"
LOG_FILE="${LOG_DIR}/certificate_renewal_$(date +%Y%m%d_%H%M%S).log"

# Certificate directories
CERT_DIR="/etc/letsencrypt/live"
NGINX_SSL_DIR="/etc/nginx/ssl"

# Notification settings
NOTIFICATION_EMAIL="monitoring@thiqax.com,admin@thiqax.com"
SLACK_WEBHOOK=""

# Initialize logging
function setup_logging() {
  mkdir -p "${LOG_DIR}"
  touch "${LOG_FILE}"
  exec > >(tee -a "${LOG_FILE}") 2>&1
  echo "$(date +"%Y-%m-%d %H:%M:%S") [INFO] Starting SSL certificate renewal check"
}

# Log messages with timestamp and level
function log() {
  local level=$1
  local message=$2
  echo "$(date +"%Y-%m-%d %H:%M:%S") [${level}] ${message}"
}

# Parse command line arguments
function parse_args() {
  for arg in "$@"; do
    case $arg in
      --force)
        FORCE_RENEWAL=true
        shift
        ;;
      --notify-only)
        NOTIFY_ONLY=true
        shift
        ;;
      --environment=*)
        ENVIRONMENT="${arg#*=}"
        shift
        ;;
      *)
        log "WARNING" "Unknown argument: $arg"
        shift
        ;;
    esac
  done
  
  # Validate environment if specified
  if [ "${ENVIRONMENT}" != "all" ]; then
    if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
      log "ERROR" "Invalid environment: ${ENVIRONMENT}. Must be 'staging', 'production', or 'all'"
      exit 1
    fi
  fi
  
  log "INFO" "Mode: ${NOTIFY_ONLY:+"Notify only"} ${FORCE_RENEWAL:+"Force renewal"} ${(!NOTIFY_ONLY && !FORCE_RENEWAL):+"Normal"}"
  log "INFO" "Environment: ${ENVIRONMENT}"
}

# Check prerequisites
function check_prerequisites() {
  log "INFO" "Checking prerequisites..."
  
  # Check for certbot
  if ! command -v certbot &> /dev/null; then
    log "ERROR" "certbot is not installed"
    exit 1
  fi
  
  # Check for openssl
  if ! command -v openssl &> /dev/null; then
    log "ERROR" "openssl is not installed"
    exit 1
  fi
  
  log "INFO" "All prerequisites satisfied"
}

# Get a list of domains with certificates
function get_certificate_domains() {
  log "INFO" "Discovering certificate domains..."
  
  if [ ! -d "${CERT_DIR}" ]; then
    log "ERROR" "Certificate directory ${CERT_DIR} not found"
    exit 1
  fi
  
  # Get list of domains (directory names in CERT_DIR)
  local domains=()
  for domain_dir in "${CERT_DIR}"/*; do
    if [ -d "${domain_dir}" ]; then
      domain=$(basename "${domain_dir}")
      
      # Skip if we're filtering by environment and this doesn't match
      if [ "${ENVIRONMENT}" != "all" ]; then
        if [[ "${ENVIRONMENT}" == "staging" && "${domain}" != *"staging"* ]]; then
          continue
        fi
        if [[ "${ENVIRONMENT}" == "production" && "${domain}" == *"staging"* ]]; then
          continue
        fi
      fi
      
      domains+=("${domain}")
    fi
  done
  
  if [ ${#domains[@]} -eq 0 ]; then
    log "WARNING" "No certificate domains found matching environment: ${ENVIRONMENT}"
    exit 0
  fi
  
  log "INFO" "Found ${#domains[@]} certificate domains: ${domains[*]}"
  echo "${domains[@]}"
}

# Check certificate expiration and return days until expiry
function check_expiration() {
  local domain=$1
  local cert_path="${CERT_DIR}/${domain}/fullchain.pem"
  
  if [ ! -f "${cert_path}" ]; then
    log "ERROR" "Certificate file not found: ${cert_path}"
    echo -1
    return
  fi
  
  # Get expiration date
  local expiry_date=$(openssl x509 -enddate -noout -in "${cert_path}" | cut -d= -f2)
  local expiry_epoch=$(date -d "${expiry_date}" +%s)
  local current_epoch=$(date +%s)
  local seconds_until_expiry=$((expiry_epoch - current_epoch))
  local days_until_expiry=$((seconds_until_expiry / 86400))
  
  log "INFO" "Certificate for ${domain} expires in ${days_until_expiry} days (${expiry_date})"
  echo "${days_until_expiry}"
}

# Send notification about certificate expiration
function send_notification() {
  local domain=$1
  local days=$2
  local level=$3  # info, warning, critical
  
  log "INFO" "Sending ${level} notification about certificate for ${domain} (${days} days until expiry)"
  
  # Email notification
  if [ -n "${NOTIFICATION_EMAIL}" ]; then
    local subject="[ThiQaX ${level^^}] SSL Certificate for ${domain} expires in ${days} days"
    local body="
SSL Certificate Alert

Domain: ${domain}
Expiration: In ${days} days
Status: ${level^^}
Environment: ${ENVIRONMENT}
Action: ${days:-0} <= ${CRITICAL_THRESHOLD} ? 'IMMEDIATE ACTION REQUIRED' : 'Renewal recommended'

This is an automated alert from the ThiQaX SSL certificate monitoring system.
Please check the certificate status and ensure renewal is properly configured.

Log file: ${LOG_FILE}
    "
    
    echo "${body}" | mail -s "${subject}" "${NOTIFICATION_EMAIL}"
    
    if [ $? -ne 0 ]; then
      log "ERROR" "Failed to send email notification"
    else
      log "INFO" "Email notification sent to ${NOTIFICATION_EMAIL}"
    fi
  fi
  
  # Slack notification
  if [ -n "${SLACK_WEBHOOK}" ]; then
    local color
    case "${level}" in
      info) color="#36a64f" ;;
      warning) color="#f2c744" ;;
      critical) color="#d00000" ;;
      *) color="#777777" ;;
    esac
    
    local slack_payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "${color}",
      "title": "SSL Certificate Alert - ${domain}",
      "text": "Certificate expires in ${days} days",
      "fields": [
        {"title": "Domain", "value": "${domain}", "short": true},
        {"title": "Environment", "value": "${ENVIRONMENT}", "short": true},
        {"title": "Expiry", "value": "${days} days", "short": true},
        {"title": "Status", "value": "${level^^}", "short": true}
      ]
    }
  ]
}
EOF
)
    
    curl -s -X POST -H "Content-type: application/json" --data "${slack_payload}" "${SLACK_WEBHOOK}"
    
    if [ $? -ne 0 ]; then
      log "ERROR" "Failed to send Slack notification"
    else
      log "INFO" "Slack notification sent"
    fi
  fi
}

# Renew certificates using certbot
function renew_certificate() {
  local domain=$1
  
  log "INFO" "Renewing certificate for ${domain}..."
  
  # Determine renewal command
  local certbot_cmd="certbot renew --cert-name ${domain} --quiet"
  
  if [ "${FORCE_RENEWAL}" = true ]; then
    certbot_cmd="${certbot_cmd} --force-renewal"
  fi
  
  # Run certbot to renew
  eval "${certbot_cmd}"
  
  if [ $? -ne 0 ]; then
    log "ERROR" "Failed to renew certificate for ${domain}"
    send_notification "${domain}" 0 "critical"
    return 1
  fi
  
  log "INFO" "Successfully renewed certificate for ${domain}"
  
  # Verify the renewal
  local new_expiry=$(check_expiration "${domain}")
  
  if [ "${new_expiry}" -lt 80 ]; then
    log "WARNING" "Certificate renewal might have failed. New expiry is only ${new_expiry} days"
    send_notification "${domain}" "${new_expiry}" "warning"
    return 1
  fi
  
  send_notification "${domain}" "${new_expiry}" "info"
  return 0
}

# Reload services after certificate renewal
function reload_services() {
  log "INFO" "Reloading services to apply new certificates..."
  
  # Reload nginx
  if systemctl is-active --quiet nginx; then
    log "INFO" "Reloading Nginx..."
    systemctl reload nginx
    
    if [ $? -ne 0 ]; then
      log "ERROR" "Failed to reload Nginx"
      return 1
    fi
  else
    log "WARNING" "Nginx is not running, skipping reload"
  fi
  
  # Add other services here that need reloading after certificate renewal
  
  log "INFO" "Services reloaded successfully"
  return 0
}

# Update symbolic links to point to renewed certificates
function update_symlinks() {
  log "INFO" "Updating symbolic links for renewed certificates..."
  
  # Ensure the nginx ssl directory exists
  mkdir -p "${NGINX_SSL_DIR}"
  
  # Prepare domain-specific symlink names based on environment
  local cert_name
  local key_name
  
  if [ "${ENVIRONMENT}" == "staging" ]; then
    cert_name="thiqax.staging.crt"
    key_name="thiqax.staging.key"
  else
    cert_name="thiqax.crt"
    key_name="thiqax.key"
  fi
  
  # Update symlinks for all domains in the environment
  for domain in $(get_certificate_domains); do
    log "INFO" "Updating symlinks for ${domain}"
    
    ln -sf "${CERT_DIR}/${domain}/fullchain.pem" "${NGINX_SSL_DIR}/${cert_name}"
    ln -sf "${CERT_DIR}/${domain}/privkey.pem" "${NGINX_SSL_DIR}/${key_name}"
    
    # Verify the symlinks
    if [ ! -L "${NGINX_SSL_DIR}/${cert_name}" ] || [ ! -L "${NGINX_SSL_DIR}/${key_name}" ]; then
      log "ERROR" "Failed to create symlinks for ${domain}"
    else
      log "INFO" "Symlinks updated successfully for ${domain}"
    fi
  done
}

# Process all certificates
function process_certificates() {
  log "INFO" "Processing certificates..."
  
  local domains=$(get_certificate_domains)
  local renewal_count=0
  local renewal_needed=false
  
  for domain in ${domains}; do
    local days_until_expiry=$(check_expiration "${domain}")
    
    # Skip invalid certificates
    if [ "${days_until_expiry}" -lt 0 ]; then
      log "WARNING" "Skipping invalid certificate for ${domain}"
      continue
    fi
    
    # Determine if renewal is needed
    if [ "${FORCE_RENEWAL}" = true ] || [ "${days_until_expiry}" -le "${EXPIRY_THRESHOLD}" ]; then
      renewal_needed=true
      
      # Send critical notification if close to expiration
      if [ "${days_until_expiry}" -le "${CRITICAL_THRESHOLD}" ]; then
        send_notification "${domain}" "${days_until_expiry}" "critical"
      else
        send_notification "${domain}" "${days_until_expiry}" "warning"
      fi
      
      # Attempt renewal if not in notify-only mode
      if [ "${NOTIFY_ONLY}" = false ]; then
        if renew_certificate "${domain}"; then
          renewal_count=$((renewal_count + 1))
        fi
      fi
    else
      log "INFO" "Certificate for ${domain} doesn't need renewal yet (${days_until_expiry} days > ${EXPIRY_THRESHOLD} days threshold)"
    fi
  done
  
  # If any certificates were renewed, update symlinks and reload services
  if [ "${renewal_count}" -gt 0 ] && [ "${NOTIFY_ONLY}" = false ]; then
    update_symlinks
    reload_services
  fi
  
  log "INFO" "Certificate processing complete. Renewed ${renewal_count} certificates."
  
  # Return exit code based on whether any renewals were needed but not performed
  if [ "${renewal_needed}" = true ] && [ "${NOTIFY_ONLY}" = true ]; then
    return 1
  else
    return 0
  fi
}

# Main execution
function main() {
  setup_logging
  parse_args "$@"
  check_prerequisites
  process_certificates
  
  log "INFO" "SSL certificate renewal check completed"
  log "INFO" "Log file saved to: ${LOG_FILE}"
}

# Execute main function with all arguments
main "$@"
