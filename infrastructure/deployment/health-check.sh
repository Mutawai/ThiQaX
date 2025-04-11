#!/bin/bash
#==============================================================================
# health-check.sh
# 
# Performs comprehensive health checks on the ThiQaX platform.
# 
# This script checks:
#   - System resources (CPU, memory, disk)
#   - Container status
#   - Application services (API, database, cache)
#   - Network connectivity and DNS
#   - SSL certificate status
#   - Database performance and connections
#   - Log analysis for errors
#
# Usage:
#   ./health-check.sh [environment] [check_type]
#   
#   environment: The environment to check (staging|production|development)
#   check_type:  Type of check to perform (full|system|services|database)
#                Default is 'full'
#
# Output formats:
#   --json: Output results in JSON format
#   --html: Generate an HTML report
#   --prometheus: Output in Prometheus format for metrics collection
#
# Exit codes:
#   0 - All checks passed
#   1 - One or more checks failed
#   2 - Invalid arguments
#==============================================================================

set -e

# Load common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../utils/common.sh"

# Constants
LOG_FILE="health-check-$(date +%Y%m%d-%H%M%S).log"
REPORT_DIR="/var/log/thiqax/health-checks"
THRESHOLD_CPU=80          # CPU usage threshold (%)
THRESHOLD_MEMORY=80       # Memory usage threshold (%)
THRESHOLD_DISK=80         # Disk usage threshold (%)
THRESHOLD_LOAD=4          # Load average threshold
DB_CONN_THRESHOLD=80      # Database connection usage threshold (%)
SSL_EXPIRY_WARNING=30     # SSL certificate expiry warning threshold (days)
TIMEOUT_SERVICE=5         # Service check timeout (seconds)

# Initialize variables
ENVIRONMENT="staging"
CHECK_TYPE="full"
OUTPUT_FORMAT="text"
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
RESULT_JSON="{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"environment\":\"$ENVIRONMENT\",\"checks\":[]}"

# Parse arguments
function parse_args() {
  # Process positional arguments
  if [[ $# -gt 0 ]]; then
    ENVIRONMENT="$1"
    shift
  fi
  
  if [[ $# -gt 0 ]]; then
    CHECK_TYPE="$1"
    shift
  fi
  
  # Process flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --json)
        OUTPUT_FORMAT="json"
        shift
        ;;
      --html)
        OUTPUT_FORMAT="html"
        shift
        ;;
      --prometheus)
        OUTPUT_FORMAT="prometheus"
        shift
        ;;
      *)
        log_error "Unknown option: $1"
        exit 2
        ;;
    esac
  done
  
  # Validate environment
  if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'development', 'staging', or 'production'"
    exit 2
  fi
  
  # Validate check type
  if [[ "$CHECK_TYPE" != "full" && "$CHECK_TYPE" != "system" && "$CHECK_TYPE" != "services" && "$CHECK_TYPE" != "database" ]]; then
    log_error "Invalid check type: $CHECK_TYPE. Must be 'full', 'system', 'services', or 'database'"
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
  
  # Set base URL based on environment
  case "$ENVIRONMENT" in
    "development")
      BASE_URL="http://localhost:5000"
      ;;
    "staging")
      BASE_URL="https://staging.thiqax.com"
      ;;
    "production")
      BASE_URL="https://thiqax.com"
      ;;
  esac
}

# Check system resources
function check_system_resources() {
  log_info "Checking system resources"
  
  # CPU usage
  local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
  cpu_usage=${cpu_usage%.*} # Remove decimal part
  
  # Memory usage
  local mem_total=$(free -m | awk '/Mem:/ {print $2}')
  local mem_used=$(free -m | awk '/Mem:/ {print $3}')
  local mem_usage=$((mem_used * 100 / mem_total))
  
  # Disk usage
  local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
  
  # Load average
  local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $1}' | tr -d ' ')
  
  # Add to JSON result
  add_check_result "cpu_usage" "$cpu_usage%" $((cpu_usage < THRESHOLD_CPU))
  add_check_result "memory_usage" "$mem_usage%" $((mem_usage < THRESHOLD_MEMORY))
  add_check_result "disk_usage" "$disk_usage%" $((disk_usage < THRESHOLD_DISK))
  add_check_result "load_average" "$load_avg" $(echo "$load_avg < $THRESHOLD_LOAD" | bc)
  
  # Output report
  log_info "CPU Usage: $cpu_usage% (Threshold: $THRESHOLD_CPU%)"
  log_info "Memory Usage: $mem_usage% (Threshold: $THRESHOLD_MEMORY%)"
  log_info "Disk Usage: $disk_usage% (Threshold: $THRESHOLD_DISK%)"
  log_info "Load Average: $load_avg (Threshold: $THRESHOLD_LOAD)"
  
  # Check thresholds
  local resources_ok=0
  
  if [[ $cpu_usage -ge $THRESHOLD_CPU ]]; then
    log_warning "CPU usage is above threshold: $cpu_usage% >= $THRESHOLD_CPU%"
    resources_ok=1
  fi
  
  if [[ $mem_usage -ge $THRESHOLD_MEMORY ]]; then
    log_warning "Memory usage is above threshold: $mem_usage% >= $THRESHOLD_MEMORY%"
    resources_ok=1
  fi
  
  if [[ $disk_usage -ge $THRESHOLD_DISK ]]; then
    log_warning "Disk usage is above threshold: $disk_usage% >= $THRESHOLD_DISK%"
    resources_ok=1
  fi
  
  if (( $(echo "$load_avg >= $THRESHOLD_LOAD" | bc -l) )); then
    log_warning "Load average is above threshold: $load_avg >= $THRESHOLD_LOAD"
    resources_ok=1
  fi
  
  if [[ $resources_ok -eq 0 ]]; then
    log_success "All system resources are within acceptable thresholds"
  fi
  
  return $resources_ok
}

# Check container status
function check_containers() {
  log_info "Checking container status"
  
  # Check all running containers with label app=thiqax
  local containers=$(docker ps --filter "label=app=thiqax" --format "{{.Names}}")
  local all_healthy=0
  
  if [[ -z "$containers" ]]; then
    log_error "No ThiQaX containers found"
    add_check_result "containers" "No containers found" 0
    return 1
  fi
  
  for container in $containers; do
    log_info "Checking container: $container"
    
    # Check if container is running
    local status=$(docker inspect --format="{{.State.Status}}" "$container")
    
    if [[ "$status" != "running" ]]; then
      log_error "Container $container is not running (status: $status)"
      add_check_result "container_$container" "$status" 0
      all_healthy=1
      continue
    fi
    
    # Check container health if available
    if docker inspect --format="{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}" "$container" | grep -q "healthy"; then
      log_success "Container $container is healthy"
      add_check_result "container_$container" "healthy" 1
    elif docker inspect --format="{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}" "$container" | grep -q "N/A"; then
      log_info "Container $container is running (no health check available)"
      add_check_result "container_$container" "running" 1
    else
      log_error "Container $container is unhealthy"
      add_check_result "container_$container" "unhealthy" 0
      all_healthy=1
    fi
  done
  
  if [[ $all_healthy -eq 0 ]]; then
    log_success "All containers are running and healthy"
  fi
  
  return $all_healthy
}

# Check application services
function check_services() {
  log_info "Checking application services"
  
  local services=(
    "/api/v1/health"
    "/api-docs"
  )
  
  local all_services_ok=0
  
  for service in "${services[@]}"; do
    log_info "Checking service: $service"
    
    local response=$(curl -s -m $TIMEOUT_SERVICE -o /dev/null -w "%{http_code}" "${BASE_URL}${service}")
    
    if [[ "$response" == "200" || "$response" == "301" || "$response" == "302" ]]; then
      log_success "Service $service is available (HTTP $response)"
      add_check_result "service_$(basename $service)" "HTTP $response" 1
    else
      log_error "Service $service is not available (HTTP $response)"
      add_check_result "service_$(basename $service)" "HTTP $response" 0
      all_services_ok=1
    fi
  done
  
  if [[ $all_services_ok -eq 0 ]]; then
    log_success "All application services are available"
  fi
  
  return $all_services_ok
}

# Check database health
function check_database() {
  log_info "Checking database health"
  
  # Check database connectivity via API
  log_info "Checking database connectivity"
  
  local response=$(curl -s -m $TIMEOUT_SERVICE -H "Content-Type: application/json" "${BASE_URL}/api/v1/health/db")
  
  if ! echo "$response" | grep -q '"database":"connected"'; then
    log_error "Database connectivity check failed"
    add_check_result "database_connectivity" "failed" 0
    return 1
  fi
  
  log_success "Database connectivity check passed"
  add_check_result "database_connectivity" "connected" 1
  
  # Check database performance metrics via API
  log_info "Checking database performance"
  
  response=$(curl -s -m $TIMEOUT_SERVICE -H "Content-Type: application/json" "${BASE_URL}/api/v1/health/db/stats")
  
  # Extract metrics from response (assuming the API returns these metrics)
  local db_connections=$(echo "$response" | grep -o '"connections":[0-9]*' | cut -d ':' -f2)
  local db_max_connections=$(echo "$response" | grep -o '"maxConnections":[0-9]*' | cut -d ':' -f2)
  local db_connection_percent=$((db_connections * 100 / db_max_connections))
  
  log_info "Database connections: $db_connections/$db_max_connections ($db_connection_percent%)"
  add_check_result "database_connections" "$db_connections/$db_max_connections" $((db_connection_percent < DB_CONN_THRESHOLD))
  
  if [[ $db_connection_percent -ge $DB_CONN_THRESHOLD ]]; then
    log_warning "Database connection usage is above threshold: $db_connection_percent% >= $DB_CONN_THRESHOLD%"
    return 1
  fi
  
  log_success "Database health check passed"
  return 0
}

# Check SSL certificate
function check_ssl() {
  log_info "Checking SSL certificate"
  
  # Skip SSL check for development environment
  if [[ "$ENVIRONMENT" == "development" ]]; then
    log_info "Skipping SSL check for development environment"
    add_check_result "ssl_certificate" "skipped" 1
    return 0
  fi
  
  # Extract domain from base URL
  local domain="${BASE_URL#https://}"
  
  # Check SSL certificate expiration
  local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates)
  
  if [[ $? -ne 0 ]]; then
    log_error "Failed to check SSL certificate"
    add_check_result "ssl_certificate" "check failed" 0
    return 1
  fi
  
  local expiry_date=$(echo "$ssl_info" | grep 'notAfter=' | cut -d= -f2)
  local expiry_timestamp=$(date -d "$expiry_date" +%s)
  local current_timestamp=$(date +%s)
  local days_remaining=$(( (expiry_timestamp - current_timestamp) / 86400 ))
  
  log_info "SSL certificate valid for $days_remaining days"
  add_check_result "ssl_expiry" "$days_remaining days" $((days_remaining > SSL_EXPIRY_WARNING))
  
  if [[ $days_remaining -lt SSL_EXPIRY_WARNING ]]; then
    log_warning "SSL certificate will expire in $days_remaining days (warning threshold: $SSL_EXPIRY_WARNING days)"
    return 1
  fi
  
  log_success "SSL certificate check passed"
  return 0
}

# Check logs for errors
function check_logs() {
  log_info "Checking application logs for errors"
  
  # Define log files to check based on environment
  local log_files=()
  
  case "$ENVIRONMENT" in
    "development")
      log_files=("/var/log/thiqax-api/error.log" "/var/log/thiqax-api/access.log")
      ;;
    "staging"|"production")
      log_files=("/var/log/thiqax-api/error.log" "/var/log/nginx/error.log")
      ;;
  esac
  
  local error_count=0
  local error_threshold=10
  
  # Check each log file for errors in the last 15 minutes
  for log_file in "${log_files[@]}"; do
    if [[ ! -f "$log_file" ]]; then
      log_warning "Log file not found: $log_file"
      continue
    fi
    
    log_info "Checking log file: $log_file"
    
    # Count errors in the last 15 minutes
    local recent_errors=$(find "$log_file" -mmin -15 -exec cat {} \; | grep -i "error\|exception\|fatal" | wc -l)
    error_count=$((error_count + recent_errors))
    
    log_info "Found $recent_errors errors in $log_file (last 15 minutes)"
  done
  
  add_check_result "log_errors" "$error_count errors" $((error_count < error_threshold))
  
  if [[ $error_count -ge $error_threshold ]]; then
    log_warning "High number of errors found in logs: $error_count errors (threshold: $error_threshold)"
    return 1
  fi
  
  log_success "Log check passed (found $error_count errors, threshold: $error_threshold)"
  return 0
}

# Add check result to JSON
function add_check_result() {
  local name="$1"
  local value="$2"
  local passed="$3"
  
  local status="PASSED"
  if [[ "$passed" -eq 0 ]]; then
    status="FAILED"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  else
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  fi
  
  # Add to JSON result
  RESULT_JSON=$(echo "$RESULT_JSON" | jq ".checks += [{\"name\": \"$name\", \"value\": \"$value\", \"status\": \"$status\"}]")
}

# Generate health check report
function generate_report() {
  local total_checks=$((CHECKS_PASSED + CHECKS_FAILED))
  local pass_percentage=$((CHECKS_PASSED * 100 / total_checks))
  
  # Update JSON result with summary
  RESULT_JSON=$(echo "$RESULT_JSON" | jq ".summary = {\"total\": $total_checks, \"passed\": $CHECKS_PASSED, \"failed\": $CHECKS_FAILED, \"pass_percentage\": $pass_percentage}")
  
  # Create report directory if it doesn't exist
  mkdir -p "$REPORT_DIR"
  
  # Generate report based on output format
  case "$OUTPUT_FORMAT" in
    "json")
      echo "$RESULT_JSON" | jq '.' > "${REPORT_DIR}/health-check-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"
      echo "$RESULT_JSON" | jq '.'
      ;;
    "html")
      # Generate HTML report
      local html_report="${REPORT_DIR}/health-check-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).html"
      
      echo "<html><head><title>ThiQaX Health Check Report</title>" > "$html_report"
      echo "<style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px}th{background-color:#f2f2f2}.passed{color:green}.failed{color:red}</style>" >> "$html_report"
      echo "</head><body>" >> "$html_report"
      echo "<h1>ThiQaX Health Check Report</h1>" >> "$html_report"
      echo "<p><strong>Environment:</strong> $ENVIRONMENT</p>" >> "$html_report"
      echo "<p><strong>Timestamp:</strong> $(date)</p>" >> "$html_report"
      echo "<p><strong>Summary:</strong> $CHECKS_PASSED passed, $CHECKS_FAILED failed (${pass_percentage}%)</p>" >> "$html_report"
      
      echo "<h2>Check Results</h2>" >> "$html_report"
      echo "<table><tr><th>Check</th><th>Value</th><th>Status</th></tr>" >> "$html_report"
      
      echo "$RESULT_JSON" | jq -r '.checks[] | "<tr><td>\(.name)</td><td>\(.value)</td><td class=\"\(.status | ascii_downcase)\">\(.status)</td></tr>"' >> "$html_report"
      
      echo "</table></body></html>" >> "$html_report"
      
      log_info "HTML report generated: $html_report"
      ;;
    "prometheus")
      # Generate Prometheus metrics
      local prom_file="${REPORT_DIR}/health-check-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).prom"
      
      echo "# HELP thiqax_health_check_pass_percentage Percentage of passed health checks" > "$prom_file"
      echo "# TYPE thiqax_health_check_pass_percentage gauge" >> "$prom_file"
      echo "thiqax_health_check_pass_percentage{environment=\"$ENVIRONMENT\"} $pass_percentage" >> "$prom_file"
      
      echo "# HELP thiqax_health_check_passed Number of passed health checks" >> "$prom_file"
      echo "# TYPE thiqax_health_check_passed gauge" >> "$prom_file"
      echo "thiqax_health_check_passed{environment=\"$ENVIRONMENT\"} $CHECKS_PASSED" >> "$prom_file"
      
      echo "# HELP thiqax_health_check_failed Number of failed health checks" >> "$prom_file"
      echo "# TYPE thiqax_health_check_failed gauge" >> "$prom_file"
      echo "thiqax_health_check_failed{environment=\"$ENVIRONMENT\"} $CHECKS_FAILED" >> "$prom_file"
      
      # Add individual check metrics
      echo "$RESULT_JSON" | jq -r '.checks[] | "# HELP thiqax_health_check_\(.name) Status of \(.name) health check\n# TYPE thiqax_health_check_\(.name) gauge\nthiqax_health_check_\(.name){environment=\"'$ENVIRONMENT'\", status=\"\(.status)\"} \(if .status == "PASSED" then "1" else "0" end)"' >> "$prom_file"
      
      log_info "Prometheus metrics generated: $prom_file"
      cat "$prom_file"
      ;;
    *)
      # Default text output
      echo "ThiQaX Health Check Report"
      echo "=========================="
      echo "Environment: $ENVIRONMENT"
      echo "Timestamp: $(date)"
      echo "Summary: $CHECKS_PASSED passed, $CHECKS_FAILED failed (${pass_percentage}%)"
      echo ""
      echo "Check Results:"
      echo "$RESULT_JSON" | jq -r '.checks[] | "\(.name): \(.value) [\(.status)]"'
      ;;
  esac
}

# Main function
function main() {
  log_info "Starting health check for $ENVIRONMENT environment (type: $CHECK_TYPE)"
  
  parse_args "$@"
  load_environment
  
  # Run checks based on check type
  if [[ "$CHECK_TYPE" == "full" || "$CHECK_TYPE" == "system" ]]; then
    check_system_resources
    check_containers
    check_logs
  fi
  
  if [[ "$CHECK_TYPE" == "full" || "$CHECK_TYPE" == "services" ]]; then
    check_services
    check_ssl
  fi
  
  if [[ "$CHECK_TYPE" == "full" || "$CHECK_TYPE" == "database" ]]; then
    check_database
  fi
  
  # Generate report
  generate_report
  
  # Determine exit code
  if [[ $CHECKS_FAILED -gt 0 ]]; then
    log_error "Health check completed with $CHECKS_FAILED failed checks"
    exit 1
  else
    log_success "Health check completed successfully"
    exit 0
  fi
}

# Execute main function
main "$@"
