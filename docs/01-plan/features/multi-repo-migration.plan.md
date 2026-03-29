# Plan: Monorepo to Multi-Repo Migration

## 1. Objective
Deconstruct the current monorepo into a specialized multi-repo architecture similar to Nextcloud's ecosystem. This will improve modularity, allow for independent versioning, and facilitate forking/integrating native mobile applications.

## 2. Target Repository Structure

| New Repository | Source Path | Description |
|----------------|-------------|-------------|
| **`arkadas-core`** | `strapi/`, `api/opencv/`, `docker/`, `Makefile` | The central API, AI services, and orchestration logic. |
| **`arkadas-web`** | `web/` | The Next.js frontend application. |
| **`arkadas-android`** | (New/Fork) | Android native application (forked from Nextcloud or native). |
| **`arkadas-ios`** | (New/Fork) | iOS native application (forked from Nextcloud or native). |
| **`arkadas-desktop`** | (New) | Electron or Tauri based desktop client. |
| **`arkadas-sdk`** | (Extracted) | Shared TypeScript types, API clients, and common utilities. |

## 3. Technical Strategy

### 3.1. Code Deconstruction
- **Step 1:** Isolate shared logic (types, validation schemas) into a standalone `arkadas-sdk`.
- **Step 2:** Use `git filter-repo` or `git subtree` to migrate folders to new repositories while preserving commit history.
- **Step 3:** Establish a "Main Management" repository (or keep `arkadas-core` as the anchor) containing global configuration and deployment scripts.

### 3.2. Cross-Repo Integration
- **API Versioning:** Implement strict semantic versioning for the `core` API to prevent breaking changes in client apps.
- **SDK Distribution:** Publish `arkadas-sdk` via a private/public NPM registry or use git submodules/subtrees.
- **Environment Management:** Each repo will manage its own `.env`, but `arkadas-core` will define the "Source of Truth" for infrastructure ports and secrets.

### 3.3. CI/CD & Orchestration
- **GitHub Actions:** Transition from a single `ci.yml` to per-repo workflows.
- **Docker Compose:** Maintain a centralized `docker-compose.yml` in `arkadas-core` that pulls pre-built images of `web` and other services.

## 4. Implementation Phases

### Phase 1: Preparation (The Anchor)
1.  Finalize the current code state (Cleanup & Stability).
2.  Create the new GitHub/GitLab organizations/repositories.

### Phase 2: Core & SDK Extraction
1.  Extract `strapi` and infrastructure into `arkadas-core`.
2.  Extract shared models/interfaces into `arkadas-sdk`.

### Phase 3: Client Migration
1.  Move `web` to `arkadas-web`.
2.  Initialize `arkadas-android` and `arkadas-ios` (Nextcloud Fork configuration).

## 5. Success Criteria
- [ ] All code resides in its target specialized repository.
- [ ] Commit history is preserved where possible.
- [ ] Client applications can be built and deployed independently.
- [ ] `arkadas-core` successfully orchestrates the entire system via Docker.
