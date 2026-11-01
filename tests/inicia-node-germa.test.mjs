/* tests/inicia-node-germa.test.mjs — prova d'integració de la CLI de l'instal·lador d'un node
   germà: còpia de la release i federació, sense npm ci ni build (B4 · T3.4 del prompt
   261101_0311 de la marató nocturna NLnet Fediversity; Gauntlet 261101, B4-G03 a B4-G05).

   tooling/instalador/inicia-node-germa.test.mjs ja prova la lògica de l'instal·lador amb una
   release de quatre fitxers d'una línia (determinisme, rebuigs, --build amb un npm fingit, CLI
   mínima i entorn VITE_ net). Esta prova no ho repetix: executa la CLI de debò, sense cap entrada
   interactiva (arguments i stdin tancat), per a un segon poble, Xixona, en un directori fet amb
   mkdtemp dins d'os.tmpdir(). Després hi executa la federació que el node publicaria amb la
   mateixa ordre que el mòdul NixOS de flake.nix
   (node tooling/seo/genera-federacio.mjs --desti … --origen … --servidor), des de la còpia
   instal·lada i amb --arrel a la còpia.

   La font (--font) és immutable, com demana l'instal·lador: la release de HEAD (src, public,
   tooling, scripts i els fitxers d'arrel que copia l'instal·lador), extreta amb git archive dins
   del mkdtemp, que és la forma d'una release publicada. L'arbre de treball no servix de font: és
   compartit, porta fitxers sense seguiment d'altres mans i el vigilant de la Wiki hi escriu
   temporals (src/data/wikiManifest.js.<uuid>.tmp) que l'instal·lador podria llistar i després no
   trobar. Conseqüència: el que encara no s'ha confirmat a src/, public/ o tooling/seo/ no entra a
   la release d'esta prova (ho proven les seues pròpies proves); l'instal·lador que s'executa sí
   que és el de l'arbre viu.

   Què aporta respecte de la prova de l'instal·lador:
     · una release real: cada fitxer de la font arriba al node amb el seu SHA-256, i res de fora
       de la release (dotfiles, node_modules, dist, la Wiki, tests/, supabase/) hi entra;
     · la identitat del node nou a node-germa.json, .env.local i INICIA_NODE.md, cap camp de més
       de la configuració (un secret posat per error no viatja) i cap residu de La Torre de les
       Maçanes als fitxers que genera l'instal·lador;
     · el motiu del rebuig d'una segona execució: el destí ja existix;
     · la federació del node: NodeInfo 2.1, host-meta i WebFinger amb l'origen de Xixona i cap
       rastre de l'origen del Mas electrònic (socdepoble.org);
     · el repositori viu: quatre fitxers sentinella amb el mateix SHA-256, cap eixida coneguda a
       l'arrel i un directori de treball aïllat que queda buit;
     · [DEFECTE] el residu de La Torre que el node encara hereta de la release (vegeu la prova).
   No prova els passos 1 i 2 d'INICIA_NODE.md (npm ci i npm run build:web) ni servix cap web.
   Necessita git i tar; cap xarxa ni npm. Els temporals s'esborren amb after(), també si una prova
   falla. */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { iniciaNodeGerma } from '../tooling/instalador/inicia-node-germa.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALADOR = path.join(ARREL, 'tooling/instalador/inicia-node-germa.mjs');
const ORIGEN = 'https://gentdexixona.example';
const SECRET = 'sb_secret_mai_ha_de_viatjar_al_node';
const CONFIG = Object.freeze({ slug: 'xixona', nom: 'Xixona', origen: ORIGEN, mode: 'seed', serviceRoleKey: SECRET });
/* La Torre de les Maçanes, el poble del Mas, en totes les formes que el repositori fa servir. */
const RESIDU_TORRE = /la[\s_-]*torre|ma[çc]anes|latorredelesmacanes|gentdelatorre/i;
/* Els tres fitxers que escriu l'instal·lador; la resta del destí és còpia de la release. */
const GENERATS = Object.freeze(['.env.local', 'INICIA_NODE.md', 'node-germa.json']);
/* Mirall de DIRECTORIS i FITXERS de tooling/instalador/inicia-node-germa.mjs: si l'instal·lador
   en copia d'altres, esta prova ho ha de saber. */
const DIRECTORIS = Object.freeze(['public', 'scripts', 'src', 'tooling']);
const FITXERS = Object.freeze(['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'firebase.json', 'flake.nix', 'flake.lock', 'LICENSE']);
const EXCLOSOS = new Set(['node_modules', 'dist', '90_arxiu_historic', '01_produccio', '02_investigacio_ia']);
/* Quatre fitxers vius de governança (només canvien amb l'executor, no a mitja prova): sentinelles
   d'una escriptura per error al repositori. No en cobrixen la resta. */
const SENTINELLES = Object.freeze(['package.json', 'package-lock.json', 'tooling/instalador/inicia-node-germa.mjs', 'tooling/seo/genera-federacio.mjs']);
/* Noms que l'instal·lador o la federació escriurien si s'equivocaren de destí. */
const EIXIDES_A_LARREL = Object.freeze([...GENERATS.filter((nom) => nom !== '.env.local'), 'ap', 'nodeinfo', 'gent-de-xixona']);

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const llig = (cami) => fs.readFileSync(cami, 'utf8');
const sentinelles = () => Object.fromEntries(SENTINELLES.map((rel) => [rel, sha(fs.readFileSync(path.join(ARREL, rel)))]));
const eixidesALArrel = () => EIXIDES_A_LARREL.filter((nom) => fs.existsSync(path.join(ARREL, nom)));
const entornSenseVite = () => Object.fromEntries(Object.entries(process.env).filter(([clau]) => !clau.startsWith('VITE_')));
const executa = (args, cwd) => spawnSync(process.execPath, args, {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180_000, maxBuffer: 16 * 1024 * 1024, env: entornSenseVite()
});

function fitxersDe(dir, prefix = '') {
  const trobats = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entrada.name}` : entrada.name;
    if (entrada.isSymbolicLink()) throw new Error(`Enllaç simbòlic inesperat: ${rel}`);
    if (entrada.isDirectory()) trobats.push(...fitxersDe(path.join(dir, entrada.name), rel));
    else trobats.push(rel);
  }
  return trobats;
}

/* La release immutable: els DIRECTORIS i FITXERS que hi ha a HEAD, extrets amb git archive i tar a
   `font`. Només llig el repositori (cap índex ni referència canvia); el tar s'esborra en acabar. */
function extreuRelease(font, tar) {
  const ordre = (programa, args) => spawnSync(programa, args, { cwd: ARREL, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120_000 });
  const cap = ordre('git', ['-C', ARREL, 'rev-parse', '--verify', 'HEAD']);
  assert.equal(cap.status, 0, `la prova necessita el repositori git amb HEAD: ${cap.stderr}`);
  const commit = cap.stdout.trim();
  const llista = ordre('git', ['-C', ARREL, 'ls-tree', '--name-only', commit, '--', ...DIRECTORIS, ...FITXERS]);
  assert.equal(llista.status, 0, llista.stderr);
  const noms = llista.stdout.split('\n').filter(Boolean);
  assert.ok(DIRECTORIS.every((dir) => noms.includes(dir)), `HEAD no porta tots els directoris de la release: ${noms.join(', ')}`);
  const arxiu = ordre('git', ['-C', ARREL, 'archive', '--format=tar', `--output=${tar}`, commit, '--', ...noms]);
  assert.equal(arxiu.status, 0, arxiu.stderr);
  fs.mkdirSync(font);
  const extraccio = ordre('tar', ['-x', '-f', tar, '-C', font]);
  assert.equal(extraccio.status, 0, extraccio.stderr);
  fs.rmSync(tar);
  return commit;
}

const estat = {};

before(() => {
  estat.base = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-node-germa-xixona-'));
  estat.font = path.join(estat.base, 'font');
  estat.treball = path.join(estat.base, 'treball');
  estat.desti = path.join(estat.base, 'gent-de-xixona');
  estat.publicacio = path.join(estat.base, 'publicacio');
  estat.config = path.join(estat.base, 'xixona.json');
  fs.mkdirSync(estat.treball);
  fs.mkdirSync(estat.publicacio);
  fs.writeFileSync(estat.config, `${JSON.stringify(CONFIG, null, 2)}\n`);

  estat.abans = { sentinelles: sentinelles(), eixides: eixidesALArrel() };
  estat.commit = extreuRelease(estat.font, path.join(estat.base, 'release.tar'));
  estat.instal = executa([INSTALADOR, '--font', estat.font, '--desti', estat.desti, '--config', estat.config], estat.treball);
  if (estat.instal.status === 0) {
    estat.manifest = JSON.parse(llig(path.join(estat.desti, 'node-germa.json')));
    // La federació del node, des de la còpia instal·lada (--arrel), com el mòdul NixOS de flake.nix.
    estat.federacio = executa([path.join(estat.desti, 'tooling/seo/genera-federacio.mjs'),
      '--desti', estat.publicacio, '--origen', ORIGEN, '--arrel', estat.desti, '--servidor'], estat.treball);
  }
  estat.despres = { sentinelles: sentinelles(), eixides: eixidesALArrel() };
});

after(() => {
  if (estat.base) fs.rmSync(estat.base, { recursive: true, force: true });
});

test('la CLI prepara el node de Xixona sense entrada interactiva, sense canviar les sentinelles ni deixar eixides a l’arrel', () => {
  assert.equal(estat.instal.status, 0, estat.instal.stderr);
  const eixida = JSON.parse(estat.instal.stdout);
  assert.deepEqual(Object.keys(eixida), ['esquema', 'slug', 'fitxers']);
  assert.equal(eixida.esquema, 'sdp.node-germa.v1');
  assert.equal(eixida.slug, 'xixona');
  assert.equal(eixida.fitxers, estat.manifest.fitxers.length);
  assert.ok(eixida.fitxers > 1000, `una release real té més de mil fitxers: ${eixida.fitxers}`);
  // El repositori viu: les quatre sentinelles amb els mateixos bytes, cap eixida coneguda a l'arrel i el directori de treball buit.
  assert.deepEqual(estat.despres.sentinelles, estat.abans.sentinelles);
  assert.deepEqual(estat.abans.eixides, []);
  assert.deepEqual(estat.despres.eixides, []);
  assert.deepEqual(fs.readdirSync(estat.treball), []);
  for (const dir of [estat.font, estat.desti]) assert.ok(path.relative(ARREL, dir).startsWith(`..${path.sep}`), `fora del repositori: ${dir}`);
});

test('una segona execució sobre el mateix destí es rebutja perquè el destí ja existix, sense tocar el node', () => {
  const manifestAbans = fs.readFileSync(path.join(estat.desti, 'node-germa.json'));
  const repeticio = executa([INSTALADOR, '--font', estat.font, '--desti', estat.desti, '--config', estat.config], estat.treball);
  assert.equal(repeticio.status, 1);
  assert.equal(repeticio.stdout, '');
  assert.match(repeticio.stderr, /destí buit/);
  /* La CLI escriu el mateix missatge per a qualsevol error (configuració, release o destí): el
     motiu es comprova a la funció, que mira el destí abans de llegir la release. */
  assert.throws(() => iniciaNodeGerma({ font: estat.font, desti: estat.desti, config: CONFIG }), /El destí ja existix/);
  assert.deepEqual(fs.readFileSync(path.join(estat.desti, 'node-germa.json')), manifestAbans);
});

test('node-germa.json, .env.local i INICIA_NODE.md porten la identitat de Xixona i cap residu de La Torre', () => {
  const { manifest } = estat;
  const versio = JSON.parse(llig(path.join(estat.desti, 'package.json'))).version;
  assert.equal(manifest.esquema, 'sdp.node-germa.v1');
  // Només els quatre camps de la identitat: el secret posat per error a la configuració no viatja.
  assert.deepEqual(manifest.config, { slug: 'xixona', nom: 'Xixona', origen: ORIGEN, mode: 'seed' });
  assert.equal(manifest.release, versio);
  assert.equal(manifest.node, process.versions.node);

  const env = Object.fromEntries(llig(path.join(estat.desti, '.env.local')).trimEnd().split('\n').map((linia) => {
    const igual = linia.indexOf('=');
    return [linia.slice(0, igual), JSON.parse(linia.slice(igual + 1))];
  }));
  assert.deepEqual(env, {
    VITE_DATA_MODE: 'seed',
    VITE_CANONICAL_URL: ORIGEN,
    VITE_SUPABASE_URL: 'https://seed.invalid',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_demostracio_seed',
    VITE_TENANT_ID: '00000000-0000-0000-0000-000000000000'
  });
  assert.equal(fs.statSync(path.join(estat.desti, '.env.local')).mode & 0o777, 0o600);

  const inicia = llig(path.join(estat.desti, 'INICIA_NODE.md'));
  assert.ok(inicia.startsWith('# Gent de Xixona\n'), inicia.split('\n')[0]);
  assert.ok(inicia.includes(`Publica dist/ a ${ORIGEN} `));

  const generats = [llig(path.join(estat.desti, '.env.local')), inicia, JSON.stringify({ ...manifest, fitxers: [] })];
  for (const text of generats) {
    assert.doesNotMatch(text, RESIDU_TORRE);
    assert.ok(!text.includes('socdepoble.org'), 'cap origen del Mas a la identitat del node');
    assert.ok(!text.includes(SECRET), 'cap secret de la configuració');
  }
});

test('el manifest cobrix la release sencera: cada fitxer de la font arriba al node amb el seu SHA-256 i res de fora hi entra', () => {
  const { manifest } = estat;
  const arrelDeLaFont = FITXERS.filter((nom) => fs.existsSync(path.join(estat.font, nom)));
  const esperats = new Set([...GENERATS, ...DIRECTORIS, ...arrelDeLaFont]);
  assert.deepEqual(new Set(fs.readdirSync(estat.desti)), esperats);

  const camins = manifest.fitxers.map(({ cami }) => cami);
  assert.deepEqual(camins, [...new Set(camins)].sort(), 'manifest ordenat i sense repeticions');
  // La release de la font amb les regles de l'instal·lador: cap tros que comence per punt ni cap directori exclòs.
  const release = [...arrelDeLaFont, ...DIRECTORIS.flatMap((dir) => fitxersDe(path.join(estat.font, dir), dir))]
    .filter((rel) => !rel.split('/').some((tros) => tros.startsWith('.') || EXCLOSOS.has(tros)))
    .sort();
  assert.deepEqual(camins, release, 'el manifest és la release de la font, ni més ni menys');
  const copiats = fitxersDe(estat.desti).filter((rel) => !GENERATS.includes(rel)).sort();
  assert.deepEqual(copiats, release);
  for (const { cami, sha256 } of manifest.fitxers) {
    assert.equal(sha(fs.readFileSync(path.join(estat.font, cami))), sha256, `font · ${cami}`);
    assert.equal(sha(fs.readFileSync(path.join(estat.desti, cami))), sha256, cami);
  }
  for (const absent of ['.git', 'node_modules', 'dist', '_wiki_de_poble', 'tests', 'supabase', 'wordpress-plugin']) {
    assert.equal(fs.existsSync(path.join(estat.desti, absent)), false, absent);
  }
});

test('la federació que publicaria el node és de l’origen de Xixona: NodeInfo, host-meta i WebFinger sense l’origen del Mas', () => {
  assert.equal(estat.federacio?.status, 0, estat.federacio?.stderr);
  const eixida = JSON.parse(estat.federacio.stdout);
  assert.equal(eixida.origen, ORIGEN);
  const publicats = fitxersDe(estat.publicacio).sort();
  assert.equal(eixida.fitxers, publicats.length);
  const a = (rel) => llig(path.join(estat.publicacio, rel));

  assert.match(a('.well-known/host-meta'), new RegExp(`template="${ORIGEN.replace(/\./g, '\\.')}/\\.well-known/webfinger/\\{uri\\}"`));
  assert.deepEqual(JSON.parse(a('.well-known/nodeinfo')).links.map((enllac) => enllac.href), [`${ORIGEN}/nodeinfo/2.1.json`]);
  const nodeinfo = JSON.parse(a('nodeinfo/2.1.json'));
  assert.equal(nodeinfo.version, '2.1');
  assert.deepEqual(nodeinfo.software, { name: 'socdepoble', version: estat.manifest.release, homepage: `${ORIGEN}/` });
  assert.equal(nodeinfo.openRegistrations, false);
  assert.deepEqual(nodeinfo.usage, { users: {} });

  const actors = publicats.filter((rel) => rel.startsWith('ap/actors/'));
  assert.ok(actors.length > 0);
  for (const rel of actors) {
    const actor = JSON.parse(a(rel));
    assert.equal(actor.id, `${ORIGEN}/${rel}`);
    for (const camp of ['inbox', 'outbox', 'followers', 'url']) assert.ok(actor[camp].startsWith(`${ORIGEN}/`), `${rel} · ${camp}`);
    const jrd = JSON.parse(a(`.well-known/webfinger/${actor.preferredUsername}.json`));
    assert.equal(jrd.subject, `acct:${actor.preferredUsername}@gentdexixona.example`);
  }
  const nginx = a('.well-known/webfinger.nginx');
  assert.ok(nginx.includes('gentdexixona\\.example'));
  assert.ok(!nginx.includes('socdepoble\\.org'));
  for (const rel of publicats) assert.ok(!a(rel).includes('socdepoble.org'), `${rel} porta l'origen del Mas`);
});

test('[DEFECTE] el node de Xixona encara hereta La Torre de la release: actor federat, reescriptures de firebase.json i llavor', () => {
  /* Deute confirmat i declarat (B4, 261101; qüestió oberta al Mestre). Esta prova passa perquè
     reproduïx el residu. POBLES_FEDERATS (src/data/activitypub.js, decisió del Mestre del
     31-10-2026) i ACTORS_WEBFINGER_ESTATIC i ALIES_WEBFINGER (tooling/seo/genera-federacio.mjs) són
     constants de la release, i l'instal·lador no les parametritza: el node de Xixona publicaria
     @la-torre-de-les-macanes@gentdexixona.example i cap actor de Xixona. El firebase.json copiat
     porta les reescriptures de WebFinger lligades a socdepoble.org. Quan la federació llija la
     identitat del node, esta prova s'ha d'invertir: actor xixona, cap actor de La Torre. */
  assert.equal(estat.federacio?.status, 0, estat.federacio?.stderr);
  assert.deepEqual(JSON.parse(estat.federacio.stdout).actors, ['socdepoble', 'la-torre-de-les-macanes']);
  const a = (rel) => path.join(estat.publicacio, rel);
  assert.equal(fs.existsSync(a('ap/actors/xixona.json')), false);
  assert.equal(fs.existsSync(a('.well-known/webfinger/xixona.json')), false);
  assert.match(llig(a('ap/actors/la-torre-de-les-macanes.json')), RESIDU_TORRE);
  assert.equal(JSON.parse(llig(a('.well-known/webfinger/la-torre-de-les-macanes.json'))).subject,
    'acct:la-torre-de-les-macanes@gentdexixona.example');
  assert.match(llig(a('.well-known/webfinger.nginx')), RESIDU_TORRE);

  const firebase = llig(path.join(estat.desti, 'firebase.json'));
  assert.match(firebase, RESIDU_TORRE);
  assert.ok(firebase.includes('socdepoble\\\\.org'), 'les reescriptures de WebFinger són per a l’origen del Mas');
  assert.ok(!firebase.includes('gentdexixona'));

  // La llavor de demostració (mode seed) viatja sencera: fotos i pàgines de La Torre dins de public/ i src/.
  assert.ok(estat.manifest.fitxers.some(({ cami }) => cami.startsWith('public/') && RESIDU_TORRE.test(cami)));
});
