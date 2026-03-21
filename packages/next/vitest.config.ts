import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'next',
    include: ['src/**/*.test.ts'],
  },
})
