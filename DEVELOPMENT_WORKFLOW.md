# Development Workflow Guide

## Overview

This document outlines the development workflow for the PROYECTO-SENA marketplace platform, including git hooks, CI/CD pipeline, and development best practices.

## Git Hooks

We use [Husky](https://typicode.github.io/husky/) to manage git hooks that ensure code quality and consistency.

### Pre-commit Hook

Runs automatically before each commit:

- ✅ TypeScript type checking
- ✅ ESLint code linting
- ✅ Prettier code formatting
- ✅ Unit tests execution

### Pre-push Hook

Runs automatically before pushing to remote:

- ✅ Security audit
- ✅ Full application build
- ✅ Test suite with coverage

### Commit Message Hook

Enforces [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

Examples:
- feat: add user authentication
- fix(auth): resolve login validation issue
- docs: update API documentation
- refactor(components): simplify button component
- test: add unit tests for security utilities
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

## CI/CD Pipeline

Our GitHub Actions workflow includes:

### 1. Code Quality & Testing (`quality` job)
- Runs on Node.js 18.x and 20.x
- TypeScript compilation check
- ESLint linting
- Prettier formatting check
- Unit tests with coverage
- Uploads coverage to Codecov

### 2. Security Audit (`security` job)
- npm security audit
- Vulnerability scanning
- SARIF report generation

### 3. Build & Artifacts (`build` job)
- Production build creation
- Build artifact storage
- Dependency on quality and security jobs

### 4. Performance Testing (`performance` job)
- Lighthouse CI performance testing
- Only runs on pull requests
- Performance, accessibility, SEO scoring

### 5. Deployment (`deploy` job)
- Only runs on main branch pushes
- Downloads build artifacts
- Deploys to production environment
- Sends deployment notifications

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feat/user-authentication

# Make changes...
# Git hooks will run automatically on commit
git add .
git commit -m "feat: add user authentication system"

# Push will trigger pre-push hooks
git push origin feat/user-authentication
```

### 2. Pull Request Process

1. Create pull request from feature branch to `develop`
2. CI/CD pipeline runs automatically:
   - Code quality checks
   - Security audit
   - Build verification
   - Performance testing (Lighthouse)
3. Code review by team members
4. Merge after approval and passing checks

### 3. Release Process

```bash
# Merge develop to main for production release
git checkout main
git merge develop
git push origin main  # Triggers production deployment
```

## Local Development Setup

### Initial Setup

```bash
# Install dependencies
npm ci

# Install git hooks
npx husky init

# Run development server
npm run dev
```

### Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm run test
npm run test:ui        # Visual test interface
npm run test:coverage  # With coverage report

# Code quality
npm run lint           # Check linting
npm run lint:fix       # Fix linting issues
npm run format         # Format code
npm run format:check   # Check formatting
npm run type-check     # TypeScript checking

# Build
npm run build          # Production build
npm run preview        # Preview production build
```

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No implicit any
- Proper type definitions for all functions
- Interface definitions for complex objects

### ESLint Rules
- React best practices
- Accessibility rules
- Performance optimizations
- Security considerations

### Prettier Configuration
- 2-space indentation
- Single quotes
- Trailing commas
- 80-character line length

### Test Coverage
- Minimum 80% coverage required
- Unit tests for all utilities
- Integration tests for components
- E2E tests for critical user flows

## Security Considerations

### Pre-commit Security
- Input sanitization validation
- Security lint rules
- Dependency vulnerability checking

### CI/CD Security
- npm audit integration
- SARIF vulnerability reporting
- Security-focused ESLint rules
- Automated dependency updates

## Performance Standards

### Lighthouse Scores (CI/CD)
- Performance: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 80
- PWA: ≥ 60 (warning level)

### Development Guidelines
- Bundle size monitoring
- Code splitting for routes
- Lazy loading for components
- Image optimization
- Caching strategy implementation

## Environment Configuration

### Development
- Hot module replacement
- Source maps enabled
- Debug logging
- Relaxed CSP policies

### Production
- Minified bundles
- Tree shaking
- Strict CSP policies
- Error tracking
- Performance monitoring

## Troubleshooting

### Git Hooks Failing

```bash
# Skip hooks temporarily (use sparingly)
git commit --no-verify -m "emergency fix"

# Fix formatting issues
npm run format

# Fix linting issues
npm run lint:fix

# Check types
npm run type-check
```

### CI/CD Issues

1. Check GitHub Actions logs
2. Run tests locally: `npm run test:coverage`
3. Verify build: `npm run build`
4. Check security: `npm audit`

### Performance Issues

1. Run Lighthouse locally
2. Check bundle analyzer: `npm run build && npx vite-bundle-analyzer`
3. Monitor Web Vitals in development
4. Check network requests in DevTools

## Best Practices

### Git Workflow
- Use conventional commit messages
- Keep commits atomic and focused
- Write descriptive pull request descriptions
- Test locally before pushing

### Code Organization
- Follow established folder structure
- Use TypeScript for type safety
- Implement proper error handling
- Write comprehensive tests

### Performance
- Implement code splitting
- Use lazy loading appropriately
- Optimize images and assets
- Monitor bundle size

### Security
- Validate all user inputs
- Implement proper authentication
- Use secure communication (HTTPS)
- Regular security audits

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)