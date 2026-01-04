# Security Audit Baseline

**Last Updated:** 2026-01-04

## Accepted Vulnerabilities

The following vulnerabilities are in third-party dependencies (Strapi) and cannot be
fixed without a Strapi version upgrade. They are documented here for tracking.

### High Severity (Strapi Dependencies)

| Package | Advisory | Reason Not Fixed |
|---------|----------|------------------|
| qs < 6.14.1 | GHSA-6rw7-vpxm-498p | Locked by @strapi/core |
| glob 10.2-10.4 | GHSA-5j98-mcp5-4vw2 | Locked by @strapi/core |
| koa 2.0-2.16 | GHSA-jgmv-j7ww-jx2x | Locked by @strapi/admin |
| esbuild <= 0.24.2 | GHSA-67mh-4wv8-2f99 | Locked by vite (dev only) |
| tmp <= 0.2.3 | GHSA-52f5-9888-hmc6 | Locked by inquirer |

### Moderate Severity

| Package | Advisory | Reason Not Fixed |
|---------|----------|------------------|
| nodemailer <= 7.0.10 | GHSA-mm7p-fcc7-pg87 | No fix available yet |
| nodemailer <= 7.0.10 | GHSA-rcmh-qjqh-p98v | No fix available yet |
| nodemailer <= 7.0.10 | GHSA-46j5-6fg5-4gv3 | No fix available yet |

## Mitigations Applied

1. **xlsx removed** - Replaced with exceljs (v2026-01-04)
2. **AI service fail-closed** - Commit 36425857
3. **Mebbis service fail-closed** - Commit 36425857
4. **Login rate limiting** - 5 attempts/15 min per IP
5. **API proxy path whitelist** - Only /api/* paths allowed
6. **Face identify tenant validation** - x-tenant-id required

## Monitoring

Run `npm audit` monthly or on major dependency updates.

When Strapi releases a patch for these issues, update:
```bash
cd strapi && npm update @strapi/strapi
```

## Development vs Production

The following vulnerabilities only affect development:
- **esbuild** (vite dev server) - Not present in production builds
- **tmp/external-editor/inquirer** (CLI tools) - Not used in runtime

## Notes

- `npm audit fix --force` would downgrade Strapi from 5.x to 4.26.0 (breaking change)
- Awaiting Strapi 5.x patch releases for internal dependency updates
