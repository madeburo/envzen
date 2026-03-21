import type { Schema, EnvObject } from './types'
import { EnvValidationError, ValidationFailure } from './types'
import { buildZodSchema, formatErrors } from './validator'
import { getSafeEnv } from './masker'

export * from './types'
export * from './masker'
export { formatErrors, buildZodSchema } from './validator'
export { printEnvExample } from './printer'

export interface CreateEnvOptions {
  // Reserved for future use (e.g., envFile loading opt-in)
}

/**
 * Validates process.env against the given schema.
 * Returns a typed, readonly env object with a `toJSON()` override that redacts
 * sensitive fields when the object is serialized via JSON.stringify.
 *
 * Note: createEnv does NOT load any .env file. Callers must invoke
 * dotenv.config() (or equivalent) before calling createEnv.
 */
export function createEnv<S extends Schema>(schema: S, _options?: CreateEnvOptions): EnvObject<S> {
  // Guard: enum fields must have a non-empty values array
  for (const [key, descriptor] of Object.entries(schema)) {
    if (descriptor.type === 'enum' && (!descriptor.values || descriptor.values.length === 0)) {
      throw new Error(`Field "${key}" has type "enum" but no values array (or empty values array)`)
    }
  }

  const zodSchema = buildZodSchema(schema)
  const result = zodSchema.safeParse(process.env)

  if (!result.success) {
    const failures: ValidationFailure[] = result.error.issues.map((issue) => ({
      variable: issue.path[0]?.toString() ?? 'unknown',
      reason: issue.message,
    }))
    throw new EnvValidationError(failures)
  }

  const envObject = Object.assign(Object.create(null), result.data) as EnvObject<S> & {
    toJSON(): Record<string, string>
  }

  envObject.toJSON = function () {
    return getSafeEnv(envObject, schema) as Record<string, string>
  }

  return envObject
}

