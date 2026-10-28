import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    coverage: {
      include: ['src/**'],
      exclude: ['**/test/**'],
    },
    globals: true,
    setupFiles: ['./src/test/vitest.setup.ts'],
  },
});
