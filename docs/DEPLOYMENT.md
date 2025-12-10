# Deployment Guide - Cipansor

Panduan deployment sistem Cipansor untuk production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Database Migration](#database-migration)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: v20 LTS atau lebih baru
- **PostgreSQL**: v14 atau lebih baru
- **pnpm**: v10 atau lebih baru
- **Docker** (opsional): v24 atau lebih baru
- **RAM**: Minimum 2GB, recommended 4GB
- **Disk**: Minimum 20GB

### Domain & SSL

- Domain yang sudah terkonfigurasi (contoh: cipansor.id)
- SSL certificate (bisa menggunakan Let's Encrypt)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/analisaperlengkapan/cipansor.git
cd cipansor
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/cipansor"

# JWT - WAJIB DIGANTI UNTUK PRODUCTION!
JWT_SECRET="your-production-secret-minimum-32-characters-long"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server
PORT=3001
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL="https://api.cipansor.id"

# CORS
CORS_ORIGIN="https://cipansor.id,https://www.cipansor.id"

# Logging
LOG_LEVEL=info
```

### 3. Install Dependencies

```bash
pnpm install
```

---

## Docker Deployment

### Recommended Method (Docker Compose)

```bash
# Build dan jalankan semua services
docker compose up -d

# Lihat logs
docker compose logs -f

# Stop services
docker compose down
```

### Environment Variables untuk Docker

Buat file `.env` di root directory:

```env
# Database
DB_USER=cipansor_user
DB_PASSWORD=strong_password_here
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-production-key-min-32-chars

# API
API_PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=https://cipansor.id

# Web
WEB_PORT=3000
NEXT_PUBLIC_API_URL=https://api.cipansor.id

# Redis
REDIS_PORT=6379
```

### Database Migration dengan Docker

```bash
# Masuk ke container API
docker compose exec api sh

# Jalankan migration
npx prisma migrate deploy

# Jalankan seed (untuk data awal)
npx prisma db seed
```

---

## Manual Deployment

### API Deployment

```bash
cd apps/api

# Generate Prisma Client
pnpm db:generate

# Build
pnpm build

# Run production
NODE_ENV=production node dist/main.js
```

### Web Deployment

```bash
cd apps/web

# Build
pnpm build

# Run production
pnpm start
```

### Process Manager (PM2)

Untuk menjaga aplikasi tetap running:

```bash
# Install PM2
npm install -g pm2

# Start API
pm2 start apps/api/dist/main.js --name "cipansor-api"

# Start Web
pm2 start apps/web/.next/standalone/server.js --name "cipansor-web"

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## Database Migration

### Production Migration

```bash
cd apps/api

# Deploy pending migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Backup Database

```bash
# Backup
pg_dump -U postgres cipansor > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres cipansor < backup_20240101.sql
```

---

## Monitoring & Logging

### Log Locations

- **API Logs**: `apps/api/logs/`
  - `error.log` - Error logs only
  - `combined.log` - All logs

### Health Check Endpoints

- **API**: `GET /health`
- **Web**: Available at root `/`

### Recommended Monitoring Tools

1. **Application Monitoring**: Sentry, New Relic
2. **Infrastructure**: Prometheus + Grafana
3. **Logging**: ELK Stack, Loki

---

## Security Checklist

### Before Going Live

- [ ] Ganti JWT_SECRET dengan secret yang kuat (min 32 karakter random)
- [ ] Set NODE_ENV=production
- [ ] Aktifkan HTTPS/SSL
- [ ] Configure CORS dengan domain yang tepat
- [ ] Hapus atau protect Swagger docs di production
- [ ] Setup firewall rules
- [ ] Enable rate limiting
- [ ] Configure security headers
- [ ] Backup database secara reguler
- [ ] Setup monitoring dan alerting

### Security Headers

Headers yang sudah dikonfigurasi:

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

---

## Troubleshooting

### API tidak bisa connect ke Database

```bash
# Check connection string
DATABASE_URL="postgresql://user:password@host:5432/cipansor"

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Build Error

```bash
# Clear cache dan rebuild
pnpm store prune
rm -rf node_modules
pnpm install
pnpm build
```

### Memory Issues

Tambahkan memory limit di environment:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Port Already in Use

```bash
# Check port
lsof -i :3001

# Kill process
kill -9 <PID>
```

---

## Platform Recommendations

### API Hosting

1. **Railway** - Easy deployment, auto-scaling
2. **Render** - Free tier available
3. **DigitalOcean App Platform** - Good for scaling
4. **AWS ECS** - Enterprise-grade

### Frontend Hosting

1. **Vercel** - Best for Next.js
2. **Netlify** - Good alternative
3. **Cloudflare Pages** - Fast CDN

### Database Hosting

1. **Neon** - Serverless PostgreSQL
2. **Supabase** - PostgreSQL + extras
3. **Railway PostgreSQL** - Simple setup
4. **AWS RDS** - Enterprise-grade

---

## Support

- Documentation: https://docs.cipansor.id
- Email: support@cipansor.id
- Issues: https://github.com/analisaperlengkapan/cipansor/issues
