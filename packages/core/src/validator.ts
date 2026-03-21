import { z } from 'zod'
import type { Schema, EnvObject, ValidationFailure } from './types'
import { EnvValidationError, formatErrors } from './types'

export { formatErrors }

/** WeakMap cache: avoids rebuilding the Zod schema when the same schema object is reused. */
const schemaCache = new WeakMap<Schema, z.ZodObject<Record<string, z.ZodTypeAny>>>()

/**
 * Builds a Zod object schema from an envguard Schema definition.
 * Applies coercion rules per field type and handles required/default/optional.
 * Results are cached per schema object reference via WeakMap.
 */
export function buildZodSchema(schema: Schema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const cached = schemaCache.get(schema)
  if (cached) return cached
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, descriptor] of Object.entries(schema)) {
    const { type, required, default: defaultValue, validate, values } = descriptor

    // Build the base Zod type for this field
    let fieldSchema: z.ZodTypeAny

    switch (type) {
      case 'string':
        fieldSchema = z.string()
        break

      case 'number':
        fieldSchema = z.coerce.number()
        break

      case 'boolean':
        fieldSchema = z
          .string()
          .transform((val, ctx) => {
            const lower = val.toLowerCase()
            if (lower === 'true' || lower === '1') return true
            if (lower === 'false' || lower === '0') return false
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `expected boolean string ("true", "false", "1", "0"), got "${val}"`,
            })
            return z.NEVER
          })
        break

      case 'port':
        fieldSchema = z.coerce.number().int().min(1).max(65535)
        break

      case 'url':
        fieldSchema = z.string().url()
        break

      case 'email':
        fieldSchema = z.string().email()
        break

      case 'enum': {
        if (!values || values.length === 0) {
          throw new Error(`Field "${key}" has type "enum" but no values array (or empty values array)`)
        }
        fieldSchema = z.enum(values as [string, ...string[]])
        break
      }

      default:
        fieldSchema = z.string()
    }

    // Chain custom validate refinement if provided
    if (validate) {
      fieldSchema = fieldSchema.pipe(validate)
    }

    // Handle required vs default vs optional
    if (required) {
      // required: true — field must be present; default is ignored
      shape[key] = fieldSchema
    } else if (defaultValue !== undefined) {
      // Has a default — make it optional with a default value
      shape[key] = z
        .preprocess(
          (val) => (val === undefined || val === null ? undefined : val),
          fieldSchema.optional()
        )
        .transform((val) => (val === undefined ? defaultValue : val))
    } else {
      // Fully optional
      shape[key] = fieldSchema.optional()
    }
  }

  const zodObject = z.object(shape)
  schemaCache.set(schema, zodObject)
  return zodObject
}

/**
 * Redacts the actual env value from a Zod error message for sensitive fields.
 * Replaces any occurrence of the raw value with [REDACTED].
 */
function redactErrorMessage(message: string, rawValue: string | undefined): string {
  if (rawValue === undefined || rawValue === '') return message
  return message.split(rawValue).join('[REDACTED]')
}

/**
 * Validates an env record against a Schema.
 * Throws EnvValidationError on failure, returns typed EnvObject on success.
 */
export function validate<S extends Schema>(
  schema: S,
  env: Record<string, string | undefined>
): EnvObject<S> {
  const zodSchema = buildZodSchema(schema)
  const result = zodSchema.safeParse(env)

  if (!result.success) {
    const failures: ValidationFailure[] = result.error.issues.map((issue) => {
      const variable = issue.path[0]?.toString() ?? 'unknown'
      const descriptor = schema[variable] as Schema[string] | undefined
      const isSensitive = descriptor?.sensitive === true
      const reason = isSensitive
        ? redactErrorMessage(issue.message, env[variable])
        : issue.message
      return { variable, reason }
    })
    throw new EnvValidationError(failures)
  }

  return result.data as EnvObject<S>
}
