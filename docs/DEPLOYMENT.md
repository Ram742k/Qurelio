# Qurelio SaaS — Production Deployment & DevOps Manual

This document provides a comprehensive operational guide for provisioning, deploying, maintaining, and recovering the **Qurelio Clinic Management SaaS** platform on production infrastructure (Ubuntu 22.04 LTS / DigitalOcean / AWS / Railway).

---

## Architecture Overview

```
[ Internet ]
     │
     ▼
[ Nginx Reverse Proxy (SSL Let's Encrypt / Gzip / Security Headers) ]
     ├── static requests / SPA  ──> /var/www/qurelio/qurelio-frontend/dist (Vite React Build)
     └── /api requests          ──> PHP-FPM (Laravel 12 API Engine)
                                        │
                                        ├── MySQL 8.0 Database
                                        ├── Redis (Sessions, Caching, Queue)
                                        └── Cloudflare R2 / S3 Asset Storage
```

---

## 1. Initial Server Setup (Ubuntu 22.04 LTS)

Execute on a clean Ubuntu 22.04 server instance:

```bash
# 1. Update APT Repositories
sudo apt update && sudo apt upgrade -y

# 2. Install Infrastructure Components
sudo apt install -y nginx git curl unzip software-properties-common supervisor redis-server mysql-server

# 3. Add PHP 8.2 & Extensions
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-cli php8.2-fpm php8.2-mysql php8.2-curl \
    php8.2-mbstring php8.2-xml php8.2-zip php8.2-bcmath php8.2-intl php8.2-gd php8.2-redis

# 4. Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# 5. Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Directory Structure & Permissions Setup

```bash
# Create Root Directory
sudo mkdir -p /var/www/qurelio
sudo chown -R $USER:$USER /var/www/qurelio

# Clone Repository
git clone https://github.com/your-org/qurelio.git /var/www/qurelio
cd /var/www/qurelio

# Configure Permissions for Laravel Storage & Cache
sudo chown -R www-data:www-data qurelio-backend/storage qurelio-backend/bootstrap/cache
sudo chmod -R 775 qurelio-backend/storage qurelio-backend/bootstrap/cache
```

---

## 3. Environment Configuration

Copy [.env.production.example](file:///c:/clinic%20project/qurelio-backend/.env.production.example) to `qurelio-backend/.env`:

```bash
cd /var/www/qurelio/qurelio-backend
cp .env.production.example .env
php artisan key:generate
```

Configure your actual production credentials in `qurelio-backend/.env`:
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `REDIS_PASSWORD`
- `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, `AWS_ENDPOINT`
- `RAZORPAY_KEY`, `RAZORPAY_SECRET`
- `PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`

---

## 4. Nginx Server Block Setup

Link [deployment/nginx/qurelio.conf](file:///c:/clinic%20project/deployment/nginx/qurelio.conf):

```bash
sudo cp /var/www/qurelio/deployment/nginx/qurelio.conf /etc/nginx/sites-available/qurelio.conf
sudo ln -s /etc/nginx/sites-available/qurelio.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. SSL Certificate Installation (Let's Encrypt)

Run [deployment/ssl/setup-ssl.sh](file:///c:/clinic%20project/deployment/ssl/setup-ssl.sh):

```bash
bash /var/www/qurelio/deployment/ssl/setup-ssl.sh "app.qureliohealth.com" "admin@qureliohealth.com"
```

---

## 6. Supervisor Worker & Horizon Setup

Link [deployment/supervisor/horizon.conf](file:///c:/clinic%20project/deployment/supervisor/horizon.conf):

```bash
sudo cp /var/www/qurelio/deployment/supervisor/horizon.conf /etc/supervisor/conf.d/qurelio-horizon.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start qurelio-horizon:*
```

---

## 7. Scheduler Crontab & Automated Backups Setup

Link [deployment/cron/qurelio-scheduler](file:///c:/clinic%20project/deployment/cron/qurelio-scheduler):

```bash
sudo cp /var/www/qurelio/deployment/cron/qurelio-scheduler /etc/cron.d/qurelio-scheduler
sudo chmod 644 /etc/cron.d/qurelio-scheduler
```

---

## 8. Repeatable Deployment & Rollback

### Automated Production Deployment
Run [deployment/deploy.sh](file:///c:/clinic%20project/deployment/deploy.sh):

```bash
bash /var/www/qurelio/deployment/deploy.sh
```

### One-Click Emergency Rollback
Run [deployment/rollback.sh](file:///c:/clinic%20project/deployment/rollback.sh):

```bash
bash /var/www/qurelio/deployment/rollback.sh
```

---

## 9. Production Monitoring & Health Checks

- **Health Check Endpoint**: `GET https://app.qureliohealth.com/api/health`
  - Returns `200 OK` when MySQL, Redis, Queue workers, and Storage disks are operational (`503 Service Unavailable` if degraded).
- **Laravel Logs**: `/var/www/qurelio/qurelio-backend/storage/logs/laravel.log`
- **Nginx Access & Error Logs**: `/var/log/nginx/qurelio_access.log`, `/var/log/nginx/qurelio_error.log`
