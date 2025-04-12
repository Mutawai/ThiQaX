# Maintenance Procedures

## Routine Maintenance Tasks

### Daily Tasks

1. **Log Rotation Check**
   ```bash
   sudo logrotate -d /etc/logrotate.d/thiqax
   ```

2. **Backup Verification**
   ```bash
   ./scripts/verify_backups.sh
   ```

3. **Health Check**
   ```bash
   curl -s https://app.thiqax.com/health | jq
   ```

### Weekly Tasks

1. **Database Maintenance**
   ```bash
   ./scripts/db_maintenance.sh
   ```

2. **SSL Certificate Check**
   ```bash
   ./scripts/check_ssl_expiry.sh
   ```

3. **Disk Space Cleanup**
   ```bash
   ./scripts/cleanup_disk.sh
   ```

4. **Security Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Node.js Dependency Audit**
   ```bash
   npm audit
   ```

### Monthly Tasks

1. **Full System Backup**
   ```bash
   ./scripts/full_backup.sh
   ```

2. **Performance Benchmark**
   ```bash
   ./scripts/benchmark.sh
   ```

3. **Security Scan**
   ```bash
   ./scripts/security_scan.sh
   ```

4. **Documentation Review**
   - Review and update documentation as needed

## Database Maintenance

### Database Backup

```bash
#!/bin/bash
# Database backup script

# Load environment variables
source .env

# Set backup variables
BACKUP_TIME=$(date +%Y%m%d%H%M%S)
BACKUP_DIR="/opt/thiqax/backups/db"
BACKUP_FILE="$BACKUP_DIR/thiqax_$BACKUP_TIME.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup MongoDB database
mongodump --host $DB_HOST --port $DB_PORT --username $DB_USER --password $DB_PASS --authenticationDatabase $DB_AUTH_SOURCE --db $DB_NAME --gzip --archive=$BACKUP_FILE

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
  
  # Remove backups older than 30 days
  find $BACKUP_DIR -name "thiqax_*.gz" -type f -mtime +30 -delete
else
  echo "Backup failed"
  exit 1
fi
```

### Database Optimization

```bash
#!/bin/bash
# Database optimization script

# Load environment variables
source .env

# Connect to MongoDB and run optimization commands
mongo --host $DB_HOST --port $DB_PORT --username $DB_USER --password $DB_PASS --authenticationDatabase $DB_AUTH_SOURCE $DB_NAME <<EOF
  // Compact database
  db.runCommand({ compact: 'users' });
  db.runCommand({ compact: 'profiles' });
  db.runCommand({ compact: 'applications' });
  
  // Reindex collections
  db.users.reIndex();
  db.profiles.reIndex();
  db.applications.reIndex();
  
  // Analyze queries
  db.setProfilingLevel(1, 100);
EOF

# Check for slow queries
mongo --host $DB_HOST --port $DB_PORT --username $DB_USER --password $DB_PASS --authenticationDatabase $DB_AUTH_SOURCE $DB_NAME --eval "db.system.profile.find({ millis: {\$gt: 100} }).sort({ ts: -1 }).limit(10).toArray()" > /var/log/thiqax/slow_queries.log

echo "Database optimization completed at $(date)"
```

## Log Management

### Log Rotation Configuration

File: `/etc/logrotate.d/thiqax`

```
/var/log/thiqax/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  create 0640 thiqax thiqax
  sharedscripts
  postrotate
    service filebeat restart > /dev/null
  endscript
}
```

### Log Analysis

```bash
#!/bin/bash
# Log analysis script

# Analyze error frequency
echo "Top 10 errors in the last 24 hours:"
grep "ERROR" /var/log/thiqax/application.log | cut -d: -f3- | sort | uniq -c | sort -nr | head -n 10

# Analyze API endpoint usage
echo "Top 10 API endpoints in the last 24 hours:"
grep "API request" /var/log/thiqax/application.log | cut -d: -f4- | sort | uniq -c | sort -nr | head -n 10

# Check for security-related log entries
echo "Security events in the last 24 hours:"
grep -E "unauthorized|forbidden|invalid token|security|attack" /var/log/thiqax/application.log
```

## Performance Tuning

### Node.js Configuration

File: `ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: "thiqax-api",
    script: "./dist/server.js",
    instances: "max",
    exec_mode: "cluster",
    watch: false,
    env: {
      NODE_ENV: "production",
      NODE_OPTIONS: "--max-old-space-size=4096",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
```

### Nginx Performance Tuning

File: `/etc/nginx/nginx.conf`

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
  worker_connections 8192;
  multi_accept on;
  use epoll;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  
  keepalive_timeout 65;
  keepalive_requests 1000;
  
  client_body_timeout 10;
  client_header_timeout 10;
  send_timeout 10;
  
  open_file_cache max=200000 inactive=20s;
  open_file_cache_valid 30s;
  open_file_cache_min_uses 2;
  open_file_cache_errors on;
  
  gzip on;
  gzip_comp_level 5;
  gzip_min_length 256;
  gzip_proxied any;
  gzip_vary on;
  gzip_types
    application/javascript
    application/json
    application/x-javascript
    application/xml
    application/xml+rss
    text/css
    text/javascript
    text/plain
    text/xml;
}
```

## Security Maintenance

### SSL Certificate Renewal

```bash
#!/bin/bash
# SSL certificate renewal script

# Check certificate expiry
CERT_EXPIRY=$(openssl x509 -in /etc/nginx/ssl/thiqax.crt -noout -enddate | cut -d= -f2)
EXPIRY_DATE=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_DATE=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))

echo "SSL certificate expires in $DAYS_LEFT days ($CERT_EXPIRY)"

# Renew if less than 30 days remain
if [ $DAYS_LEFT -lt 30 ]; then
  echo "Renewing SSL certificate..."
  
  # Renew certificate (using Let's Encrypt)
  certbot renew --nginx
  
  # Restart Nginx
  systemctl restart nginx
  
  # Verify renewal
  NEW_EXPIRY=$(openssl x509 -in /etc/nginx/ssl/thiqax.crt -noout -enddate | cut -d= -f2)
  echo "Certificate renewed. New expiry: $NEW_EXPIRY"
else
  echo "No renewal needed at this time."
fi
```

### Security Updates

```bash
#!/bin/bash
# Security updates script

# Update package lists
apt update

# Install security updates only
apt -y --only-upgrade install $(grep -l "^Priority:[[:space:]]*required\|^Priority:[[:space:]]*important\|^Priority:[[:space:]]*critical" /var/lib/apt/lists/*_InRelease | sed -e 's/^.*\/binary-[^\/]*\///' -e 's/_InRelease$//')

# Check for vulnerable Node.js packages
npm audit

# Update Node.js packages if needed
if [ $(npm audit | grep -c "vulnerabilities") -gt 0 ]; then
  echo "Updating vulnerable Node.js packages..."
  npm audit fix
fi

# Restart services if needed
systemctl restart nginx
pm2 reload ecosystem.config.js
```

## Monitoring Maintenance

### Prometheus Configuration Update

```bash
#!/bin/bash
# Update Prometheus configuration

# Update Prometheus configuration
cat > /etc/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'thiqax-platform'
    static_configs:
      - targets: ['localhost:3000']
  
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'mongodb-exporter'
    static_configs:
      - targets: ['localhost:9216']
  
  # Add new targets here
EOF

# Validate configuration
promtool check config /etc/prometheus/prometheus.yml

# Reload Prometheus
curl -X POST http://localhost:9090/-/reload
```

### Alert Configuration

```bash
#!/bin/bash
# Update alerting rules

# Update alert rules
cat > /etc/prometheus/alert.rules.yml << EOF
groups:
- name: thiqax_alerts
  rules:
  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 85% for more than 5 minutes on {{ \$labels.instance }}"
  
  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is above 90% for more than 5 minutes on {{ \$labels.instance }}"
  
  - alert: HighDiskUsage
    expr: 100 - ((node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100) > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High disk usage detected"
      description: "Disk usage is above 85% for more than 5 minutes on {{ \$labels.instance }}"
EOF

# Reload Prometheus
curl -X POST http://localhost:9090/-/reload
```

## Backup and Recovery

### Backup Schedule

- **Database**: Daily at 2 AM
- **Application Files**: Daily at 3 AM
- **Configuration Files**: Weekly on Sunday at 4 AM
- **Full System Backup**: Monthly on the 1st at 1 AM

### Recovery Procedure

```bash
#!/bin/bash
# Recovery script
# Usage: ./scripts/recover.sh <backup_file>

if [ -z "$1" ]; then
  echo "Usage: ./scripts/recover.sh <backup_file>"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Determine backup type
if [[ $BACKUP_FILE == *"db"* ]]; then
  # Database recovery
  echo "Recovering database from $BACKUP_FILE"
  
  # Load environment variables
  source .env
  
  # Restore MongoDB database
  mongorestore --host $DB_HOST --port $DB_PORT --username $DB_USER --password $DB_PASS --authenticationDatabase $DB_AUTH_SOURCE --gzip --archive=$BACKUP_FILE
  
  echo "Database recovery completed"
  
elif [[ $BACKUP_FILE == *"app"* ]]; then
  # Application recovery
  echo "Recovering application files from $BACKUP_FILE"
  
  # Extract backup
  mkdir -p /tmp/recovery
  tar -xzf $BACKUP_FILE -C /tmp/recovery
  
  # Deploy recovered files
  DEPLOY_TIME=$(date +%Y%m%d%H%M%S)
  DEPLOY_DIR="/opt/thiqax/releases/$DEPLOY_TIME"
  CURRENT_LINK="/opt/thiqax/current"
  
  mkdir -p $DEPLOY_DIR
  cp -R /tmp/recovery/* $DEPLOY_DIR/
  
  # Update symlink
  ln -sfn $DEPLOY_DIR $CURRENT_LINK
  
  # Restart application
  pm2 reload ecosystem.config.js
  
  # Clean up
  rm -rf /tmp/recovery
  
  echo "Application recovery completed"
  
else
  echo "Unknown backup type: $BACKUP_FILE"
  exit 1
fi
```

## System Updates

### Node.js Update

```bash
#!/bin/bash
# Update Node.js version

# Current version
CURRENT_VERSION=$(node -v)
echo "Current Node.js version: $CURRENT_VERSION"

# Target version
TARGET_VERSION="v18.15.0"
echo "Target Node.js version: $TARGET_VERSION"

# Check if update is needed
if [ "$CURRENT_VERSION" == "$TARGET_VERSION" ]; then
  echo "Node.js is already at the target version"
  exit 0
fi

# Update Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify update
NEW_VERSION=$(node -v)
echo "Updated Node.js version: $NEW_VERSION"

# Reinstall dependencies
cd /opt/thiqax/current
npm install

# Restart application
pm2 reload ecosystem.config.js
```

### Operating System Updates

```bash
#!/bin/bash
# OS update script

# Update package lists
apt update

# Perform upgrades
apt -y upgrade

# Check if reboot is required
if [ -f /var/run/reboot-required ]; then
  echo "System requires a reboot"
  
  # Schedule reboot for maintenance window
  echo "shutdown -r 2:00" | at now + 1 hour
fi
```

## Appendix: Maintenance Schedule

| Task                       | Frequency | Timing            | Script                        |
|----------------------------|-----------|-------------------|-------------------------------|
| Log Rotation               | Daily     | 12 AM             | Automated via logrotate       |
| Database Backup            | Daily     | 2 AM              | ./scripts/db_backup.sh        |
| Health Check               | Daily     | Every 5 minutes   | Automated via monitoring      |
| Database Maintenance       | Weekly    | Sunday, 2 AM      | ./scripts/db_maintenance.sh   |
| SSL Certificate Check      | Weekly    | Monday, 9 AM      | ./scripts/check_ssl_expiry.sh |
| Disk Cleanup               | Weekly    | Sunday, 3 AM      | ./scripts/cleanup_disk.sh     |
| Security Updates           | Weekly    | Tuesday, 2 AM     | ./scripts/security_updates.sh |
| Dependency Audit           | Weekly    | Monday, 9 AM      | npm audit                     |
| Full System Backup         | Monthly   | 1st, 1 AM         | ./scripts/full_backup.sh      |
| Performance Benchmark      | Monthly   | 1st, 3 AM         | ./scripts/benchmark.sh        |
| Security Scan              | Monthly   | 1st, 4 AM         | ./scripts/security_scan.sh    |
| Documentation Review       | Monthly   | 1st, 10 AM        | Manual process                |
| OS Updates                 | Monthly   | 2nd, 2 AM         | ./scripts/os_update.sh        |
