/**
 * O3-GEMINI-1 (D04 de 261102_1638) · Proves dels 7 recursos estàtics de
 * federació ActivityPub / NodeInfo i OpenData municipal per a producció:
 *   1. /.well-known/webfinger (JRD dels actors principals)
 *   2. /.well-known/host-meta (XRD LRDD)
 *   3. /.well-known/nodeinfo (descoberta NodeInfo)
 *   4. /nodeinfo/2.1.json (document NodeInfo 2.1)
 *   5. /ap/actors/*.json i /ap/outbox/*.json (ActivityPub)
 *   6. /opendata/municipi.jsonld (Schema.org AdministrativeArea)
 *   7. /opendata/manifest.json (Data Package v2 socdepoble.dadesobertes.v1)
 * Verifica existència, esquema JSON/XRD, paritat amb exportaMunicipiOpenData.js,
 * absència de fallback HTML SPA (`<!doctype html`) i regles d'encaminament i
 * capçaleres a firebase.json, vercel.json, public/_headers i public/_redirects.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARREL = process.env.SDP_PROJECT_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TORRE = 'la-torre-de-les-macanes';
const ORIGEN = 'https://socdepoble.org';

const llig = (rel) => fs.readFileSync(path.join(ARREL, rel), 'utf8');
const sha256 = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');

test('public/opendata/municipi.jsonld i manifest.json: existència, esquema Schema.org/DataPackage, zero HTML i paritat amb exportaMunicipiOpenData', async () => {
  const camiMunicipi = 'public/opendata/municipi.jsonld';
  const camiManifest = 'public/opendata/manifest.json';
  assert.equal(fs.existsSync(path.join(ARREL, camiMunicipi)), true, camiMunicipi);
  assert.equal(fs.existsSync(path.join(ARREL, camiManifest)), true, camiManifest);

  const textMunicipi = llig(camiMunicipi);
  const textManifest = llig(camiManifest);

  for (const [nom, text] of [[camiMunicipi, textMunicipi], [camiManifest, textManifest]]) {
    assert.doesNotMatch(text, /<!doctype\s+html|<html\b/i, `${nom} no pot ser el fallback HTML de l'SPA`);
    assert.equal(text.endsWith('\n'), true, `${nom} acaba en salt de línia`);
  }

  const municipi = JSON.parse(textMunicipi);
  assert.equal(municipi['@context'], 'https://schema.org');
  assert.equal(municipi['@type'], 'AdministrativeArea');
  assert.equal(municipi['@id'], `municipi.jsonld#${TORRE}`);
  assert.equal(municipi.identifier, TORRE);
  assert.equal(municipi.name, 'La Torre de les Maçanes');
  assert.equal(municipi.url, `${ORIGEN}/pobles/${TORRE}`);
  assert.deepEqual(municipi.subjectOf, {
    '@type': 'CreativeWork',
    encodingFormat: 'application/activity+json',
    name: 'Actor ActivityPub de la Torre de les Maçanes a Sóc de Poble (fase 1, només lectura)',
    url: `${ORIGEN}/ap/actors/${TORRE}.json`
  });

  const manifest = JSON.parse(textManifest);
  assert.equal(manifest.$schema, 'https://datapackage.org/profiles/2.0/datapackage.json');
  assert.equal(manifest.name, `dades-obertes-${TORRE}`);
  assert.equal(manifest.socdepoble?.format, 'socdepoble.dadesobertes.v1');
  assert.equal(manifest.socdepoble?.municipi, TORRE);
  assert.equal(manifest.socdepoble?.schemaVersion, '1.2.0');
  assert.ok(Array.isArray(manifest.resources) && manifest.resources.length >= 7);

  const recursMunicipi = manifest.resources.find((r) => r.path === 'municipi.jsonld');
  assert.ok(recursMunicipi, 'manifest.json descriu municipi.jsonld');
  assert.equal(recursMunicipi.name, 'municipi');
  assert.equal(recursMunicipi.mediatype, 'application/ld+json');
  assert.equal(recursMunicipi.format, 'jsonld');
  assert.equal(recursMunicipi.bytes, Buffer.byteLength(textMunicipi, 'utf8'));
  assert.equal(recursMunicipi.hash, `sha256:${sha256(textMunicipi)}`);

  // Paritat amb preparaDadesObertesMunicipi de src/data/exportaMunicipiOpenData.js
  const { preparaDadesObertesMunicipi } = await import(
    pathToFileURL(path.join(ARREL, 'src/data/exportaMunicipiOpenData.js')).href
  );
  const snapshot = JSON.parse(llig('public/opendata/snapshot-public.json'));
  assert.equal(snapshot.format, 'socdepoble.snapshot-public.opendata.v1');
  assert.equal(snapshot.entrada.ara, manifest.created);
  const preparat = preparaDadesObertesMunicipi(snapshot.entrada);
  assert.deepEqual(preparat.comptes, { noticies: 1, agenda: 1, directori: 3, memoria: 1, memoriaOral: 0 });
  for (const [coleccio, nom] of [['noticies', 'noticies.jsonld'], ['agenda', 'agenda.jsonld'], ['memoria', 'memoria-cultural.jsonld']]) {
    assert.ok(JSON.parse(llig(`public/opendata/${nom}`))['@graph'].length > 0, `${coleccio}: dades reals no buides`);
    assert.ok(snapshot.provinencia.some(f => f.coleccio === coleccio && f.url.startsWith('https://')), `${coleccio}: font pública`);
  }
  assert.equal(snapshot.entrada.memoriaOral.length, 0, 'cap revisió oral humana inventada');
  const municipiGenerat = preparat.fitxers.find((f) => f.nom === 'municipi.jsonld');
  assert.equal(textMunicipi, municipiGenerat.text);

  /* Àrbitre Claude (O3-CLAUDE-2, 261102) · Un Data Package només és vàlid si cada
     `path` del manifest es resol: cada recurs (llicencies.md inclosa, que és la
     llicència del conjunt) és a public/opendata/ amb els bytes i el hash declarats,
     i és el mateix text que genera exportaMunicipiOpenData. Si l'outbox o el
     generador canvien, esta prova cau fins que es regenere el paquet estàtic. */
  for (const recurs of manifest.resources) {
    const cami = `public/opendata/${recurs.path}`;
    assert.ok(fs.existsSync(path.join(ARREL, cami)), `${cami} existix (el manifest el cita)`);
    const text = llig(cami);
    assert.equal(recurs.bytes, Buffer.byteLength(text, 'utf8'), `${recurs.path}: bytes`);
    assert.equal(recurs.hash, `sha256:${sha256(text)}`, `${recurs.path}: hash`);
    assert.equal(text, preparat.fitxers.find((f) => f.nom === recurs.path)?.text, `${recurs.path}: paritat amb el generador`);
  }
  for (const llicencia of manifest.licenses) {
    assert.ok(manifest.resources.some((r) => r.path === llicencia.path), `${llicencia.path}: la llicència és un recurs servit`);
  }
});

test('els 7 recursos estàtics de federació i dades obertes existeixen, compleixen esquema i mai contenen HTML', async () => {
  const { default: federacioIaia } = await import(
    pathToFileURL(path.join(ARREL, 'tooling/vite/federacio-iaia.mjs')).href
  );
  const [, buildPlugin] = federacioIaia({ arrel: ARREL });
  buildPlugin.configResolved({ root: ARREL, env: {}, build: { ssr: false } });
  const emesos = new Map();
  await buildPlugin.generateBundle.call({
    emitFile: (fitxer) => emesos.set(fitxer.fileName, String(fitxer.source))
  });

  const recursos = [
    { id: 'webfinger', cami: `.well-known/webfinger/${TORRE}.json`, font: emesos.get(`.well-known/webfinger/${TORRE}.json`), tipus: 'json' },
    { id: 'host-meta', cami: '.well-known/host-meta', font: emesos.get('.well-known/host-meta'), tipus: 'xrd' },
    { id: 'nodeinfo-discovery', cami: '.well-known/nodeinfo', font: emesos.get('.well-known/nodeinfo'), tipus: 'json' },
    { id: 'nodeinfo-21', cami: 'nodeinfo/2.1.json', font: emesos.get('nodeinfo/2.1.json'), tipus: 'json' },
    { id: 'activitypub-actor', cami: `ap/actors/${TORRE}.json`, font: emesos.get(`ap/actors/${TORRE}.json`), tipus: 'json' },
    { id: 'opendata-municipi', cami: 'public/opendata/municipi.jsonld', font: llig('public/opendata/municipi.jsonld'), tipus: 'json' },
    { id: 'opendata-manifest', cami: 'public/opendata/manifest.json', font: llig('public/opendata/manifest.json'), tipus: 'json' }
  ];

  assert.equal(recursos.length, 7);
  for (const r of recursos) {
    assert.equal(typeof r.font, 'string', `recurs present: ${r.id} (${r.cami})`);
    assert.ok(r.font.trim().length > 0, `recurs no buit: ${r.id}`);
    assert.doesNotMatch(r.font, /<!doctype\s+html|<html\b/i, `${r.id} no conté cap HTML d'SPA`);
    if (r.tipus === 'json') {
      const doc = JSON.parse(r.font);
      assert.equal(typeof doc, 'object');
      assert.notEqual(doc, null);
    } else {
      assert.match(r.font, /<XRD\s+xmlns="http:\/\/docs\.oasis-open\.org\/ns\/xri\/xrd-1\.0">/);
    }
  }

  assert.equal(JSON.parse(recursos[0].font).subject, `acct:${TORRE}@socdepoble.org`);
  assert.equal(
    JSON.parse(recursos[2].font).links?.[0]?.href,
    `${ORIGEN}/nodeinfo/2.1.json`
  );
  assert.equal(JSON.parse(recursos[3].font).version, '2.1');
  assert.deepEqual(JSON.parse(recursos[3].font).protocols, ['activitypub']);
  assert.equal(JSON.parse(recursos[4].font).type, 'Organization');
  assert.equal(JSON.parse(recursos[5].font)['@type'], 'AdministrativeArea');
  assert.equal(JSON.parse(recursos[6].font).socdepoble?.format, 'socdepoble.dadesobertes.v1');
});

test('encaminament i capçaleres estàtiques (firebase.json, vercel.json, public/_headers, public/_redirects): /opendata/*, /.well-known/*, /ap/* i /nodeinfo/* no cauen a /index.html', () => {
  const firebase = JSON.parse(llig('firebase.json'));
  const spaRewrite = firebase.hosting.rewrites.at(-1);
  assert.equal(spaRewrite.destination, '/index.html');
  for (const exclosa of ['assets', 'fonts', 'ap', 'opendata', 'nodeinfo', '.well-known']) {
    assert.ok(
      spaRewrite.source.includes(exclosa),
      `firebase.json exclou ${exclosa} del rewrite SPA: ${spaRewrite.source}`
    );
  }

  const capcaleraFirebase = (source) => firebase.hosting.headers.find((h) => h.source === source)?.headers ?? [];
  const valorCapcalera = (llista, clau) => llista.find((h) => h.key.toLowerCase() === clau.toLowerCase())?.value;

  assert.equal(valorCapcalera(capcaleraFirebase('/opendata/*.jsonld'), 'Content-Type'), 'application/ld+json; charset=utf-8');
  assert.equal(valorCapcalera(capcaleraFirebase('/opendata/*.jsonld'), 'Access-Control-Allow-Origin'), '*');
  assert.equal(valorCapcalera(capcaleraFirebase('/opendata/*.json'), 'Content-Type'), 'application/json; charset=utf-8');
  assert.equal(valorCapcalera(capcaleraFirebase('/opendata/*.json'), 'Access-Control-Allow-Origin'), '*');
  assert.equal(valorCapcalera(capcaleraFirebase('/ap/**'), 'Content-Type'), 'application/activity+json; charset=utf-8');
  assert.equal(valorCapcalera(capcaleraFirebase('/.well-known/nodeinfo'), 'Content-Type'), 'application/json; charset=utf-8');
  assert.match(valorCapcalera(capcaleraFirebase('/nodeinfo/2.1.json'), 'Content-Type') ?? '', /^application\/json;\s*profile=/);

  const vercel = JSON.parse(llig('vercel.json'));
  const vercelRewrite = new RegExp(`^${vercel.rewrites[0].source}$`);
  for (const rutaEstatica of [
    '/opendata/municipi.jsonld',
    '/opendata/manifest.json',
    '/.well-known/webfinger/socdepoble.json',
    '/.well-known/host-meta',
    '/.well-known/nodeinfo',
    '/nodeinfo/2.1.json',
    `/ap/actors/${TORRE}.json`
  ]) {
    assert.equal(
      vercelRewrite.test(rutaEstatica),
      false,
      `vercel.json no reescriu ${rutaEstatica} cap a /index.html`
    );
  }
  assert.equal(vercelRewrite.test('/pobles/la-torre-de-les-macanes'), true, 'una ruta SPA normal sí que va a /index.html');

  const headersFile = llig('public/_headers');
  for (const esperat of [
    '/.well-known/host-meta',
    '/.well-known/webfinger/*',
    '/.well-known/nodeinfo',
    '/nodeinfo/2.1.json',
    '/ap/*',
    '/opendata/*.jsonld',
    '/opendata/*.json',
    'application/ld+json; charset=utf-8',
    'application/activity+json; charset=utf-8',
    'application/jrd+json; charset=utf-8'
  ]) {
    assert.ok(headersFile.includes(esperat), `public/_headers conté ${esperat}`);
  }

  const redirectsFile = llig('public/_redirects');
  for (const regla of ['/.well-known/*', '/nodeinfo/*', '/ap/*', '/opendata/*']) {
    assert.ok(redirectsFile.includes(regla), `public/_redirects protegeix ${regla}`);
  }
  assert.doesNotMatch(redirectsFile, /\/index\.html\s+200/, 'public/_redirects no força cap fallback indiscriminat abans de les rutes estàtiques');
});

/* O6 · G-D-01. Model HTTP local dels tres contractes estàtics: usa les
   capçaleres dels fitxers reals i els bytes de public/, sense cap proveïdor
   remot. L'ordre de les regles és explícit: la darrera clau que casa mana. */
function capcaleresOpendata(font, pathname) {
  const glob = (patro) => new RegExp('^' + patro.split('*').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
  let regles;
  if (font === 'firebase.json') {
    regles = JSON.parse(llig(font)).hosting.headers.filter(r => r.source?.startsWith('/opendata/'));
    return Object.fromEntries(regles.filter(r => glob(r.source).test(pathname)).flatMap(r => r.headers.map(h => [h.key.toLowerCase(), h.value])));
  }
  if (font === 'vercel.json') {
    regles = JSON.parse(llig(font)).headers.filter(r => r.source?.startsWith('/opendata/'));
    return Object.fromEntries(regles.filter(r => new RegExp('^' + r.source + '$').test(pathname)).flatMap(r => r.headers.map(h => [h.key.toLowerCase(), h.value])));
  }
  regles = [];
  for (const linia of llig(font).split('\n')) {
    if (linia.startsWith('/')) regles.push({ source: linia, headers: [] });
    else if (/^\s+\S/.test(linia) && regles.length) {
      const m = linia.trim().match(/^([^:]+):\s*(.*)$/);
      if (m) regles.at(-1).headers.push([m[1].toLowerCase(), m[2]]);
    }
  }
  return Object.fromEntries(regles.filter(r => r.source.startsWith('/opendata/') && glob(r.source).test(pathname)).flatMap(r => r.headers));
}

for (const font of ['firebase.json', 'vercel.json', 'public/_headers']) {
  test(`G-D-01 · ${font}: HTTP GET/HEAD servix el mediatype declarat, amb precedència sobre *.json`, async (t) => {
    const { createServer } = await import('node:http');
    const servidor = createServer((req, res) => {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const nom = pathname.split('/').pop();
      if (!['activitystreams.json', 'manifest.json', 'municipi.jsonld'].includes(nom)) { res.writeHead(404); res.end(); return; }
      const bytes = fs.readFileSync(path.join(ARREL, 'public', 'opendata', nom));
      for (const [key, value] of Object.entries(capcaleresOpendata(font, pathname))) res.setHeader(key, value);
      res.setHeader('Content-Length', bytes.length);
      res.end(req.method === 'HEAD' ? undefined : bytes);
    });
    await new Promise((resolve, reject) => { servidor.once('error', reject); servidor.listen(0, '127.0.0.1', resolve); });
    t.after(() => new Promise(resolve => servidor.close(resolve)));
    const origen = `http://127.0.0.1:${servidor.address().port}`;
    for (const [nom, tipus] of [
      ['activitystreams.json', 'application/activity+json'],
      ['manifest.json', 'application/json'],
      ['municipi.jsonld', 'application/ld+json']
    ]) {
      const uri = `${origen}/opendata/${nom}?prova=1`;
      for (const method of ['GET', 'HEAD']) {
        const r = await fetch(uri, { method });
        assert.equal(r.status, 200);
        assert.equal(r.headers.get('content-type'), `${tipus}; charset=utf-8`);
        assert.equal(r.headers.get('access-control-allow-origin'), '*');
        const body = await r.text();
        assert.equal(body, method === 'HEAD' ? '' : llig(`public/opendata/${nom}`));
        if (method === 'GET') assert.doesNotThrow(() => JSON.parse(body));
      }
    }
  });
}
