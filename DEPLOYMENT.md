# Deployment Procedures

## Overview

The ThiQaX Platform uses an automated deployment pipeline through GitHub Actions. This document outlines the deployment process, procedures for different environments, and troubleshooting steps.

## Deployment Environments

### Development
- URL: https://dev.thiqax.com
- Auto-deploys from `develop` branch
- Database: Non-production data
- Purpose: Feature testing and integration

### Staging
- URL: https://staging.thiqax.com
- Deploys from `staging` branch
- Database: Anonymized production data
- Purpose: Pre-production testing and validation

### Production
- URL: https://app.thiqax.com
- Deploys from `main` branch
- Database: Production data
- Purpose: Live environment

## Deployment Process

### Automatic Deployment

1. Code is pushed or merged to a deployment branch (`develop`, `staging`, or `main`)
2. GitHub Actions workflow is triggered
3. Tests are run
4. If tests pass, the application is built
5. The application is deployed to the corresponding environment
6. Post-deployment tests are run
7. Notification is sent to the development team

### Manual Deployment

If needed, manual deployment can be performed:

```bash
# Clone repository
git clone https://github.com/thiqax/platform-infrastructure.git
cd platform-infrastructure

# Checkout the appropriate branch
git checkout main  # or staging, develop

# Install dependencies
npm install

# Build the application
npm run build

# Deploy to the specified environment
NODE_ENV=production ./scripts/deploy.sh
```

## Deployment Scripts

The deployment scripts are located in the `scripts` directory:

### deploy.sh

```bash
#!/bin/bash
# Main deployment script
# Usage: ./scripts/deploy.sh [--force] [--skip-tests]

# Load environment variables
source .env

# Set deployment variables
DEPLOY_TIME=$(date +%Y%m%d%H%M%S)
DEPLOY_DIR="/opt/thiqax/releases/$DEPLOY_TIME"
CURRENT_LINK="/opt/thiqax/current"

# Pre-deployment checks
./scripts/pre_deploy_check.sh || exit 1

# Create release directory
mkdir -p $DEPLOY_DIR

# Copy application files
cp -R dist/* $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp .env $DEPLOY_DIR/

# Install production dependencies
cd $DEPLOY_DIR
npm install --production

# Run database migrations
npm run migrate

# Update symlink
ln -sfn $DEPLOY_DIR $CURRENT_LINK

# Restart application
pm2 reload ecosystem.config.js

# Run post-deployment verification
./scripts/post_deploy_verify.sh

echo "Deployment completed successfully at $(date)"
```

### rollback.sh

```bash
#!/bin/bash
# Rollback script
# Usage: ./scripts/rollback.sh [release_timestamp]

# Load environment variables
source .env

RELEASES_DIR="/opt/thiqax/releases"
CURRENT_LINK="/opt/thiqax/current"

# Get current release
CURRENT_RELEASE=$(readlink $CURRENT_LINK)
CURRENT_TIMESTAMP=$(basename $CURRENT_RELEASE)

# Get previous release
if [ -z "$1" ]; then
  PREVIOUS_RELEASE=$(ls -t $RELEASES_DIR | sed -n 2p)
else
  PREVIOUS_RELEASE=$1
fi

if [ ! -d "$RELEASES_DIR/$PREVIOUS_RELEASE" ]; then
  echo "Release $PREVIOUS_RELEASE not found"
  exit 1
fi

# Update symlink to previous release
ln -sfn $RELEASES_DIR/$PREVIOUS_RELEASE $CURRENT_LINK

# Restart application
pm2 reload ecosystem.config.js

echo "Rolled back from $CURRENT_TIMESTAMP to $PREVIOUS_RELEASE at $(date)"
```

## Deployment Verification

After deployment, several verification steps are performed:

1. Health check endpoint is verified
2. Database connection is tested
3. Redis connection is tested
4. Key API endpoints are tested
5. SSL certificate validity is checked
6. Metrics collection is verified

These checks are performed by the `post_deploy_verify.sh` script.

## Deployment Schedule

- Development: Continuous deployment on commit
- Staging: Weekly deployments (Tuesdays at 2 PM ET)
- Production: Bi-weekly deployments (Every other Thursday at 10 PM ET)

## Emergency Hotfix Procedure

1. Create a hotfix branch from `main` or `staging`
   ```bash
   git checkout -b hotfix/issue-description main
   ```

2. Make necessary changes and commit

3. Run tests locally
   ```bash
   npm test
   ```

4. Push hotfix branch and create pull request to `main` or `staging`
   ```bash
   git push origin hotfix/issue-description
   ```

5. After review, merge the pull request

6. Deploy hotfix
   ```bash
   NODE_ENV=production HOTFIX=true ./scripts/deploy.sh
   ```

7. Tag the release
   ```bash
   git tag -a v1.2.3-hotfix.1 -m "Hotfix: description"
   git push origin v1.2.3-hotfix.1
   ```

## Blue-Green Deployment

For critical updates, blue-green deployment can be used:

1. Prepare the "green" environment
   ```bash
   ./scripts/prepare_blue_green.sh
   ```

2. Deploy to the "green" environment
   ```bash
   NODE_ENV=production TARGET=green ./scripts/deploy.sh
   ```

3. Test the "green" environment
   ```bash
   ./scripts/test_environment.sh green
   ```

4. Switch traffic to the "green" environment
   ```bash
   ./scripts/switch_blue_green.sh
   ```

5. Verify the deployment
   ```bash
   ./scripts/verify_environment.sh green
   ```

## Deployment Monitoring

During and after deployment, monitor the following:

1. Application logs: `/var/log/thiqax/application.log`
2. Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
3. System metrics in Grafana: https://monitoring.thiqax.com
4. Error rates in ELK: https://logs.thiqax.com

## Deployment Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for deployment-specific troubleshooting steps.
