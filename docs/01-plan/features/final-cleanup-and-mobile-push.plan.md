# Plan: Final Cleanup & Mobile Ecosystem Launch

## 1. Objective
Finalize the "Arkadaş" multi-repo ecosystem by purging legacy files from the core repository and executing the automated forking, rebranding, and pushing of the mobile applications (Android & iOS).

## 2. Cleanup Strategy (arkadas-core)

### 2.1. Local Directory Purge
- **Data & Logs:** Remove `./infra_data/` (except placeholders) and `./logs/`.
- **Backups:** Clear `./backups/` to start fresh with the new architecture.
- **Node Modules:** Perform a clean install to ensure `package-lock.json` only contains core dependencies.

### 2.2. Remote Git Cleanup
- **History Verification:** Ensure no `web/`, `mobile/`, or `sdk/` artifacts remain in the `HEAD` of the `arkadas-core` main branch.
- **Git Attributes/Ignore:** Verify `.gitignore` is optimized for a backend-only repository.

## 3. Mobile Launch Strategy

### 3.1. Android (arkadas-android)
1.  **Fork:** Clone `nextcloud/android` into a temporary migration directory.
2.  **Rebrand:** Execute `scripts/rebrand_repo.sh`.
3.  **Logo Injection:** Replace `drawable` resources with Arkadaş branding.
4.  **Push:** Upload to `github.com/brnakblt/arkadas-android.git`.

### 3.2. iOS (arkadas-ios)
1.  **Fork:** Clone `nextcloud/ios` into a temporary migration directory.
2.  **Rebrand:** Execute `scripts/rebrand_repo.sh`.
3.  **Identity:** Update `Info.plist` and Bundle ID.
4.  **Push:** Upload to `github.com/brnakblt/arkadas-ios.git`.

## 4. Implementation Phases

### Phase 1: Core Sterilization
1.  Remove untracked data and backup files.
2.  Update `.gitignore` to be more restrictive.
3.  Force push clean core state.

### Phase 2: Android Rebranding & Push
1.  Automated fork and rebrand.
2.  Initial push to GitHub.

### Phase 3: iOS Rebranding & Push
1.  Automated fork and rebrand.
2.  Initial push to GitHub.

## 5. Success Criteria
- [ ] `arkadas-core` repo size reduced (no legacy artifacts).
- [ ] `arkadas-android` and `arkadas-ios` available on GitHub under Arkadaş name.
- [ ] All apps use `tr.com.arkadas.*` package naming convention.
