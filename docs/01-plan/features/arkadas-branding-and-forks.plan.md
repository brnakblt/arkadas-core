# Plan: Arkadaş Branding & Ecosystem Forks

## 1. Objective
Complete the transformation of the project into a fully branded, commercial-ready product named **"Arkadaş"**. This involves forking the remaining Arkadaş client applications, applying a unified brand identity across all platforms, and ensuring legal compliance with GPL/AGPL licenses.

## 2. Forking Strategy

| Component | Upstream Source | New Repository |
|-----------|-----------------|----------------|
| **Android App** | `nextcloud/android` | `brnakblt/arkadas-android` |
| **iOS App** | `nextcloud/ios` | `brnakblt/arkadas-ios` |
| **Desktop Client** | `nextcloud/desktop` | `brnakblt/arkadas-desktop` |
| **Server (Theme)** | `nextcloud/server` | Integrated via Custom Theme in `arkadas-core` |

## 3. Branding & Customization Tasks

### 3.1. Visual Identity (The "Arkadaş" Look)
- **Logos:** Replace all Arkadaş "blue cloud" icons with the Arkadaş ERP logo.
- **Color Palette:** Override default Arkadaş blue (#0082c9) with Arkadaş Brand Colors (from `brand-ui-design` plan).
- **Splash Screens:** Create custom launch screens for mobile and desktop.

### 3.2. String & Metadata Replacement
- **Naming:** Global find-and-replace "Arkadaş" -> "Arkadaş" in all user-facing strings.
- **Package Names:** 
    - Android: `com.nextcloud.client` -> `tr.com.arkadas.mobile`
    - iOS: `com.nextcloud.ios` -> `tr.com.arkadas.ios`
- **User Agent:** Update user agent strings to identify as "Arkadaş ERP Client".

### 3.3. Server-Side Theming
- Develop a Arkadaş "Theme App" to persist branding even after server updates.
- Configure `theming` app via CLI (`occ`) in `scripts/setup_nextcloud.sh`.

## 4. Implementation Phases

### Phase 1: Mobile Fork Initialization
1.  Clone upstream repositories.
2.  Set up the "Arkadaş" remote and push initial clean fork.
3.  Implement basic rebranding (Name, Icon).

### Phase 2: Branding Automation
1.  Create a `rebrand.sh` script for each client repo to automate logo and string replacements.
2.  Integrate `arkadas-sdk` into mobile forks for unified auth and API handling.

### Phase 3: Desktop & Distribution
1.  Initialize `arkadas-desktop` (Fork from Arkadaş Desktop).
2.  Configure build pipelines for APK/IPA and Installers.

## 5. Success Criteria
- [ ] Mobile and Desktop apps launch with "Arkadaş" branding.
- [ ] No "Arkadaş" trademarked terms in user-facing UI.
- [ ] Apps successfully connect to `arkadas-core` infrastructure.
- [ ] Forked source code is available publicly (GPL Compliance).
