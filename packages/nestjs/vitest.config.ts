import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'nestjs',
    include: ['src/**/*.test.ts'],
  },
})
