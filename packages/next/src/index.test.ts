import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { withEnvGuard } from './index.js'
import { EnvValidationError } from 'envzen-core'

describe('withEnvGuard', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns the config object unchanged on success', () => {
    process.env['API_KEY'] = 'secret'
    const config = { reactStrictMode: true }
    const result = withEnvGuard(config, { API_KEY: { type: 'string', required: true } })
    expect(result).toBe(config)
  })

  it('throws EnvValidationError when required var is missing', () => {
    delete process.env['MISSING_VAR']
    expect(() =>
      withEnvGuard({}, { MISSING_VAR: { type: 'string', required: true } })
    ).toThrow(EnvValidationError)
  })

  it('throws EnvValidationError when type validation fails', () => {
    process.env['MY_PORT'] = 'not-a-port'
    expect(() =>
      withEnvGuard({}, { MY_PORT: { type: 'port', required: true } })
    ).toThrow(EnvValidationError)
  })

  it('succeeds with empty schema', () => {
    const config = { output: 'standalone' }
    expect(() => withEnvGuard(config, {})).not.toThrow()
  })

  it('passes through arbitrary config properties', () => {
    const config = { images: { domains: ['example.com'] }, reactStrictMode: false }
    const result = withEnvGuard(config, {})
    expect(result).toEqual(config)
  })
})
