# Security & Honesty (PSH) Rules - Arkadaş Özel Eğitim ERP

These rules govern all feature decisions and implementation details to ensure a secure, transparent, and ethical system for special education management.

## 🔐 Security Rules (S)

| ID | Rule Name | Description |
|---|---|---|
| **S1** | **PII Encryption-by-Default** | Any field identified as PII (TCKN, Health, Contact) MUST be encrypted using `strapi/src/utils/encryption.ts` at the database layer. No unencrypted PII should be stored. |
| **S2** | **Fail-Closed Authorization** | Every API endpoint and service function must explicitly verify the user's role and `x-tenant-id`. If the check is absent, access MUST be denied by default. |
| **S3** | **No Hardcoded Secrets** | Secrets must only be provided via `.env` files (managed by Infisical/`generate_envs.sh`). Any PR with a hardcoded secret will be automatically rejected. |
| **S4** | **Vulnerability Gating** | Any new package or Docker image must pass a security scan (`mcp_osvScanner` or `make scan`). "High" or "Critical" vulnerabilities are blockers for production. |
| **S5** | **Zero-Trust Internals** | Communication between `Strapi` and internal services (AI, Mebbis) must be authenticated via a shared secret or service-level JWT. |

## 🤝 Honesty & Integrity Rules (H)

| ID | Rule Name | Description |
|---|---|---|
| **H1** | **AI Accountability** | AI-generated content (BEP, reports) must be clearly marked "AI-Generated" and require manual validation/signature by a qualified human (Teacher/Admin). |
| **H2** | **Data Provenance** | Attendance records from face recognition must store the "Confidence Score" and a reference to the source image (frame) for auditability and manual verification. |
| **H3** | **Explicit Consent for Sync** | Any data synchronization with external systems (e.g., MEBBİS) must be explicitly initiated by a user, with a clear summary of what will be shared. |
| **H4** | **Data Minimality** | Only collect and process the minimum data necessary for the specific educational or administrative task. Purge data that is no longer required by law (KVKK). |
| **H5** | **Error Honesty** | If a system fails (e.g., face recognition fails to identify a student), the UI must clearly state the failure rather than guessing or defaulting to an incorrect state. |

---

## 🚦 Conductor Integration

When using the `conductor` extension to plan new features:

1.  **PII Scan**: Conductor MUST identify if the feature introduces new PII fields and include Rule **S1** in the plan.
2.  **Ethics Guard**: If a feature involves automated decision-making or AI, Conductor MUST include Rule **H1** in the plan.
3.  **Vulnerability Check**: Conductor MUST verify the security posture of any new library suggested using `osvScanner`.
