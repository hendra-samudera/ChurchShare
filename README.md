# ChurchShare

A modern church resource sharing platform built with React and Spring Boot.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)

## Project Overview

ChurchShare is a comprehensive platform designed to facilitate resource sharing, event management, and community engagement for churches. The application provides a seamless experience for church administrators and members to share resources, manage events, and stay connected.

## Quick Links

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete production deployment instructions
- **[Testing Guide](./TESTING.md)** - Testing procedures and guidelines
- **[Architecture](#architecture)** - System architecture overview

---

## Production Quickstart

Deploy ChurchShare to production in minutes:

```bash
# 1. Clone repository
git clone https://github.com/your-org/ChurchShare.git
cd ChurchShare

# 2. Configure environment
cp .env.production .env
# Edit .env with your production values

# 3. Deploy with one command
./scripts/deploy.sh
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Architecture

### System Architecture

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

### Technology Stack

#### Frontend
- **React 18** - Modern UI library
- **Bootstrap 5** - Responsive CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form management
- **React Query** - Server state management

#### Backend
- **Java 17** - Core language
- **Spring Boot 3** - Application framework
- **Spring Security** - Authentication & Authorization
- **Spring Data JPA** - Database ORM
- **PostgreSQL 15** - Primary database
- **JWT** - Token-based authentication
- **Cloudflare R2** - Object storage for media files
- **Flyway** - Database migrations

#### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy & SSL termination
- **Let's Encrypt** - Free SSL certificates

---

## Success Metrics (from PRD)

| Metric | Target | Description |
|--------|--------|-------------|
| **Uptime** | 99.9% | System availability |
| **Response Time** | < 200ms | API response time (p95) |
| **Concurrent Users** | 1000+ | Supported simultaneous users |
| **File Upload** | 20MB | Maximum file size |
| **Backup RPO** | 24 hours | Recovery Point Objective |
| **Backup RTO** | 1 hour | Recovery Time Objective |

---

## Local Development

### Prerequisites

- Docker & Docker Compose
- Java 17+ (for local backend development)
- Node.js 18+ (for local frontend development)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/ChurchShare.git
cd ChurchShare

# 2. Copy environment template
cp .env.example .env

# 3. Start with Docker Compose
docker-compose up -d --build

# 4. View logs
docker-compose logs -f
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:80 | Web application |
| Backend API | http://localhost:8080 | REST API |
| PostgreSQL | localhost:5432 | Database |

---

## Project Structure

```
ChurchShare/
├── frontend/                    # React application
│   ├── public/                  # Static assets
│   └── src/                     # Source code
├── backend/                     # Spring Boot application
│   ├── src/                     # Java source code
│   │   └── main/
│   │       ├── java/            # Java packages
│   │       └── resources/       # Configuration files
│   └── Dockerfile               # Backend Docker config
├── docker/                      # Docker configurations
│   ├── nginx/                   # Nginx configuration
│   │   ├── conf.d/              # Server configs
│   │   └── ssl/                 # SSL certificates
│   └── postgres/                # PostgreSQL init scripts
├── scripts/                     # Deployment scripts
│   ├── deploy.sh                # One-command deployment
│   ├── backup.sh                # Database backup
│   ├── restore.sh               # Database restore
│   ├── logs.sh                  # Log viewer
│   └── init-r2-bucket.sh        # R2 setup
├── docker-compose.yml           # Development config
├── docker-compose.prod.yml      # Production config
├── .env.example                 # Environment template
├── .env.production              # Production template
├── DEPLOYMENT.md                # Deployment guide
├── TESTING.md                   # Testing guide
└── README.md                    # This file
```

---

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80, 443 | Reverse proxy & static files |
| backend | 8080 | Spring Boot API server |
| postgres | 5432 | PostgreSQL database |

---

## Deployment Scripts

| Script | Description |
|--------|-------------|
| `./scripts/deploy.sh` | One-command production deployment |
| `./scripts/backup.sh` | Database backup with compression |
| `./scripts/restore.sh` | Restore database from backup |
| `./scripts/logs.sh` | View and filter service logs |
| `./scripts/init-r2-bucket.sh` | Configure Cloudflare R2 bucket |

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | churchshare |
| `POSTGRES_PASSWORD` | Database password | (generate strong password) |
| `POSTGRES_DB` | Database name | churchshare_db |
| `JWT_SECRET` | JWT signing secret | (generate with openssl) |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | https://account.r2.cloudflarestorage.com |
| `R2_ACCESS_KEY` | R2 access key | (from Cloudflare) |
| `R2_SECRET_KEY` | R2 secret key | (from Cloudflare) |
| `R2_BUCKET_NAME` | R2 bucket name | churchshare-bucket |
| `FRONTEND_URL` | Frontend URL | https://your-domain.com |
| `SERVER_NAME` | Domain for SSL | your-domain.com |

### Generate Secure Secrets

```bash
# PostgreSQL password
openssl rand -base64 32

# JWT secret
openssl rand -base64 64
```

---

## Development Commands

```bash
# Start all services (development)
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f [service-name]

# Access backend container
docker exec -it churchshare-backend sh

# Access database
docker exec -it churchshare-postgres psql -U churchshare -d churchshare_db

# Production deployment
./scripts/deploy.sh

# Backup database
./scripts/backup.sh

# View logs
./scripts/logs.sh -f
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. Create feature branch from `main`
2. Make changes and test locally
3. Run tests: `./mvnw test` (backend), `npm test` (frontend)
4. Submit PR with description of changes
5. Code review and merge

---

## Security

- All passwords and secrets should be stored in environment variables
- Use strong, unique passwords for production
- Enable HTTPS with Let's Encrypt SSL certificates
- Regular security updates for dependencies
- JWT tokens with secure expiration settings

---

## License

This project is licensed under the MIT License.

---

## Support

For issues and questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment troubleshooting
- Check [TESTING.md](./TESTING.md) for testing procedures
- Open an issue on the GitHub repository

---

## Changelog

### Version 1.0.0
- Initial production release
- Docker Compose deployment
- Cloudflare R2 integration
- SSL/TLS support
- Automated backups
