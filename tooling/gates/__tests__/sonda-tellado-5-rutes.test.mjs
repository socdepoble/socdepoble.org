import assert from 'node:assert/strict';
import test from 'node:test';
import {
  creaServidorEfimerTellado,
  executaSondaTellado5Rutes,
} from '../sonda-tellado-5-rutes.mjs';

test('sonda-tellado-5-rutes: mode normal en 127.0.0.1:0 verifica les 5 rutes sempre amb GET anònim (mai HEAD ni cookies)', async () => {
  const srv = await creaServidorEfimerTellado();
  try {
    const res = await executaSondaTellado5Rutes(srv.url);
    assert.equal(res.ok, true, JSON.stringify(res.errors));
    assert.equal(res.resultats.length, 5);
    assert.equal(srv.peticionsRebudes.length, 5);
    for (const req of srv.peticionsRebudes) {
      assert.equal(req.method, 'GET', 'Mai no es pot usar HEAD a soles');
      assert.equal(req.cookie, '', 'Les peticions de sonda han de ser anònimes sense cookies');
    }
  } finally {
    await srv.tanca();
  }
});

test('sonda-tellado-5-rutes: mode manteniment 503 exigeix Retry-After + no-store en rutes públiques i 200 OK a /robots.txt', async () => {
  const srv = await creaServidorEfimerTellado({ mantenimentSegons: 900 });
  try {
    const res = await executaSondaTellado5Rutes(srv.url, { esperaManteniment: true });
    assert.equal(res.ok, true, JSON.stringify(res.errors));
    const robots = res.resultats.find((r) => r.ruta === '/robots.txt');
    assert.equal(robots.status, 200);
    const portada = res.resultats.find((r) => r.ruta === '/');
    assert.equal(portada.status, 503);
  } finally {
    await srv.tanca();
  }
});

test('sonda-tellado-5-rutes: caça soft-404 (200 a ruta inexistent), /robots.txt amb 503 i manteniment sense Retry-After', async () => {
  const srvSoft404 = await creaServidorEfimerTellado({ soft404: true });
  try {
    const res = await executaSondaTellado5Rutes(srvSoft404.url);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('sonda-404')));
  } finally {
    await srvSoft404.tanca();
  }

  const srvRobotsTrencat = await creaServidorEfimerTellado({
    mantenimentSegons: 600,
    robots503: true,
    ometRetryAfter: true,
  });
  try {
    const res = await executaSondaTellado5Rutes(srvRobotsTrencat.url, { esperaManteniment: true });
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('robots (/robots.txt)')));
    assert.ok(res.errors.some((e) => e.includes('Retry-After')));
  } finally {
    await srvRobotsTrencat.tanca();
  }
});

/* Onada R26 · invariants IDEA-263 de l'auditoria Codex R25.2: bytes i temps acotats, historial de salts i Retry-After vàlid. */
import http from 'node:http';

async function servidor(gestor) {
  const server = http.createServer(gestor);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, tanca: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }) };
}

const respostaNormal = (req, res) => {
  if (req.url === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('User-agent: *\nAllow: /\n'); return true; }
  if (req.url === '/feed/') { res.writeHead(200); res.end('<rss version="2.0"><channel></channel></rss>'); return true; }
  if (req.url === '/wp-sitemap.xml') { res.writeHead(200); res.end('<sitemapindex></sitemapindex>'); return true; }
  if (req.url.startsWith('/sonda-404-')) { res.writeHead(404); res.end('no'); return true; }
  return false;
};

test('sonda-tellado-5-rutes: un cos gegant es talla al pressupost de bytes i es cancel·la (mai es llig sencer)', async () => {
  const MIDA = 3 * 1024 * 1024;
  const srv = await servidor((req, res) => {
    if (respostaNormal(req, res)) return;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(Buffer.alloc(MIDA, 0x61));
  });
  try {
    const res = await executaSondaTellado5Rutes(srv.url, { maxBytes: 64 * 1024 });
    const portada = res.resultats.find((r) => r.ruta === '/');
    assert.ok(portada.bytes <= 64 * 1024, `bytes llegits: ${portada.bytes}`);
    assert.equal(portada.truncat, true);
  } finally {
    await srv.tanca();
  }
});

test('sonda-tellado-5-rutes: seguix salts HTTP amb historial i avalua la resposta final; rebutja esquemes no HTTP i bucles', async () => {
  const srv = await servidor((req, res) => {
    if (respostaNormal(req, res)) return;
    if (req.url === '/') { res.writeHead(301, { Location: '/inici/' }); res.end(); return; }
    if (req.url === '/inici/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<h1>Hola</h1>'); return; }
    res.writeHead(404); res.end();
  });
  try {
    const res = await executaSondaTellado5Rutes(srv.url);
    assert.equal(res.ok, true, JSON.stringify(res.errors));
    const portada = res.resultats.find((r) => r.ruta === '/');
    assert.equal(portada.status, 200);
    assert.deepEqual(portada.salts.map((s) => [s.status, s.location]), [[301, '/inici/']]);
  } finally {
    await srv.tanca();
  }

  const srvMal = await servidor((req, res) => {
    if (respostaNormal(req, res)) return;
    if (req.url === '/') { res.writeHead(302, { Location: 'file:///etc/passwd' }); res.end(); return; }
    res.writeHead(302, { Location: req.url }); res.end();
  });
  try {
    const res = await executaSondaTellado5Rutes(srvMal.url);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('portada') && /esquema/i.test(e)), JSON.stringify(res.errors));
  } finally {
    await srvMal.tanca();
  }

  const srvBucle = await servidor((req, res) => {
    if (req.url === '/robots.txt') { res.writeHead(200); res.end('User-agent: *\n'); return; }
    res.writeHead(302, { Location: req.url }); res.end();
  });
  try {
    const res = await executaSondaTellado5Rutes(srvBucle.url);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => /salts/i.test(e)), JSON.stringify(res.errors));
  } finally {
    await srvBucle.tanca();
  }
});

test('sonda-tellado-5-rutes: Retry-After accepta una data HTTP futura i rebutja valors no vàlids', async () => {
  const dataFutura = new Date(Date.now() + 15 * 60 * 1000).toUTCString();
  for (const [retryAfter, valid] of [[dataFutura, true], ['demà', false], ['30', false], ['-5', false], ['120', true]]) {
    const srv = await servidor((req, res) => {
      if (req.url === '/robots.txt') { res.writeHead(200); res.end('User-agent: *\n'); return; }
      res.writeHead(503, { 'Retry-After': retryAfter, 'Cache-Control': 'no-store' });
      res.end('manteniment');
    });
    try {
      const res = await executaSondaTellado5Rutes(srv.url, { esperaManteniment: true });
      assert.equal(res.ok, valid, `Retry-After «${retryAfter}»: ${JSON.stringify(res.errors)}`);
    } finally {
      await srv.tanca();
    }
  }
});

/* Onada R26 · ronda 2: en manteniment només val no-store (el que envia nocache_headers()); «no-cache» sol no. */
test('sonda-tellado-5-rutes: en manteniment, Cache-Control «no-cache» sense «no-store» no passa; «no-store» sí', async () => {
  const noCache = await creaServidorEfimerTellado({ mantenimentSegons: 900, cacheControl: 'no-cache, must-revalidate, max-age=0' });
  try {
    const res = await executaSondaTellado5Rutes(noCache.url, { esperaManteniment: true });
    assert.equal(res.ok, false, JSON.stringify(res.errors));
    assert.ok(res.errors.some((e) => e.includes('portada (/)') && e.includes('no-store')), JSON.stringify(res.errors));
  } finally {
    await noCache.tanca();
  }
  // Una directiva que només conté el text («x-no-store-ish») tampoc compta.
  const fals = await creaServidorEfimerTellado({ mantenimentSegons: 900, cacheControl: 'no-cache, x-no-store-ish' });
  try {
    assert.equal((await executaSondaTellado5Rutes(fals.url, { esperaManteniment: true })).ok, false);
  } finally {
    await fals.tanca();
  }
  const noStore = await creaServidorEfimerTellado({ mantenimentSegons: 900, cacheControl: 'no-cache, must-revalidate, max-age=0, no-store, private' });
  try {
    const res = await executaSondaTellado5Rutes(noStore.url, { esperaManteniment: true });
    assert.equal(res.ok, true, JSON.stringify(res.errors));
  } finally {
    await noStore.tanca();
  }
});
