#!/bin/bash
# ===========================================
# ChurchShare Log Viewer Script
# ===========================================
# View and filter logs from all services
#
# Usage: ./scripts/logs.sh [options]
# ===========================================

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"

# Default options
FOLLOW=false
TAIL=100
SERVICE=""
GREP_PATTERN=""
SINCE=""
UNTIL=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

show_usage() {
    echo "ChurchShare Log Viewer"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -f, --follow        Follow log output (like tail -f)"
    echo "  -n, --lines NUM     Number of lines to show (default: 100)"
    echo "  -s, --service NAME  Show logs for specific service only"
    echo "  -g, --grep PATTERN  Filter logs by pattern"
    echo "  --since TIME        Show logs since timestamp (e.g., '2024-01-01' or '1h')"
    echo "  --until TIME        Show logs until timestamp"
    echo "  -l, --list          List available services"
    echo "  -c, --clear         Clear all log files"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Services:"
    echo "  postgres    PostgreSQL database"
    echo "  backend     Spring Boot application"
    echo "  nginx       Nginx reverse proxy"
    echo ""
    echo "Examples:"
    echo "  $0 -f                     # Follow all logs"
    echo "  $0 -s backend -f          # Follow backend logs only"
    echo "  $0 -g ERROR               # Show logs containing ERROR"
    echo "  $0 -n 50 -s nginx         # Show last 50 nginx logs"
    echo "  $0 --since 1h -f          # Follow logs from last hour"
}

list_services() {
    echo "Available services:"
    echo "  postgres    PostgreSQL database"
    echo "  backend     Spring Boot application"
    echo "  nginx       Nginx reverse proxy"
    echo ""
    echo "Service status:"
    docker compose -f "$COMPOSE_FILE" ps
}

clear_logs() {
    log_info "Clearing log files..."
    
    # Clear Docker container logs
    for container in churchshare-postgres churchshare-backend churchshare-nginx; do
        if docker ps -q -f name="$container" | grep -q .; then
            log_info "Clearing logs for $container"
            docker truncate -s 0 "$container" 2>/dev/null || true
        fi
    done
    
    # Clear application log files
    if [ -d "$PROJECT_DIR/logs" ]; then
        rm -f "$PROJECT_DIR/logs"/*.log.* 2>/dev/null || true
        log_info "Cleared rotated log files"
    fi
    
    log_info "Logs cleared"
}

view_logs() {
    local compose_args=()
    
    # Add service if specified
    if [ -n "$SERVICE" ]; then
        compose_args+=("$SERVICE")
    fi
    
    # Add tail lines
    if [ -n "$TAIL" ]; then
        compose_args+=("--tail" "$TAIL")
    fi
    
    # Add follow flag
    if [ "$FOLLOW" = true ]; then
        compose_args+=("-f")
    fi
    
    # Add since/until
    if [ -n "$SINCE" ]; then
        compose_args+=("--since" "$SINCE")
    fi
    
    if [ -n "$UNTIL" ]; then
        compose_args+=("--until" "$UNTIL")
    fi
    
    # Execute docker compose logs
    if [ -n "$GREP_PATTERN" ]; then
        docker compose -f "$COMPOSE_FILE" logs "${compose_args[@]}" 2>/dev/null | grep --color=always -E "$GREP_PATTERN|.*"
    else
        docker compose -f "$COMPOSE_FILE" logs "${compose_args[@]}"
    fi
}

show_recent_errors() {
    log_info "Recent errors from all services:"
    echo ""
    
    docker compose -f "$COMPOSE_FILE" logs --tail=500 2>/dev/null | \
        grep -i -E "error|exception|fatal|critical" | \
        tail -20
    
    echo ""
}

show_service_health() {
    log_info "Service Health Status:"
    echo ""
    
    for service in postgres backend nginx; do
        local status=$(docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | tail -1 | awk '{print $2}')
        local health=$(docker compose -f "$COMPOSE_FILE" ps "$service" 2>/dev/null | tail -1 | awk '{print $3}')
        
        if [[ "$status" == *"Up"* ]]; then
            echo -e "  ${GREEN}●${NC} $service: $status $health"
        else
            echo -e "  ${RED}●${NC} $service: $status $health"
        fi
    done
    
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            TAIL="$2"
            shift 2
            ;;
        -s|--service)
            SERVICE="$2"
            shift 2
            ;;
        -g|--grep)
            GREP_PATTERN="$2"
            shift 2
            ;;
        --since)
            SINCE="$2"
            shift 2
            ;;
        --until)
            UNTIL="$2"
            shift 2
            ;;
        -l|--list)
            list_services
            exit 0
            ;;
        -c|--clear)
            clear_logs
            exit 0
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            # If no flag, assume it's a service name
            SERVICE="$1"
            shift
            ;;
    esac
done

# Main execution
main() {
    # Check if docker compose is available
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo "Error: docker-compose.prod.yml not found"
        exit 1
    fi
    
    # Show service health if no specific action
    if [ "$FOLLOW" = false ] && [ -z "$GREP_PATTERN" ] && [ -z "$SERVICE" ]; then
        show_service_health
        show_recent_errors
        echo "Use -h for help, -f to follow logs, or specify a service name"
        echo ""
    fi
    
    view_logs
}

main "$@"
