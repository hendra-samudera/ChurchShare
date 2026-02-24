# ChurchShare Production Checklist

Use this checklist to ensure all production deployment steps are completed.

## Pre-Deployment

### Infrastructure
- [ ] VPS provisioned (minimum 2GB RAM, 2 CPU cores)
- [ ] Domain registered and DNS configured
- [ ] Firewall rules configured (ports 22, 80, 443)
- [ ] SSH key configured for server access
- [ ] Non-root user created on server

### Cloudflare R2
- [ ] Cloudflare account created
- [ ] R2 bucket created
- [ ] API token generated with Admin Read & Write
- [ ] CORS configuration applied
- [ ] Bucket endpoint noted

### SSL Certificates
- [ ] Domain pointing to VPS IP
- [ ] DNS propagation verified
- [ ] SSL directory created (`docker/nginx/ssl`)
- [ ] Certbot webroot directory created

### Environment Configuration
- [ ] `.env` file created from `.env.production`
- [ ] `POSTGRES_PASSWORD` set (strong password)
- [ ] `JWT_SECRET` set (generated with openssl)
- [ ] R2 credentials configured
- [ ] `FRONTEND_URL` set to production domain
- [ ] `SERVER_NAME` set to production domain
- [ ] `.env` file permissions set to 600

## Deployment

### Docker Setup
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Docker daemon configured (log rotation)
- [ ] User added to docker group

### Application Deployment
- [ ] Repository cloned
- [ ] Frontend built (`npm run build`)
- [ ] SSL certificates obtained
- [ ] Services started (`docker compose -f docker-compose.prod.yml up -d`)
- [ ] All services healthy

### Verification
- [ ] HTTPS endpoint accessible
- [ ] Frontend loads correctly
- [ ] API health check passes (`/api/actuator/health`)
- [ ] Database connection working
- [ ] File upload working (R2 integration)
- [ ] SSL certificate valid

## Post-Deployment

### Security
- [ ] `.env` file permissions restricted (600)
- [ ] SSL private key permissions restricted (600)
- [ ] Firewall rules verified
- [ ] Non-root Docker user configured
- [ ] Unused ports closed

### Monitoring
- [ ] Health check endpoint monitored
- [ ] Log aggregation configured (optional)
- [ ] Disk space monitoring enabled
- [ ] Memory monitoring enabled
- [ ] Alert notifications configured

### Backup
- [ ] Initial database backup created
- [ ] Backup script tested
- [ ] Backup retention policy configured
- [ ] Restore procedure tested

### Maintenance
- [ ] SSL renewal cron job installed
- [ ] Log rotation configured
- [ ] Update procedure documented
- [ ] Rollback procedure documented

## Documentation

- [ ] DEPLOYMENT.md reviewed
- [ ] Runbook created for common issues
- [ ] Contact information documented
- [ ] Escalation procedure defined

## Performance

- [ ] Response time < 200ms (p95)
- [ ] Database queries optimized
- [ ] Static assets cached
- [ ] Gzip compression enabled
- [ ] Connection pooling configured

## Compliance

- [ ] Privacy policy updated
- [ ] Terms of service posted
- [ ] Cookie consent implemented (if required)
- [ ] Data retention policy defined
- [ ] GDPR compliance reviewed (if applicable)

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps Engineer | | | |
| Project Manager | | | |
| Security Review | | | |

---

## Notes

Add any deployment-specific notes or configurations here:

```
[Your notes here]
```
