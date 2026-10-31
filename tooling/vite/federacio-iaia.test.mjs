/**
 * P1-23 · Proves del connector de federació (tooling/vite/federacio-iaia.mjs):
 * el middleware de desenvolupament (codis, capçaleres i cossos) sobre un
 * servidor HTTP local a 127.0.0.1 en un port efímer, el connector del build
 * (què emet, amb quin origen i quan no n'emet cap) i el registre a
 * vite.config.js. Les dades són les del repositori (preparaFederacio, nomes
 * lectura); SDP_PROJECT_ROOT apunta a un altre arbre si cal. Cap xarxa real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import federacioIaia, {
  GENERADOR, METODES_LECTURA, RUTA_NODEINFO, RUTA_NODEINFO_21, RUTA_WEBFINGER, TIPUS, corsAmbFederacio, esRutaFederada, generadorDe, gestorFederacio
} from './federacio-iaia.mjs';

const ARREL = process.env.SDP_PROJECT_ROOT || path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const { preparaFederacio } = await import(pathToFileURL(path.join(ARREL, GENERADOR)).href);
const TORRE = 'la-torre-de-les-macanes';

/* Un servidor local amb el middleware; next() respon 299 perquè es veja que passa de llarg. */
async function servidor(t, opcions = {}) {
  const gestor = gestorFederacio({ prepara: (origen) => preparaFederacio({ arrel: ARREL, origen }), ...opcions });
  const srv = http.createServer((req, res) => { gestor(req, res, () => { res.statusCode = 299; res.end('next'); }); });
  await new Promise((resol) => srv.listen(0, '127.0.0.1', resol));
  t.after(() => new Promise((resol) => srv.close(resol)));
  const port = srv.address().port;
  return async (cami, { method = 'GET', host = `localhost:${port}`, headers = {} } = {}) => new Promise((resol, rebutja) => {
    const req = http.request({ host: '127.0.0.1', port, path: cami, method, headers: { host, ...headers } }, (res) => {
      const trossos = [];
      res.on('data', (tros) => trossos.push(tros));
      res.on('end', () => resol({ status: res.statusCode, headers: res.headers, text: Buffer.concat(trossos).toString('utf8'), port }));
    });
    req.on('error', rebutja);
    req.end();
  });
}

test('WebFinger: 200 amb JRD i CORS; 400 sense resource o amb dos; 404 per a host aliè i slug desconegut', async (t) => {
  const pide = await servidor(t);
  const { port } = await pide('/no-federat');
  const acct = `acct:${TORRE}@localhost:${port}`;
  const bo = await pide(`${RUTA_WEBFINGER}?resource=${encodeURIComponent(acct)}`);
  assert.equal(bo.status, 200);
  assert.equal(bo.headers['content-type'], TIPUS.jrd);
  assert.equal(bo.headers['access-control-allow-origin'], '*');
  assert.equal(bo.headers['x-content-type-options'], 'nosniff');
  const jrd = JSON.parse(bo.text);
  assert.equal(jrd.subject, acct);
  assert.deepEqual(jrd.links.find((l) => l.rel === 'self'), { rel: 'self', type: 'application/activity+json', href: `http://localhost:${port}/ap/actors/${TORRE}.json` });
  // Mastodon passa resource sense codificar: també val.
  assert.equal((await pide(`${RUTA_WEBFINGER}?resource=${acct}`)).status, 200);
  // Mastodon pregunta amb la caixa que escriu la persona (@La-Torre…) i compara el subject sense caixa.
  assert.equal(JSON.parse((await pide(`${RUTA_WEBFINGER}?resource=acct:${TORRE.toUpperCase()}@LOCALHOST:${port}`)).text).subject, acct);
  for (const [cami, status] of [
    [RUTA_WEBFINGER, 400], [`${RUTA_WEBFINGER}?resource=`, 400], [`${RUTA_WEBFINGER}?resource=${acct}&resource=${acct}`, 400],
    [`${RUTA_WEBFINGER}?resource=${'a'.repeat(600)}`, 400],
    // RFC 7033 §4.2: malformat → 400 (sense esquema, acct: buit, sense host, sense usuari, un «+» que és un espai).
    [`${RUTA_WEBFINGER}?resource=acct:`, 400], [`${RUTA_WEBFINGER}?resource=notauri`, 400], [`${RUTA_WEBFINGER}?resource=acct:${TORRE}`, 400],
    [`${RUTA_WEBFINGER}?resource=acct:@localhost:${port}`, 400], [`${RUTA_WEBFINGER}?resource=acct:la+torre@localhost:${port}`, 400],
    // Ben format però no d'este servidor → 404.
    [`${RUTA_WEBFINGER}?resource=acct:${TORRE}@socdepoble.org`, 404], [`${RUTA_WEBFINGER}?resource=acct:benifallim-no@localhost:${port}`, 404],
    [`${RUTA_WEBFINGER}?resource=mailto:${TORRE}@localhost:${port}`, 404]
  ]) {
    const resposta = await pide(cami);
    assert.equal(resposta.status, status, cami.slice(0, 80));
    assert.equal(resposta.headers['access-control-allow-origin'], '*', `CORS també en l’error: ${cami.slice(0, 60)}`);
    assert.equal(resposta.headers['x-content-type-options'], 'nosniff', cami.slice(0, 60));
    assert.match(resposta.headers['content-type'], /^application\/json/);
  }
  const filtrat = JSON.parse((await pide(`${RUTA_WEBFINGER}?resource=${acct}&rel=self`)).text);
  assert.deepEqual(filtrat.links.map((l) => l.rel), ['self']);
});

test('actor, outbox, followers i objecte: application/activity+json sempre, ids de l’origen de la petició', async (t) => {
  const pide = await servidor(t);
  const { port } = await pide('/no-federat');
  const origen = `http://localhost:${port}`;
  for (const [cami, tipus] of [[`/ap/actors/${TORRE}.json`, 'Organization'], [`/ap/outbox/${TORRE}.json`, 'OrderedCollection'],
    [`/ap/followers/${TORRE}.json`, 'OrderedCollection'], [`/ap/inbox/${TORRE}`, 'OrderedCollection'],
    ['/ap/objectes/socdepoble/pagina-projecte.json', 'Article']]) {
    for (const accept of ['application/activity+json', 'text/html']) {
      const resposta = await pide(cami, { headers: { accept } });
      assert.equal(resposta.status, 200, cami);
      assert.equal(resposta.headers['content-type'], TIPUS.ap, cami);
      assert.equal(resposta.headers['access-control-allow-origin'], '*');
      assert.equal(resposta.headers['x-content-type-options'], 'nosniff', cami);
      const document = JSON.parse(resposta.text);
      assert.equal(document.id, `${origen}${cami}`);
      assert.equal(document.type, tipus);
    }
  }
  const outbox = JSON.parse((await pide(`/ap/outbox/${TORRE}.json`)).text);
  assert.deepEqual([outbox.totalItems, outbox.orderedItems], [0, []]);
  const cap = await pide(`/ap/actors/${TORRE}.json`, { method: 'HEAD' });
  assert.equal(cap.status, 200);
  assert.equal(cap.text, '');
  assert.ok(Number(cap.headers['content-length']) > 0);
});

test('inbox: es llig (col·lecció buida); POST i la resta 405 amb Allow (RFC 9110 §15.5.6); OPTIONS 204; desconeguda 404', async (t) => {
  const pide = await servidor(t);
  const { port } = await pide('/no-federat');
  const inbox = JSON.parse((await pide(`/ap/inbox/${TORRE}`)).text);
  assert.deepEqual(inbox, { '@context': 'https://www.w3.org/ns/activitystreams', id: `http://localhost:${port}/ap/inbox/${TORRE}`, type: 'OrderedCollection', totalItems: 0, orderedItems: [] });
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const resposta = await pide(`/ap/inbox/${TORRE}`, { method });
    assert.equal(resposta.status, 405, method);
    assert.equal(resposta.headers.allow, 'GET, HEAD, OPTIONS', method);
    assert.equal(JSON.parse(resposta.text).error, 'inbox_not_implemented');
  }
  const opcions = await pide(`/ap/inbox/${TORRE}`, { method: 'OPTIONS' });
  assert.equal(opcions.status, 204);
  assert.equal(opcions.headers['access-control-allow-methods'], 'GET, HEAD, OPTIONS');
  for (const method of ['GET', 'POST', 'OPTIONS']) assert.equal((await pide('/ap/inbox/no-existix', { method })).status, 404, method);
  for (const cami of ['/ap', '/ap/', '/ap/actors/no-existix.json', `/ap/actors/${TORRE}`, `/ap/actors/${TORRE.toUpperCase()}.json`,
    '/ap/objectes/socdepoble/pagina-notes.json', '/ap/actors/../outbox/x.json', `/ap/actors/%2e%2e/${TORRE}.json`]) {
    assert.equal((await pide(cami)).status, 404, cami);
  }
  const post = await pide(`/ap/outbox/${TORRE}.json`, { method: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD, OPTIONS');
  const preflight = await pide(`/ap/actors/${TORRE}.json`, { method: 'OPTIONS' });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers['access-control-allow-methods'], 'GET, HEAD, OPTIONS');
});

test('host: http només en loopback (400 des d’un altre host), Host malformat 400, i la resta de rutes passa a next()', async (t) => {
  const pide = await servidor(t);
  assert.equal((await pide(`/ap/actors/${TORRE}.json`, { host: 'socdepoble.org' })).status, 400);
  assert.equal((await pide(`/ap/actors/${TORRE}.json`, { host: 'evil.example\r\nX: y' }).catch(() => ({ status: 400 }))).status, 400);
  assert.equal((await pide(`/ap/actors/${TORRE}.json`, { host: 'a b' })).status, 400);
  for (const cami of ['/', '/pobles/la-torre-de-les-macanes', '/apx/actors/x.json', '/.well-known/other', '/src/data/activitypub.js']) {
    assert.equal((await pide(cami)).status, 299, cami);
  }
  // Amb https (servidor de desenvolupament amb certificat), l'origen és https i qualsevol host és federable.
  const pideHttps = await servidor(t, { https: true });
  const actor = await pideHttps(`/ap/actors/${TORRE}.json`, { host: 'proves.socdepoble.org' });
  assert.equal(JSON.parse(actor.text).id, `https://proves.socdepoble.org/ap/actors/${TORRE}.json`);
});

test('NodeInfo: descobriment i document 2.1 amb la versió del package.json', async (t) => {
  const pide = await servidor(t);
  const { port } = await pide('/no-federat');
  const enllacos = await pide(RUTA_NODEINFO);
  assert.equal(enllacos.status, 200);
  assert.deepEqual(JSON.parse(enllacos.text).links, [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href: `http://localhost:${port}/nodeinfo/2.1.json` }]);
  const info = await pide(RUTA_NODEINFO_21);
  assert.equal(info.headers['content-type'], TIPUS.nodeinfo);
  assert.equal(JSON.parse(info.text).software.version, JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(path.join(ARREL, 'package.json'), 'utf8'))).version);
});

test('una font trencada dona 500 sense filtrar el missatge, i el registre el rep', async (t) => {
  const errors = [];
  const gestor = gestorFederacio({ prepara: async () => { throw new Error('secret intern /Users/x'); }, registre: { error: (m) => errors.push(m) } });
  const srv = http.createServer((req, res) => gestor(req, res, () => res.end()));
  await new Promise((resol) => srv.listen(0, '127.0.0.1', resol));
  t.after(() => new Promise((resol) => srv.close(resol)));
  const text = await new Promise((resol) => http.get({ host: '127.0.0.1', port: srv.address().port, path: `/ap/actors/${TORRE}.json`, headers: { host: 'localhost' } },
    (res) => { let cos = ''; res.on('data', (d) => { cos += d; }); res.on('end', () => resol({ status: res.statusCode, cos })); }));
  assert.equal(text.status, 500);
  assert.equal(text.cos.includes('secret'), false);
  assert.match(errors[0], /secret intern/);
  assert.throws(() => gestorFederacio({}), TypeError);
});

/* El connector del build: emet ap/** amb l'origen canònic, res en SSR, i un origen fals atura el build. */
async function emissions(env, ssr = false) {
  const [, build] = federacioIaia({ arrel: ARREL });
  build.configResolved({ root: ARREL, env, build: { ssr } });
  const emesos = [];
  await build.generateBundle.call({ emitFile: (fitxer) => emesos.push(fitxer) });
  return emesos;
}

test('build: apply, emissió de ap/** amb https://socdepoble.org, VITE_CANONICAL_URL, SSR i origen fals', async () => {
  const [dev, build] = federacioIaia({ arrel: ARREL });
  assert.deepEqual([dev.name, dev.apply, build.name, build.apply], ['sdp:federacio-dev', 'serve', 'sdp:federacio-build', 'build']);
  const totsEmesos = await emissions({});
  // P1-23 (ordre del Mestre del 30-10-2026) · El WebFinger estàtic de Firebase: host-meta (XRD) i el JRD dels actors principals.
  const wellKnown = totsEmesos.filter((f) => f.fileName.startsWith('.well-known/'));
  assert.deepEqual(wellKnown.map((f) => [f.type, f.fileName]), [
    ['asset', '.well-known/host-meta'], ['asset', `.well-known/webfinger/${TORRE}.json`], ['asset', '.well-known/webfinger/socdepoble.json']
  ]);
  assert.match(wellKnown[0].source, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<XRD xmlns="http:\/\/docs\.oasis-open\.org\/ns\/xri\/xrd-1\.0">\n {2}<Link rel="lrdd" type="application\/jrd\+json" template="https:\/\/socdepoble\.org\/\.well-known\/webfinger\/\{uri\}"\/>\n<\/XRD>\n$/);
  for (const fitxer of wellKnown.slice(1)) {
    const slug = fitxer.fileName.slice('.well-known/webfinger/'.length, -'.json'.length);
    assert.equal(JSON.parse(fitxer.source).subject, `acct:${slug}@socdepoble.org`);
    assert.ok(fitxer.source.endsWith('\n'));
  }
  const emesos = totsEmesos.filter((f) => !f.fileName.startsWith('.well-known/'));
  const noms = emesos.map((f) => f.fileName);
  assert.ok(noms.length > 0 && noms.every((nom) => /^ap\/(?:actors|outbox|followers|inbox|objectes)\//.test(nom)), noms.join(', '));
  assert.ok(noms.includes(`ap/actors/${TORRE}.json`) && noms.includes('ap/actors/socdepoble.json') && noms.includes(`ap/outbox/${TORRE}.json`));
  assert.ok(noms.includes(`ap/inbox/${TORRE}`), 'la inbox que l’actor declara, sense extensió');
  assert.deepEqual(noms, [...noms].sort());
  const objectes = emesos.filter((f) => f.fileName.startsWith('ap/objectes/'));
  assert.ok(objectes.length > 0);
  for (const fitxer of emesos) {
    assert.equal(fitxer.type, 'asset');
    const document = JSON.parse(fitxer.source);
    assert.equal(document.id, `https://socdepoble.org/${fitxer.fileName}`);
    assert.ok(fitxer.source.endsWith('\n'));
  }
  // Cada objecte publicat per URL és públic per ell mateix (Mastodon en llig el to/cc quan el resol).
  for (const fitxer of objectes) {
    const objecte = JSON.parse(fitxer.source);
    assert.deepEqual(objecte.to, ['https://www.w3.org/ns/activitystreams#Public'], fitxer.fileName);
    assert.deepEqual(objecte.cc, [`https://socdepoble.org/ap/followers/${fitxer.fileName.split('/')[2]}.json`], fitxer.fileName);
  }
  const canonic = await emissions({ VITE_CANONICAL_URL: 'https://proves.socdepoble.org/' });
  assert.equal(JSON.parse(canonic.find((f) => f.fileName === `ap/actors/${TORRE}.json`).source).id, `https://proves.socdepoble.org/ap/actors/${TORRE}.json`);
  assert.match(canonic.find((f) => f.fileName === '.well-known/host-meta').source, /template="https:\/\/proves\.socdepoble\.org\/\.well-known\/webfinger\/\{uri\}"/);
  assert.deepEqual(await emissions({}, true), []);
  // Un build és per a publicar: ni http, ni camí, ni loopback (que sí que val per al servidor de desenvolupament).
  for (const fals of ['http://socdepoble.org', 'https://socdepoble.org/app', 'http://localhost:3340', 'http://127.0.0.1:3340', 'http://[::1]:3340']) {
    await assert.rejects(emissions({ VITE_CANONICAL_URL: fals }), TypeError, fals);
  }
  // Determinisme: dos builds, els mateixos bytes.
  assert.deepEqual((await emissions({})).map((f) => [f.fileName, f.source]), totsEmesos.map((f) => [f.fileName, f.source]));
});

/* Una petició a un servidor local (Host localhost:<port>). */
function demanaA(port) {
  return (cami, { method = 'GET', headers = {} } = {}) => new Promise((resol, rebutja) => {
    const req = http.request({ host: '127.0.0.1', port, path: cami, method, headers: { host: `localhost:${port}`, ...headers } }, (res) => {
      const trossos = [];
      res.on('data', (tros) => trossos.push(tros));
      res.on('end', () => resol({ status: res.statusCode, headers: res.headers, text: Buffer.concat(trossos).toString('utf8') }));
    });
    req.on('error', rebutja);
    req.end();
  });
}

test('dins d’un servidor de Vite de veres: el CORS de Vite passa de llarg a /ap/ i WebFinger, i la resta el conserva', async (t) => {
  const { createServer } = await import('vite');
  // middlewareMode: els middlewares de Vite que van abans dels connectors (CORS, allowedHosts), sense port propi, HMR ni vigilància.
  const vite = await createServer({
    root: ARREL, configFile: false, logLevel: 'silent', appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }, plugins: [federacioIaia({ arrel: ARREL })]
  });
  t.after(() => vite.close());
  const srv = http.createServer(vite.middlewares);
  await new Promise((resol) => srv.listen(0, '127.0.0.1', resol));
  t.after(() => new Promise((resol) => srv.close(resol)));
  const pide = demanaA(srv.address().port);
  const extern = { origin: 'https://mastodon.social', 'access-control-request-method': 'GET', 'access-control-request-headers': 'accept' };
  for (const cami of [`/ap/actors/${TORRE}.json`, `/ap/inbox/${TORRE}`, `${RUTA_WEBFINGER}?resource=acct:${TORRE}@localhost`]) {
    const preflight = await pide(cami, { method: 'OPTIONS', headers: extern });
    assert.equal(preflight.status, 204, cami);
    assert.equal(preflight.headers['access-control-allow-origin'], '*', cami);
    assert.equal(preflight.headers['access-control-allow-methods'], METODES_LECTURA, cami);
  }
  const post = await pide(`/ap/inbox/${TORRE}`, { method: 'POST', headers: { origin: 'https://mastodon.social' } });
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, METODES_LECTURA);
  const actor = await pide(`/ap/actors/${TORRE}.json`, { headers: { origin: 'https://mastodon.social' } });
  assert.equal(actor.status, 200);
  assert.equal(actor.headers['content-type'], TIPUS.ap);
  assert.equal(actor.headers['access-control-allow-origin'], '*');
  assert.equal(actor.headers['x-content-type-options'], 'nosniff');
  assert.equal(actor.headers.vary, undefined, 'el CORS de Vite no hi ha passat');
  assert.equal((await pide(`${RUTA_WEBFINGER}?resource=acct:`)).status, 400);
  // Fora de la federació, el CORS de Vite de sempre: l'origen local, sí; un d'extern, sense ACAO.
  const local = await pide('/index.html', { method: 'OPTIONS', headers: { ...extern, origin: 'http://localhost:5173' } });
  assert.equal(local.status, 204);
  assert.equal(local.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.match(local.headers['access-control-allow-methods'], /POST/);
  const alie = await pide('/index.html', { method: 'OPTIONS', headers: extern });
  assert.equal(alie.headers['access-control-allow-origin'], undefined);
});

test('corsAmbFederacio: false continua false; a les rutes federades, origin false; a la resta, el CORS anterior', () => {
  assert.equal(corsAmbFederacio(false), false);
  const resultat = (cors, url) => { let opcions = null; cors({ url }, (error, valor) => { assert.equal(error, null); opcions = valor; }); return opcions; };
  const perDefecte = corsAmbFederacio(undefined);
  assert.deepEqual(resultat(perDefecte, `/ap/actors/${TORRE}.json`), { origin: false });
  assert.deepEqual(resultat(perDefecte, '/.well-known/webfinger?resource=x'), { origin: false });
  assert.ok(resultat(perDefecte, '/src/main.jsx').origin instanceof RegExp);
  assert.deepEqual(resultat(corsAmbFederacio(true), '/'), {});
  assert.deepEqual(resultat(corsAmbFederacio({ origin: 'https://x.example' }), '/apx'), { origin: 'https://x.example' });
  assert.deepEqual(resultat(corsAmbFederacio((req, cb) => cb(null, { origin: req.url })), '/a'), { origin: '/a' });
  for (const [url, federada] of [['/ap', true], ['/ap/', true], ['/nodeinfo/2.1.json', true], ['/.well-known/nodeinfo', true],
    ['/apx', false], ['/.well-known/other', false], ['/', false], [undefined, false]]) assert.equal(esRutaFederada(url), federada, String(url));
  // El connector de dev el registra; el de preview, no.
  const [dev] = federacioIaia({ arrel: ARREL });
  assert.equal(typeof dev.config({ server: {} }, { command: 'serve', isPreview: false }).server.cors, 'function');
  assert.equal(dev.config({ server: {} }, { command: 'serve', isPreview: true }), undefined);
});

test('el generador es torna a carregar quan canvia (dev sense reiniciar el procés), i no si no canvia', async (t) => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-generador-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  const fitxer = path.join(arrel, GENERADOR);
  fs.mkdirSync(path.dirname(fitxer), { recursive: true });
  fs.writeFileSync(fitxer, 'export const versio = 1;\n');
  fs.utimesSync(fitxer, new Date(1e12), new Date(1e12));
  const primer = await generadorDe(arrel);
  assert.equal(primer.versio, 1);
  assert.equal(await generadorDe(arrel), primer, 'sense canvis, el mateix mòdul');
  fs.writeFileSync(fitxer, 'export const versio = 2;\n');
  fs.utimesSync(fitxer, new Date(1e12 + 5000), new Date(1e12 + 5000));
  assert.equal((await generadorDe(arrel)).versio, 2);
});

test('vite.config.js registra els dos connectors; cap dels altres configs de Vite els porta', async () => {
  const fs = await import('node:fs');
  const { default: configDeVite } = await import(pathToFileURL(path.join(ARREL, 'vite.config.js')).href);
  // isPreview: sense l'empremta del procés de desenvolupament (com tests/vite-empremta-dev.test.mjs).
  const config = typeof configDeVite === 'function' ? configDeVite({ command: 'serve', mode: 'development', isPreview: true }) : configDeVite;
  const noms = config.plugins.flat(Infinity).map((p) => p?.name);
  assert.ok(noms.includes('sdp:federacio-dev') && noms.includes('sdp:federacio-build'), noms.join(', '));
  for (const altre of ['vite.natiu.config.js', 'vite.standalone.config.js']) {
    assert.equal(fs.readFileSync(path.join(ARREL, altre), 'utf8').includes('federacio-iaia'), false, altre);
  }
});
