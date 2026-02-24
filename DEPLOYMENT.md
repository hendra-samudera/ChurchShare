# ChurchShare Production Deployment Guide

A comprehensive guide for deploying ChurchShare to production.

![ChurchShare](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Register Domain and Point to VPS](#step-1-register-domain-and-point-to-vps)
4. [Step 2: Create Cloudflare R2 Bucket](#step-2-create-cloudflare-r2-bucket)
5. [Step 3: Provision VPS](#step-3-provision-vps)
6. [Step 4: Install Docker and Docker Compose](#step-4-install-docker-and-docker-compose)
7. [Step 5: Clone Repository and Configure Environment](#step-5-clone-repository-and-configure-environment)
8. [Step 6: Set Up SSL Certificates](#step-6-set-up-ssl-certificates)
9. [Step 7: Start Services](#step-7-start-services)
10. [Step 8: Verify Deployment](#step-8-verify-deployment)
11. [Troubleshooting](#troubleshooting)
12. [Backup and Restore](#backup-and-restore)
13. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Overview

This guide will help you deploy ChurchShare to a production environment using Docker Compose. The deployment includes:

- **PostgreSQL 15** - Primary database with persistent storage
- **Spring Boot Backend** - REST API with JWT authentication
- **Nginx** - Reverse proxy with SSL termination
- **Cloudflare R2** - Object storage for media files
- **Let's Encrypt** - Free SSL certificates

### Architecture

```
                                    ┌─────────────────┐
                                    │   Cloudflare    │
                                    │      R2         │
                                    │   (Storage)     │
                                    └────────┬────────┘
                                             │
                                             │ HTTPS
                                             │
┌──────────┐     HTTPS     ┌─────────┐     ┌─▼─────────┐
│  Users   │──────────────▶│  Nginx  │────▶│  Backend  │
│          │   Port 443    │ (Proxy) │     │(Spring Boot)
└──────────┘               └────┬────┘     └─────┬─────┘
                               │                 │
                         ┌─────▼─────┐     ┌─────▼─────┐
                         │  Static   │     │PostgreSQL │
                         │  Files    │     │ Database  │
                         └───────────┘     └───────────┘
```

---

## Prerequisites

Before starting, ensure you have:

- [ ] A registered domain name (e.g., from Namecheap, GoDaddy, Cloudflare)
- [ ] A VPS/server with at least 2GB RAM and 2 CPU cores
- [ ] SSH access to your VPS
- [ ] A Cloudflare account (for R2 storage)
- [ ] Basic knowledge of Linux command line
- [ ] Git installed on your local machine

### Recommended VPS Specifications

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Storage | 25 GB SSD | 50 GB SSD |
| Bandwidth | 1 TB | Unlimited |

---

## Step 1: Register Domain and Point to VPS

### 1.1 Register a Domain

Purchase a domain from any registrar:
- [Namecheap](https://namecheap.com)
- [Cloudflare](https://cloudflare.com)
- [GoDaddy](https://godaddy.com)

### 1.2 Configure DNS Records

After obtaining your VPS IP address, add the following DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_VPS_IP | Auto |
| A | www | YOUR_VPS_IP | Auto |

**Example using Cloudflare DNS:**

1. Log in to Cloudflare
2. Select your domain
3. Go to DNS settings
4. Add records:
   ```
   Type: A
   Name: @
   Content: 192.0.2.1 (your VPS IP)
   Proxy status: Proxied (orange cloud)
   
   Type: A
   Name: www
   Content: 192.0.2.1 (your VPS IP)
   Proxy status: Proxied (orange cloud)
   ```

### 1.3 Verify DNS Propagation

```bash
# Check if domain resolves to your VPS IP
ping your-domain.com
nslookup your-domain.com

# Or use online tools
# https://dnschecker.org/
```

---

## Step 2: Create Cloudflare R2 Bucket

### 2.1 Enable R2 in Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2** in the left sidebar
3. Click **Create bucket**

### 2.2 Create Bucket

```
Bucket name: churchshare-bucket (or your preferred name)
Region: Choose closest to your users
Public access: Enabled (for public resources)
```

### 2.3 Create API Token

1. Go to **R2** > **API Tokens**
2. Click **Create API token**
3. Select **Admin Read & Write** permission
4. Copy the credentials:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint** (format: `https://ACCOUNT_ID.r2.cloudflarestorage.com`)

### 2.4 Configure CORS for R2

Create a CORS configuration file `cors-config.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com", "https://www.your-domain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply CORS using AWS CLI:

```bash
# Install AWS CLI
sudo apt update && sudo apt install -y awscli

# Configure AWS CLI for R2
aws configure set default.s3.signature_version s3v4
aws configure set default.region auto

# Apply CORS configuration
aws --endpoint-url https://ACCOUNT_ID.r2.cloudflarestorage.com \
  s3api put-bucket-cors \
  --bucket churchshare-bucket \
  --cors-configuration file://cors-config.json
```

---

## Step 3: Provision VPS

### Recommended Providers

#### Hetzner Cloud (Best Value)
- **Price**: ~€5/month
- **Specs**: 2 vCPU, 2GB RAM, 40GB SSD
- **Location**: Europe (Germany, Finland)
- **Sign up**: [hetzner.com/cloud](https://hetzner.com/cloud)

#### DigitalOcean (Easy to Use)
- **Price**: $12/month
- **Specs**: 1 vCPU, 2GB RAM, 50GB SSD
- **Location**: Global
- **Sign up**: [digitalocean.com](https://digitalocean.com)

#### Linode/Akamai (Good Performance)
- **Price**: $10/month
- **Specs**: 1 vCPU, 2GB RAM, 50GB SSD
- **Location**: Global
- **Sign up**: [linode.com](https://linode.com)

### 3.1 Create Server

1. Choose Ubuntu 22.04 LTS or 24.04 LTS
2. Select closest region to your users
3. Add your SSH key
4. Enable firewall (allow SSH, HTTP, HTTPS)

### 3.2 Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Create non-root user
adduser churchshare
usermod -aG sudo churchshare

# Switch to new user
su - churchshare

# Configure SSH key (optional but recommended)
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3.3 Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Check status
sudo ufw status
```

---

## Step 4: Install Docker and Docker Compose

### 4.1 Install Docker

```bash
# Add Docker's official GPG key
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 4.2 Configure Docker Daemon

Create `/etc/docker/daemon.json`:

```bash
sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker
sudo systemctl restart docker
```

---

## Step 5: Clone Repository and Configure Environment

### 5.1 Clone Repository

```bash
# Clone the repository
cd ~
git clone https://github.com/your-org/ChurchShare.git
cd ChurchShare

# Or copy via SCP from local machine
# scp -r . churchshare@your-vps-ip:~/ChurchShare
```

### 5.2 Create Production Environment File

```bash
# Copy the production template
cp .env.production .env

# Edit with your values
nano .env
```

### 5.3 Configure Environment Variables

Edit `.env` with your production values:

```bash
# ===========================================
# Database Configuration
# ===========================================
POSTGRES_USER=churchshare
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>
POSTGRES_DB=churchshare_db

# ===========================================
# JWT Authentication
# ===========================================
# Generate with: openssl rand -base64 64
JWT_SECRET=<GENERATE_STRONG_SECRET>

# ===========================================
# Cloudflare R2 Storage
# ===========================================
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY=<YOUR_R2_ACCESS_KEY>
R2_SECRET_KEY=<YOUR_R2_SECRET_KEY>
R2_BUCKET_NAME=churchshare-bucket

# ===========================================
# Application URLs
# ===========================================
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com/api
SERVER_NAME=your-domain.com
```

### 5.4 Generate Secure Secrets

```bash
# Generate secure PostgreSQL password
openssl rand -base64 32

# Generate secure JWT secret
openssl rand -base64 64

# Example output for .env:
# POSTGRES_PASSWORD=xK9#mP2$vL5@nQ8wR3!yT6&jH4*cF7^bN0
# JWT_SECRET=aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8=
```

### 5.5 Create Required Directories

```bash
# Create SSL and webroot directories
mkdir -p docker/nginx/ssl
mkdir -p docker/nginx/certbot-webroot

# Set permissions
chmod 755 docker/nginx/ssl
chmod 755 docker/nginx/certbot-webroot
```

---

## Step 6: Set Up SSL Certificates

### 6.1 Obtain Let's Encrypt Certificate

```bash
# Stop nginx if running
docker compose -f docker-compose.prod.yml down

# Obtain certificate
docker run --rm \
  -v "$(pwd)/docker/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/docker/nginx/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d your-domain.com \
  -d www.your-domain.com
```

### 6.2 Set Certificate Permissions

```bash
# Set restrictive permissions
chmod 600 docker/nginx/ssl/live/your-domain.com/privkey.pem
chmod 644 docker/nginx/ssl/live/your-domain.com/cert.pem
chmod 644 docker/nginx/ssl/live/your-domain.com/chain.pem
chmod 644 docker/nginx/ssl/live/your-domain.com/fullchain.pem

# Set ownership for nginx container
chown -R 101:101 docker/nginx/ssl
```

### 6.3 Set Up Auto-Renewal

```bash
# Create renewal script
sudo tee /usr/local/bin/certbot-renew.sh > /dev/null << 'EOF'
#!/bin/bash
cd /home/churchshare/ChurchShare
docker run --rm \
  -v "$(pwd)/docker/nginx/ssl:/etc/letsencrypt" \
  -v "$(pwd)/docker/nginx/certbot-webroot:/var/www/certbot" \
  certbot/certbot renew --quiet
docker compose -f docker-compose.prod.yml reload nginx
EOF

# Make executable
sudo chmod +x /usr/local/bin/certbot-renew.sh

# Add to crontab (runs twice daily)
(crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/local/bin/certbot-renew.sh") | crontab -
```

---

## Step 7: Start Services

### 7.1 Build and Start

```bash
# Build frontend (if not already built)
cd frontend
npm install
npm run build
cd ..

# Start all services
docker compose -f docker-compose.prod.yml up -d --build

# View startup logs
docker compose -f docker-compose.prod.yml logs -f
```

### 7.2 Verify Services

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# Expected output:
# NAME                    STATUS         HEALTH
# churchshare-backend     Up (healthy)   
# churchshare-nginx       Up (healthy)   
# churchshare-postgres    Up (healthy)   
```

### 7.3 Build Frontend (Alternative)

If you don't have Node.js on the VPS, build locally and copy:

```bash
# On your local machine
cd frontend
npm install
npm run build

# Copy to VPS
scp -r build/* churchshare@your-vps-ip:~/ChurchShare/frontend/build/
```

---

## Step 8: Verify Deployment

### 8.1 Health Checks

```bash
# Check nginx health
curl -k https://your-domain.com/health

# Check backend health
curl -k https://your-domain.com/api/actuator/health

# Check database connection
curl -k https://your-domain.com/api/actuator/health/readiness
```

### 8.2 Test Application

1. Open browser and navigate to `https://your-domain.com`
2. Verify the frontend loads correctly
3. Try to register a new account
4. Test file upload functionality
5. Verify SSL certificate (click padlock in browser)

### 8.3 Check Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f postgres
```

### 8.4 Performance Check

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df

# Check container health
docker inspect --format='{{.State.Health.Status}}' churchshare-backend
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Check resource limits
docker stats

# Restart container
docker compose -f docker-compose.prod.yml restart <service-name>
```

#### 2. Database Connection Failed

```bash
# Check if postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Verify connection string
docker compose -f docker-compose.prod.yml exec backend env | grep SPRING
```

#### 3. SSL Certificate Issues

```bash
# Check certificate expiration
openssl x509 -in docker/nginx/ssl/live/your-domain.com/cert.pem -noout -dates

# Force renewal
docker run --rm \
  -v "$(pwd)/docker/nginx/ssl:/etc/letsencrypt" \
  certbot/certbot renew --force-renewal
```

#### 4. 502 Bad Gateway

```bash
# Check if backend is running
docker compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

#### 5. Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 6. Disk Space Full

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old logs
sudo journalctl --vacuum-time=7d
```

---

## Backup and Restore

### Backup Procedures

#### Database Backup

```bash
# Manual backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U churchshare churchshare_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (add to crontab)
0 2 * * * cd /home/churchshare/ChurchShare && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U churchshare churchshare_db > backups/backup_$(date +\%Y\%m\%d).sql

# Keep only last 7 backups
find backups/ -name "*.sql" -mtime +7 -delete
```

#### Full Backup Script

Create `scripts/backup.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Starting backup at $DATE..."

# Database backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U churchshare churchshare_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# SSL certificates backup
tar -czf $BACKUP_DIR/ssl_$DATE.tar.gz docker/nginx/ssl

# Environment backup (sanitized)
grep -v "PASSWORD\|SECRET\|KEY" .env > $BACKUP_DIR/env_$DATE.template

echo "Backup completed: $BACKUP_DIR"
ls -lh $BACKUP_DIR
```

### Restore Procedures

#### Database Restore

```bash
# Restore from backup
gunzip < backup_20240101_120000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U churchshare -d churchshare_db
```

#### Full Restore Script

Create `scripts/restore.sh`:

```bash
#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

echo "Restoring from $BACKUP_FILE..."

# Stop application
docker compose -f docker-compose.prod.yml stop backend

# Restore database
gunzip < $BACKUP_FILE | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U churchshare -d churchshare_db

# Restart application
docker compose -f docker-compose.prod.yml start backend

echo "Restore completed!"
```

---

## Monitoring and Maintenance

### Health Monitoring

```bash
# Create monitoring script
cat > /usr/local/bin/churchshare-health.sh << 'EOF'
#!/bin/bash

# Check services
docker compose -f /home/churchshare/ChurchShare/docker-compose.prod.yml ps

# Check disk space
df -h /

# Check memory
free -h

# Check recent logs for errors
docker compose -f /home/churchshare/ChurchShare/docker-compose.prod.yml logs --tail=100 | grep -i error
EOF

chmod +x /usr/local/bin/churchshare-health.sh
```

### Log Rotation

Docker Compose is already configured with log rotation. Additional system logs:

```bash
# Configure logrotate for application logs
sudo tee /etc/logrotate.d/churchshare > /dev/null << 'EOF'
/home/churchshare/ChurchShare/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 churchshare churchshare
    sharedscripts
    postrotate
        docker compose -f /home/churchshare/ChurchShare/docker-compose.prod.yml kill -s HUP backend
    endscript
}
EOF
```

### Updates

```bash
# Update application
cd ~/ChurchShare
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Update Docker images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Security Updates

```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Docker images monthly
docker image prune -a --force
```

---

## Support

For issues and questions:
- Check [TESTING.md](./TESTING.md) for testing procedures
- Review application logs: `docker compose -f docker-compose.prod.yml logs -f`
- Open an issue on the GitHub repository

---

## Appendix

### A. Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_USER` | Database username | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `POSTGRES_DB` | Database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | Yes |
| `R2_ACCESS_KEY` | R2 access key | Yes |
| `R2_SECRET_KEY` | R2 secret key | Yes |
| `R2_BUCKET_NAME` | R2 bucket name | Yes |
| `FRONTEND_URL` | Frontend URL | Yes |
| `BACKEND_URL` | Backend API URL | Yes |
| `SERVER_NAME` | Domain name for SSL | Yes |

### B. Port Reference

| Port | Service | Description |
|------|---------|-------------|
| 80 | Nginx | HTTP (redirects to HTTPS) |
| 443 | Nginx | HTTPS |
| 5432 | PostgreSQL | Database (internal only) |
| 8080 | Backend | API (internal only) |

### C. File Locations

| Path | Description |
|------|-------------|
| `/var/lib/docker/volumes/churchshare_postgres_data` | Database files |
| `docker/nginx/ssl/` | SSL certificates |
| `logs/` | Application logs |
| `.env` | Environment configuration |
