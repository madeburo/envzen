# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-03-21

### Security

- Redact sensitive field values from Zod validation error messages — previously, invalid values for `sensitive: true` fields could leak into `EnvValidationError.message` and `failures[].reason`
- Apply explicit `.strip()` on the Zod schema in `createEnv()` to prevent `process.env` keys outside the schema from leaking into the result object
- Validate file extension in CLI `resolveSchema()` — only `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs` are accepted, preventing accidental execution of arbitrary files
- Reject unknown `FieldDescriptor.type` values at runtime in `createEnv()` — previously, unknown types silently fell through to `z.string()`

### Changed

- `buildZodSchema()` now caches results per schema object reference via `WeakMap`, reducing GC pressure when the same schema is validated multiple times

## [0.1.0] - 2024-01-01

### Added

- `@envshield/core` — validation engine with Zod-based schema parsing
  - `createEnv()` — validates `process.env` against a schema, returns typed env object
  - `EnvValidationError` — structured error with per-field `failures` array
  - `getSafeEnv()` — redacts `sensitive` fields to `[REDACTED]`
  - `printEnvExample()` — serializes schema to `.env.example` format
  - `buildZodSchema()` — builds a Zod object schema from a `Schema` definition
  - Field types: `string`, `number`, `boolean`, `url`, `port`, `email`, `enum`
  - `toJSON()` override on env object for safe serialization
- `@envshield/cli` — CLI with three commands
  - `envshield init` — scaffolds `env.ts` config file; `--ci` also generates GitHub Actions workflow
  - `envshield sync` — generates `.env.example` from schema
  - `envshield check` — diffs `.env` against schema, reports missing/extra/type failures
- `@envshield/express` — `envGuardMiddleware()` for Express and Fastify
- `@envshield/vite` — `envGuardPlugin()` Vite plugin (validates in `buildStart`)
- `@envshield/next` — `withEnvGuard()` Next.js config wrapper
- `@envshield/nestjs` — `EnvGuardModule.forRoot()` NestJS dynamic module

[Unreleased]: https://github.com/madeburo/envshield/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/madeburo/envshield/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/madeburo/envshield/releases/tag/v0.1.0
