#!/bin/bash
# Qurelio SaaS - Automated Let's Encrypt SSL Provisioning Script

set -e

DOMAIN=${1:-"app.qureliohealth.com"}
EMAIL=${2:-"admin@qureliohealth.com"}

echo "🔒 Provisioning Let's Encrypt SSL Certificate for domain: $DOMAIN..."

# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Request Certificate
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect

# Setup Renewal Cron
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo "✅ SSL certificate successfully installed and auto-renewal configured!"
