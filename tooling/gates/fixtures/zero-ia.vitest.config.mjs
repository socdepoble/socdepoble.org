import { defineConfig } from 'vitest/config';
export default defineConfig({
  envFile:false,
  cacheDir:'.r3249/lot02/vite-cache',
  esbuild:{jsx:'automatic'},
  test:{environment:'jsdom',include:['tests/fixtures/zero-ia.runtime.cases.js'],maxWorkers:1,testTimeout:10000}
});
