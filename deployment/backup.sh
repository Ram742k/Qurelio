#!/bin/bash
# Qurelio SaaS - Production Automated Backup Script

set -e

BACKUP_DIR="/var/backups/qurelio"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="qurelio_user"
DB_PASS="SecurePasswordHere123!"
DB_NAME="qurelio_prod"

mkdir -p "$BACKUP_DIR"

echo "📦 Dumping MySQL Production Database..."
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

echo "📁 Archiving Uploaded Storage Assets..."
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" -C /var/www/qurelio/qurelio-backend/storage/app/public .

echo "🧹 Purging Backups Older Than 30 Days..."
find "$BACKUP_DIR" -type f -mtime +30 -name "*.gz" -delete

echo "✅ Backup completed successfully: db_$DATE.sql.gz"
