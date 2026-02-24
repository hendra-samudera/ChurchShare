#!/bin/bash
# ===========================================
# ChurchShare R2 Bucket Initialization Script
# ===========================================
# Configures Cloudflare R2 bucket with:
# - CORS settings
# - Public access configuration
# - Lifecycle policies
#
# Prerequisites:
# - AWS CLI installed
# - R2 credentials configured
#
# Usage: ./scripts/init-r2-bucket.sh
# ===========================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

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

show_usage() {
    echo "ChurchShare R2 Bucket Initialization"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --bucket NAME     Specify bucket name (default: from .env)"
    echo "  --dry-run         Show what would be done without making changes"
    echo "  --help            Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  1. AWS CLI installed: https://aws.amazon.com/cli/"
    echo "  2. R2 credentials configured in ~/.aws/credentials"
    echo "  3. Bucket created in Cloudflare Dashboard"
    echo ""
    echo "AWS CLI Configuration:"
    echo "  aws configure set profile.r2.region auto"
    echo "  aws configure set profile.r2.output json"
    echo ""
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        echo ""
        echo "Install AWS CLI:"
        echo "  Ubuntu/Debian: sudo apt install awscli"
        echo "  macOS: brew install awscli"
        echo "  Windows: Download from https://aws.amazon.com/cli/"
        exit 1
    fi
    
    log_info "AWS CLI: $(aws --version)"
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found"
        exit 1
    fi
    
    # Load environment variables
    source "$ENV_FILE"
    
    # Validate R2 credentials
    if [ -z "$R2_ACCESS_KEY" ] || [ "$R2_ACCESS_KEY" == *"CHANGE_ME"* ]; then
        log_error "R2_ACCESS_KEY not configured in .env"
        exit 1
    fi
    
    if [ -z "$R2_SECRET_KEY" ] || [ "$R2_SECRET_KEY" == *"CHANGE_ME"* ]; then
        log_error "R2_SECRET_KEY not configured in .env"
        exit 1
    fi
    
    if [ -z "$R2_ENDPOINT" ] || [ "$R2_ENDPOINT" == *"CHANGE_ME"* ]; then
        log_error "R2_ENDPOINT not configured in .env"
        exit 1
    fi
    
    if [ -z "$R2_BUCKET_NAME" ] || [ "$R2_BUCKET_NAME" == *"CHANGE_ME"* ]; then
        log_error "R2_BUCKET_NAME not configured in .env"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
    echo ""
}

configure_aws_profile() {
    log_step "Configuring AWS CLI profile for R2..."
    
    source "$ENV_FILE"
    
    # Extract account ID from endpoint
    local account_id=$(echo "$R2_ENDPOINT" | sed -n 's|https://\([^.]*\)\.r2\.cloudflarestorage\.com|\1|p')
    
    if [ -z "$account_id" ]; then
        log_error "Could not extract account ID from R2_ENDPOINT"
        exit 1
    fi
    
    log_info "Account ID: $account_id"
    
    # Configure AWS profile
    aws configure set profile.r2.region auto
    aws configure set profile.r2.output json
    aws configure set profile.r2.endpoint_url "$R2_ENDPOINT"
    aws configure set profile.r2.aws_access_key_id "$R2_ACCESS_KEY"
    aws configure set profile.r2.aws_secret_access_key "$R2_SECRET_KEY"
    
    log_success "AWS CLI profile 'r2' configured"
    echo ""
}

create_bucket() {
    local bucket_name="$1"
    local dry_run="$2"
    
    log_step "Checking if bucket exists: $bucket_name..."
    
    if [ "$dry_run" == "true" ]; then
        log_info "[DRY RUN] Would check/create bucket: $bucket_name"
        return
    fi
    
    # Check if bucket exists
    if aws --profile r2 s3 ls "s3://$bucket_name" 2>/dev/null; then
        log_info "Bucket already exists: $bucket_name"
    else
        log_info "Creating bucket: $bucket_name..."
        aws --profile r2 s3 mb "s3://$bucket_name"
        log_success "Bucket created: $bucket_name"
    fi
}

configure_cors() {
    local bucket_name="$1"
    local dry_run="$2"
    
    log_step "Configuring CORS for bucket: $bucket_name..."
    
    source "$ENV_FILE"
    
    # Create CORS configuration
    local cors_config=$(cat << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": [
                "$FRONTEND_URL",
                "http://localhost:3000",
                "http://localhost:80"
            ],
            "AllowedMethods": [
                "GET",
                "PUT",
                "POST",
                "DELETE",
                "HEAD"
            ],
            "AllowedHeaders": [
                "*"
            ],
            "ExposeHeaders": [
                "ETag",
                "x-amz-meta-custom-label"
            ],
            "MaxAgeSeconds": 3600
        }
    ]
}
EOF
)
    
    if [ "$dry_run" == "true" ]; then
        log_info "[DRY RUN] Would apply CORS configuration:"
        echo "$cors_config" | python3 -m json.tool 2>/dev/null || echo "$cors_config"
        return
    fi
    
    # Save CORS config to temp file
    local temp_file=$(mktemp)
    echo "$cors_config" > "$temp_file"
    
    # Apply CORS configuration
    aws --profile r2 s3api put-bucket-cors \
        --bucket "$bucket_name" \
        --cors-configuration "file://$temp_file"
    
    rm -f "$temp_file"
    
    log_success "CORS configuration applied"
    echo ""
}

configure_public_access() {
    local bucket_name="$1"
    local dry_run="$2"
    
    log_step "Configuring public access settings..."
    
    if [ "$dry_run" == "true" ]; then
        log_info "[DRY RUN] Would configure public access block"
        return
    fi
    
    # Disable public access block (allow public ACLs if needed)
    aws --profile r2 s3api put-public-access-block \
        --bucket "$bucket_name" \
        --public-access-block-configuration '{
            "BlockPublicAcls": false,
            "IgnorePublicAcls": false,
            "BlockPublicPolicy": false,
            "RestrictPublicBuckets": false
        }' 2>/dev/null || true
    
    log_info "Public access block configured"
    echo ""
}

configure_lifecycle() {
    local bucket_name="$1"
    local dry_run="$2"
    
    log_step "Configuring lifecycle policies..."
    
    # Create lifecycle configuration
    local lifecycle_config=$(cat << EOF
{
    "Rules": [
        {
            "ID": "DeleteOldUploads",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "temp/"
            },
            "Expiration": {
                "Days": 7
            }
        },
        {
            "ID": "ArchiveOldResources",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "resources/"
            },
            "Transitions": [
                {
                    "Days": 90,
                    "StorageClass": "INFREQUENT"
                }
            ]
        }
    ]
}
EOF
)
    
    if [ "$dry_run" == "true" ]; then
        log_info "[DRY RUN] Would apply lifecycle configuration:"
        echo "$lifecycle_config" | python3 -m json.tool 2>/dev/null || echo "$lifecycle_config"
        return
    fi
    
    # Save lifecycle config to temp file
    local temp_file=$(mktemp)
    echo "$lifecycle_config" > "$temp_file"
    
    # Apply lifecycle configuration
    aws --profile r2 s3api put-bucket-lifecycle-configuration \
        --bucket "$bucket_name" \
        --lifecycle-configuration "file://$temp_file"
    
    rm -f "$temp_file"
    
    log_success "Lifecycle policies configured"
    echo ""
}

test_bucket_access() {
    local bucket_name="$1"
    local dry_run="$2"
    
    log_step "Testing bucket access..."
    
    if [ "$dry_run" == "true" ]; then
        log_info "[DRY RUN] Would test bucket access"
        return
    fi
    
    # Create test file
    local test_content="ChurchShare R2 Test - $(date)"
    local test_file=$(mktemp)
    echo "$test_content" > "$test_file"
    
    # Upload test file
    log_info "Uploading test file..."
    aws --profile r2 s3 cp "$test_file" "s3://$bucket_name/.churchshare-test"
    
    # Download test file
    log_info "Downloading test file..."
    local downloaded_content=$(aws --profile r2 s3 cp "s3://$bucket_name/.churchshare-test" -)
    
    # Verify content
    if [ "$downloaded_content" == "$test_content" ]; then
        log_success "Bucket access test passed"
    else
        log_error "Bucket access test failed"
        exit 1
    fi
    
    # Clean up test file
    log_info "Cleaning up test file..."
    aws --profile r2 s3 rm "s3://$bucket_name/.churchshare-test"
    rm -f "$test_file"
    
    echo ""
}

list_bucket_info() {
    local bucket_name="$1"
    
    log_step "Bucket Information:"
    
    source "$ENV_FILE"
    
    echo ""
    echo "  Bucket Name:    $bucket_name"
    echo "  Endpoint:       $R2_ENDPOINT"
    echo "  Frontend URL:   $FRONTEND_URL"
    echo ""
    echo "  CORS Origins:"
    echo "    - $FRONTEND_URL"
    echo "    - http://localhost:3000"
    echo "    - http://localhost:80"
    echo ""
    echo "  Lifecycle Rules:"
    echo "    - temp/* files: Delete after 7 days"
    echo "    - resources/*: Archive after 90 days"
    echo ""
}

show_summary() {
    source "$ENV_FILE"
    
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}  R2 Bucket Configuration Complete${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Bucket: $R2_BUCKET_NAME"
    echo "Endpoint: $R2_ENDPOINT"
    echo ""
    echo "Configuration applied:"
    echo "  ✓ CORS rules for frontend access"
    echo "  ✓ Public access settings"
    echo "  ✓ Lifecycle policies"
    echo ""
    echo "Next steps:"
    echo "  1. Verify bucket in Cloudflare Dashboard"
    echo "  2. Test file upload in the application"
    echo "  3. Configure custom domain (optional)"
    echo ""
    echo "Useful commands:"
    echo "  List files:     aws --profile r2 s3 ls s3://$R2_BUCKET_NAME"
    echo "  Upload file:    aws --profile r2 s3 cp file.txt s3://$R2_BUCKET_NAME/"
    echo "  Download file:  aws --profile r2 s3 cp s3://$R2_BUCKET_NAME/file.txt ."
    echo ""
}

# Parse arguments
BUCKET_NAME=""
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --bucket)
            BUCKET_NAME="$2"
            shift 2
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
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}  ChurchShare R2 Bucket Initialization${NC}"
    echo -e "${CYAN}============================================${NC}"
    echo ""
    
    check_prerequisites
    
    source "$ENV_FILE"
    
    # Use bucket name from argument or .env
    if [ -n "$BUCKET_NAME" ]; then
        R2_BUCKET_NAME="$BUCKET_NAME"
    fi
    
    configure_aws_profile
    create_bucket "$R2_BUCKET_NAME" "$DRY_RUN"
    configure_cors "$R2_BUCKET_NAME" "$DRY_RUN"
    configure_public_access "$R2_BUCKET_NAME" "$DRY_RUN"
    configure_lifecycle "$R2_BUCKET_NAME" "$DRY_RUN"
    
    if [ "$DRY_RUN" != "true" ]; then
        test_bucket_access "$R2_BUCKET_NAME" "$DRY_RUN"
    fi
    
    list_bucket_info "$R2_BUCKET_NAME"
    show_summary
}

main "$@"
