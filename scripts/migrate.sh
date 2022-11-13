#!/bin/bash

# Database Migration Script for DeFi Asset Management Platform
# This script handles database schema migrations and data updates

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-"asset_management"}
DB_USER=${DB_USER:-"asset_manager"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
MIGRATIONS_DIR="./backend/migrations"
BACKUP_DIR="./backups"

# Helper functions
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if PostgreSQL is available
check_postgres() {
    print_header "Checking PostgreSQL Connection"
    
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) is not installed"
        exit 1
    fi
    
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' &> /dev/null; then
        print_error "Cannot connect to PostgreSQL database"
        print_info "Please check your database configuration:"
        print_info "  Host: $DB_HOST"
        print_info "  Port: $DB_PORT"
        print_info "  Database: $DB_NAME"
        print_info "  User: $DB_USER"
        exit 1
    fi
    
    print_success "PostgreSQL connection established"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_success "Created backup directory: $BACKUP_DIR"
    fi
}

# Create database backup
create_backup() {
    print_header "Creating Database Backup"
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/backup_${DB_NAME}_${timestamp}.sql"
    
    print_info "Creating backup: $backup_file"
    
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --verbose \
        --no-owner \
        --no-privileges \
        > "$backup_file"
    
    if [ $? -eq 0 ]; then
        print_success "Backup created successfully: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        print_success "Backup compressed: ${backup_file}.gz"
        
        echo "$backup_file.gz"
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Restore database from backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Backup file not specified"
        return 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file does not exist: $backup_file"
        return 1
    fi
    
    print_header "Restoring Database from Backup"
    print_warning "This will replace all current data!"
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        return 0
    fi
    
    print_info "Restoring from: $backup_file"
    
    # Drop existing connections
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U postgres -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
        AND pid <> pg_backend_pid();
    " &> /dev/null
    
    # Drop and recreate database
    PGPASSWORD=$DB_PASSWORD dropdb -h $DB_HOST -p $DB_PORT -U postgres $DB_NAME --if-exists
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U postgres $DB_NAME -O $DB_USER
    
    # Restore data
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
    else
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Database restored successfully"
    else
        print_error "Database restore failed"
        exit 1
    fi
}

# Initialize migration tracking table
init_migrations_table() {
    print_header "Initializing Migration Tracking"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    checksum VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
EOF
    
    print_success "Migration tracking table initialized"
}

# Get list of applied migrations
get_applied_migrations() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT version FROM schema_migrations ORDER BY version;
    " | sed 's/^ *//' | sed '/^$/d'
}

# Get list of pending migrations
get_pending_migrations() {
    local applied_migrations
    applied_migrations=$(get_applied_migrations)
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_warning "Migrations directory not found: $MIGRATIONS_DIR"
        return 0
    fi
    
    local all_migrations
    all_migrations=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort | xargs -I {} basename {} .sql)
    
    if [ -z "$applied_migrations" ]; then
        echo "$all_migrations"
    else
        comm -23 <(echo "$all_migrations" | sort) <(echo "$applied_migrations" | sort)
    fi
}

# Calculate file checksum
calculate_checksum() {
    local file=$1
    if [ -f "$file" ]; then
        sha256sum "$file" | cut -d' ' -f1
    else
        echo ""
    fi
}

# Apply a single migration
apply_migration() {
    local migration_file=$1
    local version=$(basename "$migration_file" .sql)
    local description=""
    local checksum
    
    # Extract description from migration file comments
    if [ -f "$migration_file" ]; then
        description=$(head -n 10 "$migration_file" | grep -E "^-- Description:" | sed 's/^-- Description: *//')
        checksum=$(calculate_checksum "$migration_file")
    fi
    
    print_info "Applying migration: $version"
    
    # Start transaction
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
BEGIN;

-- Apply migration
\i $migration_file

-- Record migration
INSERT INTO schema_migrations (version, description, checksum)
VALUES ('$version', '$description', '$checksum');

COMMIT;
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Migration applied: $version"
    else
        print_error "Migration failed: $version"
        print_error "Rolling back transaction..."
        exit 1
    fi
}

# Run all pending migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    local pending_migrations
    pending_migrations=$(get_pending_migrations)
    
    if [ -z "$pending_migrations" ]; then
        print_success "No pending migrations"
        return 0
    fi
    
    print_info "Pending migrations:"
    echo "$pending_migrations" | while read -r migration; do
        print_info "  - $migration"
    done
    
    # Apply each migration
    echo "$pending_migrations" | while read -r migration; do
        if [ -n "$migration" ]; then
            local migration_file="$MIGRATIONS_DIR/${migration}.sql"
            if [ -f "$migration_file" ]; then
                apply_migration "$migration_file"
            else
                print_error "Migration file not found: $migration_file"
                exit 1
            fi
        fi
    done
    
    print_success "All migrations completed"
}

# Rollback last migration
rollback_migration() {
    print_header "Rolling Back Last Migration"
    
    local last_migration
    last_migration=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1;
    " | sed 's/^ *//')
    
    if [ -z "$last_migration" ]; then
        print_warning "No migrations to rollback"
        return 0
    fi
    
    print_warning "Rolling back migration: $last_migration"
    
    read -p "Are you sure you want to rollback this migration? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Rollback cancelled"
        return 0
    fi
    
    # Look for rollback file
    local rollback_file="$MIGRATIONS_DIR/rollback_${last_migration}.sql"
    
    if [ ! -f "$rollback_file" ]; then
        print_error "Rollback file not found: $rollback_file"
        print_error "Manual rollback required"
        exit 1
    fi
    
    # Apply rollback
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
BEGIN;

-- Apply rollback
\i $rollback_file

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '$last_migration';

COMMIT;
EOF
    
    if [ $? -eq 0 ]; then
        print_success "Migration rolled back: $last_migration"
    else
        print_error "Rollback failed: $last_migration"
        exit 1
    fi
}

# Show migration status
show_status() {
    print_header "Migration Status"
    
    local applied_migrations
    applied_migrations=$(get_applied_migrations)
    
    local pending_migrations
    pending_migrations=$(get_pending_migrations)
    
    if [ -n "$applied_migrations" ]; then
        print_info "Applied migrations:"
        echo "$applied_migrations" | while read -r migration; do
            print_success "  ✓ $migration"
        done
    else
        print_info "No applied migrations"
    fi
    
    if [ -n "$pending_migrations" ]; then
        print_info "Pending migrations:"
        echo "$pending_migrations" | while read -r migration; do
            print_warning "  ⏳ $migration"
        done
    else
        print_success "All migrations up to date"
    fi
}

# Create new migration file
create_migration() {
    local description=$1
    
    if [ -z "$description" ]; then
        print_error "Migration description is required"
        print_info "Usage: $0 create \"Description of migration\""
        exit 1
    fi
    
    print_header "Creating New Migration"
    
    # Create migrations directory if it doesn't exist
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        mkdir -p "$MIGRATIONS_DIR"
        print_success "Created migrations directory: $MIGRATIONS_DIR"
    fi
    
    local timestamp=$(date +"%Y%m%d%H%M%S")
    local filename="${timestamp}_$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/_*/_/g' | sed 's/^_\|_$//g').sql"
    local filepath="$MIGRATIONS_DIR/$filename"
    
    # Create migration template
    cat > "$filepath" << EOF
-- Migration: $filename
-- Description: $description
-- Created: $(date)

BEGIN;

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

COMMIT;
EOF
    
    print_success "Migration created: $filepath"
    print_info "Edit the file to add your migration SQL"
    
    # Create corresponding rollback file
    local rollback_filename="rollback_${timestamp}_$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g' | sed 's/_*/_/g' | sed 's/^_\|_$//g').sql"
    local rollback_filepath="$MIGRATIONS_DIR/$rollback_filename"
    
    cat > "$rollback_filepath" << EOF
-- Rollback: $rollback_filename
-- Description: Rollback for $description
-- Created: $(date)

BEGIN;

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example_table;

COMMIT;
EOF
    
    print_success "Rollback file created: $rollback_filepath"
    print_info "Edit the rollback file to add SQL that undoes the migration"
}

# Clean old backups
clean_backups() {
    local days=${1:-7}
    
    print_header "Cleaning Old Backups"
    print_info "Removing backups older than $days days"
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$days -delete
        local removed=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$days 2>/dev/null | wc -l)
        print_success "Removed $removed old backup files"
    else
        print_info "No backup directory found"
    fi
}

# Validate migration files
validate_migrations() {
    print_header "Validating Migration Files"
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        print_warning "No migrations directory found"
        return 0
    fi
    
    local errors=0
    
    find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort | while read -r file; do
        local filename=$(basename "$file")
        
        # Check filename format
        if [[ ! "$filename" =~ ^[0-9]{14}_[a-z0-9_]+\.sql$ ]]; then
            print_error "Invalid filename format: $filename"
            errors=$((errors + 1))
        fi
        
        # Check for SQL syntax (basic check)
        if ! grep -q "BEGIN\|COMMIT" "$file"; then
            print_warning "Migration may be missing transaction markers: $filename"
        fi
        
        print_success "Validated: $filename"
    done
    
    if [ $errors -eq 0 ]; then
        print_success "All migration files are valid"
    else
        print_error "Found $errors validation errors"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Database Migration Script for DeFi Asset Management Platform"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  migrate              Run all pending migrations"
    echo "  rollback             Rollback the last migration"
    echo "  status               Show migration status"
    echo "  create \"description\" Create a new migration file"
    echo "  backup               Create a database backup"
    echo "  restore <file>       Restore from backup file"
    echo "  validate             Validate migration files"
    echo "  clean [days]         Clean old backups (default: 7 days)"
    echo "  help                 Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DB_NAME              Database name (default: asset_management)"
    echo "  DB_USER              Database user (default: asset_manager)"
    echo "  DB_PASSWORD          Database password (required)"
    echo "  DB_HOST              Database host (default: localhost)"
    echo "  DB_PORT              Database port (default: 5432)"
    echo ""
    echo "Examples:"
    echo "  $0 migrate"
    echo "  $0 create \"Add user preferences table\""
    echo "  $0 backup"
    echo "  $0 restore backups/backup_asset_management_20230215_120000.sql.gz"
    echo "  $0 clean 30"
}

# Main execution
main() {
    local command=${1:-"help"}
    
    case $command in
        "migrate")
            check_postgres
            create_backup_dir
            init_migrations_table
            local backup_file=$(create_backup)
            echo "Backup created: $backup_file"
            run_migrations
            ;;
        "rollback")
            check_postgres
            create_backup_dir
            init_migrations_table
            local backup_file=$(create_backup)
            echo "Backup created: $backup_file"
            rollback_migration
            ;;
        "status")
            check_postgres
            init_migrations_table
            show_status
            ;;
        "create")
            create_migration "$2"
            ;;
        "backup")
            check_postgres
            create_backup_dir
            create_backup
            ;;
        "restore")
            check_postgres
            restore_backup "$2"
            ;;
        "validate")
            validate_migrations
            ;;
        "clean")
            clean_backups "$2"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Check for required environment variables
if [ "$1" != "help" ] && [ "$1" != "--help" ] && [ "$1" != "-h" ] && [ "$1" != "create" ] && [ "$1" != "validate" ] && [ "$1" != "clean" ]; then
    if [ -z "$DB_PASSWORD" ]; then
        print_error "DB_PASSWORD environment variable is required"
        print_info "Export DB_PASSWORD before running this script"
        exit 1
    fi
fi

# Run main function with all arguments
main "$@"
