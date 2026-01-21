# Deployment Guide

This guide outlines the steps to deploy Arkadaş ERP in a production environment.

## Prerequisites

- **Server:** Ubuntu 22.04 LTS (recommended)
- **Resources:**
  - Min: 2 vCPU, 4GB RAM
  - Rec: 4 vCPU, 8GB RAM
- **Software:**
  - Docker Engine & Docker Compose
  - Node.js 18+ (for local scripts)
  - Git

## 1. Initial Setup

1. **Clone Repository:**
   ```bash
   git clone https://github.com/brnakblt/arkadasozelegitim.git .
   ```

2. **Run Setup Script:**
   Generate secure secrets and environment files.
   ```bash
   bash scripts/generate_envs.sh
   # Follow the prompts to configure domain and secrets
   ```

3. **Verify Environment:**
   Check `.env` files in root, `strapi/`, and `web/`.

## 2. Infrastructure Deployment

Start the core infrastructure services (Database, Redis, Storage).

```bash
docker compose up -d postgres redis sftpgo
```

Wait for services to be healthy:
```bash
docker compose ps
# Ensure all states are 'Up (healthy)'
```

## 3. Application Deployment

Build and start the application services.

```bash
# Build images
docker compose build

# Start all services
docker compose up -d
```

## 4. Post-Deployment Steps

1. **Seed Database (First Run Only):**
   ```bash
   # Enter Strapi container
   docker compose exec strapi sh
   
   # Run seed script
   node scripts/seed.js
   ```

2. **Configure SFTPGo:**
   The admin user is automatically created. Login to `http://YOUR_IP:8088` to verify.

3. **Verify Web App:**
   Access `http://YOUR_IP:3000`. Login with default admin credentials if seeded.

## 5. Security Checklist

- [ ] Change default Strapi admin password.
- [ ] Change SFTPGo admin password.
- [ ] Ensure firewall (UFW) allows only ports 80/443 (if using reverse proxy) and 22.
- [ ] Set `NODE_ENV=production`.
- [ ] backup your `infra_data` directory.

## 6. Maintenance

- **Updates:** `git pull && docker compose build && docker compose up -d`
- **Backup:** `bash scripts/backup.sh`
- **Logs:** `docker compose logs -f --tail=100`

## Troubleshooting

**Strapi fails to connect to DB:**
- Check `infra_data/postgres` permissions.
- Verify `DATABASE_HOST` matches service name (`postgres`) in `.env`.

**Uploads failing:**
- Check SFTPGo container status.
- Verify `SFTPGO_URL` matches internal docker network alias (`http://sftpgo:8080`).
