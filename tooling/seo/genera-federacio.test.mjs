/**
 * P1-23 · Proves del generador estàtic de la federació
 * (tooling/seo/genera-federacio.mjs): què es publica de les fonts reals del
 * repositori (i què no: notes, eines, seed), la frontera pública amb fonts
 * injectades, l'origen del build, el determinisme, l'escriptura segura
 * (restes, enllaços simbòlics, camins) i la CLI sobre un directori temporal.
 * SDP_PROJECT_ROOT apunta a un altre arbre si cal. Cap xarxa.
 * Gauntlet 261030, cicle 4 (webfinger-jrd-creuat-fora-del-precommit) · Les
 * proves pures del WebFinger estàtic de Firebase (el host-meta i el JRD de
 * cada actor principal, les regles de firebase.json iguals a les del
 * generador i la simulació de l'algorisme de Mastodon) viuen ara a
 * src/config/firebaseHosting.webfinger.seguretat.test.js, que corre al
 * pre-commit: esta suite de node no hi corre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  ACTOR_PROJECTE, ALIES_WEBFINGER, AVIS_FASE_1, FONTS, escriuFederacio, fitxersDelServidor, origenDeLaPublicacio, preparaFederacio,
  recullActorsPublics, reglesNginxWebFinger
} from './genera-federacio.mjs';

const ARREL = process.env.SDP_PROJECT_ROOT || path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const GENERADOR = fileURLToPath(new URL('./genera-federacio.mjs', import.meta.url));
const ORIGEN = 'https://socdepoble.org';
const TORRE = 'la-torre-de-les-macanes';
const importa = (rel) => import(pathToFileURL(path.join(ARREL, rel)).href);
const ap = await importa(FONTS.activitypub);
const { MOCK_TOWNS } = await importa(FONTS.pobles);

function temporal(t) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-federacio-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('fonts reals: el projecte amb les pàgines públiques; els pobles del seed, només amb el nom i l’outbox buit', async () => {
  const actors = await recullActorsPublics({ arrel: ARREL, origen: ORIGEN });
  assert.equal(actors[0].slug, ACTOR_PROJECTE.slug);
  assert.deepEqual(actors.slice(1).map((a) => a.slug), MOCK_TOWNS.map((p) => p.id));
  const pagines = actors[0].elements.map((e) => e.id);
  for (const publica of ['pagina-projecte', 'pagina-legal', 'pagina-versions']) assert.ok(pagines.includes(publica), publica);
  // Les eines i la Wiki no són pàgines publicables (PRIVATE_ROUTES de publication-policy, com el manifest social).
  /* Ordre del Mestre (30-10-2026, prompt 2208, T2.1) · Expectativa actualitzada a
     posta: /disseny ja és pública i indexable (ix de PRIVATE_ROUTES), i la seua
     pàgina es federa com les germanes. Abans, 'pagina-disseny' era a la llista
     de les privades; /notes i la Wiki continuen fora. */
  assert.ok(pagines.includes('pagina-disseny'), 'pagina-disseny');
  for (const privada of ['pagina-notes', 'pagina-wikidepoble']) assert.equal(pagines.includes(privada), false, privada);
  for (const element of actors[0].elements) {
    assert.equal(element.tipus, 'Article');
    assert.ok(element.url.startsWith(`${ORIGEN}/`), element.url);
    // La data és la que la pàgina porta (PAGE_COPY.date): si en porta, vàlida; si no, cap (mai una d'inventada).
    assert.ok(element.publicat === null || ap.dataIso(element.publicat), `${element.id}: ${element.publicat}`);
    // L'entradeta va de resum (summary): el cos de la pàgina no es federa.
    assert.equal(element.text, undefined, element.id);
  }
  for (const poble of actors.slice(1)) {
    assert.deepEqual(poble.elements, [], poble.slug);
    assert.equal(poble.perfil, `/pobles/${poble.slug}`);
  }
});

test('el seed és de mostra: cap resum, població, comarca, coordenada, imatge ni data seua ix als fitxers', async () => {
  const { fitxers } = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
  const tot = [...fitxers.values()].map((d) => ap.serialitzaJson(d)).join('\n');
  for (const poble of MOCK_TOWNS) {
    for (const camp of ['content', 'population', 'comarca', 'image_url', 'avatar_url', 'created_at', 'author', 'linkTo']) {
      if (typeof poble[camp] === 'string' && poble[camp].length > 3) assert.equal(tot.includes(poble[camp]), false, `${poble.id}.${camp}`);
    }
    assert.equal(tot.includes(String(poble.lat)), false, `${poble.id}.lat`);
  }
  // Cap camp de la subvenció ni cap comarca inventada (defecte 9).
  for (const fals of ['fediversityGrant', 'Muntanya d’Alacant', 'Open Data Export']) assert.equal(tot.includes(fals), false, fals);
  const torre = fitxers.get(`ap/actors/${TORRE}.json`);
  assert.equal(torre.name, 'La Torre de les Maçanes · Sóc de Poble');
  assert.match(torre.summary, /No és el compte oficial de l’Ajuntament/);
  assert.ok(torre.summary.includes(ap.escapaHtml(AVIS_FASE_1)));
  assert.equal(torre.icon, undefined);
  assert.deepEqual(fitxers.get(`ap/outbox/${TORRE}.json`).orderedItems, []);
  const projecte = fitxers.get('ap/actors/socdepoble.json');
  assert.deepEqual(projecte.icon, { type: 'Image', mediaType: 'image/png', url: `${ORIGEN}/icona-app-512.png` });
  // Cada pàgina és un Article amb l'entradeta a summary (Mastodon mostra name + summary + url, i no el content).
  const pagina = fitxers.get('ap/objectes/socdepoble/pagina-projecte.json');
  assert.equal(pagina.type, 'Article');
  assert.match(pagina.summary, /^<p>.+<\/p>$/s);
  assert.deepEqual(pagina.summaryMap, { ca: pagina.summary });
  assert.equal(pagina.content, undefined);
  assert.deepEqual(pagina.to, ['https://www.w3.org/ns/activitystreams#Public']);
});

/* Fonts injectades: la frontera pública decidix, no el generador. */
function fontsFalses({ pagines, copy, pobles }) {
  const moduls = {
    [FONTS.activitypub]: ap,
    [FONTS.pagines]: { SYSTEM_PAGES: pagines },
    [FONTS.copy]: { PAGE_COPY: copy },
    [FONTS.pobles]: { MOCK_TOWNS: pobles },
    [FONTS.text]: { textPla: (valor) => String(valor).replace(/\*\*/g, '') }
  };
  return async (rel) => moduls[rel];
}

test('frontera: visibility no pública, arxivat, rutes privades i pobles amb id no federable', async () => {
  const pagines = [
    { key: 'projecte', href: '/projecte' }, { key: 'privada', href: '/page/privada' }, { key: 'arxivada', href: '/page/arxivada' },
    { key: 'notes', href: '/notes' }, { key: 'sense-copy', href: '/page/sense-copy' }, { key: 'oculta', href: '/page/oculta', visibility: 'members' },
    { key: 'sense-data', href: '/page/sense-data' }
  ];
  const copy = {
    projecte: { title: 'El **projecte**', lead: 'Entradeta', date: '2026-08-20T00:00:00.000Z' },
    privada: { title: 'Privada', lead: 'x', visibility: 'members' },
    arxivada: { title: 'Arxivada', lead: 'x', status: 'arxivat' },
    notes: { title: 'Notes', lead: 'x' },
    oculta: { title: 'Oculta', lead: 'x' },
    'sense-data': { title: 'Sense data', subtitle: 'Subtítol' }
  };
  const pobles = [{ id: 'benifallim', title: 'Benifallim' }, { id: 'privat', title: 'Privat', visibility: 'private' }];
  const carrega = fontsFalses({ pagines, copy, pobles });
  const actors = await recullActorsPublics({ arrel: ARREL, origen: ORIGEN, carrega });
  assert.deepEqual(actors[0].elements.map((e) => [e.id, e.nom, e.resum, e.publicat]), [
    ['pagina-projecte', 'El projecte', 'Entradeta', '2026-08-20T00:00:00.000Z'], ['pagina-sense-data', 'Sense data', 'Subtítol', null]
  ]);
  assert.deepEqual(actors.slice(1).map((a) => a.slug), ['benifallim']);
  // Una pàgina sense data no en rep cap d'inventada (defecte 9): ni l'objecte ni el Create porten published.
  const { fitxers } = await preparaFederacio({ arrel: ARREL, origen: ORIGEN, carrega });
  const senseData = fitxers.get('ap/outbox/socdepoble.json').orderedItems.find((a) => a.object.id.endsWith('/pagina-sense-data.json'));
  assert.equal(senseData.object.published, undefined);
  assert.equal(senseData.published, undefined);
  assert.equal(fitxers.get('ap/objectes/socdepoble/pagina-sense-data.json').published, undefined);
  for (const dolent of ['Benifallim', 'la torre', '../x', 'a'.repeat(65)]) {
    await assert.rejects(recullActorsPublics({ arrel: ARREL, origen: ORIGEN, carrega: fontsFalses({ pagines, copy, pobles: [{ id: dolent, title: 'X' }] }) }), Error, dolent);
  }
});

test('origen del build: VITE_CANONICAL_URL o https://socdepoble.org; un origen que no és https net atura', async () => {
  assert.equal(await origenDeLaPublicacio({ env: {}, arrel: ARREL }), ORIGEN);
  assert.equal(await origenDeLaPublicacio({ env: { VITE_CANONICAL_URL: ' ' }, arrel: ARREL }), ORIGEN);
  assert.equal(await origenDeLaPublicacio({ env: { VITE_CANONICAL_URL: 'https://proves.socdepoble.org/' }, arrel: ARREL }), 'https://proves.socdepoble.org');
  // El loopback és l'origen del servidor de desenvolupament (normalitzaOrigen l'admet), no el d'un build per a publicar.
  for (const dolent of ['http://socdepoble.org', 'https://socdepoble.org/app', 'javascript:alert(1)', 'http://localhost:3340', 'http://127.0.0.1:3340', 'http://[::1]:3340']) {
    await assert.rejects(origenDeLaPublicacio({ env: { VITE_CANONICAL_URL: dolent }, arrel: ARREL }), TypeError, dolent);
  }
});

test('determinisme: dues generacions, els mateixos bytes; i els JRD del servidor quadren amb WebFinger', async () => {
  const bytes = async () => {
    const { fitxers } = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
    return [...fitxers].map(([cami, document]) => `${cami}\n${ap.serialitzaJson(document)}`).join('');
  };
  assert.equal(await bytes(), await bytes());
  const preparat = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
  const servidor = fitxersDelServidor(preparat);
  assert.deepEqual(servidor.get(`.well-known/webfinger/${TORRE}.json`).subject, `acct:${TORRE}@socdepoble.org`);
  assert.deepEqual(servidor.get('.well-known/nodeinfo'), ap.construeixEnllacosNodeInfo({ origen: ORIGEN }));
  assert.equal(servidor.get('nodeinfo/2.1.json').software.version, preparat.versio);
  assert.equal(servidor.size, preparat.actors.length + 3);
  // Les regles d'nginx: una per actor i una per àlies (cap al JRD del seu actor), sense caixa, cap captura al rewrite i el host escapat.
  const regles = servidor.get('.well-known/webfinger.nginx');
  assert.equal(typeof regles, 'string');
  const rewrites = [...regles.matchAll(/^if \(\$arg_resource ~\* "\^acct\(\?::\|%3a\)([a-z0-9-]+)\(\?:@\|%40\)socdepoble\\\.org\$"\) \{\n {4}rewrite \^ \/\.well-known\/webfinger\/([a-z0-9-]+)\.json\? last;\n\}$/gm)];
  const alies = Object.entries(ALIES_WEBFINGER).flatMap(([slug, noms]) => noms.map((nom) => [nom, slug]));
  assert.deepEqual(rewrites.map(([, slug, desti]) => [slug, desti]).sort(), [...preparat.actors.map((a) => [a.slug, a.slug]), ...alies].sort());
  assert.deepEqual(alies, [['latorredelesmacanes', TORRE]]);
  assert.equal(regles.includes('$1'), false);
});

/* P1-23 (ordre del Mestre del 30-10-2026) · El WebFinger del lloc estàtic: el host-meta, el JRD dels actors
   principals i la simulació de Mastodon són a src/config/firebaseHosting.webfinger.seguretat.test.js (pre-commit).
   Ací, el que necessita fonts injectades: un àlies que xoca amb un actor, o que dos reclamen, atura. */
test('WebFinger estàtic: un àlies que és el slug d’un altre actor, o que dos actors reclamen, atura la generació', async () => {
  const pagines = [{ key: 'projecte', href: '/projecte' }];
  const copy = { projecte: { title: 'Projecte', lead: 'x' } };
  await assert.rejects(recullActorsPublics({ arrel: ARREL, origen: ORIGEN, carrega: fontsFalses({ pagines, copy, pobles: [{ id: TORRE, title: 'La Torre' }, { id: 'latorredelesmacanes', title: 'Una altra' }] }) }),
    /Àlies de WebFinger repetit o d'un altre actor: latorredelesmacanes/);
  assert.throws(() => ap.aliesWebFinger([{ slug: 'a', alies: ['b'] }, { slug: 'c', alies: ['b'] }]), /repetit/);
  assert.throws(() => ap.aliesWebFinger([{ slug: 'a', alies: ['La Torre'] }]), /invàlid/);
});

/* Gauntlet 261030 (G8 de Gemini): nginx també respon per l'URL de l'actor i del perfil, com activitypub.js. */
test('regles d’nginx: l’URL exacta de l’actor i del perfil, amb «:» i «/» tal qual o codificats; cap URL repetida', async () => {
  const preparat = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
  const regles = reglesNginxWebFinger(preparat);
  const perUrl = [...regles.matchAll(/^if \(\$arg_resource ~ "\^\(\?:(.+)\)\$"\) \{\n {4}rewrite \^ \/\.well-known\/webfinger\/([a-z0-9-]+)\.json\? last;\n\}$/gm)];
  assert.deepEqual(perUrl.map(([, , slug]) => slug), preparat.actors.map((a) => a.slug).sort());
  for (const [, patro, slug] of perUrl) {
    // Sense «i»: amb caixa, com el === de construeixWebFinger.
    const re = new RegExp(`^(?:${patro})$`);
    const { actor, perfil } = ap.urlsDeMunicipi(slug, { origen: ORIGEN, perfil: preparat.actors.find((a) => a.slug === slug).perfil });
    for (const url of [actor, perfil]) {
      assert.ok(re.test(url), url);
      assert.ok(re.test(encodeURIComponent(url)), `codificada: ${url}`);
      assert.ok(re.test(encodeURIComponent(url).replace(/%[0-9A-F]{2}/g, (hex) => hex.toLowerCase())), `hex en minúscules: ${url}`);
      for (const dolenta of [url.replace('https:', 'http:'), url.toUpperCase(), `${url}/`, `${url}x`, url.replace(/\./g, 'x')]) {
        assert.equal(re.test(dolenta), false, dolenta);
      }
    }
    assert.equal(re.test(ap.urlsDeMunicipi(slug, { origen: ORIGEN }).outbox), false, `outbox de ${slug}`);
  }
  const projecte = perUrl.find(([, , slug]) => slug === ACTOR_PROJECTE.slug)[1];
  assert.equal(projecte, 'https(?::|%3[Aa])(?:/|%2[Ff])(?:/|%2[Ff])socdepoble\\.org(?:/|%2[Ff])ap(?:/|%2[Ff])actors(?:/|%2[Ff])socdepoble\\.json'
    + '|https(?::|%3[Aa])(?:/|%2[Ff])(?:/|%2[Ff])socdepoble\\.org(?:/|%2[Ff])projecte');
  // Dos actors amb el mateix perfil: cap regla pot triar el JRD bo; s'atura.
  const repetits = [{ slug: 'a', perfil: '/pobles/x' }, { slug: 'b', perfil: '/pobles/x' }];
  assert.throws(() => reglesNginxWebFinger({ ap, origen: ORIGEN, actors: repetits }), /Dos actors amb la mateixa URL a WebFinger: https:\/\/socdepoble\.org\/pobles\/x/);
});

test('escriptura: crea l’arbre, no esborra restes (s’atura abans), no seguix enllaços i refusa camins estranys', async (t) => {
  const { fitxers } = await preparaFederacio({ arrel: ARREL, origen: ORIGEN });
  const desti = temporal(t);
  const escrits = escriuFederacio({ desti, fitxers, ap });
  assert.deepEqual(escrits, [...fitxers.keys()].sort());
  assert.equal(fs.readFileSync(path.join(desti, `ap/actors/${TORRE}.json`), 'utf8'), ap.serialitzaJson(fitxers.get(`ap/actors/${TORRE}.json`)));
  // Una segona generació igual passa (cap resta); una amb un fitxer de més, no.
  assert.doesNotThrow(() => escriuFederacio({ desti, fitxers, ap }));
  fs.writeFileSync(path.join(desti, 'ap/actors/poble-retirat.json'), '{}');
  const abans = fs.statSync(path.join(desti, `ap/actors/${TORRE}.json`)).mtimeMs;
  assert.throws(() => escriuFederacio({ desti, fitxers, ap }), /generació anterior.*poble-retirat/);
  assert.equal(fs.existsSync(path.join(desti, 'ap/actors/poble-retirat.json')), true);
  assert.equal(fs.statSync(path.join(desti, `ap/actors/${TORRE}.json`)).mtimeMs, abans);
  // També vigila els JRD d'una generació anterior (un poble retirat que nginx encara serviria).
  const ambJrd = temporal(t);
  fs.mkdirSync(path.join(ambJrd, '.well-known/webfinger'), { recursive: true });
  fs.writeFileSync(path.join(ambJrd, '.well-known/webfinger/poble-retirat.json'), '{}');
  assert.throws(() => escriuFederacio({ desti: ambJrd, fitxers, ap }), /generació anterior.*webfinger\/poble-retirat/);
  assert.equal(fs.existsSync(path.join(ambJrd, 'ap')), false);
  // Un fitxer del conjunt amb uns altres bytes (un altre origen): no es reescriu cap sense reescriu.
  const altre = temporal(t);
  escriuFederacio({ desti: altre, fitxers, ap });
  const { fitxers: proves } = await preparaFederacio({ arrel: ARREL, origen: 'https://proves.socdepoble.org' });
  assert.throws(() => escriuFederacio({ desti: altre, fitxers: proves, ap }), /altre contingut.*ap\/actors\/la-torre-de-les-macanes\.json/);
  assert.match(fs.readFileSync(path.join(altre, `ap/actors/${TORRE}.json`), 'utf8'), /"id": "https:\/\/socdepoble\.org\//);
  assert.deepEqual(escriuFederacio({ desti: altre, fitxers: proves, ap, reescriu: true }), [...proves.keys()].sort());
  assert.match(fs.readFileSync(path.join(altre, `ap/actors/${TORRE}.json`), 'utf8'), /"id": "https:\/\/proves\.socdepoble\.org\//);
  // Un text (les regles d'nginx) s'escriu tal qual, no com a JSON.
  const text = temporal(t);
  escriuFederacio({ desti: text, fitxers: new Map([['.well-known/webfinger.nginx', '# regla\n']]), ap });
  assert.equal(fs.readFileSync(path.join(text, '.well-known/webfinger.nginx'), 'utf8'), '# regla\n');
  // Enllaç simbòlic a ap/ o al fitxer: cap escriptura fora.
  const fora = temporal(t);
  const ambEnllac = temporal(t);
  fs.symlinkSync(fora, path.join(ambEnllac, 'ap'));
  assert.throws(() => escriuFederacio({ desti: ambEnllac, fitxers, ap }), /directori real|enllaç/);
  const ambFitxerEnllacat = temporal(t);
  fs.mkdirSync(path.join(ambFitxerEnllacat, 'ap/actors'), { recursive: true });
  fs.writeFileSync(path.join(fora, 'victima.json'), 'intacte');
  fs.symlinkSync(path.join(fora, 'victima.json'), path.join(ambFitxerEnllacat, `ap/actors/${TORRE}.json`));
  assert.throws(() => escriuFederacio({ desti: ambFitxerEnllacat, fitxers, ap }), /ELOOP|symbolic|enllaç/i);
  assert.equal(fs.readFileSync(path.join(fora, 'victima.json'), 'utf8'), 'intacte');
  assert.deepEqual(fs.readdirSync(fora), ['victima.json']);
  for (const cami of ['../fora.json', 'ap/../../x.json', 'src/x.json', '/ap/x.json', 'ap//x.json']) {
    assert.throws(() => escriuFederacio({ desti: temporal(t), fitxers: new Map([[cami, {}]]), ap }), /Camí federat invàlid/, cami);
  }
});

test('CLI: --desti i --servidor escriuen ap/**, els JRD i NodeInfo; sense --desti, error d’ús', (t) => {
  const desti = temporal(t);
  const cli = spawnSync(process.execPath, [GENERADOR, '--desti', desti, '--arrel', ARREL, '--servidor'], { encoding: 'utf8', env: { ...process.env, VITE_CANONICAL_URL: '' } });
  assert.equal(cli.status, 0, cli.stderr);
  const resum = JSON.parse(cli.stdout);
  assert.equal(resum.origen, ORIGEN);
  assert.ok(resum.actors.includes(TORRE));
  const jrd = JSON.parse(fs.readFileSync(path.join(desti, `.well-known/webfinger/${TORRE}.json`), 'utf8'));
  assert.equal(jrd.links.find((l) => l.rel === 'self').href, `${ORIGEN}/ap/actors/${TORRE}.json`);
  assert.ok(fs.existsSync(path.join(desti, 'nodeinfo/2.1.json')) && fs.existsSync(path.join(desti, '.well-known/nodeinfo')));
  // Sense --servidor, el mateix que el build web: ap/**, host-meta i el JRD dels actors principals, i res del servidor.
  const web = temporal(t);
  const nomes = spawnSync(process.execPath, [GENERADOR, '--desti', web, '--arrel', ARREL], { encoding: 'utf8', env: { ...process.env, VITE_CANONICAL_URL: '' } });
  assert.equal(nomes.status, 0, nomes.stderr);
  assert.deepEqual(fs.readdirSync(path.join(web, '.well-known'), { recursive: true }).sort(), ['host-meta', 'webfinger', `webfinger/${TORRE}.json`, 'webfinger/socdepoble.json']);
  assert.match(fs.readFileSync(path.join(web, '.well-known/host-meta'), 'utf8'), /template="https:\/\/socdepoble\.org\/\.well-known\/webfinger\/\{uri\}"/);
  assert.equal(fs.readFileSync(path.join(web, '.well-known/host-meta'), 'utf8'), fs.readFileSync(path.join(desti, '.well-known/host-meta'), 'utf8'));
  const sense = spawnSync(process.execPath, [GENERADOR], { encoding: 'utf8' });
  assert.equal(sense.status, 1);
  assert.match(sense.stderr, /--desti/);
  const origen = spawnSync(process.execPath, [GENERADOR, '--desti', temporal(t), '--arrel', ARREL, '--origen', 'http://socdepoble.org'], { encoding: 'utf8' });
  assert.equal(origen.status, 1);
  assert.match(origen.stderr, /Origen federat invàlid/);
  // Una opció repetida és un error d'ús, no «l'última guanya».
  const dos = [temporal(t), temporal(t)];
  const repetida = spawnSync(process.execPath, [GENERADOR, '--desti', dos[0], '--desti', dos[1], '--arrel', ARREL], { encoding: 'utf8' });
  assert.equal(repetida.status, 1);
  assert.match(repetida.stderr, /Ús:/);
  assert.deepEqual(dos.map((dir) => fs.readdirSync(dir)), [[], []]);
});

test('CLI sense --origen: l’origen dels .env de l’arrel, com «vite build»; i no reescriu en silenci el ap/ d’un altre origen', (t) => {
  // Una arrel mínima: package.json (real: confinedFile no seguix enllaços), src/ enllaçat i el .env del build.
  const arrel = temporal(t);
  fs.copyFileSync(path.join(ARREL, 'package.json'), path.join(arrel, 'package.json'));
  fs.symlinkSync(path.join(ARREL, 'src'), path.join(arrel, 'src'));
  fs.writeFileSync(path.join(arrel, '.env.production.local'), 'VITE_CANONICAL_URL=https://poble.example.org\n');
  const entorn = { ...process.env };
  delete entorn.VITE_CANONICAL_URL;
  const cli = (...args) => spawnSync(process.execPath, [GENERADOR, '--arrel', arrel, ...args], { encoding: 'utf8', env: entorn });
  const desti = temporal(t);
  const primera = cli('--desti', desti, '--servidor');
  assert.equal(primera.status, 0, primera.stderr);
  assert.equal(JSON.parse(primera.stdout).origen, 'https://poble.example.org');
  const actor = () => JSON.parse(fs.readFileSync(path.join(desti, `ap/actors/${TORRE}.json`), 'utf8')).id;
  assert.equal(actor(), `https://poble.example.org/ap/actors/${TORRE}.json`);
  // Un altre origen sobre el mateix destí: s'atura sense tocar res; amb --reescriu, sí.
  const altre = cli('--desti', desti, '--servidor', '--origen', ORIGEN);
  assert.equal(altre.status, 1);
  assert.match(altre.stderr, /altre contingut/);
  assert.equal(actor(), `https://poble.example.org/ap/actors/${TORRE}.json`);
  assert.equal(cli('--desti', desti, '--servidor', '--origen', ORIGEN, '--reescriu').status, 0);
  assert.equal(actor(), `${ORIGEN}/ap/actors/${TORRE}.json`);
  // L'entorn del procés mana sobre el .env, com en Vite.
  const ambEntorn = spawnSync(process.execPath, [GENERADOR, '--arrel', arrel, '--desti', temporal(t)], { encoding: 'utf8', env: { ...entorn, VITE_CANONICAL_URL: 'https://proves.socdepoble.org' } });
  assert.equal(JSON.parse(ambEntorn.stdout).origen, 'https://proves.socdepoble.org');
});
