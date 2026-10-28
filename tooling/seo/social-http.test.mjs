/* Prova HTTP sense navegador ni execució de la SPA; l'export de preview és temporal.
   Pla 261028_1526 (P1-61, Fase 2) · Portable: sense SDP_SOCIAL_ARTIFACTS, els
   artefactes (manifest, shell i política) es generen del repositori en una
   carpeta temporal; amb la variable, es lligen d'allà, com abans. */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createSocialHandler, selectMetadata } from './social-edge.mjs';
import { applySitePolicy } from './apply-site-policy.mjs';
import { buildSocialManifest } from './build-social-manifest.mjs';
import { prepareShell } from './prepare-social-shell.mjs';
import { buildSitePolicy } from './build-site-policy.mjs';

const root = process.env.SDP_PROJECT_ROOT || process.cwd();
const { JSDOM } = createRequire(path.join(root, 'package.json'))('jsdom');

async function artefactes(t) {
  if (process.env.SDP_SOCIAL_ARTIFACTS) return process.env.SDP_SOCIAL_ARTIFACTS;
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-social-http-'));
  t.after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  const { manifest } = await buildSocialManifest({ root, origin: 'https://socdepoble.org', estricte: true });
  fs.writeFileSync(path.join(carpeta, 'social-manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(carpeta, 'social-shell.json'), JSON.stringify(prepareShell(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), JSDOM)));
  fs.writeFileSync(path.join(carpeta, 'site-policy.json'), JSON.stringify(buildSitePolicy(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'))));
  return carpeta;
}

test('WhatsApp rep per HTTP el Llibre d’Or amb imatge pròpia i canonical complet', async (t) => {
  const artifacts = await artefactes(t);
  const manifest = JSON.parse(fs.readFileSync(artifacts + '/social-manifest.json'));
  const shell = JSON.parse(fs.readFileSync(artifacts + '/social-shell.json'));
  const policy = JSON.parse(fs.readFileSync(artifacts + '/site-policy.json'));
  const source = fs.readFileSync(root + '/index.html', 'utf8');
  const imagePath = '/assets/system/ui/og-llibre-d-or-1200x630.png';
  const png = fs.readFileSync(root + '/public' + imagePath);
  const handler = createSocialHandler({ manifest, shell, fetchOrigin: async request => {
    if (new URL(request.url).pathname === imagePath) return new Response(png, { headers: { 'Content-Type': 'image/png' } });
    return new Response(source, { headers: { 'Content-Type': 'text/html' } });
  } });
  const server = http.createServer(async (incoming, outgoing) => {
    try {
      const request = new Request(new URL(incoming.url, manifest.origin), { method: incoming.method, headers: incoming.headers });
      const response = applySitePolicy(request, await handler(request), policy);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { outgoing.writeHead(500); outgoing.end(error.message); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const key = '/wikidepoble?item=03_llibre_d_or_memoria_episodica';
    for (const route of [...Object.keys(manifest.routes), ...Object.keys(manifest.aliases)]) assert.ok(selectMetadata(manifest, manifest.origin + route), route);
    for (const route of [key, '/wikidepoble/03_llibre_d_or_memoria_episodica']) {
      const response = await fetch(base + route, { headers: { 'User-Agent': 'WhatsApp/2.26' } });
      assert.equal(response.status, 200);
      const html = await response.text();
      const dom = new JSDOM(html), document = dom.window.document;
      assert.ok(document.title.includes("Llibre d'Or"), route);
      assert.equal(document.querySelector('link[rel="canonical"]').href, manifest.origin + key);
      assert.equal(document.querySelector('meta[property="og:image"]').content, manifest.origin + imagePath);
      assert.equal(document.querySelectorAll('meta[property="og:title"]').length, 1);
      assert.equal(document.querySelectorAll('meta[property="og:site_name"]').length, 1);
      assert.ok(document.querySelector('title').hasAttribute('data-sdp-ssr'));
      assert.ok(response.headers.get('Content-Security-Policy').includes("script-src 'self'"));
      if (route === key && process.env.SDP_SOCIAL_ARTIFACTS) {
        fs.writeFileSync(artifacts + '/llibre-whatsapp-preview.html', html);
      }
      dom.window.close();
    }
    const head = await fetch(base + key, { method: 'HEAD', headers: { 'User-Agent': 'TelegramBot' } });
    assert.equal(head.status, 200); assert.equal(await head.text(), '');
    const image = await fetch(base + imagePath);
    const bytes = Buffer.from(await image.arrayBuffer());
    assert.equal(bytes.readUInt32BE(16), 1200); assert.equal(bytes.readUInt32BE(20), 630);
    assert.equal(image.headers.get('Content-Type'), 'image/png');
    if (process.env.SDP_SOCIAL_ARTIFACTS) {
      fs.writeFileSync(artifacts + '/http-proof.json', JSON.stringify({ status: 200, routesAccepted: Object.keys(manifest.routes).length,
        aliasesAccepted: Object.keys(manifest.aliases).length, imageBytes: bytes.length, noBrowserJavaScript: true }, null, 2));
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
