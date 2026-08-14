#!/bin/bash
# Qurelio SaaS - Production Repeatable Deployment Script

set -e

echo "🚀 Starting Production Deployment for Qurelio SaaS..."

# 1. Pull Code
echo "📥 Fetching latest commits from repository..."
git pull origin main

# 2. Backend Optimizations
echo "📦 Installing Composer dependencies..."
cd qurelio-backend
composer install --no-dev --optimize-autoloader --no-interaction

echo "🔑 Caching Laravel Configurations & Routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "💾 Running Database Migrations..."
php artisan migrate --force

echo "🔗 Verifying Storage Symbolic Link..."
php artisan storage:link || true

echo "🔒 Correcting Directory Ownership & Permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 3. Frontend Assets Build
echo "⚛️ Compiling Production React Frontend..."
cd ../qurelio-frontend
npm install --production=false
npm run build

# 4. Restart Background Workers & Queue
echo "🔄 Restarting Queue Workers & Supervisor..."
cd ../qurelio-backend
php artisan queue:restart
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart qurelio-horizon:* || sudo supervisorctl restart qurelio-worker:*

# 5. Reload Web Server
echo "🌐 Reloading Nginx Web Server..."
sudo systemctl reload nginx

echo "✅ Qurelio SaaS successfully deployed to Production!"
