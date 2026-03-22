import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Schema, FieldType } from 'envzen-core'
import { buildZodSchema } from 'envzen-core'
import { resolveSchema } from '../utils/resolveSchema.js'

export interface CheckOptions {
  schema?: string
  env?: string
  ci: boolean
}

export interface TypeFailure {
  variable: string
  expected: FieldType
  actual: string | undefined
}

export interface DiffResult {
  missing: string[]
  extra: string[]
  typeFailures: TypeFailure[]
}

/**
 * Parses a .env file into a key-value map.
 * Handles quoted values, inline comments, and blank/comment lines.
 */
function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    // Skip blank lines and comments
    if (!line || line.startsWith('#')) continue

    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue

    const key = line.slice(0, eqIdx).trim()
    if (!key) continue

    let value = line.slice(eqIdx + 1).trim()

    // Strip surrounding quotes first, then inline comments for unquoted values
    if (value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
         (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1)
    } else {
      // Strip inline comments (only outside quotes)
      const hashIdx = value.indexOf(' #')
      if (hashIdx !== -1) {
        value = value.slice(0, hashIdx).trimEnd()
      }
    }

    map.set(key, value)
  }
  return map
}

/**
 * Computes the diff between a schema and a parsed .env map.
 */
export function computeDiff(schema: Schema, envMap: Map<string, string>): DiffResult {
  const schemaKeys = new Set(Object.keys(schema))
  const envKeys = new Set(envMap.keys())

  const missing: string[] = []
  const extra: string[] = []
  const typeFailures: TypeFailure[] = []

  // Variables in schema but not in .env
  for (const key of schemaKeys) {
    if (!envKeys.has(key)) {
      missing.push(key)
    }
  }

  // Variables in .env but not in schema
  for (const key of envKeys) {
    if (!schemaKeys.has(key)) {
      extra.push(key)
    }
  }

  // Type validation for variables present in both
  const zodSchema = buildZodSchema(schema)
  for (const key of schemaKeys) {
    if (!envKeys.has(key)) continue // already in missing

    const descriptor = schema[key]
    if (!descriptor) continue
    const rawValue = envMap.get(key)

    // Build a single-field parse to check type
    const singleFieldSchema = (zodSchema.shape as Record<string, unknown>)[key]
    if (!singleFieldSchema) continue

    // Use zod to validate just this field
    const result = (singleFieldSchema as { safeParse: (v: unknown) => { success: boolean } }).safeParse(rawValue)
    if (!result.success) {
      const isSensitive = descriptor?.sensitive === true
      typeFailures.push({
        variable: key,
        expected: descriptor.type,
        actual: isSensitive ? '[REDACTED]' : rawValue,
      })
    }
  }

  return { missing, extra, typeFailures }
}

/**
 * Formats the DiffResult as human-readable text.
 */
function formatDiff(diff: DiffResult): string {
  const lines: string[] = []

  if (diff.missing.length > 0) {
    lines.push('Missing variables (in schema, not in .env):')
    for (const v of diff.missing) {
      lines.push(`  - ${v}`)
    }
  }

  if (diff.extra.length > 0) {
    lines.push('Extra variables (in .env, not in schema):')
    for (const v of diff.extra) {
      lines.push(`  - ${v}`)
    }
  }

  if (diff.typeFailures.length > 0) {
    lines.push('Type failures:')
    for (const f of diff.typeFailures) {
      const actualStr = f.actual !== undefined ? ` (got: ${f.actual})` : ''
      lines.push(`  - ${f.variable}: expected ${f.expected}${actualStr}`)
    }
  }

  return lines.join('\n')
}

export async function checkCommand(opts: CheckOptions): Promise<void> {
  // 1. Resolve schema
  const schema = await resolveSchema(opts.schema)

  // 2. Resolve .env file path
  const envPath = opts.env
    ? resolve(process.cwd(), opts.env)
    : resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    process.stderr.write(
      `envzen: cannot find .env file.\n  Searched: ${envPath}\n  Use --env <path> to specify a different location.\n`
    )
    process.exit(1)
  }

  // 3. Parse .env file
  const envContent = await readFile(envPath, 'utf8')
  const envMap = parseEnvFile(envContent)

  // 4. Compute diff
  const diff = computeDiff(schema, envMap)

  const hasFailures =
    diff.missing.length > 0 || diff.extra.length > 0 || diff.typeFailures.length > 0

  // 5. Output results
  if (!hasFailures) {
    process.stdout.write('envzen: all checks passed.\n')
    process.exit(0)
  }

  const output = formatDiff(diff)
  process.stdout.write(`envzen check failed:\n${output}\n`)
  process.exit(1)
}
