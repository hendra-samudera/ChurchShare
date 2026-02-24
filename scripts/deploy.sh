#!/bin/bash
# ===========================================
# ChurchShare One-Command Deployment Script
# ===========================================
# Automates the entire deployment process:
# - Environment setup
# - SSL certificate acquisition
# - Service deployment
# - Health verification
#
# Usage: ./scripts/deploy.sh
# ===========================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env"
SSL_DIR="$PROJECT_DIR/docker/nginx/ssl"
CERTBOT_WEBROOT="$PROJECT_DIR/docker/nginx/certbot-webroot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_banner() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  ChurchShare Production Deployment${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
}

show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-ssl      Skip SSL certificate setup"
    echo "  --skip-build    Skip frontend build"
    echo "  --dry-run       Show what would be done without making changes"
    echo "  --help          Show this help message"
    echo ""
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    local errors=0
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        errors=$((errors + 1))
    else
        log_info "Docker: $(docker --version)"
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        errors=$((errors + 1))
    else
        log_info "Docker Compose: $(docker compose version --short)"
    fi
    
    # Check Node.js (for frontend build)
    if [ "$SKIP_BUILD" != "true" ] && ! command -v node &> /dev/null; then
        log_warn "Node.js not found - frontend build will be skipped"
    fi
    
    # Check if running in project directory
    if [ ! -f "$PROJECT_DIR/docker-compose.prod.yml" ]; then
        log_error "docker-compose.prod.yml not found"
        errors=$((errors + 1))
    fi
    
    if [ $errors -gt 0 ]; then
        log_error "Prerequisites check failed with $errors error(s)"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
    echo ""
}

setup_environment() {
    log_step "Setting up environment..."
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warn ".env file not found"
        
        if [ -f "$PROJECT_DIR/.env.production" ]; then
            log_info "Creating .env from .env.production template..."
            cp "$PROJECT_DIR/.env.production" "$ENV_FILE"
            log_warn "Please edit .env file with your production values before continuing"
            log_warn "Press Enter to open .env in editor, or Ctrl+C to cancel"
            read
            ${EDITOR:-nano} "$ENV_FILE"
        else
            log_error "No .env.production template found"
            exit 1
        fi
    fi
    
    # Validate required environment variables
    log_info "Validating environment variables..."
    
    local required_vars=(
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "POSTGRES_DB"
        "JWT_SECRET"
        "R2_ENDPOINT"
        "R2_ACCESS_KEY"
        "R2_SECRET_KEY"
        "R2_BUCKET_NAME"
        "FRONTEND_URL"
        "SERVER_NAME"
    )
    
    local missing_vars=0
    source "$ENV_FILE"
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"CHANGE_ME"* ]]; then
            log_error "Missing or unset: $var"
            missing_vars=$((missing_vars + 1))
        fi
    done
    
    if [ $missing_vars -gt 0 ]; then
        log_error "Please set $missing_vars required environment variable(s) in .env"
        exit 1
    fi
    
    log_success "Environment setup completed"
    echo ""
}

create_directories() {
    log_step "Creating required directories..."
    
    mkdir -p "$SSL_DIR"
    mkdir -p "$CERTBOT_WEBROOT"
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/backups"
    
    chmod 755 "$SSL_DIR"
    chmod 755 "$CERTBOT_WEBROOT"
    
    log_success "Directories created"
    echo ""
}

build_frontend() {
    if [ "$SKIP_BUILD" == "true" ]; then
        log_info "Skipping frontend build (--skip-build flag set)"
        return
    fi
    
    log_step "Building frontend..."
    
    if ! command -v node &> /dev/null; then
        log_warn "Node.js not found - skipping frontend build"
        log_warn "Please build frontend manually: cd frontend && npm run build"
        return
    fi
    
    cd "$PROJECT_DIR/frontend"
    
    if [ ! -f "package.json" ]; then
        log_warn "package.json not found - skipping frontend build"
        return
    fi
    
    log_info "Installing dependencies..."
    npm ci --production
    
    log_info "Building for production..."
    npm run build
    
    log_success "Frontend build completed"
    cd "$PROJECT_DIR"
    echo ""
}

setup_ssl() {
    if [ "$SKIP_SSL" == "true" ]; then
        log_info "Skipping SSL setup (--skip-ssl flag set)"
        return
    fi
    
    log_step "Setting up SSL certificates..."
    
    source "$ENV_FILE"
    
    # Check if certificates already exist
    if [ -f "$SSL_DIR/live/$SERVER_NAME/fullchain.pem" ]; then
        log_info "SSL certificates already exist, skipping acquisition"
        return
    fi
    
    log_info "Obtaining SSL certificates from Let's Encrypt..."
    
    # Stop nginx if running
    docker compose -f "$COMPOSE_FILE" stop nginx 2>/dev/null || true
    
    # Obtain certificate
    docker run --rm \
        -v "$SSL_DIR:/etc/letsencrypt" \
        -v "$CERTBOT_WEBROOT:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "${ADMIN_EMAIL:-admin@$SERVER_NAME}" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d "$SERVER_NAME" \
        -d "www.$SERVER_NAME"
    
    # Set permissions
    log_info "Setting certificate permissions..."
    chmod 600 "$SSL_DIR/live/$SERVER_NAME/privkey.pem" 2>/dev/null || true
    chmod 644 "$SSL_DIR/live/$SERVER_NAME/cert.pem" 2>/dev/null || true
    chmod 644 "$SSL_DIR/live/$SERVER_NAME/chain.pem" 2>/dev/null || true
    chmod 644 "$SSL_DIR/live/$SERVER_NAME/fullchain.pem" 2>/dev/null || true
    
    # Set ownership for nginx container
    chown -R 101:101 "$SSL_DIR" 2>/dev/null || true
    
    log_success "SSL certificates obtained"
    echo ""
}

deploy_services() {
    log_step "Deploying services..."
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker compose -f "$COMPOSE_FILE" pull
    
    # Build and start services
    log_info "Building and starting services..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    
    log_success "Services deployed"
    echo ""
}

wait_for_services() {
    log_step "Waiting for services to be healthy..."
    
    local max_attempts=60
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        local healthy_count=0
        local total_services=3
        
        if docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "healthy"; then
            healthy_count=$((healthy_count + 1))
        fi
        
        if docker compose -f "$COMPOSE_FILE" ps backend | grep -q "healthy"; then
            healthy_count=$((healthy_count + 1))
        fi
        
        if docker compose -f "$COMPOSE_FILE" ps nginx | grep -q "healthy"; then
            healthy_count=$((healthy_count + 1))
        fi
        
        if [ $healthy_count -eq $total_services ]; then
            log_success "All services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting for services... ($healthy_count/$total_services healthy, attempt $attempt/$max_attempts)"
        sleep 10
    done
    
    log_warn "Some services did not become healthy within timeout"
    log_warn "Check logs: docker compose -f docker-compose.prod.yml logs"
    return 1
}

verify_deployment() {
    log_step "Verifying deployment..."
    
    source "$ENV_FILE"
    
    # Check service status
    echo ""
    log_info "Service Status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    # Test HTTPS endpoint
    log_info "Testing HTTPS endpoint..."
    if curl -k -s -o /dev/null -w "%{http_code}" "https://$SERVER_NAME" | grep -q "200\|301\|302"; then
        log_success "HTTPS endpoint is accessible"
    else
        log_warn "HTTPS endpoint may not be responding correctly"
    fi
    
    # Test API health
    log_info "Testing API health endpoint..."
    if curl -k -s "https://$SERVER_NAME/api/actuator/health" | grep -q "UP"; then
        log_success "API health check passed"
    else
        log_warn "API health check may have issues"
    fi
    
    echo ""
    log_success "Deployment verification completed"
}

show_summary() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    
    source "$ENV_FILE"
    
    echo "Application URLs:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  API:      $BACKEND_URL"
    echo ""
    echo "Useful commands:"
    echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
    echo "  Stop services: docker compose -f docker-compose.prod.yml down"
    echo "  Backup DB:     ./scripts/backup.sh"
    echo "  View status:   docker compose -f docker-compose.prod.yml ps"
    echo ""
    echo "Next steps:"
    echo "  1. Test the application at $FRONTEND_URL"
    echo "  2. Create an admin user"
    echo "  3. Configure Cloudflare R2 CORS settings"
    echo "  4. Set up monitoring and alerts"
    echo ""
}

# Parse arguments
SKIP_SSL="false"
SKIP_BUILD="false"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-ssl)
            SKIP_SSL="true"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    show_banner
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "DRY RUN - No changes will be made"
        echo ""
        log_info "Would perform the following steps:"
        echo "  1. Check prerequisites"
        echo "  2. Setup environment"
        echo "  3. Create directories"
        echo "  4. Build frontend"
        echo "  5. Setup SSL certificates"
        echo "  6. Deploy services"
        echo "  7. Verify deployment"
        exit 0
    fi
    
    check_prerequisites
    setup_environment
    create_directories
    build_frontend
    setup_ssl
    deploy_services
    wait_for_services
    verify_deployment
    show_summary
}

# Run main function
main "$@"
