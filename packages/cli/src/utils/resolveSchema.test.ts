import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveSchema } from './resolveSchema.js'

describe('resolveSchema — file extension validation', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>
  let exitSpy: ReturnType<typeof vi.spyOn>
  let cwdSpy: ReturnType<typeof vi.spyOn>
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'envguard-resolve-test-'))
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number) => {
      throw new Error(`process.exit(${_code})`)
    })
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('rejects .json extension', async () => {
    const jsonPath = join(tmpDir, 'schema.json')
    writeFileSync(jsonPath, '{}', 'utf8')

    await expect(resolveSchema(jsonPath)).rejects.toThrow('process.exit(1)')
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('unsupported schema file extension')
    )
  })

  it('rejects .yaml extension', async () => {
    const yamlPath = join(tmpDir, 'schema.yaml')
    writeFileSync(yamlPath, '', 'utf8')

    await expect(resolveSchema(yamlPath)).rejects.toThrow('process.exit(1)')
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('unsupported schema file extension')
    )
  })

  it('rejects files with no extension', async () => {
    const noExtPath = join(tmpDir, 'schema')
    writeFileSync(noExtPath, '', 'utf8')

    await expect(resolveSchema(noExtPath)).rejects.toThrow('process.exit(1)')
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('unsupported schema file extension')
    )
  })

  it('accepts .ts extension (does not reject on extension)', async () => {
    // File doesn't exist, so it will fail on the "cannot find" check, not the extension check
    const tsPath = join(tmpDir, 'nonexistent.ts')

    await expect(resolveSchema(tsPath)).rejects.toThrow('process.exit(1)')
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('cannot find schema file')
    )
  })

  it('accepts .mjs extension (does not reject on extension)', async () => {
    const mjsPath = join(tmpDir, 'nonexistent.mjs')

    await expect(resolveSchema(mjsPath)).rejects.toThrow('process.exit(1)')
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('cannot find schema file')
    )
  })
})
