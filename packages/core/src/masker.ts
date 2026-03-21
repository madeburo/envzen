import type { Schema, EnvObject, SafeEnvObject } from './types'

/**
 * Returns a new object with sensitive field values replaced by "[REDACTED]".
 * Non-sensitive values are passed through unchanged (cast to string for the safe type).
 */
export function getSafeEnv<S extends Schema>(env: EnvObject<S>, schema: S): SafeEnvObject<S> {
  const result: Record<string, string> = {}

  for (const key of Object.keys(schema) as (keyof S & string)[]) {
    const descriptor = schema[key]
    if (descriptor?.sensitive === true) {
      result[key] = '[REDACTED]'
    } else {
      result[key] = String(env[key])
    }
  }

  return result as SafeEnvObject<S>
}
