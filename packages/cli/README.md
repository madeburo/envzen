# envzen-cli

CLI for [EnvZen](https://github.com/madeburo/envzen) — scaffold, sync, and check environment variables against your schema.

## Installation

```bash
npm install -g envzen-cli
```

## Commands

```bash
# Scaffold an env.ts config file
envzen init

# Generate .env.example from your schema
envzen sync --schema ./env.ts

# Diff your .env against the schema
envzen check --schema ./env.ts --env ./.env

# CI mode (no interactive prompts)
envzen init --ci
envzen check --ci
```

## License

MIT
