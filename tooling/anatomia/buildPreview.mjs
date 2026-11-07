/** Build one offline HTML specimen; all source stays inside this worktree. */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const artifactDir = join(root, '.r31');
const outDir = join(artifactDir, 'preview-dist');
const scratch = await mkdtemp(join(tmpdir(), 'sdp-r31-preview-build-'));
const envDir = join(scratch, 'env');
await mkdir(envDir);
try {
  await mkdir(artifactDir, { recursive: true });
  await build({
    root, configFile: false, publicDir: false, plugins: [react()], cacheDir: join(scratch, 'cache'), base: './',
    envDir, envPrefix: 'SDP_R31_PREVIEW_', define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir, emptyOutDir: true, cssCodeSplit: false, assetsInlineLimit: Infinity,
      lib: { entry: join(root, 'tooling/anatomia/preview.jsx'), name: 'SdpPouNeuPreview', formats: ['iife'], fileName: () => 'pou-neu-preview.js', cssFileName: 'pou-neu-preview' },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const names = await readdir(outDir);
  const scripts = names.filter((name) => name.endsWith('.js'));
  if (scripts.length !== 1) throw new Error(`Expected one IIFE script, found ${scripts.length}`);
  const js = await readFile(join(outDir, scripts[0]), 'utf8');
  let css = (await Promise.all(names.filter((name) => name.endsWith('.css')).map((name) => readFile(join(outDir, name), 'utf8')))).join('\n');
  const mime = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif' };
  const references = [...new Set([...css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map((match) => match[1]))];
  for (const reference of references) {
    if (/^(data:|#)/i.test(reference)) continue;
    if (/^https?:|^\/\//i.test(reference)) throw new Error(`Offline CSS retained an external asset: ${reference}`);
    const filename = reference.startsWith('/') ? join(root, 'public', reference.slice(1)) : resolve(outDir, reference);
    const bytes = await readFile(filename);
    const data = `data:${mime[extname(filename)] || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
    css = css.replaceAll(reference, data);
  }
  const html = `<!doctype html>\n<html lang="ca"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R31 · Pou de la Neu · Anatomia 3D</title><style>${css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>\n`;
  const filename = join(artifactDir, 'preview-standalone.html');
  await writeFile(filename, html);
  console.log(`Offline preview: ${filename} (${Buffer.byteLength(html)} bytes). Query: ?lang=ca|es|en|eu|gl&no-webgl&exploded`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
