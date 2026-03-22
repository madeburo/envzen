# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3] - 2026-03-22

### Fixed

- `buildZodSchema` — replaced silent `default: z.string()` fallback with an exhaustive `assertNever()` check; calling `buildZodSchema` directly with an unknown `FieldType` now throws instead of silently coercing to `z.string()`
- `createEnv` — env object is now frozen with `Object.freeze()`, making `readonly` enforcement runtime-level rather than type-level only
- `createEnv` — `toJSON` is defined via `Object.defineProperty` with `enumerable: false`, preventing it from appearing as a regular key when spreading the env object
- `redactErrorMessage` — deduplicated; single implementation exported from `validator.ts`, removed copy in `index.ts`
- `.env` parser (`envzen check`) — fixed edge case where a single-character quoted value (e.g. `KEY="`) would incorrectly strip quotes; added `length >= 2` guard
- `.env` parser (`envzen check`) — implemented inline comment stripping for unquoted values (e.g. `KEY=value # comment` now correctly parses as `value`)

### Changed

- `EnvGuardModule.forRoot()` (NestJS) — validated env object is now exposed as an `'ENV'` injection token via `useValue`, making it injectable into services

## [0.1.2] - 2026-03-21

### Added

- README for all packages (`envzen-core`, `envzen-cli`, `envzen-express`, `envzen-vite`, `envzen-next`, `envzen-nestjs`)

### Changed

- Renamed packages from scoped `@envzen/*` to unscoped `envzen-*` for simpler installation

## [0.1.1] - 2026-03-21

### Added

- Initial public release of EnvZen
- `envzen-core` — validation engine with Zod-based schema parsing
  - `createEnv()` — validates `process.env` against a schema, returns typed env object
  - `EnvValidationError` — structured error with per-field `failures` array
  - `getSafeEnv()` — redacts `sensitive` fields to `[REDACTED]`
  - `printEnvExample()` — serializes schema to `.env.example` format
  - `buildZodSchema()` — builds a Zod object schema from a `Schema` definition
  - Field types: `string`, `number`, `boolean`, `url`, `port`, `email`, `enum`
  - `toJSON()` override on env object for safe serialization
- `envzen-cli` — CLI with three commands
  - `envzen init` — scaffolds `env.ts` config file; `--ci` also generates GitHub Actions workflow
  - `envzen sync` — generates `.env.example` from schema
  - `envzen check` — diffs `.env` against schema, reports missing/extra/type failures
- `envzen-express` — `envGuardMiddleware()` for Express and Fastify
- `envzen-vite` — `envGuardPlugin()` Vite plugin (validates in `buildStart`)
- `envzen-next` — `withEnvGuard()` Next.js config wrapper
- `envzen-nestjs` — `EnvGuardModule.forRoot()` NestJS dynamic module

### Security

- Sensitive field values are redacted from validation error messages
- Unknown `FieldDescriptor.type` values are rejected at runtime
- Schema result is stripped — `process.env` keys outside the schema never leak into the output
- CLI `resolveSchema()` validates file extensions before importing

[Unreleased]: https://github.com/madeburo/envzen/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/madeburo/envzen/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/madeburo/envzen/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/madeburo/envzen/releases/tag/v0.1.1
