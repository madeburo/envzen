import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { envGuardMiddleware } from './index.js'
import { EnvValidationError } from 'envzen-core'

describe('envGuardMiddleware', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns a middleware function', () => {
    const mw = envGuardMiddleware({})
    expect(typeof mw).toBe('function')
  })

  it('calls next() without error when schema is valid', () => {
    process.env['API_KEY'] = 'secret'
    const mw = envGuardMiddleware({ API_KEY: { type: 'string', required: true } })
    const next = vi.fn()
    mw({}, {}, next)
    expect(next).toHaveBeenCalledWith()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('calls next(err) with EnvValidationError when required var is missing', () => {
    delete process.env['MISSING_VAR']
    const mw = envGuardMiddleware({ MISSING_VAR: { type: 'string', required: true } })
    const next = vi.fn()
    mw({}, {}, next)
    expect(next).toHaveBeenCalledTimes(1)
    const err = next.mock.calls[0]?.[0]
    expect(err).toBeInstanceOf(EnvValidationError)
  })

  it('calls next(err) with EnvValidationError when type validation fails', () => {
    process.env['MY_PORT'] = 'not-a-port'
    const mw = envGuardMiddleware({ MY_PORT: { type: 'port', required: true } })
    const next = vi.fn()
    mw({}, {}, next)
    const err = next.mock.calls[0]?.[0]
    expect(err).toBeInstanceOf(EnvValidationError)
  })

  it('succeeds with an empty schema', () => {
    const mw = envGuardMiddleware({})
    const next = vi.fn()
    mw({}, {}, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('only validates once across multiple requests', () => {
    process.env['API_KEY'] = 'secret'
    const mw = envGuardMiddleware({ API_KEY: { type: 'string' as const, required: true } })
    const next = vi.fn()
    mw({}, {}, next)
    mw({}, {}, next)
    expect(next).toHaveBeenCalledTimes(2)
    expect(next.mock.calls[0]).toEqual([])
    expect(next.mock.calls[1]).toEqual([])
  })
})
