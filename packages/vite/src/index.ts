import { createEnv } from 'envzen-core'
import type { Schema } from 'envzen-core'
import type { Plugin } from 'vite'

/**
 * Returns a Vite plugin that validates environment variables during build or dev-server startup.
 * Calls `createEnv(schema)` in the `buildStart` hook; re-throws `EnvValidationError` to halt Vite.
 */
export function envGuardPlugin(schema: Schema): Plugin {
  return {
    name: 'envzen',
    buildStart() {
      createEnv(schema)
    },
  }
}
