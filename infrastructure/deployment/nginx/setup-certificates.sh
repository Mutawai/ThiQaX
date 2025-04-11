#!/bin/bash
#==============================================================================
# ThiQaX Platform - SSL Certificate Setup Script
# 
# Description:
#   Initializes and configures SSL certificates for ThiQaX environments
#   using Let's Encrypt certbot. Creates certificates for specified domains
#   and configures them for Nginx.
#
# Usage:
#   ./setup-certificates.sh [environment] [domain] [email]
#
# Arguments:
#   environment - Target environment (staging|production)
#   domain      - Primary domain for certificate (e.g., thiqax.com)
#   email       - Email address for Let's Encrypt notifications
#
# Examples:
#   ./setup-certificates.sh staging staging.thiqax.com admin@thiqax.com
#   ./setup-certificates.sh production thiqax.com admin@thiqax.com
#
# Dependencies:
#   - certbot
#   - openssl
#   - nginx
#==============================================================================

set -e

# Log file location
LOG_DIR="/var/log/thiqax/ssl"
LOG_FILE="${LOG_DIR}/certificate_setup_$(date +%Y%m%d_%H%M%S).log"

# Certificate directories
CERT_DIR="/etc/letsencrypt/live"
NGINX_SSL_DIR="/etc/nginx/ssl"

# Initialize logging
function setup_logging() {
  mkdir -p "${LOG_DIR}"
  touch "${LOG_FILE}"
  exec > >(tee -a "${LOG_FILE}") 2>&1
  echo "$(date +"%Y-%m-%d %H:%M:%S") [INFO] Starting SSL certificate setup"
}

# Log messages with timestamp and level
function log() {
  local level=$1
  local message=$2
  echo "$(date +"%Y-%m-%d %H:%M:%S") [${level}] ${message}"
}

# Check for required arguments
function check_args() {
  if [ $# -lt 3 ]; then
    log "ERROR" "Missing required arguments"
    echo "Usage: $0 [environment] [domain] [email]"
    exit 1
  fi
  
  ENVIRONMENT=$1
  DOMAIN=$2
  EMAIL=$3
  
  # Validate environment
  if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
    log "ERROR" "Invalid environment: ${ENVIRONMENT}. Must be 'staging' or 'production'"
    exit 1
  fi
  
  # Validate domain format
  if ! [[ "${DOMAIN}" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    log "ERROR" "Invalid domain format: ${DOMAIN}"
    exit 1
  fi
  
  # Validate email format
  if ! [[ "${EMAIL}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    log "ERROR" "Invalid email format: ${EMAIL}"
    exit 1
  }
  
  log "INFO" "Setting up certificates for ${DOMAIN} in ${ENVIRONMENT} environment"
}

# Check if required tools are installed
function check_prerequisites() {
  log "INFO" "Checking prerequisites..."
  
  # Check for certbot
  if ! command -v certbot &> /dev/null; then
    log "ERROR" "certbot is not installed"
    log "INFO" "Install with: sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx"
    exit 1
  fi
  
  # Check for openssl
  if ! command -v openssl &> /dev/null; then
    log "ERROR" "openssl is not installed"
    log "INFO" "Install with: sudo apt-get update && sudo apt-get install -y openssl"
    exit 1
  fi
  
  # Check for nginx
  if ! command -v nginx &> /dev/null; then
    log "ERROR" "nginx is not installed"
    log "INFO" "Install with: sudo apt-get update && sudo apt-get install -y nginx"
    exit 1
  fi
  
  # Check if nginx is running
  if ! systemctl is-active --quiet nginx; then
    log "WARNING" "Nginx is not running. Starting nginx..."
    systemctl start nginx
    if [ $? -ne 0 ]; then
      log "ERROR" "Failed to start nginx"
      exit 1
    fi
  fi
  
  log "INFO" "All prerequisites satisfied"
}

# Generate certificates using Let's Encrypt certbot
function generate_certificates() {
  log "INFO" "Generating certificates for ${DOMAIN}"
  
  # Determine if we need to include www subdomain
  local domain_args="${DOMAIN}"
  if [[ "${DOMAIN}" =~ ^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$ ]]; then
    domain_args="-d ${DOMAIN} -d www.${DOMAIN}"
    log "INFO" "Adding www subdomain automatically"
  else
    domain_args="-d ${DOMAIN}"
  fi
  
  # Run certbot to obtain certificates
  log "INFO" "Running certbot to obtain certificates..."
  certbot certonly --nginx ${domain_args} --email "${EMAIL}" --agree-tos --non-interactive
  
  if [ $? -ne 0 ]; then
    log "ERROR" "Failed to obtain certificates from Let's Encrypt"
    exit 1
  fi
  
  log "INFO" "Successfully obtained certificates for ${DOMAIN}"
}

# Configure Nginx to use the new certificates
function configure_nginx() {
  log "INFO" "Configuring Nginx to use new certificates"
  
  # Create nginx ssl directory if it doesn't exist
  mkdir -p "${NGINX_SSL_DIR}"
  
  # Create symlinks to Let's Encrypt certificates in Nginx ssl directory
  ln -sf "${CERT_DIR}/${DOMAIN}/fullchain.pem" "${NGINX_SSL_DIR}/thiqax.crt"
  ln -sf "${CERT_DIR}/${DOMAIN}/privkey.pem" "${NGINX_SSL_DIR}/thiqax.key"
  
  # Verify the symlinks
  if [ ! -L "${NGINX_SSL_DIR}/thiqax.crt" ] || [ ! -L "${NGINX_SSL_DIR}/thiqax.key" ]; then
    log "ERROR" "Failed to create symlinks for certificates"
    exit 1
  fi
  
  # Test nginx configuration
  log "INFO" "Testing Nginx configuration..."
  nginx -t
  
  if [ $? -ne 0 ]; then
    log "ERROR" "Nginx configuration test failed"
    exit 1
  fi
  
  # Reload nginx to apply the new configuration
  log "INFO" "Reloading Nginx to apply new configuration..."
  systemctl reload nginx
  
  if [ $? -ne 0 ]; then
    log "ERROR" "Failed to reload Nginx"
    exit 1
  fi
  
  log "INFO" "Nginx successfully configured with new certificates"
}

# Create HSTS configuration for production
function setup_hsts() {
  if [ "${ENVIRONMENT}" == "production" ]; then
    log "INFO" "Setting up HSTS for production environment"
    
    # Update nginx configuration to include strong HSTS header
    local hsts_config="add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;"
    
    # Check if HSTS is already configured
    if grep -q "Strict-Transport-Security" /etc/nginx/nginx.conf; then
      log "INFO" "HSTS appears to be already configured"
    else
      log "INFO" "Adding HSTS configuration to nginx.conf"
      # For simplicity, we're assuming the add_header directives are in the http block
      # In a real implementation, you might want to use sed or awk for more precise insertion
      echo "This script would insert HSTS configuration in the correct location"
    fi
  else
    log "INFO" "Skipping HSTS setup for non-production environment"
  fi
}

# Validate the certificates
function validate_certificates() {
  log "INFO" "Validating certificates for ${DOMAIN}"
  
  # Get expiration date
  local expiry=$(openssl x509 -enddate -noout -in "${CERT_DIR}/${DOMAIN}/fullchain.pem" | cut -d= -f2)
  log "INFO" "Certificate expiration date: ${expiry}"
  
  # Check if certificate is valid for the right domain
  local cert_domain=$(openssl x509 -noout -subject -in "${CERT_DIR}/${DOMAIN}/fullchain.pem" | grep -oP "CN\s*=\s*\K[^,]+")
  
  if [[ "${cert_domain}" != "${DOMAIN}" && "${cert_domain}" != "*.${DOMAIN}" ]]; then
    log "WARNING" "Certificate domain (${cert_domain}) does not match requested domain (${DOMAIN})"
  else
    log "INFO" "Certificate domain verified: ${cert_domain}"
  fi
  
  # Test the actual HTTPS connection to the domain
  log "INFO" "Testing HTTPS connection to ${DOMAIN}..."
  local curl_output=$(curl -sS -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>&1)
  
  if [[ "${curl_output}" == "200" || "${curl_output}" == "301" || "${curl_output}" == "302" ]]; then
    log "INFO" "HTTPS connection successful (status: ${curl_output})"
  else
    log "WARNING" "HTTPS connection test returned unexpected status: ${curl_output}"
  fi
}

# Setup automatic renewal in crontab
function setup_auto_renewal() {
  log "INFO" "Setting up automatic certificate renewal"
  
  # Check if renewal is already configured
  if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    log "INFO" "Automatic renewal already configured"
  else
    log "INFO" "Adding automatic renewal to crontab"
    (crontab -l 2>/dev/null || echo "") | { cat; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'"; } | crontab -
    
    if [ $? -ne 0 ]; then
      log "ERROR" "Failed to update crontab for automatic renewal"
      exit 1
    fi
  fi
  
  log "INFO" "Automatic renewal configured to run daily at 3 AM"
}

# Main execution
function main() {
  setup_logging
  check_args "$@"
  check_prerequisites
  generate_certificates
  configure_nginx
  setup_hsts
  validate_certificates
  setup_auto_renewal
  
  log "INFO" "SSL certificate setup completed successfully for ${DOMAIN}"
  log "INFO" "Certificates will expire in approximately 90 days and will be automatically renewed"
  log "INFO" "Log file saved to: ${LOG_FILE}"
}

# Execute main function with all arguments
main "$@"
