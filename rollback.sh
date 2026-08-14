#!/bin/bash
# Qurelio SaaS - Production Rollback Script

set -e

echo "⚠️ Initiating Qurelio Production Emergency Rollback..."

# 1. Revert Git Commit
echo "⏮️ Reverting code to previous git commit..."
git reset --hard HEAD~1

# 2. Re-cache & Re-optimize Backend
echo "⚡ Re-building Backend Caches..."
cd qurelio-backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart

# 3. Re-build Frontend Build
echo "⚛️ Re-building Frontend Assets..."
cd ../qurelio-frontend
npm run build

# 4. Restart Services
echo "🔄 Reloading Nginx & Supervisor..."
sudo systemctl reload nginx
sudo supervisorctl restart qurelio-worker:*

echo "✅ Qurelio SaaS successfully rolled back to previous stable release!"
