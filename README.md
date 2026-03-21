# EnvGuard

[![npm](https://img.shields.io/npm/v/@envguard/core)](https://www.npmjs.com/package/@envguard/core)
[![CI](https://img.shields.io/github/actions/workflow/status/madeburo/envguard/ci.yml?label=CI)](https://github.com/madeburo/envguard/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5%2B-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Type-safe environment variable validation for TypeScript/Node.js. Validates `process.env` against a developer-defined schema at startup — catching misconfigured environments at boot time, not at runtime.

## Features

- Throws a descriptive `EnvValidationError` on missing, wrong-type, or invalid variables
- Infers TypeScript types from the schema — no manual casting
- Redacts `sensitive` fields automatically in `toJSON()` / `JSON.stringify()`
- Adapters for Express, Fastify, Vite, Next.js, and NestJS
- CLI for scaffolding, diffing, and syncing `.env.example`

## Packages

| Package | Description |
|---|---|
| `@envguard/core` | Validation engine, types, masker, printer |
| `@envguard/cli` | `envguard check / sync / init` CLI |
| `@envguard/express` | Express / Fastify middleware |
| `@envguard/vite` | Vite plugin |
| `@envguard/next` | Next.js `withEnvGuard()` wrapper |
| `@envguard/nestjs` | NestJS `EnvGuardModule.forRoot()` |

## Installation

```bash
# Core only
npm install @envguard/core

# With a framework adapter
npm install @envguard/core @envguard/express
npm install @envguard/core @envguard/vite
npm install @envguard/core @envguard/next
npm install @envguard/core @envguard/nestjs

# CLI (global or dev dependency)
npm install -g @envguard/cli
```

## Quick Start

```ts
// env.ts
import { createEnv } from '@envguard/core'

export const env = createEnv({
  NODE_ENV: {
    type: 'enum',
    values: ['development', 'production', 'test'],
    default: 'development',
  },
  PORT: {
    type: 'port',
    default: 3000,
  },
  DATABASE_URL: {
    type: 'url',
    required: true,
    sensitive: true,
  },
  API_KEY: {
    type: 'string',
    required: true,
    sensitive: true,
  },
})
```

Call `dotenv.config()` before `createEnv()` if you load from a `.env` file — EnvGuard does not load `.env` files itself.

```ts
// index.ts
import 'dotenv/config'
import { env } from './env.js'

console.log(env.PORT)        // number
console.log(env.NODE_ENV)    // 'development' | 'production' | 'test'
console.log(JSON.stringify(env)) // DATABASE_URL and API_KEY → "[REDACTED]"
```

## Schema Reference

### FieldDescriptor

| Property | Type | Description |
|---|---|---|
| `type` | `FieldType` | Variable type (see below) |
| `required` | `boolean` | Must be present; ignores `default` |
| `default` | `string \| number \| boolean` | Fallback when variable is absent |
| `description` | `string` | Used in `.env.example` output |
| `sensitive` | `boolean` | Redacts value in `toJSON()` |
| `values` | `string[]` | Required when `type: 'enum'` |
| `validate` | `ZodType` | Custom Zod refinement chained after base type |

### FieldType

| Value | Coercion / Validation |
|---|---|
| `string` | Raw string |
| `number` | `z.coerce.number()` |
| `boolean` | Accepts `"true"`, `"false"`, `"1"`, `"0"` |
| `port` | Integer 1–65535 |
| `url` | `z.string().url()` |
| `email` | `z.string().email()` |
| `enum` | Must match one of `values` |

## Framework Adapters

### Express / Fastify

```ts
import express from 'express'
import { envGuardMiddleware } from '@envguard/express'
import { schema } from './env.js'

const app = express()
app.use(envGuardMiddleware(schema))
```

Validation runs on the first request. On failure, the error is forwarded to your framework's error handler via `next(err)`.

### Vite

```ts
// vite.config.ts
import { envGuardPlugin } from '@envguard/vite'
import { schema } from './env.js'

export default {
  plugins: [envGuardPlugin(schema)],
}
```

Validation runs in the `buildStart` hook, halting Vite on failure.

### Next.js

```ts
// next.config.ts
import { withEnvGuard } from '@envguard/next'
import { schema } from './env.js'

export default withEnvGuard({ /* your next config */ }, schema)
```

### NestJS

```ts
import { EnvGuardModule } from '@envguard/nestjs'
import { schema } from './env.js'

@Module({
  imports: [EnvGuardModule.forRoot(schema)],
})
export class AppModule {}
```

## CLI

```bash
# Scaffold an env.ts config file
envguard init

# Generate .env.example from your schema
envguard sync --schema ./env.ts

# Diff your .env against the schema
envguard check --schema ./env.ts --env ./.env

# CI mode (no interactive prompts, plain-text output)
envguard init --ci
envguard check --ci
```

`envguard init --ci` also generates a `.github/workflows/envguard.yml` GitHub Actions workflow.

## Error Handling

```ts
import { createEnv, EnvValidationError } from '@envguard/core'

try {
  const env = createEnv(schema)
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error(err.message)   // formatted list of failures
    console.error(err.failures)  // ValidationFailure[]
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type-check
pnpm lint
```

## License

MIT
