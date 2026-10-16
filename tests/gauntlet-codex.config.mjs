import { defineConfig } from 'vitest/config';

// Explicit opt-in: this workload is not discovered by the normal CI suite.
export default defineConfig({
  test: {
    include: ['tests/gauntlet-codex-concurrency.stress.mjs'],
    environment: 'jsdom',
    maxWorkers: 1,
    execArgv: ['--expose-gc'],
    testTimeout: 120_000,
    hookTimeout: 10_000,
  },
});
