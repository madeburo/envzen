import { resolve, extname } from 'node:path'
import { existsSync } from 'node:fs'
import type { Schema } from 'envzen-core'

const ALLOWED_EXTENSIONS = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'])

/**
 * Resolves and imports the user's schema file.
 * Falls back to `./env.ts` in the current working directory if no path is given.
 * Prints a descriptive error to stderr and exits with code 1 on failure.
 */
export async function resolveSchema(schemaFlag?: string): Promise<Schema> {
  const schemaPath = schemaFlag
    ? resolve(process.cwd(), schemaFlag)
    : resolve(process.cwd(), 'env.ts')

  const ext = extname(schemaPath).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    process.stderr.write(
      `envzen: unsupported schema file extension "${ext}".\n  Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}\n`
    )
    process.exit(1)
  }

  if (!existsSync(schemaPath)) {
    process.stderr.write(
      `envzen: cannot find schema file.\n  Searched: ${schemaPath}\n  Use --schema <path> to specify a different location.\n`
    )
    process.exit(1)
  }

  let mod: unknown
  try {
    mod = await import(schemaPath)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`envzen: failed to import schema file "${schemaPath}".\n  ${message}\n`)
    process.exit(1)
  }

  const schema = (mod as Record<string, unknown>)?.default ?? (mod as Record<string, unknown>)?.schema

  if (!schema || typeof schema !== 'object') {
    process.stderr.write(
      `envzen: schema file "${schemaPath}" must export a default export or named "schema" export that is a Schema object.\n`
    )
    process.exit(1)
  }

  return schema as Schema
}
