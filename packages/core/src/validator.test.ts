import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { buildZodSchema, validate } from './validator'
import { EnvValidationError } from './types'

describe('buildZodSchema', () => {
  it('throws immediately for enum with empty values', () => {
    expect(() =>
      buildZodSchema({ MODE: { type: 'enum', values: [] } })
    ).toThrow('empty values array')
  })

  it('throws immediately for enum with no values field', () => {
    expect(() =>
      buildZodSchema({ MODE: { type: 'enum' } })
    ).toThrow('empty values array')
  })
})

describe('validate — string', () => {
  it('passes any string', () => {
    const result = validate({ NAME: { type: 'string', required: true } }, { NAME: 'hello' })
    expect(result.NAME).toBe('hello')
  })
})

describe('validate — number', () => {
  it('coerces numeric string', () => {
    const result = validate({ PORT: { type: 'number', required: true } }, { PORT: '3000' })
    expect(result.PORT).toBe(3000)
  })

  it('rejects non-numeric string', () => {
    expect(() =>
      validate({ PORT: { type: 'number', required: true } }, { PORT: 'abc' })
    ).toThrow(EnvValidationError)
  })
})

describe('validate — boolean', () => {
  it.each([['true', true], ['1', true], ['TRUE', true], ['True', true]])(
    'coerces "%s" to true',
    (input, expected) => {
      const result = validate({ FLAG: { type: 'boolean', required: true } }, { FLAG: input })
      expect(result.FLAG).toBe(expected)
    }
  )

  it.each([['false', false], ['0', false], ['FALSE', false], ['False', false]])(
    'coerces "%s" to false',
    (input, expected) => {
      const result = validate({ FLAG: { type: 'boolean', required: true } }, { FLAG: input })
      expect(result.FLAG).toBe(expected)
    }
  )

  it.each(['yes', 'no', 'on', 'off', '2', ''])(
    'rejects "%s"',
    (input) => {
      expect(() =>
        validate({ FLAG: { type: 'boolean', required: true } }, { FLAG: input })
      ).toThrow(EnvValidationError)
    }
  )
})

describe('validate — port', () => {
  it('accepts valid port', () => {
    const result = validate({ PORT: { type: 'port', required: true } }, { PORT: '3000' })
    expect(result.PORT).toBe(3000)
  })

  it('accepts boundary 1', () => {
    const result = validate({ PORT: { type: 'port', required: true } }, { PORT: '1' })
    expect(result.PORT).toBe(1)
  })

  it('accepts boundary 65535', () => {
    const result = validate({ PORT: { type: 'port', required: true } }, { PORT: '65535' })
    expect(result.PORT).toBe(65535)
  })

  it('rejects 0', () => {
    expect(() =>
      validate({ PORT: { type: 'port', required: true } }, { PORT: '0' })
    ).toThrow(EnvValidationError)
  })

  it('rejects 65536', () => {
    expect(() =>
      validate({ PORT: { type: 'port', required: true } }, { PORT: '65536' })
    ).toThrow(EnvValidationError)
  })

  it('rejects non-integer', () => {
    expect(() =>
      validate({ PORT: { type: 'port', required: true } }, { PORT: 'abc' })
    ).toThrow(EnvValidationError)
  })
})

describe('validate — url', () => {
  it('accepts valid URL', () => {
    const result = validate({ URL: { type: 'url', required: true } }, { URL: 'https://example.com' })
    expect(result.URL).toBe('https://example.com')
  })

  it('rejects invalid URL', () => {
    expect(() =>
      validate({ URL: { type: 'url', required: true } }, { URL: 'not-a-url' })
    ).toThrow(EnvValidationError)
  })
})

describe('validate — email', () => {
  it('accepts valid email', () => {
    const result = validate({ EMAIL: { type: 'email', required: true } }, { EMAIL: 'user@example.com' })
    expect(result.EMAIL).toBe('user@example.com')
  })

  it('rejects invalid email', () => {
    expect(() =>
      validate({ EMAIL: { type: 'email', required: true } }, { EMAIL: 'notanemail' })
    ).toThrow(EnvValidationError)
  })
})

describe('validate — enum', () => {
  it('accepts declared value', () => {
    const result = validate(
      { MODE: { type: 'enum', values: ['dev', 'prod'], required: true } },
      { MODE: 'dev' }
    )
    expect(result.MODE).toBe('dev')
  })

  it('rejects undeclared value', () => {
    expect(() =>
      validate(
        { MODE: { type: 'enum', values: ['dev', 'prod'], required: true } },
        { MODE: 'staging' }
      )
    ).toThrow(EnvValidationError)
  })
})

describe('validate — required vs default vs optional', () => {
  it('required field throws when absent', () => {
    expect(() =>
      validate({ NAME: { type: 'string', required: true } }, {})
    ).toThrow(EnvValidationError)
  })

  it('default is used when variable is absent', () => {
    const result = validate({ PORT: { type: 'number', default: 3000 } }, {})
    expect(result.PORT).toBe(3000)
  })

  it('required takes precedence over default', () => {
    expect(() =>
      validate({ PORT: { type: 'number', required: true, default: 3000 } }, {})
    ).toThrow(EnvValidationError)
  })

  it('optional field is undefined when absent', () => {
    const result = validate({ NAME: { type: 'string' } }, {})
    expect(result.NAME).toBeUndefined()
  })
})

describe('validate — custom validate refinement', () => {
  it('passes when custom validate passes', () => {
    const result = validate(
      {
        URL: {
          type: 'url',
          required: true,
          validate: z.string().startsWith('https://'),
        },
      },
      { URL: 'https://example.com' }
    )
    expect(result.URL).toBe('https://example.com')
  })

  it('throws when custom validate fails', () => {
    expect(() =>
      validate(
        {
          URL: {
            type: 'url',
            required: true,
            validate: z.string().startsWith('https://'),
          },
        },
        { URL: 'http://example.com' }
      )
    ).toThrow(EnvValidationError)
  })
})

describe('validate — error collects all failures', () => {
  it('reports all failing variables in one error', () => {
    let error: EnvValidationError | undefined
    try {
      validate(
        {
          A: { type: 'string', required: true },
          B: { type: 'number', required: true },
        },
        {}
      )
    } catch (e) {
      error = e as EnvValidationError
    }
    expect(error).toBeInstanceOf(EnvValidationError)
    const vars = error!.failures.map((f) => f.variable)
    expect(vars).toContain('A')
    expect(vars).toContain('B')
  })
})
