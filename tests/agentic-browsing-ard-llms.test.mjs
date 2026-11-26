import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROPIS_DEL_LLOC } from '../vite.standalone.config.js';
import { creaInventariEstatic } from '../tooling/instalador/inventari-estatic.mjs';
import { construeixActor, CONTEXT_AS, TIPUS_AP } from '../src/data/activitypub.js';
import { TIPUS, RUTA_NODEINFO, RUTA_NODEINFO_21, RUTA_WEBFINGER, esRutaFederada } from '../tooling/vite/federacio-iaia.mjs';
import { extrauRutes, rutaQueServix } from '../tooling/seo/rutes-del-router.mjs';
import { publicSeoRoute } from '../tooling/wiki/lib/publication-policy.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const URN_AIR_RE = /^urn:air:([a-zA-Z0-9.-]+)(?::([a-zA-Z0-9._:-]+))?:([a-zA-Z0-9._-]+)$/;

/* R32 (proves febles, P2) · Què és una ruta pública de socdepoble.org, derivat
   del codi i mai d'una llista escrita ací (seria un oracle que es dona la raó):
   · Router: les rutes que llig tooling/seo/rutes-del-router.mjs d'App.jsx i
     RutaApps.jsx, sense RequireAuth, que no són la 404 i el primer segment de
     les quals no és sense indexar ni al client (useSEO.js · PRIVATE) ni al
     servidor (publication-policy.mjs · PRIVATE_ROUTES).
   · Estàtics: un fitxer regular de public/ (sense enllaços simbòlics ni
     configuració d'amfitrió «_headers»/«_redirects»); de les carpetes ocultes,
     només .well-known (RFC 8615).
   · Federació: les rutes que respon tooling/vite/federacio-iaia.mjs. */
const ORIGEN_PUBLIC = 'https://socdepoble.org';
const PUBLIC_DIR = path.join(ARREL, 'public');
const segmentDe = (cami) => cami.split('/')[1] ?? '';

let contextPublic = null;
function rutesPubliques() {
  contextPublic ??= (async () => {
    const router = await extrauRutes({ root: ARREL });
    assert.deepEqual(router.infraccions, [], 'El lector del Router ha de llegir App.jsx sense infraccions');
    const privades = new Set(router.privades);
    const seccionsDeDetall = new Set(router.seccionsDeDetall);
    const publica = (r) => Boolean(r) && !r.guarda && r.component !== 'NotFoundPage'
      && !privades.has(segmentDe(r.patro)) && publicSeoRoute(r.patro);

    const segmentsRouter = new Set();
    for (const r of router.rutes) {
      const segment = segmentDe(r.patro);
      if (segment && !segment.startsWith(':') && !segment.includes('*') && publica(r)) segmentsRouter.add(segment);
    }
    const segmentsEstatics = new Set(fs.readdirSync(PUBLIC_DIR)
      .filter((nom) => !nom.startsWith('_') && (!nom.startsWith('.') || nom === '.well-known')));
    const actor = construeixActor({ slug: 'socdepoble', nom: 'Sóc de Poble', perfil: '/projecte' }, { origen: ORIGEN_PUBLIC });
    const segmentsFederats = new Set([RUTA_WEBFINGER, RUTA_NODEINFO, RUTA_NODEINFO_21, new URL(actor.id).pathname].map(segmentDe));

    // El camí el servix una ruta pública; una redirecció ha d'acabar també en una ruta pública.
    const servitPelRouter = (cami, salts = 0) => {
      const r = rutaQueServix(router.rutes, cami);
      if (!publica(r)) return false;
      if (r.component === 'ItemDetailSection' && !seccionsDeDetall.has(segmentDe(cami))) return false;
      const desti = r.redireccio?.desti;
      if (typeof desti === 'string') return salts < 4 && segmentsRouter.has(segmentDe(desti)) && servitPelRouter(desti, salts + 1);
      return true;
    };
    const fitxerPublic = (cami) => {
      const rel = path.relative(PUBLIC_DIR, path.resolve(PUBLIC_DIR, `.${cami}`));
      if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return false;
      let actual = PUBLIC_DIR;
      for (const part of rel.split(path.sep)) {
        if (part.startsWith('_')) return false;
        actual = path.join(actual, part);
        try { if (fs.lstatSync(actual).isSymbolicLink()) return false; } catch { return false; }
      }
      return fs.statSync(actual).isFile();
    };
    return {
      segments: new Set([...segmentsRouter, ...segmentsEstatics, ...segmentsFederats]),
      segmentsRouter, segmentsEstatics, segmentsFederats, servitPelRouter, fitxerPublic
    };
  })();
  return contextPublic;
}

/** null si `href` és una URL pública de socdepoble.org; si no, el motiu. */
function motiuDeRebuig(href, ctx) {
  let u;
  try { u = new URL(href); } catch { return 'no és una URL absoluta'; }
  if (u.origin !== ORIGEN_PUBLIC) return `l'origen ${u.origin} no és ${ORIGEN_PUBLIC}`;
  if (u.username || u.password) return 'porta credencials';
  const cami = u.pathname.replace(/\/+$/, '') || '/';
  if (cami === '/') return null;
  const segment = segmentDe(cami);
  if (!ctx.segments.has(segment)) return `el primer segment «${segment}» no és cap ruta pública del Router, de public/ ni de la federació`;
  if (ctx.segmentsEstatics.has(segment) && ctx.fitxerPublic(cami)) return null;
  if (ctx.segmentsFederats.has(segment) && esRutaFederada(u.href)) return null;
  if (ctx.segmentsRouter.has(segment) && ctx.servitPelRouter(cami)) return null;
  return `${cami} no el servix cap ruta pública, cap fitxer de public/ ni la federació`;
}

/** Totes les URL amb esquema (Markdown, nues o <autoenllaç>) i tots els destins d'enllaç Markdown. */
function urlsDelText(txt) {
  const nues = [...txt.matchAll(/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>()[\]"'`]+/gi)].map(([u]) => u.replace(/[.,;:!?]+$/, ''));
  const markdown = [...txt.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)].map(([, desti]) => desti);
  return { totes: [...new Set([...nues, ...markdown])], markdown };
}

/** El text no pot anunciar cap endpoint alié o intern, ni cap adreça de correu. */
function comprovaTextSenseEndpointsInterns(txt, nom) {
  assert.doesNotMatch(txt, /supabase\.(?:co|in)\b/i, `${nom} no pot anunciar cap endpoint de Supabase`);
  assert.doesNotMatch(txt, /\blocalhost\b|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i, `${nom} no pot anunciar cap adreça local`);
  assert.doesNotMatch(txt, /__iaia/i, `${nom} no pot anunciar el middleware intern /__iaia`);
  assert.doesNotMatch(txt, /service_role|sb_secret_|apikey=/i, `${nom} no pot portar cap rastre de clau de servidor`);
  assert.doesNotMatch(txt, /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/i, `${nom} no pot publicar cap adreça de correu`);
  // L'amfitrió del Node 0 ix del codi que hi parla, no d'un literal d'esta prova.
  const font = fs.readFileSync(path.join(ARREL, 'src/data/node0/adaptadorNodeZeroHttp.js'), 'utf8');
  const urlNode0 = /URL_NODE_ZERO\s*=\s*'([^']+)'/.exec(font)?.[1];
  assert.ok(urlNode0, 'Cal llegir URL_NODE_ZERO a src/data/node0/adaptadorNodeZeroHttp.js');
  assert.equal(txt.toLowerCase().includes(new URL(urlNode0).hostname), false, `${nom} no pot anunciar el Node 0 (${new URL(urlNode0).hostname})`);
}

test('la llista blanca de rutes públiques ix del Router, de public/ i de la federació, i deixa fora les internes', async () => {
  const ctx = await rutesPubliques();
  // Ancoratge contra una derivació buida o massa ampla: unes quantes rutes de cada font i les internes de sempre.
  for (const segment of ['projecte', 'mur', 'legal', 'versions', 'fediversity']) assert.equal(ctx.segmentsRouter.has(segment), true, `El Router publica /${segment}`);
  for (const segment of ['opendata', '.well-known', 'llms.txt']) assert.equal(ctx.segmentsEstatics.has(segment), true, `public/ publica /${segment}`);
  for (const segment of ['ap', 'nodeinfo', '.well-known']) assert.equal(ctx.segmentsFederats.has(segment), true, `La federació publica /${segment}`);
  for (const segment of ['admin', 'el-meu-perfil', 'notes', 'xat', 'control', 'login', '__iaia', '_headers', '_redirects']) {
    assert.equal(ctx.segments.has(segment), false, `/${segment} no és una ruta pública`);
  }
  assert.notEqual(motiuDeRebuig(`${ORIGEN_PUBLIC}/panell`, ctx), null, '/panell redirigix a /control, que no és pública');
  assert.notEqual(motiuDeRebuig(`${ORIGEN_PUBLIC}/opendata/no-existix.json`, ctx), null, 'Un recurs estàtic ha d’existir a public/');
  assert.equal(motiuDeRebuig(`${ORIGEN_PUBLIC}/fediversity`, ctx), null, '/fediversity redirigix a /page/fediversity, que és pública');
});

test('public/llms.txt compleix l’estàndard Agentic Browsing i només enllaça rutes públiques reals', async () => {
  const llmsPath = path.join(ARREL, 'public/llms.txt');
  assert.equal(fs.existsSync(llmsPath), true, 'Falta public/llms.txt');
  const txt = fs.readFileSync(llmsPath, 'utf8');
  assert.ok(txt.length >= 200, 'llms.txt ha de tindre contingut substantiu');
  assert.match(txt, /^#\s+Sóc de Poble/m, 'llms.txt ha d’encapçalar amb H1 # Sóc de Poble');

  const links = [...txt.matchAll(/\[([^\]]*)\]\(/g)];
  assert.ok(links.length >= 10, 'llms.txt ha d’oferir enllaços Markdown verificables');
  for (const [, label] of links) assert.ok(label.trim().length > 0, 'Cap enllaç Markdown sense etiqueta');

  const ctx = await rutesPubliques();
  const { totes, markdown } = urlsDelText(txt);
  assert.equal(markdown.length, links.length, 'Cada enllaç Markdown ha de tindre un destí llegible');
  const rebutjos = totes.map((href) => [href, motiuDeRebuig(href, ctx)]).filter(([, motiu]) => motiu !== null);
  assert.deepEqual(rebutjos, [], 'llms.txt només pot enllaçar rutes públiques de https://socdepoble.org');
  comprovaTextSenseEndpointsInterns(txt, 'llms.txt');

  // Zero lèxic prohibit (Llei 0)
  assert.doesNotMatch(txt, /IAIA\s+sobirana|WhatsApp\s+sobirà|Node\s*0\s+sobirà|Nodrir\s+la\s+IAIA|Apple\s+Silicon/i);
});

test('public/.well-known/ard.json descriu cada recurs amb el seu format real i conserva l’estructura ARD', async () => {
  const ardPath = path.join(ARREL, 'public/.well-known/ard.json');
  assert.equal(fs.existsSync(ardPath), true, 'Falta public/.well-known/ard.json');
  const ardText = fs.readFileSync(ardPath, 'utf8');
  const ard = JSON.parse(ardText);
  // La mateixa llista blanca per a tota URL del catàleg, també dins de description o displayName.
  const ctx = await rutesPubliques();
  const rebutjos = urlsDelText(ardText).totes.map((href) => [href, motiuDeRebuig(href, ctx)]).filter(([, motiu]) => motiu !== null);
  assert.deepEqual(rebutjos, [], 'ard.json només pot anunciar rutes públiques de https://socdepoble.org');
  comprovaTextSenseEndpointsInterns(ardText, 'ard.json');

  /* R32.3 · A més d'entries, l'arrel porta el manifest de versió que llig l'App nativa
     (src/natiu/actualitzacioAppNativa.js): version, androidBuild i iosBuild. L'ARD ignora els
     membres d'arrel que no són entries (validador de Lighthouse: «Top-level members ignored by
     ARD (transport-defined)», sense avís); collections continua prohibit (sí que en dona avís). */
  /* v1.2.7 · P0-123 · I, opcionals, els canals de proves que escriu publica-tot.mjs --sincronitza-proves
     (testflightIosBuild, apkDirectBuild i apkSha256) i latestBuild. */
  const OPCIONALS = ['apkDirectBuild', 'apkSha256', 'latestBuild', 'testflightIosBuild'];
  assert.deepEqual(Object.keys(ard).filter((clau) => !OPCIONALS.includes(clau)).sort(), ['androidBuild', 'entries', 'iosBuild', 'version'],
    'L’arrel ARD sols exposa entries i el manifest de versió de l’App (sense collections ni més camps)');
  assert.ok(Array.isArray(ard.entries) && ard.entries.length >= 2);

  const ids = new Set();
  const formatsPublicats = new Map([
    ['/llms.txt', 'text/markdown'],
    ['/opendata/manifest.json', 'application/json'],
    ['/ap/actors/socdepoble.json', TIPUS_AP],
  ]);
  const urls = new Set();
  for (const entry of ard.entries) {
    assert.match(entry.identifier, URN_AIR_RE, `URN invàlid: ${entry.identifier}`);
    assert.equal(ids.has(entry.identifier), false, `URN duplicat: ${entry.identifier}`);
    ids.add(entry.identifier);

    assert.equal(typeof entry.displayName, 'string');
    assert.ok(entry.displayName.trim().length >= 5);
    assert.equal(typeof entry.description, 'string');
    assert.ok(entry.description.trim().length >= 15);
    const url = new URL(entry.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.origin, 'https://socdepoble.org');
    assert.equal(urls.has(url.pathname), false, 'Recurs anunciat duplicat');
    urls.add(url.pathname);
    assert.equal(entry.type, formatsPublicats.get(url.pathname), `El tipus ha de descriure el recurs real: ${entry.url}`);
    assert.equal(Object.hasOwn(entry, 'data'), false, 'url i data són mútuament excloents');
    assert.equal(Object.hasOwn(entry, 'trustManifest'), false);
    assert.equal(Object.hasOwn(entry, 'TrustManifest'), false);

    assert.ok(Array.isArray(entry.representativeQueries), 'Cal representativeQueries');
    assert.ok(
      entry.representativeQueries.length >= 2 && entry.representativeQueries.length <= 5,
      'representativeQueries ha de tindre entre 2 i 5 consultes per obtindre 1.0 sense warning',
    );
    for (const q of entry.representativeQueries) {
      assert.equal(typeof q, 'string');
      assert.ok(q.trim().length >= 8);
    }
  }
  assert.deepEqual(urls, new Set(formatsPublicats.keys()));
  const paquet = JSON.parse(fs.readFileSync(path.join(ARREL, 'public/opendata/manifest.json'), 'utf8'));
  assert.match(paquet.$schema, /datapackage/);
  assert.ok(Array.isArray(paquet.resources));
  assert.equal(Object.hasOwn(paquet, 'entries'), false, 'El Data Package no és un catàleg ARD de recursos agents');
  const actor = construeixActor({ slug: 'socdepoble', nom: 'Sóc de Poble', perfil: '/projecte' }, { origen: 'https://socdepoble.org' });
  assert.equal(actor['@context'], CONTEXT_AS);
  assert.equal(actor.type, 'Organization');
  assert.equal(actor.id, 'https://socdepoble.org/ap/actors/socdepoble.json');
  assert.equal(TIPUS.ap.split(';')[0], TIPUS_AP);
  // La guia Markdown pública no declara el contracte d'una Skill executable.
  assert.match(fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8'), /^# Sóc de Poble\n/);
});

/* R32.3 (ordre del Mestre, 16-11-2026 22:09) · El manifest de versió de l'App. version és la de
   package.json, com cada entrada; androidBuild i iosBuild són el darrer build JA DISPONIBLE al canal
   que obri la barra (mai el compilat ni un de més alt que VERSIO_CLIENT_NATIU: la barra prometria una
   versió que la botiga no dona). L'App el llig en arrencar i en tornar a primer pla, entre orígens:
   firebase.json li posa Access-Control-Allow-Origin, sense Content-Type propi. */
test('R32.3 · ard.json porta el manifest de versió de l’App, coherent amb package.json i VERSIO_CLIENT_NATIU', async () => {
  const ard = JSON.parse(fs.readFileSync(path.join(ARREL, 'public/.well-known/ard.json'), 'utf8'));
  const paquet = JSON.parse(fs.readFileSync(path.join(ARREL, 'package.json'), 'utf8'));
  const { VERSIO_CLIENT_NATIU } = await import('../src/data/contracte.js');
  assert.equal(ard.version, paquet.version, 'version és la de package.json');
  assert.ok(ard.entries.every((entry) => entry.version === ard.version), 'Cada entrada declara la mateixa versió');
  for (const camp of ['androidBuild', 'iosBuild']) {
    assert.ok(Number.isSafeInteger(ard[camp]) && ard[camp] >= 1, `${camp} és un enter positiu`);
    assert.ok(ard[camp] <= VERSIO_CLIENT_NATIU, `${camp} (${ard[camp]}) no supera VERSIO_CLIENT_NATIU (${VERSIO_CLIENT_NATIU})`);
  }
  /* v1.2.7 · P0-123 · Els canals de proves, si hi són: enters positius sense passar de VERSIO_CLIENT_NATIU,
     l'APK sempre amb la seua SHA-256, i latestBuild el més alt de tots (mai un número solt). */
  for (const camp of ['testflightIosBuild', 'apkDirectBuild']) {
    if (!Object.hasOwn(ard, camp)) continue;
    assert.ok(Number.isSafeInteger(ard[camp]) && ard[camp] >= 1 && ard[camp] <= VERSIO_CLIENT_NATIU, `${camp} (${ard[camp]}) és un build vàlid`);
  }
  assert.equal(Object.hasOwn(ard, 'apkDirectBuild'), Object.hasOwn(ard, 'apkSha256'), 'apkDirectBuild i apkSha256 van junts');
  if (Object.hasOwn(ard, 'apkSha256')) assert.match(ard.apkSha256, /^[0-9a-f]{64}$/);
  if (Object.hasOwn(ard, 'latestBuild')) {
    const builds = ['androidBuild', 'iosBuild', 'testflightIosBuild', 'apkDirectBuild'].filter((camp) => Object.hasOwn(ard, camp)).map((camp) => ard[camp]);
    assert.equal(ard.latestBuild, Math.max(...builds), 'latestBuild és el més alt dels builds');
  }
});

/* R32.3 (Elefant) · «Llegible des de Capacitor» són dues portes i les dues han de ser obertes: la
   capçalera CORS del hosting i la CSP de la closca nativa. La segona es prova contra la CSP REAL
   (cspNativa de vite.natiu.config.js, la que escriu la meta de dist-natiu/index.html) i la porta REAL
   del detector (connexioPermesaPerCsp): amb una CSP que no deixa connectar amb socdepoble.org, el
   detector queda inert en silenci (cap fetch, cap avís) i les proves del detector, amb una CSP
   sintètica, no ho veurien. */
test('R32.3 · /.well-known/ard.json és llegible des de Capacitor: CORS del hosting, la CSP REAL de la closca i cap reescriptura de l’SPA', async () => {
  const { hosting } = JSON.parse(fs.readFileSync(path.join(ARREL, 'firebase.json'), 'utf8'));
  const regles = hosting.headers.filter((r) => r.source === '/.well-known/ard.json');
  assert.deepEqual(regles, [{ source: '/.well-known/ard.json', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] }]);

  const { cspNativa } = await import('../vite.natiu.config.js');
  const { connexioPermesaPerCsp, URL_MANIFEST_VERSIO } = await import('../src/natiu/actualitzacioAppNativa.js');
  assert.equal(URL_MANIFEST_VERSIO, `${ORIGEN_PUBLIC}/.well-known/ard.json`);
  for (const backend of ['https://abcdefghijklmnopqrst.supabase.co', 'https://node.example.org:8443']) {
    const csp = cspNativa(backend);
    const closca = { querySelectorAll: () => [{ getAttribute: (nom) => ({ 'http-equiv': 'Content-Security-Policy', content: csp }[nom] ?? null) }] };
    assert.equal(connexioPermesaPerCsp(URL_MANIFEST_VERSIO, closca), true,
      `la CSP nativa ha de deixar connectar amb ${ORIGEN_PUBLIC} (connect-src: ${csp.split(';').find((d) => d.trim().startsWith('connect-src'))?.trim()})`);
  }

  /* Firebase servix abans el fitxer estàtic que cap reescriptura, però la de l'SPA (la darrera) també
     l'ha d'excloure de manera explícita: una font negada «!/@(…)/**» amb .well-known com a alternativa
     sencera. Una font que el cobrix («/.well-known/**») o que només l'anomena no val. */
  const espa = hosting.rewrites.at(-1);
  assert.equal(espa.destination, '/index.html');
  const negada = /^!\/@\(([^()]+)\)\/\*\*$/.exec(String(espa.source ?? ''));
  assert.ok(negada, `la reescriptura de l'SPA ha de ser una font negada «!/@(…)/**» (és ${JSON.stringify(espa.source)})`);
  assert.ok(negada[1].split('|').includes('.well-known'), 'la negació inclou .well-known com a alternativa sencera');
});

test('Llei 0 · llms.txt i ARD no presenten com a viva cap candidatura NLnet ni cap fons on Sóc de Poble no ha concorregut', async () => {
  // R32 · Sóc de Poble no ha concorregut mai a NGI0 Commons Fund (la pàgina /fediversity
  // l'anomena «fons germà»), i la sol·licitud 2026-08-1a6 a NGI Fediversity no va passar
  // la primera selecció (31-10-2026; resposta definitiva de NLnet el 9-11-2026).
  const txt = fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8');
  assert.doesNotMatch(txt, /Commons\s+Fund/i, 'llms.txt no pot atribuir-se una candidatura a NGI0 Commons Fund');
  for (const linia of txt.split('\n').filter((l) => /candidatura|NLnet|\bNGI/i.test(l))) {
    assert.match(linia, /no va passar la primera selecció/, `Una línia que esmenta la candidatura ha de dir-ne la resolució: ${linia}`);
  }
  const { PAGE_COPY } = await import('../src/sections/text/pageContent.js');
  assert.match(PAGE_COPY.fediversity.lead, /no va passar la primera selecció/, 'llms.txt i /fediversity han de contar la mateixa resolució');

  const ard = JSON.parse(fs.readFileSync(path.join(ARREL, 'public/.well-known/ard.json'), 'utf8'));
  for (const entry of ard.entries) {
    assert.equal(entry.tags.some((tag) => /nlnet|ngi0?|commons-fund/i.test(tag)), false, `${entry.identifier} no pot etiquetar-se amb un finançador que no l'ha concedit`);
    assert.doesNotMatch(`${entry.displayName} ${entry.description}`, /candidatura|NLnet|Commons\s+Fund/i);
  }
});

test('llms.txt queda exclòs del paquet WordPress/natiu i admés per l’inventari estàtic amb .well-known/ard.json', (t) => {
  assert.equal(PROPIS_DEL_LLOC.arrel.includes('llms.txt'), true, 'llms.txt és propi del domini socdepoble.org');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-ard-inv-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dist = path.join(dir, 'dist');
  const fixture = {
    'index.html': '<!doctype html><title>Sóc de Poble</title>',
    'llms.txt': fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8'),
    'md/document-obert.md': '# Document Obert\n',
    'manifest.webmanifest': '{"name":"Sóc de Poble","start_url":"/"}',
    '.well-known/ard.json': fs.readFileSync(path.join(ARREL, 'public/.well-known/ard.json'), 'utf8'),
    '.well-known/host-meta': '<XRD/>',
    '.well-known/nodeinfo': '{"links":[]}',
    '.well-known/webfinger/socdepoble.json': '{"subject":"acct:socdepoble@socdepoble.org"}',
    'nodeinfo/2.1.json': '{"version":"2.1"}',
    'opendata/manifest.json': '{"schema":"public"}',
    'opendata/municipi.jsonld': '{"@id":"https://socdepoble.org/"}',
    'ap/actors/socdepoble.json': '{"id":"https://socdepoble.org/ap/actors/socdepoble.json"}',
    'assets/app-01.js': 'console.log("ok")',
  };
  for (const [rel, content] of Object.entries(fixture)) {
    const abs = path.join(dist, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  const inv = creaInventariEstatic(dist);
  const camins = inv.fitxers.map((f) => f.cami);
  assert.ok(camins.includes('llms.txt'));
  assert.ok(camins.includes('.well-known/ard.json'));
  assert.ok(camins.includes('md/document-obert.md'), 'la còpia Markdown de la Wiki és un directori admés');
});

/* P0-CONSOLIDACIO-3-CATEDRES (Emowe/Tellado) · llms.txt enllaça la còpia Markdown
   pública de la Wiki (tooling/seo/genera-llms.mjs): cada enllaç /md/ és un fitxer
   de public/md, cada fitxer de public/md és a llms.txt i a slugIndex.json, i la
   carpeta no viatja al connector WordPress ni a l'app nativa.
   v1.2.26 · public/md/skills (IDEA-364) és la subcarpeta de la projecció de skills, no cap document. I, amb D4
   Opció B (D5), un esborrany de la Wiki es llig a /wikidepoble però no té còpia a /md: els documents de public/md
   són EXACTAMENT els slugs indexables, els de slugIndex.json menys els esborranys de wikiManifest (cada esborrany
   ha de casar amb una sola entrada de slugIndex.json, perquè la resta no siga mai una resta buida). */
test('llms.txt i public/md: cap enllaç orfe, cap fitxer orfe, els slugs indexables de slugIndex.json i fora dels paquets', async () => {
  const txt = fs.readFileSync(path.join(ARREL, 'public/llms.txt'), 'utf8');
  const enllacats = [...txt.matchAll(/\]\(https:\/\/socdepoble\.org\/md\/([^)]+)\)/g)].map((m) => m[1]).sort();
  const carpeta = path.join(ARREL, 'public/md');
  assert.equal(fs.lstatSync(carpeta).isDirectory(), true, 'public/md és una carpeta real');
  const entrades = fs.readdirSync(carpeta, { withFileTypes: true }).filter((e) => !e.name.startsWith('.'));
  const carpetes = entrades.filter((e) => e.isDirectory()).map((e) => e.name);
  assert.deepEqual(carpetes, ['skills'], 'l’única carpeta de public/md és la de les skills (IDEA-364)');
  assert.equal(fs.lstatSync(path.join(carpeta, 'skills')).isSymbolicLink(), false, 'public/md/skills és una carpeta real');
  const documents = entrades.filter((e) => e.isFile()).map((e) => e.name).sort();
  assert.equal(documents.length + carpetes.length, entrades.length, 'a public/md només hi ha fitxers i la carpeta de skills');
  assert.ok(documents.length > 0, 'la Wiki pública té documents');
  assert.deepEqual(enllacats, documents, 'cada enllaç /md/ de llms.txt és un document de public/md i a l’inrevés');

  const { wikiManifest } = await import('../src/data/wikiManifest.js');
  const { idDeDocumentWiki } = await import('../src/config/rutaSocial.js');
  const esborranys = new Set(wikiManifest.items.filter((i) => i.noindex === true || i.attributes?.status === 'esborrany').map((i) => i.id));
  assert.ok(esborranys.size > 0, 'la Wiki té esborranys: la resta no pot ser buida per construcció');
  // L'id del document a l'app, el mateix que genera-llms.mjs (idDelDocument): el nom del fitxer sense .md.
  const idDe = (rel) => idDeDocumentWiki(path.posix.basename(rel) === 'SKILL.md' ? `${path.posix.basename(path.posix.dirname(rel))}_SKILL` : path.posix.basename(rel, '.md'));
  const slugIndex = JSON.parse(fs.readFileSync(path.join(ARREL, 'public/slugIndex.json'), 'utf8'));
  const deEsborrany = slugIndex.filter((d) => esborranys.has(idDe(d.path)));
  assert.deepEqual(deEsborrany.map((d) => idDe(d.path)).sort(), [...esborranys].sort(), 'cada esborrany de wikiManifest casa amb una sola entrada de slugIndex.json');
  const indexables = slugIndex.filter((d) => !esborranys.has(idDe(d.path))).map((d) => `${d.slug}.md`).sort();
  assert.deepEqual(documents, indexables, 'public/md té un document per cada slug indexable de slugIndex.json, ni més ni menys');
  assert.match(txt, /\n## Wiki de Poble \(Markdown\)\n/);
  assert.equal(PROPIS_DEL_LLOC.arrel.includes('md'), true, 'public/md és propi del domini socdepoble.org');
});

test('DateTimeControl i SelectorDataHora mantenen separació textual per complir WCAG 2.5.3 label-content-name-mismatch', () => {
  const controlsSrc = fs.readFileSync(path.join(ARREL, 'src/components/PedraSeca/atoms/controls.jsx'), 'utf8');
  const selectorSrc = fs.readFileSync(path.join(ARREL, 'src/components/PedraSeca/organismes/SelectorDataHora.jsx'), 'utf8');

  assert.match(controlsSrc, /\{time && date \? ' ' : null\}/, 'DateTimeControl ha de separar hora i data amb espai textual');
  assert.match(selectorSrc, /\{mostra\.time && mostra\.date \? ' ' : null\}/, 'SelectorDataHora ha de separar hora i data amb espai textual');
  assert.match(selectorSrc, /\.replace\(`\(\$\{visible\}\)`,\s*`— \$\{visible\}`\)/, 'SelectorDataHora no ha de deixar visible entre parèntesis per a axe-core');
});
