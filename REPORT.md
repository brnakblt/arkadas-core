# Arkadaş Özel Eğitim ERP - Architectural Review Report

**Date:** March 26, 2026  
**Status:** Structural Quality Evaluation  
**Auditor:** Gemini CLI Architect Agent

---

## 1. Executive Summary
The Arkadaş Özel Eğitim ERP project demonstrates a high degree of modularity and follows modern engineering standards (Next.js 16, Strapi v5, FastAPI). The codebase is well-organized by service boundaries, but several strategic risks related to logic distribution, proxy bloat, and redundant service implementations have been identified.

---

## 2. Structural Evaluation & Findings

### Issue 1: Domain Logic Leakage (Business Rule "Junk Drawer")
*   **Location:** `web/src/lib/` (e.g., `mebRules.ts`, `mebReports.ts`, `regulationCompliance.ts`)
*   **Description:** Significant domain logic related to government system (Mebbis) regulations and report generation is residing in the frontend `lib` directory.
*   **Impact:** 
    *   **Low Reusability:** Logic is inaccessible to the mobile app without duplication.
    *   **Bundle Bloat:** Increases frontend weight with complex validation rules.
    *   **Source of Truth:** Harder to manage "Mebbis Compliance" across different client platforms.
*   **Proposed Improvement:** Migrate these "Rule Engines" to Strapi services or a shared private TypeScript package. The backend should be the ultimate authority on business rules.

### Issue 2: Redundant Proxy Layer (BFF Bloat)
*   **Location:** `web/src/app/api/v1/`
*   **Description:** Many Next.js API routes (e.g., `storage/route.ts`, `v1/files/route.ts`) act as pure passthrough proxies to Strapi endpoints.
*   **Impact:** 
    *   **Latency:** Adds an unnecessary network hop.
    *   **Maintenance:** Requires "double-sync" for every backend API signature change.
*   **Proposed Improvement:** Minimize the BFF (Backend-for-Frontend) layer. Since Next.js 16 Server Components can call Strapi directly, use the proxy layer only for sensitive operations (token exchange) or complex data aggregation.

### Issue 3: AI Service "Single-File" Risk (God Object)
*   **Location:** `api/opencv/main.py`
*   **Description:** The Python service for face recognition currently houses all logic (API, processing, encoding) in one file.
*   **Impact:** 
    *   **Scalability:** As more AI features (BEP generation, OCR) are added, this file will become unmaintainable.
*   **Proposed Improvement:** Refactor the Python service into a standard FastAPI directory structure:
    *   `routers/`: API endpoints.
    *   `services/`: OpenCV/Face Recognition logic.
    *   `schemas/`: Pydantic models for validation.

### Issue 4: Storage Logic Fragmentation
*   **Location:** `strapi/src/services/sftpgo-api.ts` vs. `web/src/services/storageService.ts` vs. `strapi/src/utils/sftpgo.js`
*   **Description:** There are multiple, overlapping implementations for interacting with SFTPGo across the frontend and backend.
*   **Impact:** 
    *   **Inconsistency:** Potential for mismatched token handling or path resolution logic.
*   **Proposed Improvement:** Consolidate all low-level SFTPGo API logic into a single "Core Storage Service" within Strapi. All other components should consume this unified service.

---

## 3. Decisions & Trade-offs to Discuss

### BFF vs. Direct Backend Consumption
The current approach uses Next.js as a thick proxy.
*   **Discussion:** Should we move toward a "Thick Backend" (Strapi) approach where the web and mobile apps consume the same high-level APIs? This would reduce the Next.js API surface area to only auth-related logic and reduce latency.

### State Management Strategy
The presence of both `web/src/context` and `web/src/providers` (Next-Auth, QueryClient) suggests a hybrid approach.
*   **Discussion:** For a complex ERP, is the current Context API usage sufficient, or should a more robust state manager (e.g., Zustand) be introduced for the planning and scheduling grids to avoid unnecessary re-renders?

---

## 4. Proposed Immediate Actions
1.  **Refactor `api/opencv`** into a proper FastAPI directory structure.
2.  **Audit `web/src/lib`** and identify core Mebbis rules to move to the backend.
3.  **Consolidate Storage Services** into a single Strapi service.

---

## 5. Tech Lead Evaluation - Dependency & Stack Analysis

**Date:** March 26, 2026  
**Auditor:** Tech Lead (Gemini CLI)

### 5.1 Stack Inventory
| Component | Technology | Version |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React 19) | ^16.1.7 (Bleeding Edge) |
| **Backend** | Strapi | 4.26.1 (Core) / 5.40.0 (Plugins) |
| **Mobile** | React Native (Expo) | 0.76.9 (Expo 55) |
| **AI Service** | FastAPI (Python 3.13) | 1.0.0 (OpenCV, face_recognition) |
| **Database** | PostgreSQL / Redis | 16 / 7 (via Docker) |
| **Orchestration** | Turbo / Makefile | 2.8.20 |

### 5.2 Outdated & Mismatched Dependencies
| Dependency | Detected | Target | Severity | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **Strapi Core** | `4.26.1` | `5.x.x` | **Critical** | `GEMINI.md` mandates v5. Plugins are already at v5, creating a high-risk version mismatch. Upgrade core. |
| **Next.js** | `16.1.7` | `15.x.x` | **Moderate** | Next.js 15 is the current stable. V16 is experimental/future-dated; verify stability or downgrade. |
| **React** | `19.1.0` (Web) | `18.3.1` | **Minor** | Inconsistency between Web and Mobile/Strapi. Align where possible. |

### 5.3 Deprecated or Abandoned Packages
| Package | Context | Risk | Severity | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **face-api.js** | `web`, `strapi` | Abandoned (last update 2020). Large bundle size. | **Moderate** | Remove from frontend. Offload all face logic to the dedicated Python AI service. |
| **isomorphic-fetch** | `web` | Superseded by native `fetch` in Node 18+. | **Minor** | Remove and use native fetch or `undici`. |

### 5.4 Redundancy Analysis
| Problem Area | Redundant Packages | Severity | Recommended Action |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | `Vitest` vs `Jest` (in `web/`) | **Moderate** | Consolidate to `Vitest`. It is faster and already the primary runner for unit tests. |
| **Icons** | `Lucide` vs `FontAwesome` | **Minor** | Choose one (Lucide preferred for modern Next.js apps) to reduce bundle size. |
| **Data Fetching** | `SWR` vs `React Query` | **Minor** | Standardize on `TanStack Query` (React Query) as it's already used in `mobile`. |

### 5.5 Missing Tooling & Better Alternatives
| Type | Status / Alternative | Severity | Observation |
| :--- | :--- | :--- | :--- |
| **Python Deps** | **Missing requirements.txt** | **Moderate** | `api/opencv` lacks a manifest. Hard to replicate env or scale in CI. |
| **Mobile Linting** | **Disabled** | **Minor** | `mobile/package.json` explicitly skips linting. Should be enabled for consistency. |
| **node-gyp (Dep)** | **Built-in / DevTool** | **Minor** | `node-gyp` is listed as a production dependency in `web`. Should be moved to dev. |

### 5.6 Strategic Decisions to Make
1. **Next.js 16 Strategy:** Confirm if experimental v16 is required for specific features. If not, downgrade to **v15 LTS** for production stability. (**Severity: High**)
2. **Strapi v5 Migration:** The backend is in a "hybrid" state (v4 core with v5 plugins). This will cause database schema corruption. Immediate upgrade to **Strapi 5 Core** is mandatory. (**Severity: Critical**)
3. **ML Offloading:** Finalize the transition of all image processing from `face-api.js` to the Python `BSDK` service. (**Severity: Moderate**)

---

## 6. Documentation Audit Report

**Date:** March 26, 2026  
**Status:** Code Documentation Quality Audit  
**Auditor:** Gemini CLI (Senior Developer / Technical Writer)

### 6.1 Executive Summary
A comprehensive audit of the core architectural files across the AI service, Strapi backend, Next.js frontend, and mobile application has been completed. The codebase is functionally robust, but significant "documentation debt" exists in the form of missing docstrings, inconsistent typing (over-reliance on `any`), and undocumented business rules ("Magic Numbers").

### 6.2 Detailed Findings & Remediation

#### 6.2.1 AI Service (api/opencv/)
| File + Line Range | Category | Suggested Comment or Rename |
| :--- | :--- | :--- |
| `main.py:11-13` | Missing Docstring | **Add:** `"""Health check endpoint for the OpenCV service."""` |
| `main.py:30-31` | Misleading Names | **Rename:** `nparr` → `image_buffer`, `img` → `cv_frame`. |
| `main.py:36` | Unexplained Logic | **Add:** `# Convert BGR (OpenCV default) to RGB (required by face_recognition library).` |

#### 6.2.2 Backend (strapi/src/)
| File + Line Range | Category | Suggested Comment or Rename |
| :--- | :--- | :--- |
| `api/mobile/controllers/mobile.ts:13-134` | **Critical:** Type Debt | **Action:** Replace `ctx: any` with a proper `Core.Context` interface. This masks the API contract. |
| `api/mobile/controllers/mobile.ts:45` | Unexplained Policy | **Add:** `# 09:15 threshold represents the center's official 'Late' policy for student check-ins.` |
| `middlewares/audit-log.ts:8` | Missing Docstring | **Add:** `/** Intercepts POST/PUT/DELETE requests to record changes in the AuditLog collection. */` |
| `index.ts:73` | TODO/FIXME Debt | **Action:** `// TODO: Move permission seeding to a dedicated migration script for environment parity.` |

#### 6.2.3 Web Frontend (web/src/)
| File + Line Range | Category | Suggested Comment or Rename |
| :--- | :--- | :--- |
| `hooks/useAIChat.ts:68-80` | Unexplained Logic | **Add:** `// SSE (Server-Sent Events) parser: splits stream by 'data:' and reconstructs JSON chunks.` |
| `lib/api.ts:23-26` | Misleading Names | **Rename:** `data` → `serverResponse`. The name `data` is too generic in a large Next.js app. |
| `providers/TwoFactorProvider.tsx:86` | **Critical:** Security Debt | **FIXME:** `// FIXME: Replace 'accept any 6-digit code' with actual TOTP verification.` |
| `app/api/v1/webhooks/whatsapp/route.ts:80` | TODO Debt | **TODO:** `// TODO: Persistence layer required. Messages currently only exist in the session log.` |

#### 6.2.4 Mobile App (mobile/src/)
| File + Line Range | Category | Suggested Comment or Rename |
| :--- | :--- | :--- |
| `screens/DashboardScreen.tsx:8` | Misleading Names | **Rename:** `route: any` → `DashboardRouteProps`. Using `any` on screens prevents prop-type safety. |
| `services/authService.ts:8` | Missing Docstring | **Add:** `/** Handles OAuth2.1 flow with Strapi backend. Returns user profile and JWT. */` |
| `screens/LoginScreen.tsx:31` | Outdated Comments | **Action:** Remove "Old catch block" comment and document the specific UI toast notification logic used. |

#### 6.2.5 Infrastructure Scripts (scripts/)
| File + Line Range | Category | Suggested Comment or Rename |
| :--- | :--- | :--- |
| `generate_envs.sh:44` | Misleading Names | **Rename:** `APP_PWD` → `STRAPI_ADMIN_INITIAL_PASSWORD` for clarity in production logs. |
| `monitor.js:51` | FIXME Debt | **FIXME:** `// FIXME: If health check fails, stats should still attempt to run for partial diagnostics.` |

### 6.3 Strategic Recommendations
1.  **Enforce Strict Typing:** Gradually eliminate `any` from all Strapi controllers and Next.js hooks to make the code self-documenting.
2.  **Document "Magic Numbers":** Any numerical threshold (like 09:15 AM) used for business logic must be accompanied by a comment or moved to a configuration file.
3.  **Unified Documentation Style:** Standardize on TSDoc for TypeScript files and Google-style docstrings for Python to ensure consistency across services.

---

## 7. Project Review Report (Comprehensive Deep-Dive)

**Date:** March 26, 2026  
**Auditor:** Senior Software Engineer (Gemini CLI)

### 7.1 Missing or Inadequate Comments
| File Name | Severity | Issue | Concrete Suggestion |
| :--- | :--- | :--- | :--- |
| `web/src/services/authService.ts` | Moderate | Public API methods (`register`, `forgotPassword`) lack JSDoc. | Add JSDoc detailing params, return types, and documented error throws. |
| `strapi/src/utils/sftpgo.js` | Moderate | `syncUser` and `ensureGroup` lack parameter documentation. | Add block comments for destructured object properties. |
| `web/src/app/api/auth/login/route.ts` | Minor | No module description for the BFF cookie proxy logic. | Add top-level comment explaining the HTTP-only cookie strategy and KVKK compliance. |

### 7.2 Logical Mistakes & Bugs
| File Name | Severity | Issue | Concrete Suggestion |
| :--- | :--- | :--- | :--- |
| `strapi/src/utils/sftpgo.js` | **Critical** | **JWT Token Expiry:** No expiry check for `this.token`. Long-running processes will fail on 401 until restart. | Store `tokenExpiresAt` and re-authenticate if token is missing or expired. |
| `api/opencv/main.py` | Moderate | **Deprecation:** `np.fromstring` is deprecated for binary data. | Replace with `np.frombuffer(contents, np.uint8)`. |
| `strapi/.../lifecycles.js` | Moderate | **Silent Failure:** SFTPGo provisioning errors are swallowed. Leads to "ghost" users without folders. | Log failures to a `PendingStorage` table for automated retry. |
| `web/src/.../login/route.ts` | Minor | **Performance:** Dynamic import of `@/lib/rate-limit` inside the request handler. | Move import to top-level; handle missing Redis inside the utility. |

### 7.3 Tech Stack Analysis
| Type | Libraries Detected | Severity | Recommendations |
| :--- | :--- | :--- | :--- |
| **Redundant Fetching** | `TanStack Query` AND `SWR` | Minor | Standardize on React Query; remove SWR. |
| **Redundant Testing** | `Vitest` AND `Jest` | Moderate | Consolidate to Vitest; remove Jest configurations. |
| **Redundant DB Drivers** | `pg`, `mysql2`, `better-sqlite3` | Minor | Remove `mysql2` and `sqlite3` as infra is exclusively PostgreSQL. |
| **Missing Tooling** | `api/opencv` Python linting | Moderate | Add `ruff` and a `requirements.txt` to the Python service. |

### 7.4 Architectural & Design Decisions
| Issue | Severity | Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| **Inconsistent BFF Proxy** | **Critical** | `authService.ts` calls some Strapi endpoints directly and others via Next.js proxy. | Route *all* Strapi communication through Next.js API routes to hide backend URLs. |
| **Tight Coupling** | Moderate | Strapi lifecycle hooks fail or delay if SFTPGo is slow/down. | Use BullMQ (already in package) for asynchronous storage provisioning. |

### 7.5 Strategic Decisions & Quick Wins
- **BFF Standardization:** Decide on "Next.js as Proxy" vs "Direct Backend" across all client apps. Standardizing on a single entry point reduces CORS complexity.
- **Quick Win:** Add a "Resync Storage" button in Strapi Admin to fix users with missing folders (Heal the drift).
- **Long-term:** Move Mebbis rule engines from `web/src/lib` to a dedicated microservice or Strapi service for mobile parity.

---
**bkit Feature Usage**  
Used: `codebase_investigator`, `read_file`, `grep_search`.  
Not Used: `pdca` (Audit phase).  
Recommended: `/pdca do [SFTPGo-Token-Fix]` to resolve the critical expiry bug.
