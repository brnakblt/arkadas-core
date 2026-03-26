# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Arkadaş ERP, please send an email to security@arkadas.com.tr.

All security vulnerabilities will be promptly addressed.

### What to Include

- Type of vulnerability
- Steps to reproduce
- Affected components
- Potential impact

### Response Timeline

- Initial response: 24 hours
- Status update: 72 hours
- Fix timeline: Depends on severity

## Security Measures

### Data Protection

- All sensitive data is encrypted at rest
- HTTPS enforced in production
- JWT tokens with short expiration
- Password hashing with bcrypt

### Infrastructure

- Docker containers with resource limits
- Regular security scans with Docker Scout
- Automated vulnerability detection
- Network isolation between services

### Access Control

- Role-based access control (RBAC)
- Multi-tenant data isolation
- API rate limiting
- Session management

## Compliance

This project follows security best practices and is designed to comply with:

- KVKK (Turkish Personal Data Protection Law)
- GDPR principles
- OWASP Top 10 guidelines
