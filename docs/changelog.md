# API Changelog

All notable changes to the Arkadaş ERP API and System will be documented in this file.

## [Unreleased]

### Added

- **Mobile API**: New endpoints for Dashboard stats and activity feed.
- **Bulk Operations**: API support for batch update of student status and bulk SMS.
- **Health Check**: `/api/health` endpoint for monitoring system status.

### Changed

- **Authentication**: Migrated from localStorage tokens to **httpOnly Cookies** for improved security.
- **CORS**: Restricted allowed origins to configured domains only.
- **Rate Limiting**: Added limits to TTS and expensive AI endpoints.

### Fixed

- **Path Traversal**: Fixed vulnerability in `face_service.py` where user IDs were not validated.
- **XSS**: Implemented `DOMPurify` sanitizer for all rich text inputs.
- **DoS**: Added file size limits to upload endpoints and character limits to TTS.

---

## [1.0.0] - 2025-11-01

### Initial Release

- Core ERP functionality
- MEBBIS automation scripts
- Basic student management
- Attendance tracking
