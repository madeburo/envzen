import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnvGuardModule } from './index.js'
import { EnvValidationError } from 'envzen-core'

describe('EnvGuardModule.forRoot', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns a DynamicModule with global: true on success', () => {
    process.env['API_KEY'] = 'secret'
    const mod = EnvGuardModule.forRoot({ API_KEY: { type: 'string', required: true } })
    expect(mod.global).toBe(true)
    expect(mod.module).toBe(EnvGuardModule)
  })

  it('throws EnvValidationError when required var is missing', () => {
    delete process.env['MISSING_VAR']
    expect(() =>
      EnvGuardModule.forRoot({ MISSING_VAR: { type: 'string', required: true } })
    ).toThrow(EnvValidationError)
  })

  it('throws EnvValidationError when type validation fails', () => {
    process.env['MY_PORT'] = 'not-a-port'
    expect(() =>
      EnvGuardModule.forRoot({ MY_PORT: { type: 'port', required: true } })
    ).toThrow(EnvValidationError)
  })

  it('succeeds with empty schema', () => {
    expect(() => EnvGuardModule.forRoot({})).not.toThrow()
  })
})
