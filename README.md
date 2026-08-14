# Qurelio Health — Multi-Tenant Clinic Management SaaS Platform

[![CI/CD Pipeline](https://github.com/qurelio-health/qurelio-health/actions/workflows/deploy.yml/badge.svg)](https://github.com/qurelio-health/qurelio-health/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Laravel](https://img.shields.io/badge/Laravel-12-red.svg)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)

Qurelio Health is an enterprise-grade multi-tenant SaaS application built for modern healthcare clinics, OPD practices, polyclinics, and hospital chains.

---

## 🌟 Key Features

- **Multi-Tenant Data Isolation**: Strict RBAC & tenant scoping via Laravel Eloquent traits (`BelongsToTenant`).
- **Patient Management & EMR**: Complete electronic medical records, visit histories, and demographic tracking.
- **OPD Queue Engine**: Real-time token generation (`A01`, `B01`), state machine transitions (`waiting`, `serving`, `completed`), and multi-doctor room management.
- **Appointment Scheduling**: Smart appointment booking, status filtering, and doctor availability calendars.
- **Digital Prescriptions**: Drug inventory search, dosage instructions, and 1-click WhatsApp PDF sharing.
- **Billing & Gateway Integrations**: Invoicing with multi-currency (INR), partial payments, and native Razorpay & PhonePe online payment webhooks.
- **Reports & Analytics Dashboard**: Real-time revenue analytics, doctor performance leaderboards, patient demographics, and CSV export.
- **Clinic Settings & Audit Logging**: Customizable clinic details, working hours, user roles, API keys, automated backups, and live audit trails.
- **Automated Follow-up Reminders**: Scheduled Artisan background job sending follow-up alerts to patients after visit completion.

---

## 📁 Enterprise Monorepo Structure

```text
qurelio-health/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD Pipeline
├── deployment/
│   ├── cron/
│   │   ├── scheduler               # Cron schedule definition
│   │   └── qurelio-scheduler
│   ├── logrotate/
│   │   └── qurelio                 # Log rotation policy
│   ├── nginx/
│   │   └── qurelio.conf            # Production Nginx reverse proxy
│   ├── ssl/
│   │   └── setup-ssl.sh            # Let's Encrypt SSL automation
│   ├── supervisor/
│   │   └── horizon.conf            # Supervisor queue worker & scheduler config
│   ├── backup.sh                   # Automated MySQL & asset backup script
│   ├── deploy.sh                   # Repeatable production deployment script
│   └── rollback.sh                 # Emergency release rollback script
├── docs/
│   ├── README.md                   # Documentation Index
│   ├── DEPLOYMENT.md               # Detailed DevOps Manual
│   └── API.md                      # REST API Endpoints Specification
├── qurelio-backend/                # Laravel 12 API Backend Engine
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/
│   ├── routes/
│   ├── storage/
│   ├── tests/
│   ├── Dockerfile
│   └── .env.example
├── qurelio-frontend/               # React 18 + Vite SPA Frontend UI
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml              # Development Docker Stack
├── docker-compose.prod.yml         # Production Docker Stack Override
├── .dockerignore
├── .gitignore
├── LICENSE                         # MIT License
└── README.md                       # Monorepo Documentation
```

---

## 🚀 Quick Start & Local Development

### Requirements
- PHP 8.2+
- Composer 2.x
- Node.js 20 LTS
- MySQL 8.0+
- Redis 6.x+

### Setup Instructions

1. **Clone the Monorepo**:
   ```bash
   git clone https://github.com/qurelio-health/qurelio-health.git
   cd qurelio-health
   ```

2. **Backend Setup**:
   ```bash
   cd qurelio-backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve --port=8000
   ```

3. **Frontend Setup**:
   ```bash
   cd ../qurelio-frontend
   npm install
   npm run dev
   ```

4. **Docker Setup (Alternative)**:
   ```bash
   docker compose up -d --build
   ```

---

## 🧪 Testing

Run backend PHPUnit automated feature test suite (51 passed, 197 assertions):

```bash
cd qurelio-backend
php artisan test
```

---

## 🔒 Security & License

- **Security Concerns**: Report security issues directly to `security@qureliohealth.com`.
- **License**: Released under the [MIT License](LICENSE).
