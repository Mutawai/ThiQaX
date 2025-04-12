# Troubleshooting Guide

## Common Issues and Solutions

### Database Connection Issues

**Symptoms:**
- Error logs showing connection timeouts
- Application fails to start with database-related errors
- Slow database responses

**Solutions:**
1. Check database service status:
   ```bash
   sudo systemctl status mongodb
   ```

2. Verify database credentials in `.env` file

3. Check network connectivity:
   ```bash
   nc -zv <DB_HOST> <DB_PORT>
   ```

4. Verify MongoDB authentication settings:
   ```bash
   mongo --host <DB_HOST> --port <DB_PORT> -u <DB_USER> -p <DB_PASS> --authenticationDatabase <DB_AUTH_SOURCE>
   ```

5. Check MongoDB logs:
   ```bash
   sudo tail -f /var/log/mongodb/mongod.log
   ```

### SSL Certificate Issues

**Symptoms:**
- Browser security warnings
- Error logs related to SSL/TLS
- Certificate expiration warnings

**Solutions:**
1. Check certificate validity:
   ```bash
   openssl x509 -in /etc/nginx/ssl/thiqax.crt -text -noout | grep -A2 "Validity"
   ```

2. Verify certificate chain:
   ```bash
   openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt /etc/nginx/ssl/thiqax.crt
   ```

3. Renew expired certificates:
   ```bash
   ./scripts/ssl_renew.sh
   ```

4. Check Nginx SSL configuration:
   ```bash
   nginx -t
   ```

### Deployment Failures

**Symptoms:**
- Failed CI/CD pipeline
- Deployment scripts exit with errors
- Application not updated after deployment

**Solutions:**
1. Check CI/CD logs in GitHub Actions or CI system

2. Verify deployment script permissions:
   ```bash
   chmod +x ./scripts/deploy.sh
   ```

3. Check disk space:
   ```bash
   df -h
   ```

4. Verify environment configurations:
   ```bash
   ./scripts/verify_env.sh
   ```

5. Manual deployment for troubleshooting:
   ```bash
   NODE_ENV=staging ./scripts/deploy.sh --verbose
   ```

### Performance Issues

**Symptoms:**
- High CPU/memory usage
- Slow response times
- Timeout errors

**Solutions:**
1. Check system resources:
   ```bash
   top
   htop
   free -m
   ```

2. Check application logs for bottlenecks:
   ```bash
   tail -f /var/log/thiqax/application.log | grep "slow"
   ```

3. Analyze Nginx access logs for slow endpoints:
   ```bash
   awk '{ print $7, $10 }' /var/log/nginx/access.log | sort -k2 -nr | head -n 20
   ```

4. Review database query performance:
   ```bash
   ./scripts/analyze_db_performance.sh
   ```

5. Check Redis performance:
   ```bash
   redis-cli --stat
   ```

### ELK Stack Issues

**Symptoms:**
- Missing logs in Kibana
- Elasticsearch not indexing data
- Filebeat service failures

**Solutions:**
1. Check Elasticsearch status:
   ```bash
   curl -X GET "localhost:9200/_cluster/health?pretty"
   ```

2. Verify Filebeat configuration:
   ```bash
   filebeat test config -c /etc/filebeat/filebeat.yml
   ```

3. Check Filebeat status:
   ```bash
   sudo systemctl status filebeat
   ```

4. Verify log file permissions:
   ```bash
   ls -la /var/log/thiqax/
   ```

5. Restart ELK components:
   ```bash
   ./scripts/restart_elk.sh
   ```

### Security Issues

**Symptoms:**
- Failed security scans
- Unusual access patterns in logs
- Server access from unexpected locations

**Solutions:**
1. Review security logs:
   ```bash
   tail -f /var/log/auth.log
   ```

2. Check for failed login attempts:
   ```bash
   grep "Failed password" /var/log/auth.log
   ```

3. Run security scan:
   ```bash
   ./scripts/security_scan.sh
   ```

4. Update security patches:
   ```bash
   sudo apt update && sudo apt upgrade
   ```

5. Review firewall rules:
   ```bash
   sudo ufw status
   ```

## Diagnostic Tools

### Log Analysis
```bash
# Get most common error messages
grep "ERROR" /var/log/thiqax/*.log | cut -d: -f3- | sort | uniq -c | sort -nr | head -n 10

# Find slow database queries
grep "slow query" /var/log/mongodb/mongod.log

# Check for rate limiting issues
grep "rate limit exceeded" /var/log/nginx/error.log | wc -l
```

### Performance Analysis
```bash
# CPU and memory usage over time
sar -u 1 10
sar -r 1 10

# Disk I/O
iostat -xz 1 10

# Network traffic
iftop -i eth0
```

### Security Analysis
```bash
# Check for open ports
sudo netstat -tulpn

# Check for running processes
ps aux

# Check for recent user activity
last | head -n 20
```

## Getting Additional Help

If the above solutions don't resolve your issue:

1. Check the [GitHub Issues](https://github.com/thiqax/platform-infrastructure/issues) for similar problems
2. Contact the infrastructure team at infrastructure@thiqax.com
3. Open a new issue with the following information:
   - Detailed description of the problem
   - Steps to reproduce
   - Error messages and logs
   - Environment information (OS, versions, etc.)
