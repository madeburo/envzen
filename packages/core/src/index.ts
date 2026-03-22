import type { Schema, FieldType, EnvObject } from './types'
import { EnvValidationError, ValidationFailure } from './types'
import { buildZodSchema, formatErrors, redactErrorMessage } from './validator'
import { getSafeEnv } from './masker'

export * from './types'
export * from './masker'
export { formatErrors, buildZodSchema, redactErrorMessage } from './validator'
export { printEnvExample } from './printer'

const VALID_FIELD_TYPES: ReadonlySet<FieldType> = new Set([
  'string', 'number', 'boolean', 'url', 'port', 'email', 'enum',
])

export function createEnv<S extends Schema>(schema: S): EnvObject<S> {
  for (const [key, desc] of Object.entries(schema) as [string, Schema[string]][]) {
    // Guard: reject unknown field types
    if (!VALID_FIELD_TYPES.has(desc.type)) {
      throw new Error(
        `Field "${key}" has unknown type "${String(desc.type)}". Valid types: ${[...VALID_FIELD_TYPES].join(', ')}`
      )
    }
    // Guard: enum fields must have a non-empty values array
    if (desc.type === 'enum' && (!desc.values || desc.values.length === 0)) {
      throw new Error(`Field "${key}" has type "enum" but no values array (or empty values array)`)
    }
  }

  const zodSchema = buildZodSchema(schema).strip()
  const result = zodSchema.safeParse(process.env)

  if (!result.success) {
    const failures: ValidationFailure[] = result.error.issues.map((issue: { path: (string | number)[]; message: string }) => {
      const variable = issue.path[0]?.toString() ?? 'unknown'
      const descriptor = schema[variable] as Schema[string] | undefined
      const isSensitive = descriptor?.sensitive === true
      const reason = isSensitive
        ? redactErrorMessage(issue.message, process.env[variable])
        : issue.message
      return { variable, reason }
    })
    throw new EnvValidationError(failures)
  }

  const envObject = Object.assign(Object.create(null), result.data) as EnvObject<S>

  Object.defineProperty(envObject, 'toJSON', {
    value() {
      return getSafeEnv(envObject, schema) as Record<string, string>
    },
    enumerable: false,
    configurable: false,
    writable: false,
  })

  return Object.freeze(envObject)
}

