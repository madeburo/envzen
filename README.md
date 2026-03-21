# EnvShield

[![npm](https://img.shields.io/npm/v/@envshield/core)](https://www.npmjs.com/package/@envshield/core)
[![CI](https://img.shields.io/github/actions/workflow/status/madeburo/envshield/ci.yml?label=CI)](https://github.com/madeburo/envshield/actions)
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
| `@envshield/core` | Validation engine, types, masker, printer |
| `@envshield/cli` | `envshield check / sync / init` CLI |
| `@envshield/express` | Express / Fastify middleware |
| `@envshield/vite` | Vite plugin |
| `@envshield/next` | Next.js `withEnvGuard()` wrapper |
| `@envshield/nestjs` | NestJS `EnvGuardModule.forRoot()` |

## Installation

```bash
# Core only
npm install @envshield/core

# With a framework adapter
npm install @envshield/core @envshield/express
npm install @envshield/core @envshield/vite
npm install @envshield/core @envshield/next
npm install @envshield/core @envshield/nestjs

# CLI (global or dev dependency)
npm install -g @envshield/cli
```

## Quick Start

```ts
// env.ts
import { createEnv } from '@envshield/core'

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

Call `dotenv.config()` before `createEnv()` if you load from a `.env` file — EnvShield does not load `.env` files itself.

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
import { envGuardMiddleware } from '@envshield/express'
import { schema } from './env.js'

const app = express()
app.use(envGuardMiddleware(schema))
```

### Vite

```ts
// vite.config.ts
import { envGuardPlugin } from '@envshield/vite'
import { schema } from './env.js'

export default {
  plugins: [envGuardPlugin(schema)],
}
```

### Next.js

```ts
// next.config.ts
import { withEnvGuard } from '@envshield/next'
import { schema } from './env.js'

export default withEnvGuard({ /* your next config */ }, schema)
```

### NestJS

```ts
import { EnvGuardModule } from '@envshield/nestjs'
import { schema } from './env.js'

@Module({
  imports: [EnvGuardModule.forRoot(schema)],
})
export class AppModule {}
```

## CLI

```bash
# Scaffold an env.ts config file
envshield init

# Generate .env.example from your schema
envshield sync --schema ./env.ts

# Diff your .env against the schema
envshield check --schema ./env.ts --env ./.env

# CI mode (no interactive prompts, plain-text output)
envshield init --ci
envshield check --ci
```

`envshield init --ci` also generates a `.github/workflows/envshield.yml` GitHub Actions workflow.

## Error Handling

```ts
import { createEnv, EnvValidationError } from '@envshield/core'

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
pnpm install
pnpm build
pnpm test
pnpm lint
```

## License

MIT
