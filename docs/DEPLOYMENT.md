# Deployment Guide

This document provides a comprehensive guide for deploying the **Arkadaş Özel Eğitim ERP** to production.

## Deployment Stack

*   **Orchestration**: Docker Swarm or Coolify (recommended)
*   **Database**: Managed Postgres or Dockerized Postgres
*   **Cache**: Redis
*   **Reverse Proxy**: Traefik or Nginx

---

## 1. Environment Configuration

Production requires stricter security. Ensure the following variables are set in your CI/CD pipeline or `.env.production` file.

### Critical Secrets (Infisical)
We recommend injecting these via **Infisical CLI** at runtime.

*   `INFISICAL_CLIENT_ID`
*   `INFISICAL_CLIENT_SECRET`
*   `STRAPI_API_TOKEN` (Long-lived token for internal services)
*   `JWT_SECRET`
*   `ADMIN_JWT_SECRET`
*   `APP_KEYS`

---

## 2. Docker Image Strategy

We use a **dual-tagging** strategy:
1.  `latest`: The most recent stable build.
2.  `git-sha`: Immutable tag derived from the commit hash (e.g., `arkadas-web:a1b2c3d`).

### Building Images
Use the automated script to build and push images:
```bash
./scripts/build_docker_images.sh
```

---

## 3. Deployment Methods

### Option A: Docker Compose (Simple)
Good for single-server deployments (VPS, DigitalOcean Droplet).

1.  **Prepare Server**: Install Docker & Compose.
2.  **Copy Files**: Copy `docker-compose.prod.yml` and `.env.docker` to the server.
3.  **Deploy**:
    ```bash
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d
    ```

### Option B: Coolify (Recommended)
1.  Connect your Git repository to Coolify.
2.  Select **Docker Compose** deployment.
3.  Use the contents of `docker-compose.prod.yml`.
4.  Add Environment Variables in the Coolify UI.

---

## 4. Rollback Procedure

If a deployment fails:

1.  **Identify Last Stable Tag**:
    Check your registry or git history for the previous working hash (e.g., `prev123`).

2.  **Update Deployment**:
    *   **Docker Compose**: Update `IMAGE_TAG=prev123` in `.env` and run `docker compose up -d`.
    *   **Coolify**: Re-deploy the previous commit in the UI.

---

## 5. Health Checks
After deployment, verify:
-   `GET /health` on Mebbis Service
-   `GET /api/health` on AI Service
-   `GET /_health` on Web (if implemented) or check status `200` on `/`.
