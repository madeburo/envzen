#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('envguard')
  .description('Type-safe environment variable validation CLI')
  .version('0.1.0')

// ── init ──────────────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Scaffold an env.ts configuration file in the current directory')
  .option('--ci', 'Skip interactive prompts and generate a GitHub Actions workflow file')
  .action(async (opts: { ci?: boolean }) => {
    const { initCommand } = await import('./commands/init.js')
    await initCommand({ ci: opts.ci ?? false })
  })

// ── sync ──────────────────────────────────────────────────────────────────────
program
  .command('sync')
  .description('Generate .env.example from your schema')
  .option('--schema <path>', 'Path to the schema file (default: ./env.ts)')
  .action(async (opts: { schema?: string }) => {
    const { syncCommand } = await import('./commands/sync.js')
    await syncCommand({ schema: opts.schema })
  })

// ── check ─────────────────────────────────────────────────────────────────────
program
  .command('check')
  .description('Diff your local .env file against the schema')
  .option('--schema <path>', 'Path to the schema file (default: ./env.ts)')
  .option('--env <path>', 'Path to the .env file (default: ./.env)')
  .option('--ci', 'Suppress interactive prompts and use plain-text output')
  .action(async (opts: { schema?: string; env?: string; ci?: boolean }) => {
    const { checkCommand } = await import('./commands/check.js')
    await checkCommand({ schema: opts.schema, env: opts.env, ci: opts.ci ?? false })
  })

program.parse()
