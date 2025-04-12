#!/bin/bash
#
# ThiQaX Platform Deployment Notification
# This script sends notifications about deployment status
#
# Usage: ./notify-deployment.sh <environment> <status>

set -e

ENVIRONMENT=$1
STATUS=$2
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_SHA=${GITHUB_SHA:0:7}
REPO_NAME=${GITHUB_REPOSITORY:-"Mutawai/ThiQaX"}
DEPLOYER=${GITHUB_ACTOR:-"CI/CD Pipeline"}

if [ -z "$ENVIRONMENT" ] || [ -z "$STATUS" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: ./notify-deployment.sh <environment> <status>"
  exit 1
fi

# Format message based on status
if [ "$STATUS" == "success" ]; then
  EMOJI="✅"
  COLOR="#36a64f"
  TITLE="Deployment Successful"
elif [ "$STATUS" == "failure" ]; then
  EMOJI="❌"
  COLOR="#ff0000"
  TITLE="Deployment Failed"
else
  EMOJI="ℹ️"
  COLOR="#439FE0"
  TITLE="Deployment Status: $STATUS"
fi

MESSAGE="$EMOJI *$TITLE*\n\n- *Environment:* $ENVIRONMENT\n- *Repository:* $REPO_NAME\n- *Commit:* $COMMIT_SHA\n- *Deployed by:* $DEPLOYER\n- *Timestamp:* $TIMESTAMP"

# Send Slack notification if webhook is configured
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  echo "Sending Slack notification..."
  
  # Format JSON payload for Slack
  PAYLOAD=$(cat <<EOF
{
  "attachments": [
    {
      "color": "$COLOR",
      "title": "$TITLE",
      "text": "$MESSAGE",
      "fields": [
        {
          "title": "Environment",
          "value": "$ENVIRONMENT",
          "short": true
        },
        {
          "title": "Status",
          "value": "$STATUS",
          "short": true
        },
        {
          "title": "Repository",
          "value": "$REPO_NAME",
          "short": true
        },
        {
          "title": "Commit",
          "value": "$COMMIT_SHA",
          "short": true
        }
      ],
      "footer": "ThiQaX CI/CD Pipeline",
      "ts": $(date +%s)
    }
  ]
}
EOF
)
  
  # Send request to Slack webhook
  curl -s -X POST -H "Content-type: application/json" -d "$PAYLOAD" $SLACK_WEBHOOK_URL
  
  if [ $? -eq 0 ]; then
    echo "Slack notification sent successfully"
  else
    echo "Failed to send Slack notification"
  fi
fi

# Send email notification if SMTP is configured
if [ -n "$NOTIFICATION_EMAIL" ] && [ -n "$SMTP_SERVER" ]; then
  echo "Sending email notification..."
  
  EMAIL_SUBJECT="ThiQaX Deployment: $ENVIRONMENT - $STATUS"
  EMAIL_BODY="$MESSAGE\n\nThis is an automated message from the ThiQaX CI/CD pipeline."
  
  echo -e "$EMAIL_BODY" | mail -s "$EMAIL_SUBJECT" -S smtp="$SMTP_SERVER" "$NOTIFICATION_EMAIL"
  
  if [ $? -eq 0 ]; then
    echo "Email notification sent successfully"
  else
    echo "Failed to send email notification"
  fi
fi

# Log the notification to a local file
echo "[$TIMESTAMP] [$ENVIRONMENT] Deployment $STATUS" >> deployment-notifications.log

echo "Deployment notification completed"
