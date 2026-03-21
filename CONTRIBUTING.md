# Contributing to EnvZen

Thanks for taking the time to contribute. This document covers how to get set up, the project conventions, and the process for submitting changes.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Setup

```bash
git clone https://github.com/madeburo/envzen.git
cd envzen
pnpm install
pnpm build
pnpm test
```

## Project Structure

```
packages/
  core/     # @envzen/core — validation engine (Zod-based)
  cli/      # @envzen/cli — check / sync / init commands
  express/  # @envzen/express — Express/Fastify middleware
  vite/     # @envzen/vite — Vite plugin
  next/     # @envzen/next — Next.js withEnvGuard() wrapper
  nestjs/   # @envzen/nestjs — NestJS EnvGuardModule
```

All business logic lives in `@envzen/core`. Adapter packages are thin wrappers that call `createEnv()` and re-throw on failure — do not duplicate validation logic in adapters.

## Common Commands

```bash
pnpm build           # Build all packages
pnpm test            # Run all tests (single pass)
pnpm test:coverage   # Run tests with coverage
pnpm lint            # Type-check (no emit)

# Per-package
pnpm -F @envzen/core test
pnpm -F @envzen/core build
```

## Conventions

### TypeScript

All packages use strict TypeScript with:
- `strict: true`
- `exactOptionalPropertyTypes: true` — don't assign `undefined` to optional props explicitly
- `noUncheckedIndexedAccess: true` — index access returns `T | undefined`

### Code Style

- Files: `camelCase.ts`, tests: `camelCase.test.ts`
- Exported types/interfaces: `PascalCase`
- Exported functions: `camelCase`
- Env variable keys in schemas: `SCREAMING_SNAKE_CASE`
- `src/index.ts` is the public API surface — use explicit re-exports

### Adding a New Field Type

1. Add the type to the `FieldType` union in `packages/core/src/types.ts`
2. Add a `case` to the `buildZodSchema` switch in `packages/core/src/validator.ts`
3. Add tests in `packages/core/src/validator.test.ts`

### Adding a CLI Command

Create `packages/cli/src/commands/<name>.ts` exporting a single `<name>Command(opts)` async function, then register it in `packages/cli/src/index.ts`.

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes with tests
3. Run `pnpm test` and `pnpm lint` — both must pass
4. Update `CHANGELOG.md` under `[Unreleased]`
5. Open a pull request with a clear description of what changed and why

## Reporting Issues

Please include:
- EnvZen version(s) affected
- Node.js version
- Minimal reproduction (schema + env values that trigger the issue)
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
