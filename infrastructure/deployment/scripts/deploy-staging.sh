# deployment/scripts/deploy-staging.sh
#!/bin/bash

set -e

# Configuration
DEPLOY_ENV="staging"
DEPLOY_DIR="/opt/thiqax/$DEPLOY_ENV"
BACKUP_DIR="/opt/thiqax/backups/$DEPLOY_ENV/$(date +%Y%m%d%H%M%S)"
REPO_URL="https://github.com/MutawaiTrust/thiqax.git"
BRANCH="development"
LOG_FILE="/var/log/thiqax/deployment-$DEPLOY_ENV-$(date +%Y%m%d).log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

# Start logging
exec > >(tee -a $LOG_FILE) 2>&1

echo "=== ThiQaX $DEPLOY_ENV Deployment Started at $(date) ==="

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR" ]; then
    echo "Creating backup of current deployment..."
    cp -R $DEPLOY_DIR/* $BACKUP_DIR/ || echo "Warning: Backup incomplete"
    
    # Backup MongoDB
    echo "Backing up MongoDB database..."
    /opt/thiqax/database/backup/backup.sh "$DEPLOY_ENV" "$BACKUP_DIR/db_backup"
fi

# Create or ensure deployment directory exists
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Pull latest code
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git fetch --all
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
fi

# Copy environment-specific files
echo "Setting up environment configuration..."
cp .env.$DEPLOY_ENV .env

# Build and deploy with Docker Compose
echo "Starting Docker build and deployment..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml down || true
docker-compose -f docker-compose.$DEPLOY_ENV.yml pull
docker-compose -f docker-compose.$DEPLOY_ENV.yml build --no-cache
docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d

# Wait for services to be available
echo "Waiting for services to start..."
sleep 30

# Run health checks
echo "Running health checks..."
./deployment/scripts/health-check.sh $DEPLOY_ENV

if [ $? -ne 0 ]; then
    echo "Health checks failed! Rolling back to previous version..."
    docker-compose -f docker-compose.$DEPLOY_ENV.yml down
    
    # Restore from backup
    rm -rf $DEPLOY_DIR/*
    cp -R $BACKUP_DIR/* $DEPLOY_DIR/
    
    # Restore MongoDB if needed
    if [ -d "$BACKUP_DIR/db_backup" ]; then
        /opt/thiqax/database/restore/restore.sh "$DEPLOY_ENV" "$BACKUP_DIR/db_backup"
    fi
    
    # Restart with previous version
    cd $DEPLOY_DIR
    docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d
    
    echo "Rollback completed. Deployment FAILED."
    exit 1
fi

# Run database migrations if needed
echo "Running database migrations..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml exec -T api npm run migrations

echo "=== Deployment to $DEPLOY_ENV completed successfully at $(date) ==="
echo "Access the application at: https://$DEPLOY_ENV.thiqax.com"

exit 0

# deployment/scripts/deploy-production.sh
#!/bin/bash

set -e

# Configuration
DEPLOY_ENV="production"
DEPLOY_DIR="/opt/thiqax/$DEPLOY_ENV"
BACKUP_DIR="/opt/thiqax/backups/$DEPLOY_ENV/$(date +%Y%m%d%H%M%S)"
REPO_URL="https://github.com/MutawaiTrust/thiqax.git"
BRANCH="main"
LOG_FILE="/var/log/thiqax/deployment-$DEPLOY_ENV-$(date +%Y%m%d).log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

# Start logging
exec > >(tee -a $LOG_FILE) 2>&1

echo "=== ThiQaX $DEPLOY_ENV Deployment Started at $(date) ==="

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR" ]; then
    echo "Creating backup of current deployment..."
    cp -R $DEPLOY_DIR/* $BACKUP_DIR/ || echo "Warning: Backup incomplete"
    
    # Backup MongoDB
    echo "Backing up MongoDB database..."
    /opt/thiqax/database/backup/backup.sh "$DEPLOY_ENV" "$BACKUP_DIR/db_backup"
fi

# Create or ensure deployment directory exists
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Pull latest code
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git fetch --all
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone -b $BRANCH $REPO_URL .
fi

# Copy environment-specific files
echo "Setting up environment configuration..."
cp .env.$DEPLOY_ENV .env

# Build and deploy with Docker Compose
echo "Starting Docker build and deployment..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml down || true
docker-compose -f docker-compose.$DEPLOY_ENV.yml pull
docker-compose -f docker-compose.$DEPLOY_ENV.yml build --no-cache
docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d

# Wait for services to be available
echo "Waiting for services to start..."
sleep 60  # Give more time for production startup

# Run health checks
echo "Running health checks..."
./deployment/scripts/health-check.sh $DEPLOY_ENV

if [ $? -ne 0 ]; then
    echo "Health checks failed! Rolling back to previous version..."
    ./deployment/scripts/rollback.sh $DEPLOY_ENV $BACKUP_DIR
    exit 1
fi

# Run database migrations if needed
echo "Running database migrations..."
docker-compose -f docker-compose.$DEPLOY_ENV.yml exec -T api npm run migrations

echo "=== Deployment to $DEPLOY_ENV completed successfully at $(date) ==="
echo "Access the application at: https://thiqax.com"

exit 0

# deployment/scripts/rollback.sh
#!/bin/bash

set -e

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <environment> <backup_directory>"
    echo "Example: $0 production /opt/thiqax/backups/production/20250415120000"
    exit 1
fi

DEPLOY_ENV=$1
BACKUP_DIR=$2
DEPLOY_DIR="/opt/thiqax/$DEPLOY_ENV"
LOG_FILE="/var/log/thiqax/rollback-$DEPLOY_ENV-$(date +%Y%m%d).log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

# Start logging
exec > >(tee -a $LOG_FILE) 2>&1

echo "=== ThiQaX $DEPLOY_ENV Rollback Started at $(date) ==="
echo "Rolling back to backup: $BACKUP_DIR"

# Validate backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    echo "ERROR: Backup directory $BACKUP_DIR does not exist!"
    exit 1
fi

# Stop current deployment
echo "Stopping current deployment..."
cd $DEPLOY_DIR
docker-compose -f docker-compose.$DEPLOY_ENV.yml down || true

# Restore from backup
echo "Restoring files from backup..."
rm -rf $DEPLOY_DIR/*
cp -R $BACKUP_DIR/* $DEPLOY_DIR/

# Check if database backup exists and restore it
if [ -d "$BACKUP_DIR/db_backup" ]; then
    echo "Restoring database from backup..."
    /opt/thiqax/database/restore/restore.sh "$DEPLOY_ENV" "$BACKUP_DIR/db_backup"
else
    echo "WARNING: No database backup found in $BACKUP_DIR/db_backup"
fi

# Start with previous version
echo "Starting services from previous version..."
cd $DEPLOY_DIR
docker-compose -f docker-compose.$DEPLOY_ENV.yml up -d

# Run health checks
echo "Running health checks..."
./deployment/scripts/health-check.sh $DEPLOY_ENV

if [ $? -ne 0 ]; then
    echo "ERROR: Health checks failed after rollback! System may be in inconsistent state."
    exit 1
else
    echo "Health checks passed after rollback."
fi

echo "=== Rollback to $DEPLOY_ENV completed at $(date) ==="

exit 0

# deployment/scripts/health-check.sh
#!/bin/bash

# Configuration
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <environment>"
    echo "Example: $0 staging"
    exit 1
fi

DEPLOY_ENV=$1
MAX_RETRIES=30
RETRY_INTERVAL=5

if [ "$DEPLOY_ENV" == "production" ]; then
    BASE_URL="https://thiqax.com"
    API_URL="https://api.thiqax.com"
else
    BASE_URL="https://$DEPLOY_ENV.thiqax.com"
    API_URL="https://api.$DEPLOY_ENV.thiqax.com"
fi

# Function to check endpoint health
check_endpoint() {
    local url=$1
    local expected_status=$2
    local retries=$MAX_RETRIES
    
    echo "Checking endpoint: $url"
    
    while [ $retries -gt 0 ]; do
        http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        
        if [ "$http_status" == "$expected_status" ]; then
            echo "✅ $url returned $http_status as expected"
            return 0
        else
            echo "❌ $url returned $http_status, expected $expected_status. Retrying in $RETRY_INTERVAL seconds..."
            sleep $RETRY_INTERVAL
            retries=$((retries-1))
        fi
    done
    
    echo "ERROR: Endpoint $url health check failed after $MAX_RETRIES attempts"
    return 1
}

# Function to check service health via Docker
check_container_health() {
    local container=$1
    local retries=$MAX_RETRIES
    
    echo "Checking container health: $container"
    
    while [ $retries -gt 0 ]; do
        # Check if container is running
        container_status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
        
        if [ "$container_status" != "running" ]; then
            echo "❌ Container $container is not running (status: $container_status). Retrying in $RETRY_INTERVAL seconds..."
            sleep $RETRY_INTERVAL
            retries=$((retries-1))
            continue
        fi
        
        # If container has healthcheck, verify it
        if docker inspect --format='{{if .Config.Healthcheck}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container" 2>/dev/null | grep -q "healthy"; then
            echo "✅ Container $container is healthy"
            return 0
        elif docker inspect --format='{{if .Config.Healthcheck}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$container" 2>/dev/null | grep -q "no-healthcheck"; then
            echo "✅ Container $container is running (no health check defined)"
            return 0
        else
            echo "❌ Container $container health check not passing. Retrying in $RETRY_INTERVAL seconds..."
            sleep $RETRY_INTERVAL
            retries=$((retries-1))
        fi
    done
    
    echo "ERROR: Container $container health check failed after $MAX_RETRIES attempts"
    return 1
}

# Check frontend
check_endpoint "$BASE_URL" "200" || exit 1

# Check API health endpoint
check_endpoint "$API_URL/health" "200" || exit 1

# Check containers health
check_container_health "thiqax-mongo-$DEPLOY_ENV" || exit 1
check_container_health "thiqax-api-$DEPLOY_ENV" || exit 1
check_container_health "thiqax-nginx-$DEPLOY_ENV" || exit 1
check_container_health "thiqax-prometheus-$DEPLOY_ENV" || exit 1
check_container_health "thiqax-elasticsearch-$DEPLOY_ENV" || exit 1

echo "All health checks passed successfully!"
exit 0
