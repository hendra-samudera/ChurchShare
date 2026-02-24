#!/bin/bash
# ===========================================
# ChurchShare Database Restore Script
# ===========================================
# Restores the PostgreSQL database from a backup file
#
# Usage: ./scripts/restore.sh <backup-file.sql.gz>
# ===========================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_confirm() {
    echo -e "${BLUE}[CONFIRM]${NC} $1"
}

show_usage() {
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Examples:"
    echo "  $0 backups/backup_20240101_120000.sql.gz"
    echo "  $0 /path/to/backup.sql.gz"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -10 || echo "  No backups found in $BACKUP_DIR"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if docker compose is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_error ".env file not found in $PROJECT_DIR"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup file: $backup_file"
    
    # Check if file exists
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    # Check if file is readable
    if [ ! -r "$backup_file" ]; then
        log_error "Backup file is not readable: $backup_file"
        exit 1
    fi
    
    # Verify checksum if available
    local checksum_file="${backup_file}.sha256"
    if [ -f "$checksum_file" ]; then
        log_info "Verifying checksum..."
        if sha256sum -c "$checksum_file" --quiet; then
            log_info "Checksum verification passed"
        else
            log_error "Checksum verification failed! Backup may be corrupted."
            exit 1
        fi
    else
        log_warn "No checksum file found, skipping verification"
    fi
    
    # Check if file is a valid gzip
    if ! gzip -t "$backup_file" 2>/dev/null; then
        log_error "Backup file is not a valid gzip archive"
        exit 1
    fi
    
    log_info "Backup file verification passed"
}

confirm_restore() {
    log_warn "============================================"
    log_warn "  DATABASE RESTORE WARNING"
    log_warn "============================================"
    log_warn ""
    log_warn "This operation will:"
    log_warn "  1. Stop the backend service"
    log_warn "  2. DROP and recreate the database"
    log_warn "  3. Restore data from: $1"
    log_warn ""
    log_warn "All current data will be lost!"
    log_warn ""
    
    read -p "Type 'YES' to confirm restore: " confirm
    
    if [ "$confirm" != "YES" ]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
    
    log_info "Restore confirmed"
}

stop_services() {
    log_info "Stopping backend service..."
    docker compose -f "$COMPOSE_FILE" stop backend || true
    log_info "Backend stopped"
}

restore_database() {
    local backup_file="$1"
    
    # Get database credentials from environment
    source "$PROJECT_DIR/.env"
    
    log_info "Starting database restore..."
    log_info "Database: $POSTGRES_DB"
    log_info "Backup: $backup_file"
    
    # Drop and recreate database
    log_info "Dropping existing database..."
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d postgres -c \
        "DROP DATABASE IF EXISTS $POSTGRES_DB;" || true
    
    log_info "Creating fresh database..."
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d postgres -c \
        "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;"
    
    # Restore from backup
    log_info "Restoring data from backup..."
    gunzip -c "$backup_file" | \
        docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    
    log_info "Data restore completed"
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Start backend briefly to run Flyway migrations
    docker compose -f "$COMPOSE_FILE" start backend
    
    # Wait for backend to be healthy
    log_info "Waiting for backend to start..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" ps backend | grep -q "healthy"; then
            log_info "Backend is healthy, migrations completed"
            break
        fi
        sleep 5
        attempt=$((attempt + 1))
        log_info "Waiting for backend... (attempt $attempt/$max_attempts)"
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_warn "Backend did not become healthy within timeout"
        log_warn "You may need to run migrations manually"
    fi
    
    # Stop backend again
    docker compose -f "$COMPOSE_FILE" stop backend
}

restart_services() {
    log_info "Restarting services..."
    docker compose -f "$COMPOSE_FILE" start backend
    log_info "Services restarted"
}

verify_restore() {
    log_info "Verifying restore..."
    
    # Get database credentials
    source "$PROJECT_DIR/.env"
    
    # Check table count
    local table_count=$(docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    log_info "Tables found: $table_count"
    
    if [ "$table_count" -gt 0 ]; then
        log_info "Database restore verification passed"
    else
        log_warn "No tables found in database"
    fi
}

# Main execution
main() {
    echo "============================================"
    echo "  ChurchShare Database Restore"
    echo "============================================"
    echo ""
    
    # Check if backup file argument is provided
    if [ -z "$1" ]; then
        log_error "No backup file specified"
        echo ""
        show_usage
        exit 1
    fi
    
    local backup_file="$1"
    
    # Handle relative paths
    if [[ "$backup_file" != /* ]]; then
        backup_file="$PROJECT_DIR/$backup_file"
    fi
    
    check_prerequisites
    verify_backup "$backup_file"
    confirm_restore "$backup_file"
    stop_services
    restore_database "$backup_file"
    run_migrations
    restart_services
    verify_restore
    
    echo ""
    log_info "============================================"
    log_info "  RESTORE COMPLETED SUCCESSFULLY"
    log_info "============================================"
    echo ""
    echo "Database has been restored from: $backup_file"
    echo ""
    echo "Next steps:"
    echo "  1. Verify application functionality"
    echo "  2. Check logs: docker compose -f docker-compose.prod.yml logs -f"
    echo "  3. Test critical features"
}

# Run main function
main "$@"
