import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: 'vitest-cache',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
