#!/bin/bash
#==============================================================================
# notify-deployment.sh
# 
# Sends notifications for deployment events in the ThiQaX platform.
# 
# This script sends notifications through multiple channels:
#   - Email
#   - Slack
#   - Microsoft Teams
#   - Deployment monitoring system
#   - Status page updates
#
# Usage:
#   ./notify-deployment.sh <event_type> <environment> <deployment_id> [status] [duration]
#   
#   event_type:    Type of event (deploy|rollback|hotfix)
#   environment:   Environment where the event occurred (staging|production)
#   deployment_id: ID of the deployment
#   status:        Status of the deployment (SUCCESS|FAILED|ABORTED)
#   duration:      Duration of the deployment in seconds
#
# Exit codes:
#   0 - Notifications sent successfully
#   1 - Failed to send notifications
#   2 - Invalid arguments
#==============================================================================

set -e

# Load common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../utils/common.sh"

# Constants
CONFIG_FILE="${SCRIPT_DIR}/../config/notification.json"
LOG_FILE="deployment-notification-$(date +%Y%m%d-%H%M%S).log"
SLACK_DEFAULT_CHANNEL="#deployments"
TEAMS_DEFAULT_WEBHOOK=""
EMAIL_DEFAULT_RECIPIENTS="devops@thiqax.com,engineering@thiqax.com"
DEFAULT_STATUS_PAGE_ID="thiqax-status"

# Initialize variables
EVENT_TYPE=""
ENVIRONMENT=""
DEPLOYMENT_ID=""
STATUS="SUCCESS"
DURATION="0"
COMMIT_HASH=""
COMMIT_MESSAGE=""
AUTHOR=""
VERSION=""
CHANGELOG=""

# Parse arguments
function parse_args() {
  if [[ $# -lt 3 ]]; then
    log_error "Insufficient arguments. Usage: $0 <event_type> <environment> <deployment_id> [status] [duration]"
    exit 2
  fi
  
  EVENT_TYPE="$1"
  ENVIRONMENT="$2"
  DEPLOYMENT_ID="$3"
  
  if [[ $# -ge 4 ]]; then
    STATUS="$4"
  fi
  
  if [[ $# -ge 5 ]]; then
    DURATION="$5"
  fi
  
  # Validate event type
  if [[ "$EVENT_TYPE" != "deploy" && "$EVENT_TYPE" != "rollback" && "$EVENT_TYPE" != "hotfix" ]]; then
    log_error "Invalid event type: $EVENT_TYPE. Must be 'deploy', 'rollback', or 'hotfix'"
    exit 2
  fi
  
  # Validate environment
  if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 2
  fi
  
  # Validate status
  if [[ "$STATUS" != "SUCCESS" && "$STATUS" != "FAILED" && "$STATUS" != "ABORTED" ]]; then
    log_error "Invalid status: $STATUS. Must be 'SUCCESS', 'FAILED', or 'ABORTED'"
    exit 2
  fi
}

# Load configuration
function load_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log_warning "Configuration file not found: $CONFIG_FILE. Using default values."
    return
  fi
  
  log_info "Loading configuration from $CONFIG_FILE"
  
  # Load configuration values
  SLACK_WEBHOOK=$(jq -r ".channels.slack.webhook" "$CONFIG_FILE")
  SLACK_CHANNEL=$(jq -r ".channels.slack.channel" "$CONFIG_FILE")
  TEAMS_WEBHOOK=$(jq -r ".channels.teams.webhook" "$CONFIG_FILE")
  EMAIL_RECIPIENTS=$(jq -r ".channels.email.recipients" "$CONFIG_FILE")
  STATUS_PAGE_ID=$(jq -r ".statusPage.id" "$CONFIG_FILE")
  
  # Use default values if not found in config
  SLACK_CHANNEL=${SLACK_CHANNEL:-$SLACK_DEFAULT_CHANNEL}
  TEAMS_WEBHOOK=${TEAMS_WEBHOOK:-$TEAMS_DEFAULT_WEBHOOK}
  EMAIL_RECIPIENTS=${EMAIL_RECIPIENTS:-$EMAIL_DEFAULT_RECIPIENTS}
  STATUS_PAGE_ID=${STATUS_PAGE_ID:-$DEFAULT_STATUS_PAGE_ID}
}

# Load deployment information
function load_deployment_info() {
  log_info "Loading deployment information for $DEPLOYMENT_ID"
  
  local deploy_info_file="/var/www/thiqax/${ENVIRONMENT}/backups/${DEPLOYMENT_ID}/deploy.info"
  
  if [[ -f "$deploy_info_file" ]]; then
    # Load information from deploy.info file
    source "$deploy_info_file"
    
    # Extract commit information if available
    if [[ -n "$GIT_COMMIT" ]]; then
      COMMIT_HASH="$GIT_COMMIT"
      
      # Try to get commit message and author
      if command -v git &>/dev/null; then
        cd "/var/www/thiqax/${ENVIRONMENT}/current" || true
        COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s" "$COMMIT_HASH" 2>/dev/null || echo "")
        AUTHOR=$(git log -1 --pretty=format:"%an <%ae>" "$COMMIT_HASH" 2>/dev/null || echo "")
      fi
    fi
    
    # Get version from package.json
    if [[ -f "/var/www/thiqax/${ENVIRONMENT}/current/package.json" ]]; then
      VERSION=$(jq -r ".version" "/var/www/thiqax/${ENVIRONMENT}/current/package.json")
    fi
    
    # Get changelog if available
    if [[ -f "/var/www/thiqax/${ENVIRONMENT}/current/CHANGELOG.md" ]]; then
      CHANGELOG=$(grep -A 10 "## ${VERSION}" "/var/www/thiqax/${ENVIRONMENT}/current/CHANGELOG.md" | tail -n +2)
    fi
  else
    log_warning "Deployment info file not found: $deploy_info_file"
  fi
  
  # Set default values if not available
  COMMIT_HASH=${COMMIT_HASH:-"N/A"}
  COMMIT_MESSAGE=${COMMIT_MESSAGE:-"N/A"}
  AUTHOR=${AUTHOR:-"N/A"}
  VERSION=${VERSION:-"N/A"}
  
  log_info "Deployment details:"
  log_info "  Version: $VERSION"
  log_info "  Commit: $COMMIT_HASH"
  log_info "  Author: $AUTHOR"
  log_info "  Message: $COMMIT_MESSAGE"
}

# Format deployment message
function format_message() {
  # Format event type
  local event_formatted
  case "$EVENT_TYPE" in
    "deploy")
      event_formatted="Deployment"
      ;;
    "rollback")
      event_formatted="Rollback"
      ;;
    "hotfix")
      event_formatted="Hotfix"
      ;;
  esac
  
  # Format environment
  local env_formatted
  case "$ENVIRONMENT" in
    "staging")
      env_formatted="Staging"
      ;;
    "production")
      env_formatted="Production"
      ;;
  esac
  
  # Format status
  local status_formatted
  case "$STATUS" in
    "SUCCESS")
      status_formatted="✅ Successful"
      ;;
    "FAILED")
      status_formatted="❌ Failed"
      ;;
    "ABORTED")
      status_formatted="⚠️ Aborted"
      ;;
  esac
  
  # Format duration
  local duration_formatted
  if [[ "$DURATION" != "0" ]]; then
    local minutes=$((DURATION / 60))
    local seconds=$((DURATION % 60))
    duration_formatted="${minutes}m ${seconds}s"
  else
    duration_formatted="N/A"
  fi
  
  # Create messages for different notification types
  
  # Plain text message (for email and logging)
  PLAIN_MESSAGE=$(cat <<EOF
${status_formatted} ${event_formatted} to ${env_formatted}

Deployment ID: ${DEPLOYMENT_ID}
Version: ${VERSION}
Status: ${STATUS}
Duration: ${duration_formatted}
Time: $(date)

Commit: ${COMMIT_HASH}
Author: ${AUTHOR}
Message: ${COMMIT_MESSAGE}

${CHANGELOG}

Dashboard: https://jenkins.thiqax.com/deployment/${DEPLOYMENT_ID}
EOF
)

  # HTML message (for email)
  HTML_MESSAGE=$(cat <<EOF
<h2>${status_formatted} ${event_formatted} to ${env_formatted}</h2>
<p><strong>Deployment ID:</strong> ${DEPLOYMENT_ID}<br>
<strong>Version:</strong> ${VERSION}<br>
<strong>Status:</strong> ${STATUS}<br>
<strong>Duration:</strong> ${duration_formatted}<br>
<strong>Time:</strong> $(date)</p>

<p><strong>Commit:</strong> ${COMMIT_HASH}<br>
<strong>Author:</strong> ${AUTHOR}<br>
<strong>Message:</strong> ${COMMIT_MESSAGE}</p>

<pre>${CHANGELOG}</pre>

<p><a href="https://jenkins.thiqax.com/deployment/${DEPLOYMENT_ID}">View in Dashboard</a></p>
EOF
)

  # Slack/Teams message (JSON format)
  SLACK_MESSAGE=$(cat <<EOF
{
  "text": "${status_formatted} ${event_formatted} to ${env_formatted}",
  "attachments": [
    {
      "color": "$([ "$STATUS" == "SUCCESS" ] && echo "good" || [ "$STATUS" == "FAILED" ] && echo "danger" || echo "warning")",
      "fields": [
        {
          "title": "Deployment ID",
          "value": "${DEPLOYMENT_ID}",
          "short": true
        },
        {
          "title": "Version",
          "value": "${VERSION}",
          "short": true
        },
        {
          "title": "Status",
          "value": "${STATUS}",
          "short": true
        },
        {
          "title": "Duration",
          "value": "${duration_formatted}",
          "short": true
        },
        {
          "title": "Commit",
          "value": "${COMMIT_HASH}",
          "short": true
        },
        {
          "title": "Author",
          "value": "${AUTHOR}",
          "short": true
        },
        {
          "title": "Message",
          "value": "${COMMIT_MESSAGE}",
          "short": false
        }
      ],
      "footer": "ThiQaX Deployment",
      "footer_icon": "https://thiqax.com/favicon.ico",
      "ts": $(date +%s)
    }
  ]
}
EOF
)

  # Microsoft Teams message
  TEAMS_MESSAGE=$(cat <<EOF
{
  "@type": "MessageCard",
  "@context": "http://schema.org/extensions",
  "themeColor": "$([ "$STATUS" == "SUCCESS" ] && echo "00FF00" || [ "$STATUS" == "FAILED" ] && echo "FF0000" || echo "FFA500")",
  "summary": "${status_formatted} ${event_formatted} to ${env_formatted}",
  "sections": [
    {
      "activityTitle": "${status_formatted} ${event_formatted} to ${env_formatted}",
      "facts": [
        {
          "name": "Deployment ID",
          "value": "${DEPLOYMENT_ID}"
        },
        {
          "name": "Version",
          "value": "${VERSION}"
        },
        {
          "name": "Status",
          "value": "${STATUS}"
        },
        {
          "name": "Duration",
          "value": "${duration_formatted}"
        },
        {
          "name": "Commit",
          "value": "${COMMIT_HASH}"
        },
        {
          "name": "Author",
          "value": "${AUTHOR}"
        },
        {
          "name": "Message",
          "value": "${COMMIT_MESSAGE}"
        }
      ],
      "markdown": true
    }
  ],
  "potentialAction": [
    {
      "@type": "OpenUri",
      "name": "View in Dashboard",
      "targets": [
        {
          "os": "default",
          "uri": "https://jenkins.thiqax.com/deployment/${DEPLOYMENT_ID}"
        }
      ]
    }
  ]
}
EOF
)
}

# Send email notification
function send_email_notification() {
  if [[ -z "$EMAIL_RECIPIENTS" ]]; then
    log_warning "Email recipients not configured, skipping email notification"
    return
  }
  
  log_info "Sending email notification to $EMAIL_RECIPIENTS"
  
  local subject="${STATUS} ${EVENT_TYPE} to ${ENVIRONMENT} (${DEPLOYMENT_ID})"
  
  # Send email using mail command (requires mailutils or similar)
  if command -v mail &>/dev/null; then
    echo "$PLAIN_MESSAGE" | mail -s "$subject" "$EMAIL_RECIPIENTS"
    log_success "Email notification sent"
  elif command -v curl &>/dev/null && [[ -n "$SMTP_HOST" && -n "$SMTP_EMAIL" && -n "$SMTP_PASSWORD" ]]; then
    # Alternatively, use a mail sending API if configured
    local email_data=$(cat <<EOF
{
  "from": {"email": "$FROM_EMAIL", "name": "$FROM_NAME"},
  "to": [{"email": "$EMAIL_RECIPIENTS"}],
  "subject": "$subject",
  "text": "$PLAIN_MESSAGE",
  "html": "$HTML_MESSAGE"
}
EOF
)
    
    curl -s -X POST -u "api:$SMTP_PASSWORD" \
      "https://$SMTP_HOST/api/send" \
      -H "Content-Type: application/json" \
      -d "$email_data" > /dev/null
    
    log_success "Email notification sent via API"
  else
    log_error "Email notification failed: mail command not found and SMTP API not configured"
    return 1
  fi
  
  return 0
}

# Send Slack notification
function send_slack_notification() {
  if [[ -z "$SLACK_WEBHOOK" ]]; then
    log_warning "Slack webhook not configured, skipping Slack notification"
    return
  }
  
  log_info "Sending Slack notification to $SLACK_CHANNEL"
  
  curl -s -X POST -H "Content-Type: application/json" \
    -d "$SLACK_MESSAGE" \
    "$SLACK_WEBHOOK" > /dev/null
  
  if [[ $? -eq 0 ]]; then
    log_success "Slack notification sent"
    return 0
  else
    log_error "Slack notification failed"
    return 1
  fi
}

# Send Microsoft Teams notification
function send_teams_notification() {
  if [[ -z "$TEAMS_WEBHOOK" ]]; then
    log_warning "Teams webhook not configured, skipping Teams notification"
    return
  }
  
  log_info "Sending Microsoft Teams notification"
  
  curl -s -X POST -H "Content-Type: application/json" \
    -d "$TEAMS_MESSAGE" \
    "$TEAMS_WEBHOOK" > /dev/null
  
  if [[ $? -eq 0 ]]; then
    log_success "Microsoft Teams notification sent"
    return 0
  else
    log_error "Microsoft Teams notification failed"
    return 1
  fi
}

# Update status page
function update_status_page() {
  if [[ -z "$STATUS_PAGE_ID" ]]; then
    log_warning "Status page ID not configured, skipping status page update"
    return
  }
  
  # Only update status page for production deployments
  if [[ "$ENVIRONMENT" != "production" ]]; then
    log_info "Status page updates only for production, skipping for $ENVIRONMENT"
    return
  }
  
  log_info "Updating status page"
  
  # Determine status page update based on deployment status
  local status_page_status
  local status_page_message
  
  if [[ "$STATUS" == "SUCCESS" ]]; then
    status_page_status="operational"
    status_page_message="Successful deployment of version $VERSION completed at $(date)"
  elif [[ "$STATUS" == "FAILED" ]]; then
    status_page_status="degraded_performance"
    status_page_message="Deployment of version $VERSION failed at $(date). Engineers are investigating."
  elif [[ "$STATUS" == "ABORTED" ]]; then
    status_page_status="partial_outage"
    status_page_message="Deployment of version $VERSION was aborted at $(date). Engineers are investigating."
  fi
  
  # Update status page using API (if implemented)
  local status_data=$(cat <<EOF
{
  "status": {
    "indicator": "$status_page_status",
    "description": "$status_page_message"
  },
  "component_id": "api",
  "incident_name": "Deployment $DEPLOYMENT_ID"
}
EOF
)
  
  if command -v curl &>/dev/null && [[ -n "$STATUS_PAGE_API_KEY" ]]; then
    curl -s -X POST \
      -H "Authorization: Bearer $STATUS_PAGE_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$status_data" \
      "https://api.statuspage.io/v1/pages/$STATUS_PAGE_ID/components/api" > /dev/null
    
    if [[ $? -eq 0 ]]; then
      log_success "Status page updated"
      return 0
    else
      log_error "Status page update failed"
      return 1
    fi
  else
    log_warning "Status page API key not configured or curl not found, skipping status page update"
    return
  fi
}

# Log deployment event
function log_deployment_event() {
  log_info "Logging deployment event"
  
  # Create log entry
  local log_entry=$(cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "event_type": "$EVENT_TYPE",
  "environment": "$ENVIRONMENT",
  "deployment_id": "$DEPLOYMENT_ID",
  "status": "$STATUS",
  "duration": "$DURATION",
  "version": "$VERSION",
  "commit_hash": "$COMMIT_HASH",
  "commit_message": "$COMMIT_MESSAGE",
  "author": "$AUTHOR"
}
EOF
)
  
  # Save to deployment log file
  echo "$log_entry" >> "/var/log/thiqax/deployments.log"
  
  # Send to logging system via API if configured
  if command -v curl &>/dev/null && [[ -n "$LOG_API_ENDPOINT" && -n "$LOG_API_KEY" ]]; then
    curl -s -X POST \
      -H "Authorization: Bearer $LOG_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$log_entry" \
      "$LOG_API_ENDPOINT" > /dev/null
    
    if [[ $? -ne 0 ]]; then
      log_warning "Failed to send deployment event to logging API"
    fi
  fi
  
  log_success "Deployment event logged"
  return 0
}

# Main function
function main() {
  log_info "Starting deployment notification for $EVENT_TYPE to $ENVIRONMENT (Deployment ID: $DEPLOYMENT_ID)"
  
  parse_args "$@"
  load_config
  load_deployment_info
  format_message
  
  # Send notifications
  local notification_errors=0
  
  send_email_notification || notification_errors=$((notification_errors + 1))
  send_slack_notification || notification_errors=$((notification_errors + 1))
  send_teams_notification || notification_errors=$((notification_errors + 1))
  update_status_page || notification_errors=$((notification_errors + 1))
  log_deployment_event || notification_errors=$((notification_errors + 1))
  
  if [[ $notification_errors -gt 0 ]]; then
    log_warning "Completed with $notification_errors notification errors"
    exit 1
  else
    log_success "All notifications sent successfully"
    exit 0
  fi
}

# Execute main function
main "$@"
