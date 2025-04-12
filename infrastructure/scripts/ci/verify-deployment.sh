#!/bin/bash
#
# ThiQaX Platform Deployment Verification
# This script verifies that the deployment was successful
#
# Usage: ./verify-deployment.sh

set -e

# Check if environment variables are set
if [ -z "$API_URL" ]; then
  echo "Error: API_URL environment variable is not set"
  exit 1
fi

MAX_RETRIES=12
RETRY_INTERVAL=10
RETRY_COUNT=0
HEALTH_CHECK_ENDPOINT="$API_URL/api/v1/health"

echo "Verifying deployment at $(date)"
echo "Health check endpoint: $HEALTH_CHECK_ENDPOINT"

# Wait for the application to start and become responsive
echo "Waiting for application to be ready..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_ENDPOINT)
  
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "Application is ready and responding with HTTP 200"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Attempt $RETRY_COUNT/$MAX_RETRIES: Application not ready yet (HTTP $HTTP_STATUS). Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Application failed to become responsive after $MAX_RETRIES attempts"
  exit 1
fi

# Check application version
echo "Checking application version..."
VERSION_RESPONSE=$(curl -s $API_URL/api/v1/version)
if [ $? -ne 0 ]; then
  echo "Error: Failed to retrieve application version"
  exit 1
fi

# Check key endpoints
echo "Checking API endpoints..."

# API documentation endpoint
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api-docs)
if [ "$DOCS_STATUS" -ne 200 ]; then
  echo "Error: API documentation endpoint is not responding correctly (HTTP $DOCS_STATUS)"
  exit 1
fi
echo "API documentation endpoint: OK"

# Auth endpoint
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/api/v1/auth/login -X OPTIONS)
if [ "$AUTH_STATUS" -ne 204 ] && [ "$AUTH_STATUS" -ne 200 ]; then
  echo "Error: Auth endpoint is not responding correctly (HTTP $AUTH_STATUS)"
  exit 1
fi
echo "Auth endpoint: OK"

# Check database connectivity
echo "Checking database connectivity..."
DB_CHECK_RESPONSE=$(curl -s $API_URL/api/v1/health/db)
if ! echo $DB_CHECK_RESPONSE | grep -q "database.*connected"; then
  echo "Error: Database connectivity check failed"
  echo "Response: $DB_CHECK_RESPONSE"
  exit 1
fi
echo "Database connectivity: OK"

# Additional checks for environment-specific requirements
if [[ "$API_URL" == *"production"* ]]; then
  echo "Running production-specific checks..."
  
  # SSL check
  echo "Checking SSL configuration..."
  SSL_RESPONSE=$(curl -s -v https://${API_URL#https://} 2>&1 | grep "TLSv1.2\|TLSv1.3")
  if [ -z "$SSL_RESPONSE" ]; then
    echo "Warning: SSL might not be using TLS 1.2 or 1.3"
  else
    echo "SSL configuration: OK"
  fi
  
  # Load balancer check
  echo "Checking load balancer..."
  LB_HEADERS=$(curl -s -I $API_URL | grep -i "X-Load-Balancer")
  if [ -n "$LB_HEADERS" ]; then
    echo "Load balancer: OK"
  else
    echo "Warning: Load balancer headers not detected"
  fi
fi

echo "All deployment verification checks passed successfully!"
exit 0
