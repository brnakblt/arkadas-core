# Plan: Arkadaş Full Ecosystem Takeover (Nextcloud-to-Arkadaş Rebranding)

## 1. Objective
Establish a complete, independent, and commercial-ready software ecosystem under the **"Arkadaş"** brand. This involves forking every critical component of the Nextcloud ecosystem, applying a unified branding, and ensuring cross-repository synchronization.

## 2. Target Ecosystem Map

| Category | Component | Source Repository | New Arkadaş Repository |
|----------|-----------|-------------------|-------------------------|
| **Platform** | Core Server | `nextcloud/server` | `brnakblt/arkadas-core` (Integrated) |
| **Mobile** | Files (Android) | `nextcloud/android` | `brnakblt/arkadas-android` |
| **Mobile** | Files (iOS) | `nextcloud/ios` | `brnakblt/arkadas-ios` |
| **Mobile** | Talk (Android) | `nextcloud/talk-android` | `brnakblt/arkadas-talk-android` |
| **Mobile** | Talk (iOS) | `nextcloud/talk-ios` | `brnakblt/arkadas-talk-ios` |
| **Desktop** | Desktop Client | `nextcloud/desktop` | `brnakblt/arkadas-desktop` |
| **Messaging**| Talk (Spreed) | `nextcloud/spreed` | `brnakblt/arkadas-talk-server` |
| **Office** | Office Online | `nextcloud/officeonline` | `brnakblt/arkadas-office` |
| **Apps** | Maps | `nextcloud/maps` | `brnakblt/arkadas-maps` |
| **Apps** | File Access Control| `nextcloud/file_accesscontrol` | `brnakblt/arkadas-access-control` |
| **Security** | Privacy | `nextcloud/privacy` | `brnakblt/arkadas-privacy` |
| **Store** | App Store | `nextcloud/appstore` | `brnakblt/arkadas-app-hub` |
| **Deploy** | All-in-One (AIO)| `nextcloud/all-in-one` | `brnakblt/arkadas-aio` |

## 3. Rebranding Automation Strategy

### 3.1. Unified Rebranding Engine
Instead of manual edits, we will create a centralized `arkadas-branding-tool` script that performs the following:
- **String Replacement:** "Nextcloud" -> "Arkadaş", "nextcloud" -> "arkadas".
- **Asset Swapping:** Replace `logo.svg`, `favicon.ico`, and app icons.
- **Package Renaming:** Update `com.nextcloud.client` -> `tr.com.arkadas.files`.
- **Theming:** Inject Arkadaş primary colors (#4f46e5) into CSS/SCSS files.

### 3.2. Cross-Repo Sync
- **Upstream Tracking:** Configure each repo to track official Nextcloud repos as `upstream` to pull security updates while maintaining the `arkadas` brand.
- **Git Hooks:** Post-merge hooks to automatically re-run the branding tool on upstream updates.

## 4. Implementation roadmap

### Phase 1: High-Priority Client Forking
1.  Initialize **Files** (Android/iOS) and **Desktop** client forks.
2.  Run the branding tool on these repos to change Name, Icon, and Primary Color.
3.  Perform the push to GitHub.

### Phase 2: Collaboration Suite Forking
1.  Fork **Talk (Spreed)** and its mobile counterparts.
2.  Apply branding to messaging interfaces.
3.  Integrate Talk with the existing `arkadas-core` dashboard.

### Phase 3: Infrastructure & Extensibility
1.  Fork **All-in-One (AIO)** for streamlined production deployments.
2.  Fork the **App Store** to create an internal "Arkadaş App Hub" for curated plugin delivery.

## 5. Success Criteria
- [ ] 100% independent repositories for all listed components.
- [ ] No "Nextcloud" strings in user-facing interfaces across the entire stack.
- [ ] Arkadaş branding persists across upstream updates.
- [ ] Full compliance with AGPL/GPL licenses (all forks remain open source).
