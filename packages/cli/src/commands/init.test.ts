import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Mock readline to control user input
vi.mock('node:readline', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn((_q: string, cb: (answer: string) => void) => cb('y')),
    close: vi.fn(),
  })),
}))

import { initCommand } from './init.js'

describe('initCommand', () => {
  let tmpDir: string
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let cwdSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'envguard-init-test-'))
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates env.ts and prints the path', async () => {
    await initCommand({ ci: false })

    expect(existsSync(join(tmpDir, 'env.ts'))).toBe(true)
    const content = readFileSync(join(tmpDir, 'env.ts'), 'utf8')
    expect(content).toContain('createEnv')
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('env.ts'))
  })

  it('prompts before overwriting existing env.ts and overwrites on confirmation', async () => {
    writeFileSync(join(tmpDir, 'env.ts'), 'old content', 'utf8')

    // readline mock returns 'y' by default
    await initCommand({ ci: false })

    const content = readFileSync(join(tmpDir, 'env.ts'), 'utf8')
    expect(content).toContain('createEnv')
    expect(content).not.toBe('old content')
  })

  it('aborts when user declines overwrite', async () => {
    const readline = await import('node:readline')
    vi.mocked(readline.createInterface).mockReturnValueOnce({
      question: vi.fn((_q: string, cb: (answer: string) => void) => cb('n')),
      close: vi.fn(),
    } as ReturnType<typeof readline.createInterface>)

    writeFileSync(join(tmpDir, 'env.ts'), 'old content', 'utf8')

    await initCommand({ ci: false })

    const content = readFileSync(join(tmpDir, 'env.ts'), 'utf8')
    expect(content).toBe('old content')
    expect(stdoutSpy).toHaveBeenCalledWith('Aborted.\n')
  })

  it('--ci skips prompt and creates env.ts', async () => {
    await initCommand({ ci: true })

    expect(existsSync(join(tmpDir, 'env.ts'))).toBe(true)
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('env.ts'))
  })

  it('--ci generates GitHub Actions workflow file', async () => {
    await initCommand({ ci: true })

    const workflowPath = join(tmpDir, '.github', 'workflows', 'envzen.yml')
    expect(existsSync(workflowPath)).toBe(true)
    const content = readFileSync(workflowPath, 'utf8')
    expect(content).toContain('envzen check')
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('envzen.yml'))
  })
})
