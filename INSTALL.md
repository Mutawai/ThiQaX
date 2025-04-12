# Installation Guide

## Prerequisites
- Node.js 18.x or higher
- Docker 24.x or higher
- Docker Compose 2.x
- Git
- MongoDB 6.x
- Nginx 1.22.x
- OpenSSL

## System Requirements
- CPU: 4+ cores recommended
- RAM: 8+ GB recommended
- Storage: 50+ GB SSD recommended
- OS: Ubuntu 22.04 LTS or later

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/thiqax/platform-infrastructure.git
cd platform-infrastructure
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env file with your specific configuration
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
./scripts/db_setup.sh
```

### 5. SSL Certificate Setup
```bash
./scripts/ssl_setup.sh
```

### 6. Configure ELK Stack
```bash
./scripts/elk_setup.sh
```

### 7. Set Up Monitoring
```bash
./scripts/monitoring_setup.sh
```

### 8. Set Up Security
```bash
./scripts/security_setup.sh
```

### 9. Verify Installation
```bash
./scripts/verify_installation.sh
```

## Docker Installation (Alternative)
For containerized deployment:

```bash
docker-compose up -d
```

## Troubleshooting Installation Issues
See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common installation issues.
