# envzen-vite

Vite plugin adapter for [EnvZen](https://github.com/madeburo/envzen).

## Installation

```bash
npm install envzen-core envzen-vite
```

## Usage

```ts
// vite.config.ts
import { envGuardPlugin } from 'envzen-vite'
import { schema } from './env.js'

export default {
  plugins: [envGuardPlugin(schema)],
}
```

Validation runs in the `buildStart` hook, halting Vite on failure.

## License

MIT
