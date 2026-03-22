import { createEnv } from 'envzen-core'
import type { Schema } from 'envzen-core'

/**
 * Returns an Express/Fastify-compatible middleware that validates environment
 * variables on first invocation. Calls `createEnv(schema)` and throws
 * `EnvValidationError` if validation fails, preventing any request from being
 * handled with a misconfigured environment.
 *
 * Compatible with both Express (req, res, next) and Fastify (request, reply, done)
 * middleware signatures.
 */
export function envGuardMiddleware(schema: Schema) {
  let validated = false

  return function middleware(
    _req: unknown,
    _res: unknown,
    next: (err?: unknown) => void,
  ): void {
    if (!validated) {
      try {
        createEnv(schema)
        validated = true
      } catch (err) {
        next(err)
        return
      }
    }
    next()
  }
}
