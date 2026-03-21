# envzen-express

Express / Fastify middleware adapter for [EnvZen](https://github.com/madeburo/envzen).

## Installation

```bash
npm install envzen-core envzen-express
```

## Usage

```ts
import express from 'express'
import { envGuardMiddleware } from 'envzen-express'
import { schema } from './env.js'

const app = express()
app.use(envGuardMiddleware(schema))
```

Validation runs on the first request. On failure the error is forwarded to your framework's error handler via `next(err)`.

## License

MIT
