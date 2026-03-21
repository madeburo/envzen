# envzen-core

The validation engine behind [EnvZen](https://github.com/madeburo/envzen). Validates `process.env` against a developer-defined schema at startup using [Zod](https://zod.dev).

## Installation

```bash
npm install envzen-core
```

## Usage

```ts
import { createEnv } from 'envzen-core'

export const env = createEnv({
  NODE_ENV: {
    type: 'enum',
    values: ['development', 'production', 'test'],
    default: 'development',
  },
  PORT: {
    type: 'port',
    default: 3000,
  },
  DATABASE_URL: {
    type: 'url',
    required: true,
    sensitive: true,
  },
  API_KEY: {
    type: 'string',
    required: true,
    sensitive: true,
  },
})

// Fully typed
console.log(env.PORT)     // number
console.log(env.NODE_ENV) // 'development' | 'production' | 'test'

// Sensitive fields are redacted in JSON output
console.log(JSON.stringify(env)) // DATABASE_URL → "[REDACTED]"
```

> Call `dotenv.config()` before `createEnv()` if you use a `.env` file — envzen-core does not load it automatically.

## Field Types

| Type | Validation |
|---|---|
| `string` | Raw string |
| `number` | Coerced via `z.coerce.number()` |
| `boolean` | Accepts `"true"`, `"false"`, `"1"`, `"0"` |
| `port` | Integer 1–65535 |
| `url` | Valid URL string |
| `email` | Valid email string |
| `enum` | Must match one of `values` |

## FieldDescriptor

```ts
{
  type: FieldType        // required
  required?: boolean     // must be present, ignores default
  default?: string | number | boolean
  description?: string   // used in .env.example output
  sensitive?: boolean    // redacts value in toJSON()
  values?: string[]      // required when type is 'enum'
  validate?: ZodType     // custom Zod refinement
}
```

## Error Handling

```ts
import { createEnv, EnvValidationError } from 'envzen-core'

try {
  const env = createEnv(schema)
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error(err.message)   // formatted list of failures
    console.error(err.failures)  // [{ variable, reason }]
  }
}
```

## License

MIT
