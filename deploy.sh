#!/bin/bash
# Qurelio SaaS - Automated Production Deployment Script

set -e

echo "🚀 Starting Qurelio Production Deployment..."

# 1. Pull Latest Code
echo "📥 Pulling latest release from Git..."
git pull origin main

# 2. Deploy Backend Dependencies & Optimizations
echo "📦 Installing PHP dependencies (Composer)..."
cd qurelio-backend
composer install --no-dev --optimize-autoloader

echo "🔑 Generating Application Keys & Caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "💾 Running Database Migrations..."
php artisan migrate --force

echo "🔗 Verifying Storage Link..."
php artisan storage:link || true

echo "🔒 Setting Storage & Cache Directory Permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 3. Deploy Frontend Assets
echo "⚛️ Building Frontend Assets (Vite)..."
cd ../qurelio-frontend
npm install --production=false
npm run build

# 4. Restart Queue Workers & Redis Cache
echo "🔄 Restarting Supervisor Queue Workers & Scheduler..."
cd ../qurelio-backend
php artisan queue:restart
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart qurelio-worker:*

# 5. Reload Nginx Web Server
echo "🌐 Reloading Nginx Web Server..."
sudo systemctl reload nginx

echo "✅ Qurelio SaaS successfully deployed to Production!"
