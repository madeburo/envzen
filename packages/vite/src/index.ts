import { createEnv } from '@envguard/core'
import type { Schema } from '@envguard/core'
import type { Plugin } from 'vite'

/**
 * Returns a Vite plugin that validates environment variables during build or dev-server startup.
 * Calls `createEnv(schema)` in the `buildStart` hook; re-throws `EnvValidationError` to halt Vite.
 */
export function envGuardPlugin(schema: Schema): Plugin {
  return {
    name: 'envguard',
    buildStart() {
      createEnv(schema)
    },
  }
}
