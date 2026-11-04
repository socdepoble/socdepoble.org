import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import opendataPublica from './opendata-publica.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const emet = async () => {
  const p = opendataPublica({ arrel: root }); const emesos = new Map();
  await p.generateBundle.call({ emitFile: f => emesos.set(f.fileName, f.source) }); return emesos;
};
test('build emet ZIP i SHA reals amb epoch fixat; dos builds donen els mateixos bytes sense xarxa', async () => {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('xarxa prohibida'); };
  try {
    const a = await emet(), b = await emet(); assert.equal(a.size, 2);
    const nom = [...a.keys()].find(n => n.endsWith('.zip'));
    assert.ok(nom); assert.deepEqual(a.get(nom), b.get(nom));
    const hash = createHash('sha256').update(a.get(nom)).digest('hex');
    assert.equal(a.get(`${nom}.sha256`), `${hash}  ${path.basename(nom)}\n`);
  } finally { globalThis.fetch = fetchOriginal; }
});
test('dev servix ZIP/SHA amb mediatype, HEAD sense cos i mai fallback SPA per un paquet inexistent', async () => {
  const p = opendataPublica({ arrel: root }); let middleware;
  p.configureServer({ middlewares: { use: m => { middleware = m; } } });
  const assets = await emet(), nom = [...assets.keys()].find(n => n.endsWith('.zip'));
  async function peticio(url, method = 'GET') {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(cos) { this.cos = cos; } }; let next = false;
    await middleware({ url, method }, res, e => { if (e) throw e; next = true; }); return { res, next };
  }
  const get = await peticio(`/${nom}`); assert.equal(get.res.statusCode, 200); assert.equal(get.res.headers['Content-Type'], 'application/zip'); assert.deepEqual(get.res.cos, assets.get(nom));
  const head = await peticio(`/${nom}`, 'HEAD'); assert.equal(head.res.statusCode, 200); assert.equal(head.res.cos, undefined);
  const sha = await peticio(`/${nom}.sha256`); assert.match(sha.res.headers['Content-Type'], /text\/plain/); assert.equal(sha.res.cos, assets.get(`${nom}.sha256`));
  const altre = await peticio('/opendata/dades-obertes-xixona-20261103.zip'); assert.equal(altre.res.statusCode, 404); assert.equal(altre.next, false);
  assert.equal((await peticio('/mur')).next, true);
});
