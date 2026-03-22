import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEnv } from './index'
import { EnvValidationError } from './types'
import type { Schema } from './types'

describe('createEnv — unknown field type rejection', () => {
  it('throws on unknown field type', () => {
    const schema = { BAD: { type: 'exec' } } as unknown as Schema
    expect(() => createEnv(schema)).toThrow('unknown type "exec"')
  })

  it('throws with list of valid types', () => {
    const schema = { BAD: { type: 'foo' } } as unknown as Schema
    expect(() => createEnv(schema)).toThrow('Valid types:')
  })

  it('accepts all valid field types without throwing type error', () => {
    const schema: Schema = {
      A: { type: 'string', default: 'x' },
      B: { type: 'number', default: 0 },
      C: { type: 'boolean', default: false },
      D: { type: 'url', default: 'https://example.com' },
      E: { type: 'port', default: 3000 },
      F: { type: 'email', default: 'a@b.com' },
      G: { type: 'enum', values: ['x'], default: 'x' },
    }
    // Should not throw a "unknown type" error
    expect(() => createEnv(schema)).not.toThrow()
  })
})

describe('createEnv — .strip() prevents extra keys', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('result does not contain env vars outside the schema', () => {
    process.env['MY_VAR'] = 'hello'
    process.env['EXTRA_SECRET'] = 'should-not-leak'

    const result = createEnv({ MY_VAR: { type: 'string', required: true } })

    expect(result.MY_VAR).toBe('hello')
    expect((result as Record<string, unknown>)['EXTRA_SECRET']).toBeUndefined()
  })
})

describe('createEnv — sensitive error redaction', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('redacts sensitive values from validation error messages', () => {
    process.env['DB_PASS'] = 'super-secret-123'

    let error: EnvValidationError | undefined
    try {
      createEnv({
        DB_PASS: { type: 'boolean', required: true, sensitive: true },
      })
    } catch (e) {
      error = e as EnvValidationError
    }

    expect(error).toBeInstanceOf(EnvValidationError)
    expect(error!.message).not.toContain('super-secret-123')
    expect(error!.message).toContain('[REDACTED]')
  })
})
