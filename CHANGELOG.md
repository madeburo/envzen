# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/madeburo/envzen/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/madeburo/envzen/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/madeburo/envzen/releases/tag/v0.1.1
