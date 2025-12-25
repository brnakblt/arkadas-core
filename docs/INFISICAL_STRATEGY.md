# Infisical Strategy & Guide

## What is Infisical?
Infisical is an open-source Secret Management Platform. Think of it as a secure vault for your API keys, database passwords, and certificates.

## Why use it? (The "Future" Impact)

Currently, as a **solo developer**, you might manage secrets via `.env` files locally and environment variables in your deployment platform (e.g., Coolify, Vercel).

**However, as the project grows:**
1.  **Multi-Tenancy Security**: If you serve 50 different schools, you will hold 50 sets of **MEBBIS credentials**. Storing these in your primary database (Postgres) is a risk. If your DB is compromised, *all* your clients are compromised. Infisical encrypts these separately.
2.  **Team Scaling**: When you hire a junior dev, you might not want them to see the Production Database Password or the MEBBIS credentials of real clients. Infisical allows you to grant them access to "Dev" environment secrets only.
3.  **Secret Rotation**: If a key leaks, Infisical helps you rotate it across all services instantly without redeploying code.

---

## How it works in this project

We previously integrated (and then reverted) the **Infisical Node SDK** into `mebbis-service`. Here is how that architecture works:

### 1. The Setup
- You create a Project in Infisical (e.g., "Arkadas ERP").
- You create a "Machine Identity" (a robot account) for the Mebbis Service.
- You give this robot "Read-Only" access to the `Production` environment.

### 2. The Code Integration
Instead of:
```typescript
// Unsafe: Password stored in DB
const password = tenant.mebbisPassword;
```

You do:
```typescript
// Safe: Password fetched from Vault at runtime
const password = await infisicalClient.getSecret(`TENANT_${id}_MEBBIS_PASSWORD`);
```

### 3. The Workflow
1.  **School A** signs up.
2.  You (Admin) go to Infisical Dashboard.
3.  Add Secret: `TENANT_123_MEBBIS_PASSWORD` = `secure-password`.
4.  The Mebbis Service pulls this value when it needs to run a sync job.

---

## Recommendation for Solo Dev

**Current Status**: We reverted to Strapi-based storage to simplify your workflow.

**When to switch back?**
*   **Trigger 1**: You onboard your first *external* client (a different school/institution).
*   **Trigger 2**: You hire another developer.
*   **Trigger 3**: You prepare for a security audit / ISO certification.

Until then, keeping secrets in Strapi (encrypted at rest if possible) is an acceptable trade-off for development speed.
