import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { syncCommand } from './sync.js'

describe('syncCommand', () => {
  let tmpDir: string
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>
  let cwdSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'envguard-sync-test-'))
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

  it('writes .env.example from a valid schema file', async () => {
    // Create a minimal schema file
    const schemaContent = `
import { type Schema } from '@envguard/core'
const schema: Schema = {
  PORT: { type: 'port', default: 3000, description: 'HTTP port' },
  NODE_ENV: { type: 'enum', values: ['development', 'production'], required: true },
}
export default schema
`
    const schemaPath = join(tmpDir, 'env.schema.ts')
    writeFileSync(schemaPath, schemaContent, 'utf8')

    await syncCommand({ schema: schemaPath })

    const outputPath = join(tmpDir, '.env.example')
    expect(existsSync(outputPath)).toBe(true)
    const content = readFileSync(outputPath, 'utf8')
    expect(content).toContain('PORT=')
    expect(content).toContain('NODE_ENV=')
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('.env.example'))
  })

  it('exits non-zero when schema file does not exist', async () => {
    await expect(
      syncCommand({ schema: join(tmpDir, 'nonexistent.ts') })
    ).rejects.toThrow('process.exit(1)')

    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('cannot find schema file'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('exits non-zero when default env.ts does not exist', async () => {
    // No env.ts in tmpDir
    await expect(syncCommand({})).rejects.toThrow('process.exit(1)')

    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('cannot find schema file'))
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
