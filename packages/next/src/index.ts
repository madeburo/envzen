import { createEnv } from '@envguard/core'
import type { Schema } from '@envguard/core'

// Minimal NextConfig type compatible with next.config.ts
// Using a structural type so `next` doesn't need to be installed at type-check time
type NextConfig = Record<string, unknown>

/**
 * Wraps a Next.js config object and validates environment variables at build time.
 * Calls `createEnv(schema)` at module evaluation time; re-throws `EnvValidationError`
 * to halt the Next.js build on validation failure.
 *
 * @param config - The Next.js configuration object (returned unchanged on success)
 * @param schema - The envguard schema to validate against
 * @returns The original `config` object unchanged
 */
export function withEnvGuard(config: NextConfig, schema: Schema): NextConfig {
  createEnv(schema)
  return config
}
