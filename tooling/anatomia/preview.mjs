/** Isolated local specimen server. Does not load the application dev plugins. */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cacheDir = await mkdtemp(join(tmpdir(), 'sdp-r31-vite-'));
const server = await createServer({
  root, configFile: false, envDir: cacheDir, envPrefix: 'SDP_R31_PREVIEW_', plugins: [react()], cacheDir,
  server: { host: '127.0.0.1', port: 3347, strictPort: true, fs: { strict: true } },
});
await server.listen();
console.log('R31 preview: http://127.0.0.1:3347/tooling/anatomia/preview.html');
const stop = async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
