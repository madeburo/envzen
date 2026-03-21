import type { Schema } from './types'

/**
 * Serializes a Schema into `.env.example` format.
 *
 * For each variable, emits:
 *   - `# <description>` comment if `description` is present
 *   - `# default: <value>` comment if `default` is present
 *   - `# required` comment if `required: true`
 *   - `NAME=` line (variable name followed by `=` with no value)
 *
 * Variable blocks are separated by a blank line.
 */
export function printEnvExample(schema: Schema): string {
  const blocks: string[] = []

  for (const [name, descriptor] of Object.entries(schema)) {
    const lines: string[] = []

    if (descriptor.description !== undefined) {
      lines.push(`# ${descriptor.description}`)
    }

    if (descriptor.default !== undefined) {
      lines.push(`# default: ${descriptor.default}`)
    }

    if (descriptor.required === true) {
      lines.push(`# required`)
    }

    lines.push(`${name}=`)

    blocks.push(lines.join('\n'))
  }

  return blocks.join('\n\n')
}
