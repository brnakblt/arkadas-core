# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Security:** Docker Scout integration for CVE scanning.
- **Monitoring:** Prometheus, Grafana, Alertmanager stack.
- **Backup:** Automated backup and restore scripts for DB, Redis, and Files.
- **Workflow:** GitHub Actions for security scanning.
- **Documentation:** Architecture, Deployment, and Security policy docs.
- **DX:** Makefile for common development tasks.

### Changed
- **Infrastructure:** Separation of `infra_data` from `databases` in volume mounts.
- **SFTPGo:** Corrected initialization path and password sync logic.
- **Scripts:** Enhanced `reset_project.sh` to ensure clean state.

### Fixed
- Fixed PostgreSQL authentication failure due to volume persistence across resets.
- Fixed SFTPGo initial admin data not loading correct credentials.
- Fixed `seed.js` using hardcoded URLs instead of environment variables.

## [1.0.0] - 2024-01-20

### Added
- Initial release of Arkadaş ERP.
- Strapi CMS backend.
- Next.js Web Application.
- Docker Compose infrastructure.
- Basic SFTPGo integration.
