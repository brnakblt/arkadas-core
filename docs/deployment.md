# Deployment Checklist

## Pre-Deployment Verification

- [ ] **Security Fixes Applied**: Verify all 12 security items are closed.
- [ ] **Tests Passing**: Run `npm run test` and `playwright test`.
- [ ] **Build Check**: Run `npm run build` locally to ensure no build errors.
- [ ] **Environment Variables**: Verify `.env.production` has all keys (see below).

## Environment Configuration

Ensure these variables are set in your production environment (Vercel, VPS, etc.):

### Web / Next.js

- `NEXT_PUBLIC_API_URL`: URL of your backend (Strapi/API).
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN for monitoring.
- `NEXT_AUTH_SECRET`: Strong secret for cookie encryption.
- `VAULT_ENCRYPTION_KEY`: 32-byte hex key for credential vault.

### AI Service

- `AI_SERVICE_API_KEY`: Strong API key for AI endpoints.
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed domains (e.g., `https://arkadas-erp.com`).

### MEBBIS Service

- `MEBBIS_SERVICE_URL`: Internal URL if running separately.
- Check `vault` for stored credentials.

## Deployment Steps

### 1. Web Application (Vercel/Node.js)

1. Push to `main` branch.
2. Connect repository to Vercel/Netlify.
3. Configure environment variables.
4. Deploy.

### 2. AI Service (Python/Docker)

1. Build Docker image: `docker build -t arkadas-ai ./ai-service`.
2. Push to container registry.
3. Deploy to cloud (AWS/GCP/DigitalOcean) or VPS using `docker-compose`.

### 3. Mobile App (Expo)

1. Install EAS CLI: `npm install -g eas-cli`.
2. Login: `eas login`.
3. Configure build: `eas build --platform all`.
4. Submit: `eas submit`.

## Post-Deployment

- [ ] **Health Check**: Visit `/api/health` to verify status.
- [ ] **Login Test**: Verify admin login works.
- [ ] **MEBBIS Connectivity**: Test MEBBIS sync in dashboard.
- [ ] **SSL Check**: Ensure all endpoints are serving HTTPS.
