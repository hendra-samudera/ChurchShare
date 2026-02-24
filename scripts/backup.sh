#!/bin/bash
# ===========================================
# ChurchShare Database Backup Script
# ===========================================
# Creates a compressed backup of the PostgreSQL database
# Backups are stored in ./backups directory
#
# Usage: ./scripts/backup.sh [backup-name]
# ===========================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

# Backup name (optional argument)
BACKUP_NAME="${1:-backup_$DATE}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    
    # Check if postgres service is running
    if ! docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log_error "PostgreSQL container is not running"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

create_backup() {
    log_info "Starting database backup: $BACKUP_NAME"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Get database credentials from environment
    source "$PROJECT_DIR/.env"
    
    # Create backup file name
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
    
    # Perform backup
    log_info "Dumping database '$POSTGRES_DB'..."
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | \
        gzip > "$BACKUP_FILE"
    
    # Verify backup was created
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_info "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        log_error "Backup file was not created"
        exit 1
    fi
    
    # Create checksum
    log_info "Creating checksum..."
    sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"
    
    # Create metadata file
    log_info "Creating metadata file..."
    cat > "${BACKUP_FILE}.meta" << EOF
backup_name=$BACKUP_NAME
backup_file=$(basename "$BACKUP_FILE")
database=$POSTGRES_DB
timestamp=$DATE
hostname=$(hostname)
size=$(du -h "$BACKUP_FILE" | cut -f1)
checksum=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
EOF
    
    log_info "Metadata created: ${BACKUP_FILE}.meta"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7 days)..."
    
    # Find and remove backups older than 7 days
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.sha256" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.meta" -mtime +7 -delete
    
    log_info "Cleanup completed"
}

show_backup_list() {
    echo ""
    log_info "Recent backups:"
    echo "----------------------------------------"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"
    echo "----------------------------------------"
}

# Main execution
main() {
    echo "============================================"
    echo "  ChurchShare Database Backup"
    echo "============================================"
    echo ""
    
    check_prerequisites
    create_backup
    cleanup_old_backups
    show_backup_list
    
    echo ""
    log_info "Backup completed successfully!"
    echo ""
    echo "Backup location: $BACKUP_DIR"
    echo "To restore, use: ./scripts/restore.sh $BACKUP_FILE"
}

# Run main function
main "$@"
