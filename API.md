# API Documentation

## Infrastructure API Endpoints

The ThiQaX Platform Infrastructure provides several API endpoints for monitoring, managing, and interacting with the infrastructure components.

### Authentication

All API calls require authentication using JWT tokens.

**Request Header:**
```
Authorization: Bearer <your_jwt_token>
```

### Base URL

All API endpoints are prefixed with: `https://api.thiqax.com/v1/infrastructure`

### Endpoints

#### Health Check

```
GET /health
```

Returns the health status of all infrastructure components.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "redis": "healthy",
    "elasticsearch": "healthy",
    "application": "healthy",
    "nginx": "healthy"
  },
  "timestamp": "2025-04-11T12:34:56Z"
}
```

#### Metrics

```
GET /metrics
```

Returns current system metrics.

**Response:**
```json
{
  "cpu": {
    "usage": 23.5,
    "cores": 4
  },
  "memory": {
    "total": 8192,
    "used": 3456,
    "free": 4736
  },
  "disk": {
    "total": 51200,
    "used": 15360,
    "free": 35840
  },
  "network": {
    "rx_bytes": 1024567,
    "tx_bytes": 2048123
  },
  "timestamp": "2025-04-11T12:34:56Z"
}
```

#### Deployment

```
POST /deploy
```

Triggers a new deployment of the application.

**Request Body:**
```json
{
  "version": "1.2.3",
  "environment": "staging",
  "force": false
}
```

**Response:**
```json
{
  "deployment_id": "d-12345678",
  "status": "initiated",
  "timestamp": "2025-04-11T12:34:56Z",
  "estimated_completion": "2025-04-11T12:44:56Z"
}
```

#### Deployment Status

```
GET /deploy/:deployment_id
```

Returns the status of a specific deployment.

**Response:**
```json
{
  "deployment_id": "d-12345678",
  "status": "completed",
  "started_at": "2025-04-11T12:34:56Z",
  "completed_at": "2025-04-11T12:42:36Z",
  "logs_url": "https://logs.thiqax.com/deployments/d-12345678"
}
```

#### Database Backup

```
POST /database/backup
```

Triggers a backup of the database.

**Request Body:**
```json
{
  "backup_name": "pre-update-backup",
  "description": "Backup before deploying v1.2.3"
}
```

**Response:**
```json
{
  "backup_id": "b-87654321",
  "status": "initiated",
  "timestamp": "2025-04-11T12:34:56Z",
  "estimated_completion": "2025-04-11T12:39:56Z"
}
```

#### Logs

```
GET /logs
```

Returns application logs. Supports filtering.

**Query Parameters:**
- `level` - Log level (info, warn, error)
- `from` - Start timestamp
- `to` - End timestamp
- `service` - Service name
- `limit` - Maximum number of log entries (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-04-11T12:34:56Z",
      "level": "info",
      "service": "api",
      "message": "API server started on port 3000"
    },
    {
      "timestamp": "2025-04-11T12:35:12Z",
      "level": "error",
      "service": "database",
      "message": "Connection timeout",
      "stack_trace": "..."
    }
  ],
  "count": 2,
  "total": 1543
}
```

### Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resource_id": "12345",
      "resource_type": "deployment"
    }
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Authentication failed
- `FORBIDDEN` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `INTERNAL_ERROR` - Server error

### Rate Limiting

API requests are limited to 100 requests per minute per API key. When the limit is exceeded, the API returns status code 429 with a "Too Many Requests" error.

## Client Libraries

Official client libraries for the Infrastructure API:

- JavaScript: `npm install @thiqax/infrastructure-client`
- Python: `pip install thiqax-infrastructure-client`
- Go: `go get github.com/thiqax/infrastructure-client-go`
