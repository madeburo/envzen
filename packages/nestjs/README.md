# envzen-nestjs

NestJS adapter for [EnvZen](https://github.com/madeburo/envzen).

## Installation

```bash
npm install envzen-core envzen-nestjs
```

## Usage

```ts
import { EnvGuardModule } from 'envzen-nestjs'
import { schema } from './env.js'

@Module({
  imports: [EnvGuardModule.forRoot(schema)],
})
export class AppModule {}
```

## License

MIT
