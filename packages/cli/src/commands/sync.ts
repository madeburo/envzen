import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { printEnvExample } from '@envshield/core'
import { resolveSchema } from '../utils/resolveSchema.js'

export interface SyncOptions {
  schema?: string
}

export async function syncCommand(opts: SyncOptions): Promise<void> {
  const schema = await resolveSchema(opts.schema)
  const content = printEnvExample(schema)
  const outputPath = resolve(process.cwd(), '.env.example')
  await writeFile(outputPath, content, 'utf8')
  process.stdout.write(`Created ${outputPath}\n`)
}
