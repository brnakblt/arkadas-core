# Contributing to Arkadaş ERP

Thank you for considering contributing to Arkadaş ERP!

## Development Setup

1. Clone the repository
2. Run `npm run install:all`
3. Copy environment files: `npm run setup:env`
4. Start development: `npm run dev` or `make dev`

## Code Style

- Use TypeScript where possible
- Follow existing code patterns
- Run `npm run lint` before committing
- Write meaningful commit messages

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run tests: `npm run test`
4. Run linting: `npm run lint`
5. Run security scan: `npm run scan`
6. Create a Pull Request

## Commit Messages

Use conventional commits:

```
feat: add new student report
fix: resolve login issue
docs: update README
refactor: optimize database queries
```

## Testing

- Unit tests: `npm run test:web`
- E2E tests: `npm run test:e2e`
- All tests: `npm run test`

## Questions?

Open an issue or contact the maintainers.
