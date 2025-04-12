# Configuration Guide

## Environment Configuration

All environment variables are managed through `.env` files. The repository includes `.env.example` as a template.

### Core Environment Variables

```
# Application
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0
APP_NAME=ThiQaX
APP_URL=https://app.thiqax.com

# Database
DB_HOST=localhost
DB_PORT=27017
DB_NAME=thiqax
DB_USER=thiqaxuser
DB_PASS=your_password_here
DB_AUTH_SOURCE=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=86400
COOKIE_SECRET=your_cookie_secret_here
ENCRYPTION_KEY=your_encryption_key

# Logging
LOG_LEVEL=info
ELASTIC_URL=http://localhost:9200
KIBANA_URL=http://localhost:5601

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

## Web Server Configuration

Nginx configuration is stored in `nginx.conf`. Key settings include:

```nginx
server {
    listen 80;
    server_name app.thiqax.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.thiqax.com;
    
    ssl_certificate /etc/nginx/ssl/thiqax.crt;
    ssl_certificate_key /etc/nginx/ssl/thiqax.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    
    # Proxy settings for Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring Configuration

### Prometheus Configuration
The Prometheus configuration is stored in `prometheus.yml`:

```yaml
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
```

### Filebeat Configuration
The Filebeat configuration is stored in `filebeat.yml`:

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/thiqax/*.log
    - /var/log/nginx/*.log

output.elasticsearch:
  hosts: ["localhost:9200"]
  username: "elastic"
  password: "${ELASTIC_PASSWORD}"
  
setup.kibana:
  host: "localhost:5601"
```

## Docker Configuration

The Docker Compose configuration is stored in `docker-compose.yml`. Key services include:

- Application
- MongoDB
- Redis
- Nginx
- ELK Stack
- Prometheus
- Grafana

## Security Configuration

Security settings are configured through the security management component. Key configurations include:

- Helmet.js settings for secure HTTP headers
- Rate limiting configuration
- CORS configuration
- Input validation rules
- Authentication middleware settings

## Backup Configuration

Backup settings are configured in `backup-config.yml`:

```yaml
backups:
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: 30  # Keep backups for 30 days
  storage:
    type: "s3"
    bucket: "thiqax-backups"
    region: "us-east-1"
  targets:
    - database
    - uploads
    - configuration
```
