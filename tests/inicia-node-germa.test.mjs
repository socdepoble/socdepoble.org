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
     · D-13 (pla 261101_1246): la federació és la del poble del node, llegida de node-germa.json:
       un sol actor, Xixona, amb el seu WebFinger, la seua outbox (la pàgina pública del poble) i
       el seu NodeInfo 2.1, i cap actor del projecte ni de La Torre de les Maçanes;
     · el repositori viu: quatre fitxers sentinella amb el mateix SHA-256, cap eixida coneguda a
       l'arrel i un directori de treball aïllat que queda buit;
     · [DEFECTE] el residu que el node encara hereta de la release: les reescriptures de WebFinger
       de firebase.json i la llavor de mostra (vegeu la prova).
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
import { iniciaNodeGerma, validaCompilacioNode } from '../tooling/instalador/inicia-node-germa.mjs';
import { enllacaNodeModules, contrastaNodeModules } from '../tooling/seo/comprova-reproductibilitat.mjs';
import * as activitypub from '../src/data/activitypub.js';
import { reglesFirebaseWebFinger } from '../tooling/seo/genera-federacio.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALADOR = path.join(ARREL, 'tooling/instalador/inicia-node-germa.mjs');
const ORIGEN = 'https://gentdexixona.example';
const SECRET = "sb_" + "secret_mai_ha_de_viatjar_al_node";
const CONFIG = Object.freeze({ slug: 'xixona', nom: 'Xixona', origen: ORIGEN, mode: 'seed', serviceRoleKey: SECRET });
/* La Torre de les Maçanes, el poble del Mas, en totes les formes que el repositori fa servir. */
const RESIDU_TORRE = /la[\s_-]*torre|ma[çc]anes|latorredelesmacanes|gentdelatorre/i;
/* Els tres fitxers que escriu l'instal·lador; la resta del destí és còpia de la release. */
const GENERATS = Object.freeze(['.env.local', 'INICIA_NODE.md', 'node-germa.json']);
/* Mirall de DIRECTORIS i FITXERS de tooling/instalador/inicia-node-germa.mjs: si l'instal·lador
   en copia d'altres, esta prova ho ha de saber. */
const DIRECTORIS = Object.freeze(['public', 'scripts', 'src', 'tooling', 'nix', '_wiki_de_poble/01_ser', '_wiki_de_poble/02_saber', '_wiki_de_poble/03_actuar']);
const FITXERS = Object.freeze(['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'firebase.json', 'flake.nix', 'flake.lock', 'LICENSE', 'AGENTS.md', '.agents/AGENTS.md']);
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
  const esperats = new Set([...GENERATS, ...DIRECTORIS, ...arrelDeLaFont].map(n => n.split('/')[0]));
  assert.deepEqual(new Set(fs.readdirSync(estat.desti)), esperats);

  const camins = manifest.fitxers.map(({ cami }) => cami);
  assert.deepEqual(camins, [...new Set(camins)].sort(), 'manifest ordenat i sense repeticions');
  // La release de la font amb les regles de l'instal·lador: cap tros que comence per punt ni cap directori exclòs.
  const release = [...arrelDeLaFont, ...DIRECTORIS.flatMap((dir) => fitxersDe(path.join(estat.font, dir), dir))]
    .filter((rel) => rel === '.agents/AGENTS.md' || !rel.split('/').some((tros) => tros.startsWith('.') || EXCLOSOS.has(tros)))
    .sort();
  assert.deepEqual(camins, release, 'el manifest és la release de la font, ni més ni menys');
  const copiats = fitxersDe(estat.desti).filter((rel) => !GENERATS.includes(rel)).sort();
  assert.deepEqual(copiats, release);
  for (const { cami, sha256, sha256Font } of manifest.fitxers) {
    assert.equal(sha(fs.readFileSync(path.join(estat.font, cami))), sha256Font ?? sha256, `font · ${cami}`);
    assert.equal(sha(fs.readFileSync(path.join(estat.desti, cami))), sha256, cami);
    if (sha256Font) assert.equal(cami, 'firebase.json', 'només Firebase es transforma');
  }
  for (const absent of ['.git', 'node_modules', 'dist', '_wiki_de_poble/04_escriptori', '_wiki_de_poble/90_arxiu_historic', 'tests', 'supabase', 'wordpress-plugin']) {
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

/* D-13 (pla 261101_1246, carril T3) · Gir del [DEFECTE] «el node de Xixona encara hereta La Torre»:
   tooling/seo/genera-federacio.mjs llig node-germa.json (el que escriu l'instal·lador) i el node
   publica el seu poble. Esta prova executa el generador de la release de HEAD: passa quan el canvi
   està confirmat. Abans del commit, el bloc «D-13» de tooling/seo/genera-federacio.test.mjs ho
   prova amb el codi viu i una arrel fixture. */
test('D-13 · la federació del node és la de Xixona: un sol actor, amb el seu WebFinger, la seua outbox i el seu NodeInfo 2.1', () => {
  assert.equal(estat.federacio?.status, 0, estat.federacio?.stderr);
  assert.deepEqual(JSON.parse(estat.federacio.stdout).actors, ['xixona']);
  const a = (rel) => path.join(estat.publicacio, rel);
  const actor = JSON.parse(llig(a('ap/actors/xixona.json')));
  assert.deepEqual([actor.id, actor.preferredUsername, actor.name, actor.url], [`${ORIGEN}/ap/actors/xixona.json`, 'xixona', 'Xixona · Sóc de Poble', `${ORIGEN}/`]);
  assert.match(actor.summary, /No és el compte oficial de l’Ajuntament/);
  assert.equal(JSON.parse(llig(a('.well-known/webfinger/xixona.json'))).subject, 'acct:xixona@gentdexixona.example');
  const outbox = JSON.parse(llig(a('ap/outbox/xixona.json')));
  assert.ok(outbox.totalItems >= 1, `l'outbox del node no és buida: ${outbox.totalItems}`);
  assert.deepEqual([outbox.orderedItems.at(-1).object.name, outbox.orderedItems.at(-1).object.url], ['Xixona a Sóc de Poble', `${ORIGEN}/`]);
  assert.equal(JSON.parse(llig(a('nodeinfo/2.1.json'))).metadata.nodeName, 'Xixona · Sóc de Poble');
  for (const absent of ['ap/actors/socdepoble.json', 'ap/actors/la-torre-de-les-macanes.json', '.well-known/webfinger/socdepoble.json',
    '.well-known/webfinger/la-torre-de-les-macanes.json', 'ap/outbox/la-torre-de-les-macanes.json']) {
    assert.equal(fs.existsSync(a(absent)), false, absent);
  }
  // Cap fitxer publicat pel node porta La Torre, en cap de les seues formes.
  for (const rel of fitxersDe(estat.publicacio)) assert.doesNotMatch(llig(a(rel)), RESIDU_TORRE, rel);
  // I la guia del node diu amb quin compte es troba.
  assert.ok(llig(path.join(estat.desti, 'INICIA_NODE.md')).includes('@xixona@gentdexixona.example'));
});

test('FEDI-05 · Firebase adapta WebFinger a Xixona amb les mateixes regles del generador; la llavor continua sent de mostra', () => {
  const firebase = JSON.parse(llig(path.join(estat.desti, 'firebase.json')));
  const regles = reglesFirebaseWebFinger({ap:activitypub,origen:ORIGEN,actors:[{slug:'xixona',perfil:'/'}],principals:['xixona']});
  assert.deepEqual(firebase.hosting.rewrites.filter(r => r.destination?.startsWith('/.well-known/webfinger/')),regles.rewrites);
  assert.deepEqual(firebase.hosting.headers.filter(r => r.source === '/.well-known/host-meta' || r.regex?.includes('webfinger')),regles.headers);
  const webfinger=JSON.stringify(regles);
  assert.doesNotMatch(webfinger,RESIDU_TORRE);
  assert.ok(!webfinger.includes('socdepoble'));
  assert.ok(webfinger.includes('gentdexixona'));
  assert.equal(firebase.hosting.site,undefined);
  assert.equal(firebase.hosting.target,undefined);
  assert.equal(estat.manifest.fitxers.find(f => f.cami === 'firebase.json').sha256Font,sha(fs.readFileSync(path.join(estat.font,'firebase.json'))));

  // La llavor de demostració (mode seed) viatja sencera: fotos i pàgines de La Torre dins de public/ i src/.
  assert.ok(estat.manifest.fitxers.some(({ cami }) => cami.startsWith('public/') && RESIDU_TORRE.test(cami)));
});

test('FEDI-05 · compilació Vite real de la còpia instal·lada i validació de la identitat emesa', {skip:process.env.SDP_NODE_GERMA_BUILD_REAL !== '1'}, () => {
  const dependencies=contrastaNodeModules(ARREL);
  assert.equal(dependencies.absents,0, 'dependències locals exigides pel lock presents');
  assert.deepEqual(dependencies.diferents,[],'versions de dependències iguals al lock');
  enllacaNodeModules(path.join(ARREL,'node_modules'),path.join(estat.desti,'node_modules'));
  const resultat=spawnSync('npm',['run','build:web'],{cwd:estat.desti,encoding:'utf8',timeout:180_000,maxBuffer:16*1024*1024,
    env:{...entornSenseVite(),HUSKY:'0',SDP_SOCIAL_SENSE_REMOT:'1',SOURCE_DATE_EPOCH:'0'}});
  assert.equal(resultat.status,0,resultat.stderr+'\n'+resultat.stdout.slice(-3000));
  assert.equal(validaCompilacioNode(estat.desti,CONFIG).actor,`${ORIGEN}/ap/actors/xixona.json`);
});
