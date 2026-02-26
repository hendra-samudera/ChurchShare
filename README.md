# ChurchShare

**Memory-Light PDF Sharing for Church Congregations**

A zero-download PDF sharing platform designed specifically for church communities, eliminating storage and version confusion for elderly congregation members.

---

## 📋 Overview

ChurchShare solves two critical problems for church communities:

1. **Storage Overload** — Elderly users with low-spec phones frequently see "Storage Full" errors when downloading PDFs from WhatsApp
2. **Version Chaos** — When PDFs are corrected, multiple versions circulate in chat, causing confusion

### Solution

- **Zero-Download Viewing** — PDFs render directly in the mobile browser via PDF.js. No file is saved to the device.
- **Hot-Swap Links** — Each document has one permanent URL. When an admin replaces a PDF, the link automatically serves the new version.

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Java + Spring Boot | 21 + 4.0.3 |
| **Frontend** | Angular + TypeScript | v21 + 5.9+ |
| **Database** | PostgreSQL | 15+ |
| **Storage** | Cloudflare R2 (MinIO for local) | — |
| **ORM** | Spring Data JPA + Hibernate | 7.1.x |
| **Migrations** | Flyway | 11.x |
| **Auth** | Spring Security + JWT | 7.0.x + 0.12.x |
| **PDF Rendering** | PDF.js | Latest |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose (v2.0+)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/churchshare.git
cd ChurchShare
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings (optional for local dev)
```

### 3. Start All Services

```bash
# Production-like setup
docker-compose up -d

# Development mode with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:4200 | — |
| **Backend API** | http://localhost:8080 | — |
| **Backend Health** | http://localhost:8080/actuator/health | — |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin_secret |
| **PostgreSQL** | localhost:5432 | churchshare / churchshare_dev_password |

---

## 📁 Project Structure

```
ChurchShare/
├── backend/                    # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Java source code
│   │   │   ├── resources/
│   │   │   │   ├── application.yml
│   │   │   │   └── db/        # Flyway migrations
│   │   └── test/              # Unit & integration tests
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                   # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/         # Admin dashboard components
│   │   │   ├── public-viewer/ # PDF viewer component
│   │   │   ├── services/      # Angular services
│   │   │   └── shared/        # Shared components & utilities
│   │   ├── assets/
│   │   ├── environments/
│   │   └── index.html
│   ├── angular.json
│   ├── package.json
│   └── Dockerfile
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx.conf
│   └── init-postgres/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

---

## 🧪 Development

### Backend Development

```bash
cd backend

# Run with Maven
mvn spring-boot:run

# Run tests
mvn test

# Build JAR
mvn clean package

# Debug mode (port 5005)
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=*:5005"
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run start

# Build for production
npm run build -- --configuration production

# Run tests
npm run test
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it churchshare-postgres psql -U churchshare -d churchshare

# View Flyway migration history
docker exec -it churchshare-postgres psql -U churchshare -d churchshare -c "SELECT * FROM flyway_schema_history;"
```

### Storage Access (MinIO)

```bash
# Access MinIO web console
open http://localhost:9001

# Or use mc client
docker exec -it churchshare-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin_secret
docker exec -it churchshare-minio mc ls myminio/churchshare-dev
```

---

## 🔧 Common Commands

### Docker Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Clean up (remove volumes)
docker-compose down -v
```

### Development Mode

```bash
# Start with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Backend only (dev)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up backend

# Frontend only (dev)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up frontend
```

---

## 📊 API Documentation

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/slots/{slug}` | Get slot metadata |
| `GET` | `/api/v1/slots/{slug}/file` | Stream PDF file |

### Admin Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/admin/auth/login` | Admin login |
| `GET` | `/api/v1/admin/slots` | List all slots |
| `POST` | `/api/v1/admin/slots` | Create new slot |
| `POST` | `/api/v1/admin/slots/{id}/upload` | Upload/replace PDF |

---

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
mvn test

# Run with coverage
mvn clean test jacoco:report

# Run specific test class
mvn test -Dtest=SlotServiceTest
```

### Frontend Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test -- --code-coverage

# Run E2E tests
npm run e2e
```

---

## 🔐 Security Notes

### For Production Deployment

1. **Change all default passwords** in `.env`
2. **Generate a strong JWT secret**: `openssl rand -base64 32`
3. **Use HTTPS** (configure SSL termination at nginx or load balancer)
4. **Switch from MinIO to Cloudflare R2** for storage
5. **Enable Spring Security production profile**
6. **Review Content-Security-Policy** in nginx.conf

---

## 📝 License

[Specify your license here]

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.
