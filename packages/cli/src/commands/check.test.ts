import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { computeDiff, checkCommand } from './check.js'
import type { Schema } from '@envguard/core'

// ── computeDiff unit tests ────────────────────────────────────────────────────

describe('computeDiff', () => {
  const schema: Schema = {
    PORT: { type: 'port', required: true },
    NODE_ENV: { type: 'enum', values: ['development', 'production'], required: true },
    API_KEY: { type: 'string', required: true, sensitive: true },
  }

  it('returns empty diff when all variables are present and valid', () => {
    const envMap = new Map([
      ['PORT', '3000'],
      ['NODE_ENV', 'development'],
      ['API_KEY', 'secret'],
    ])
    const diff = computeDiff(schema, envMap)
    expect(diff.missing).toHaveLength(0)
    expect(diff.extra).toHaveLength(0)
    expect(diff.typeFailures).toHaveLength(0)
  })

  it('reports missing variables (in schema, not in .env)', () => {
    const envMap = new Map([['PORT', '3000']])
    const diff = computeDiff(schema, envMap)
    expect(diff.missing).toContain('NODE_ENV')
    expect(diff.missing).toContain('API_KEY')
    expect(diff.missing).not.toContain('PORT')
  })

  it('reports extra variables (in .env, not in schema)', () => {
    const envMap = new Map([
      ['PORT', '3000'],
      ['NODE_ENV', 'development'],
      ['API_KEY', 'secret'],
      ['UNKNOWN_VAR', 'value'],
    ])
    const diff = computeDiff(schema, envMap)
    expect(diff.extra).toContain('UNKNOWN_VAR')
    expect(diff.extra).not.toContain('PORT')
  })

  it('reports type failures for invalid values', () => {
    const envMap = new Map([
      ['PORT', 'not-a-port'],
      ['NODE_ENV', 'development'],
      ['API_KEY', 'secret'],
    ])
    const diff = computeDiff(schema, envMap)
    expect(diff.typeFailures).toHaveLength(1)
    expect(diff.typeFailures[0]?.variable).toBe('PORT')
    expect(diff.typeFailures[0]?.expected).toBe('port')
  })

  it('redacts sensitive variable values in type failures', () => {
    const sensitiveSchema: Schema = {
      SECRET: { type: 'number', required: true, sensitive: true },
    }
    const envMap = new Map([['SECRET', 'not-a-number']])
    const diff = computeDiff(sensitiveSchema, envMap)
    expect(diff.typeFailures).toHaveLength(1)
    expect(diff.typeFailures[0]?.actual).toBe('[REDACTED]')
  })

  it('does not redact non-sensitive variable values in type failures', () => {
    const nonSensitiveSchema: Schema = {
      PORT: { type: 'port', required: true },
    }
    const envMap = new Map([['PORT', 'bad-value']])
    const diff = computeDiff(nonSensitiveSchema, envMap)
    expect(diff.typeFailures[0]?.actual).toBe('bad-value')
  })
})

// ── checkCommand integration tests ───────────────────────────────────────────

describe('checkCommand', () => {
  let tmpDir: string
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>
  let cwdSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'envguard-check-test-'))
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number) => {
      throw new Error(`process.exit(${_code})`)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeSchema(content: string, filename = 'env.schema.ts'): string {
    const path = join(tmpDir, filename)
    writeFileSync(path, content, 'utf8')
    return path
  }

  function writeEnvFile(content: string, filename = '.env'): string {
    const path = join(tmpDir, filename)
    writeFileSync(path, content, 'utf8')
    return path
  }

  it('exits 0 and prints success when all checks pass', async () => {
    const schemaPath = writeSchema(`
import { type Schema } from '@envguard/core'
const schema: Schema = {
  PORT: { type: 'port', required: true },
}
export default schema
`)
    const envPath = writeEnvFile('PORT=3000\n')

    await expect(
      checkCommand({ schema: schemaPath, env: envPath, ci: false })
    ).rejects.toThrow('process.exit(0)')

    expect(exitSpy).toHaveBeenCalledWith(0)
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('all checks passed'))
  })

  it('exits 1 when variables are missing from .env', async () => {
    const schemaPath = writeSchema(`
import { type Schema } from '@envguard/core'
const schema: Schema = {
  PORT: { type: 'port', required: true },
  DATABASE_URL: { type: 'url', required: true },
}
export default schema
`)
    const envPath = writeEnvFile('PORT=3000\n')

    await expect(
      checkCommand({ schema: schemaPath, env: envPath, ci: false })
    ).rejects.toThrow('process.exit(1)')

    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL'))
  })

  it('exits 1 when .env has type failures', async () => {
    const schemaPath = writeSchema(`
import { type Schema } from '@envguard/core'
const schema: Schema = {
  PORT: { type: 'port', required: true },
}
export default schema
`)
    const envPath = writeEnvFile('PORT=not-a-port\n')

    await expect(
      checkCommand({ schema: schemaPath, env: envPath, ci: false })
    ).rejects.toThrow('process.exit(1)')

    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('PORT'))
  })

  it('exits 1 when .env has extra variables', async () => {
    const schemaPath = writeSchema(`
import { type Schema } from '@envguard/core'
const schema: Schema = {
  PORT: { type: 'port', required: true },
}
export default schema
`)
    const envPath = writeEnvFile('PORT=3000\nUNKNOWN=value\n')

    await expect(
      checkCommand({ schema: schemaPath, env: envPath, ci: false })
    ).rejects.toThrow('process.exit(1)')

    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('UNKNOWN'))
  })

  it('exits 1 when schema file does not exist', async () => {
    const envPath = writeEnvFile('PORT=3000\n')

    await expect(
      checkCommand({ schema: join(tmpDir, 'nonexistent.ts'), env: envPath, ci: false })
    ).rejects.toThrow('process.exit(1)')

    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('cannot find schema file'))
  })

  it('exits 1 when .env file does not exist', async () => {
    const schemaPath = writeSchema(`
import { type Schema } from '@envguard/core'
const schema: Schema = { PORT: { type: 'port', required: true } }
export default schema
`)

    await expect(
      checkCommand({ schema: schemaPath, env: join(tmpDir, '.env'), ci: false })
    ).rejects.toThrow('process.exit(1)')

    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('cannot find .env file'))
  })

  it('does not expose sensitive variable values in output', async () => {
    const schemaPath = writeSchema(`
import { type Schema } from '@envguard/core'
const schema: Schema = {
  SECRET_KEY: { type: 'string', required: true, sensitive: true },
}
export default schema
`)
    const envPath = writeEnvFile('SECRET_KEY=super-secret-value\nEXTRA=oops\n')

    await expect(
      checkCommand({ schema: schemaPath, env: envPath, ci: false })
    ).rejects.toThrow('process.exit(1)')

    // The actual secret value should not appear in stdout
    const allOutput = stdoutSpy.mock.calls.map((c) => c[0]).join('')
    expect(allOutput).not.toContain('super-secret-value')
  })
})
