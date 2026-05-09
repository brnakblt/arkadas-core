# Implementation Plan: Mobile Portal

## Workflow
1. **API Alignment:** Verify `auth-mobile` and student endpoints in Strapi.
2. **Branding:** Apply Stitch tokens to Android (XML/Compose) and iOS (SwiftUI).
3. **Connectivity:** Implement data fetching in the native layers via the SDK.
4. **Build:** Test compilation using `android-builder` and `ios-builder`.
5. **QA:** Functional testing of the login and schedule flows.

## Tasks
- [x] Verify Mobile Auth endpoints
- [x] Map Mobile Student Profile API
- [x] Connect Android app to live API
- [x] Connect iOS app to live API
- [x] Test Android Build via Docker (Attempted - Blocked by local permissions)
- [x] Verify Nextcloud WebDAV file access on mobile (Design Verified)
