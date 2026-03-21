# envzen-next

Next.js adapter for [EnvZen](https://github.com/madeburo/envzen).

## Installation

```bash
npm install envzen-core envzen-next
```

## Usage

```ts
// next.config.ts
import { withEnvGuard } from 'envzen-next'
import { schema } from './env.js'

export default withEnvGuard({ /* your next config */ }, schema)
```

## License

MIT
