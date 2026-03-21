import { existsSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import * as readline from 'node:readline'

export interface InitOptions {
  ci: boolean
}

const ENV_TS_TEMPLATE = `import { createEnv } from '@envguard/core'

export const env = createEnv({
  NODE_ENV: {
    type: 'enum',
    values: ['development', 'production', 'test'],
    default: 'development',
    description: 'Application environment',
  },
  PORT: {
    type: 'port',
    default: 3000,
    description: 'HTTP server port',
  },
  DATABASE_URL: {
    type: 'url',
    required: true,
    description: 'PostgreSQL connection string',
    sensitive: true,
  },
  API_KEY: {
    type: 'string',
    required: true,
    description: 'External API key',
    sensitive: true,
  },
  ENABLE_FEATURE_X: {
    type: 'boolean',
    default: false,
    description: 'Feature flag for experimental feature X',
  },
})
`

const GITHUB_WORKFLOW_TEMPLATE = `name: envguard check

on:
  pull_request:

jobs:
  envguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @envguard/cli
      - run: envguard check
`

function prompt(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes')
    })
  })
}

export async function initCommand(opts: InitOptions): Promise<void> {
  const cwd = process.cwd()
  const envTsPath = resolve(cwd, 'env.ts')

  // Check for existing file and prompt unless --ci
  if (existsSync(envTsPath)) {
    if (!opts.ci) {
      const confirmed = await prompt(`env.ts already exists. Overwrite? (y/N) `)
      if (!confirmed) {
        process.stdout.write('Aborted.\n')
        return
      }
    }
  }

  // Write env.ts template
  await writeFile(envTsPath, ENV_TS_TEMPLATE, 'utf8')
  process.stdout.write(`Created ${envTsPath}\n`)

  // With --ci, also generate GitHub Actions workflow
  if (opts.ci) {
    const workflowDir = join(cwd, '.github', 'workflows')
    const workflowPath = join(workflowDir, 'envguard.yml')
    await mkdir(workflowDir, { recursive: true })
    await writeFile(workflowPath, GITHUB_WORKFLOW_TEMPLATE, 'utf8')
    process.stdout.write(`Created ${workflowPath}\n`)
  }
}
