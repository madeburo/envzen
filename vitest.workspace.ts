import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/core',
  'packages/cli',
  'packages/next',
  'packages/nestjs',
  'packages/vite',
  'packages/express',
])
