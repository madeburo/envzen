import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { envGuardPlugin } from './index'
import { EnvValidationError } from '@envguard/core'

describe('envGuardPlugin', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns a plugin with name "envguard"', () => {
    const plugin = envGuardPlugin({})
    expect(plugin.name).toBe('envguard')
  })

  it('has a buildStart hook', () => {
    const plugin = envGuardPlugin({})
    expect(typeof plugin.buildStart).toBe('function')
  })

  it('buildStart succeeds when all required env vars are present', () => {
    process.env.API_KEY = 'secret'
    const plugin = envGuardPlugin({
      API_KEY: { type: 'string', required: true },
    })
    expect(() => (plugin.buildStart as () => void)()).not.toThrow()
  })

  it('buildStart throws EnvValidationError when required env var is missing', () => {
    delete process.env.MISSING_VAR
    const plugin = envGuardPlugin({
      MISSING_VAR: { type: 'string', required: true },
    })
    expect(() => (plugin.buildStart as () => void)()).toThrow(EnvValidationError)
  })

  it('buildStart throws EnvValidationError when type validation fails', () => {
    process.env.MY_PORT = 'not-a-port'
    const plugin = envGuardPlugin({
      MY_PORT: { type: 'port', required: true },
    })
    expect(() => (plugin.buildStart as () => void)()).toThrow(EnvValidationError)
  })

  it('buildStart succeeds with empty schema', () => {
    const plugin = envGuardPlugin({})
    expect(() => (plugin.buildStart as () => void)()).not.toThrow()
  })
})
