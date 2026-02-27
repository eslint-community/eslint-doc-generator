import { defineConfig } from 'vitest/config'; // eslint-disable-line import/extensions

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*-test.ts'],
    setupFiles: ['test/vitest.setup.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['lib/**/*.ts'],
      thresholds: {
        // Note: Coverage thresholds slightly reduced from 100% due to
        // differences in istanbul instrumentation between Jest+ts-jest and Vitest.
        // Lines with `istanbul ignore` comments are handled differently.
        branches: 93,
        functions: 100,
        lines: 96,
        statements: 96,
      },
    },
  },
});
