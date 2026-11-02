/** Higiene estructural del repositori · IDEA-62 (T4, prompt 261102_1532).
 *
 *  Nou regles que hui són verdes (H1-H9), cadascuna una funció pura exportada
 *  (infraccionsHn) que la sonda final prova amb llistes sintètiques: la guarda
 *  ha de mossegar. Les regles que hui fallen NO entren ací: són diferides, amb
 *  evidència, al dipòsit per a MarIA
 *  _wiki_de_poble/04_escriptori/02_investigacio_ia/261102_1640_claude/governanca/LLEGIM_HIGIENE.txt
 *
 *  Zero dependències de npm: node:test, node:fs, node:path, node:child_process,
 *  node:url i node:assert/strict. Les regles (git) lligen l'índex amb
 *  `git ls-files -z`; si git no respon, la prova es salta amb motiu, mai un
 *  verd fingit. Les regles (disc) recorren el disc sense seguir enllaços
 *  simbòlics; per nom només salten node_modules i .git, a qualsevol fondària, i per
 *  ruta exacta l'eixida de build wordpress-plugin/dist (A3, àrbitre 261102): una
 *  carpeta src/sections/android/ o public/build/ entra al recorregut. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as empaquetador from '../wordpress-plugin/eines/empaqueta.mjs';
import * as brossaArrel from '../tooling/higiene/neteja_brossa_arrel.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Els únics noms que se salten a qualsevol fondària. EXCLOSOS de tooling/lib/arrel.mjs
   (dist, build, android, ios…) NO s'aplica dins de src/ ni public/: amagaria carpetes
   de producte amb eixos noms (A3, àrbitre 261102). */
export const SALTATS_SEMPRE = Object.freeze(new Set(['node_modules', '.git']));

/** Si el recorregut ha de saltar la carpeta `rutaRel` (nom `nom`): per nom (SALTATS_SEMPRE)
 *  o per ruta exacta (saltaRutes, les eixides de build de la regla). Pura. */
export function salta(rutaRel, nom, saltaRutes = new Set()) {
  return SALTATS_SEMPRE.has(nom) || saltaRutes.has(rutaRel);
}

/* PATRONS_BROSSA és l'export de tooling/higiene/neteja_brossa_arrel.mjs:27
   (verificat 261102); la còpia local és la mateixa llista, per si l'export canvia de nom. */
const PATRONS_BROSSA = Array.isArray(brossaArrel.PATRONS_BROSSA)
  ? brossaArrel.PATRONS_BROSSA
  : Object.freeze([
    /\.log$/i, /\.diff$/i, /\.patch$/i, /\.orig$/i, /\.rej$/i, /\.tmp$/i, /~$/,
    /^test_output.*\.txt$/i, /^lint_results.*\.json$/i, /^eslint_errors/i, /^orphans\./i,
    /^probe_.*\.m?js$/i, /^scratchpad_.*\.m?js$/i, /^test-imports\.m?js$/i,
  ]);

/* ─────────────────────────── Lectors del món real ─────────────────────────── */

/** Rutes seguides per git (relatives a l'arrel), o null si git no respon. */
function seguits() {
  const r = spawnSync('git', ['-C', ARREL, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  return r.status === 0 ? r.stdout.split('\0').filter(Boolean) : null;
}

/** Recorregut del disc sota ARREL/rel: fitxers com «a/b.js», carpetes com «a/b/».
 *  No seguix enllaços simbòlics; salta només el que diu salta() (per nom, SALTATS_SEMPRE;
 *  per ruta exacta, saltaRutes). */
function recorre(rel, acc = [], saltaRutes = new Set()) {
  let entrades;
  try { entrades = fs.readdirSync(path.join(ARREL, rel), { withFileTypes: true }); } catch { return acc; }
  for (const e of entrades.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (e.isSymbolicLink()) continue;
    const fill = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (salta(fill, e.name, saltaRutes)) continue;
      acc.push(`${fill}/`);
      recorre(fill, acc, saltaRutes);
    } else if (e.isFile()) {
      acc.push(fill);
    }
  }
  return acc;
}

/** Entrades de primer nivell d'una carpeta (noms), ordenades. */
function primerNivell(rel) {
  return fs.readdirSync(path.join(ARREL, rel), { withFileTypes: true }).map((e) => e.name).sort();
}

function existixCarpeta(rel) {
  const estat = fs.statSync(path.join(ARREL, rel), { throwIfNoEntry: false });
  return Boolean(estat && estat.isDirectory());
}

/** Lleva comentaris de bloc i de línia amb un escàner lineal de caràcters, sense regex
 *  (A1, àrbitre 261102). Estats: codi · cadena ' · cadena " · plantilla ` · comentari de
 *  línia · comentari de bloc. Només es blanquegen els trams en estat comentari (cada
 *  caràcter → un espai; els salts de línia es conserven, així la llargària no canvia).
 *  Un «/*» o un «//» dins d'una cadena (globs de Vite, URL) no obri res; un «/» escapat
 *  («\/» d'un literal de regex) tampoc. Les cadenes ' i " moren també al salt de línia
 *  per a no arrossegar mai un fitxer sencer darrere d'un apòstrof de JSX. */
export function senseComentaris(text) {
  const eixida = [];
  let estat = 'codi';
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const seguent = text[i + 1];
    if (estat === 'codi') {
      if (c === '/' && (seguent === '/' || seguent === '*') && text[i - 1] !== '\\') {
        estat = seguent === '/' ? 'linia' : 'bloc';
        eixida.push('  ');
        i += 1;
      } else {
        if (c === '\'') estat = 'simple';
        else if (c === '"') estat = 'doble';
        else if (c === '`') estat = 'plantilla';
        eixida.push(c);
      }
    } else if (estat === 'linia') {
      if (c === '\n') { estat = 'codi'; eixida.push(c); } else eixida.push(' ');
    } else if (estat === 'bloc') {
      if (c === '*' && seguent === '/') { estat = 'codi'; eixida.push('  '); i += 1; } else eixida.push(c === '\n' ? c : ' ');
    } else {
      // Dins d'una cadena: l'escapament arrossega el caràcter següent; ' i " moren al salt de línia.
      if (c === '\\' && seguent !== undefined) { eixida.push(c, seguent); i += 1; continue; }
      if ((estat === 'simple' && (c === '\'' || c === '\n')) || (estat === 'doble' && (c === '"' || c === '\n')) || (estat === 'plantilla' && c === '`')) estat = 'codi';
      eixida.push(c);
    }
  }
  return eixida.join('');
}

function assertaBuit(infraccions, regla) {
  assert.deepEqual(infraccions, [], [
    `${regla.id} · ${regla.titol}`,
    `Ubicació correcta: ${regla.ubicacio}`,
    `Infractors (${infraccions.length}):`,
    ...infraccions.map((i) => `- ${i}`),
  ].join('\n'));
}

const nomDe = (ruta) => ruta.replace(/\/$/, '').split('/').at(-1);

/* ─────────────────────────── Regles pures (H1-H9) ─────────────────────────── */

/* H1b (diferida, dipòsit): els 69 «.DS-Store» amb guió de public/ no entren ací. */
const RE_EXT_H1 = /\.(?:orig|rej|log|bak|zip|apk|aab|jks|keystore|p12|mobileprovision)$/i;
export const H1 = Object.freeze({ id: 'H1', titol: 'cap fitxer seguit per git és brossa del sistema o un artefacte (.DS_Store, ._*, .orig, .rej, .log, .bak, .zip, .apk, .aab, .jks, .keystore, .p12, .mobileprovision)', ubicacio: 'fora de l\'índex: git rm --cached i patró a .gitignore; els artefactes van a wordpress-plugin/builds/ o a 01_produccio/ sense versionar' });
export function infraccionsH1(rutes) {
  return rutes.filter((r) => {
    const nom = nomDe(r);
    return nom === '.DS_Store' || nom.startsWith('._') || RE_EXT_H1.test(nom);
  });
}

export const PREFIXOS_H2 = Object.freeze([
  'dist/', 'dist-natiu/', 'wordpress-plugin/dist/', 'wordpress-plugin/builds/directori/dist/',
  'android/app/src/main/assets/public/', 'android/app/build/', 'ios/App/App/public/', 'ios/App/Pods/',
]);
export const H2 = Object.freeze({ id: 'H2', titol: 'cap eixida de build seguida per git', ubicacio: `fora de l'índex (git rm -r --cached): ${PREFIXOS_H2.join(', ')} es regeneren amb el build` });
export function infraccionsH2(rutes) {
  return rutes.filter((r) => PREFIXOS_H2.some((p) => r.startsWith(p)));
}

/* Una plantilla pública (.env.example o .env.<canal>.example) no porta secrets: es tolera (A7, àrbitre 261102). */
const RE_PLANTILLA_ENV = /^\.env(?:\..+)?\.example$/;
export const H3 = Object.freeze({ id: 'H3', titol: 'cap fitxer d\'entorn seguit per git (basename .env*), llevat de les plantilles .env.example i .env.<canal>.example', ubicacio: 'fora de l\'índex (git rm --cached) i rotació dels secrets; només les plantilles *.example es versionen' });
export function infraccionsH3(rutes) {
  return rutes.filter((r) => {
    const nom = nomDe(r);
    return nom.startsWith('.env') && !RE_PLANTILLA_ENV.test(nom);
  });
}

export const PERMESES_WP = Object.freeze(new Set(['assets', 'builds', 'eines', 'includes', 'languages', 'readme.txt', 'socdepoble-enxufe.php', 'templates', 'uninstall.php']));
/* dist/ és l'outDir de vite.standalone.config.js:725 i empaqueta.mjs:604 la llig;
   viu al disc sense versionar (H2 ho garantix). No és una entrada del connector. */
export const EIXIDES_BUILD_WP = Object.freeze(new Set(['dist']));
/* Rutes exactes que H7 salta en recórrer: només eixes eixides de build (A3). */
export const SALTATS_H7 = Object.freeze(new Set([...EIXIDES_BUILD_WP].map((d) => `wordpress-plugin/${d}`)));
export const H4 = Object.freeze({ id: 'H4', titol: 'wordpress-plugin/ només té les entrades del connector', ubicacio: `wordpress-plugin/ admet ${[...PERMESES_WP].join(', ')} (més l'eixida de build ${[...EIXIDES_BUILD_WP].join(', ')} sense versionar); la resta va a tooling/, tests/ o a l'Escriptori` });
export function infraccionsH4(entrades) {
  return entrades.filter((n) => !n.startsWith('.') && !PERMESES_WP.has(n) && !EIXIDES_BUILD_WP.has(n));
}

/* H14 (diferida, dipòsit): els banner-*.png no es prohibixen ací. */
const RE_VITRINA_H5 = /(^|\/)(icon-\d+x\d+\.png|icon\.svg|screenshot-\d+\.(png|jpe?g))$/;
const RE_DESENVOLUPAMENT_H5 = /\.(test\.[a-z]+|md|log|orig|sql)$/;
export const H5 = Object.freeze({ id: 'H5', titol: 'cap actiu de vitrina, fitxer de desenvolupament ni ocult entre els fitxers de l\'adaptador (fitxersAdaptador)', ubicacio: 'la vitrina viu a wordpress-plugin/assets/ (fora d\'ADAPTADOR); proves i documentació a tests/ i a la Wiki; cap segment que comence per «.»' });
export function infraccionsH5(rels) {
  return rels.filter((rel) => RE_VITRINA_H5.test(rel) || RE_DESENVOLUPAMENT_H5.test(rel) || rel.split('/').some((s) => s.startsWith('.')));
}

/* Els formats que WordPress.org admet a la vitrina (A7, àrbitre 261102): bàners png|jpg,
   icones png|jpg més icon.svg, captures png|jpg|jpeg|gif, i la carpeta blueprints/ del
   Playground amb només blueprint.json. */
const RE_VITRINA_H6 = /^(banner-(772x250|1544x500)\.(png|jpe?g)|icon-(128x128|256x256)\.(png|jpe?g)|icon\.svg|screenshot-\d+\.(png|jpe?g|gif))$/;
export const H6 = Object.freeze({ id: 'H6', titol: 'wordpress-plugin/assets/ només conté la vitrina de WordPress.org', ubicacio: 'wordpress-plugin/assets/ admet banner-772x250 i banner-1544x500 (png|jpg), icon-128x128 i icon-256x256 (png|jpg), icon.svg, screenshot-N (png|jpg|jpeg|gif) i blueprints/blueprint.json; els recursos de l\'app van a public/' });
/* Els noms que comencen per «.» (p. ex. .DS_Store del Finder) els governa .gitignore:6 i H1, no esta regla. */
export function infraccionsH6(noms, dinsBlueprints = []) {
  return [
    ...noms.filter((n) => !n.startsWith('.') && n !== 'blueprints' && !RE_VITRINA_H6.test(n)),
    ...dinsBlueprints.filter((n) => !n.startsWith('.') && n !== 'blueprint.json').map((n) => `blueprints/${n}`),
  ];
}

export const H7 = Object.freeze({ id: 'H7', titol: 'cap prova ni documentació fora de la seua capa (public/, src/, tooling/, wordpress-plugin/)', ubicacio: 'proves node:test a tests/ (*.test.mjs); proves Vitest a src/ (*.test.js|jsx); documentació a la Wiki; __fixtures__ a tests/fixtures/' });
export function infraccionsH7(rutes) {
  return rutes.filter((r) => {
    const segs = r.replace(/\/$/, '').split('/');
    const nom = segs.at(-1);
    switch (segs[0]) {
      /* O3-GEMINI-1 (261102) · Els .md de primer nivell de public/opendata/ són recursos
         del Data Package (llicencies.md, memoria.md), no documentació: el manifest els cita. */
      case 'public': return /\.test\./.test(nom) || (/\.md$/i.test(nom) && !(segs.length === 3 && segs[1] === 'opendata')) || segs.includes('__fixtures__');
      case 'src': return /\.test\.mjs$/.test(nom);
      case 'tooling': return /\.test\.jsx?$/.test(nom);
      case 'wordpress-plugin': return /\.test\./.test(nom);
      default: return false;
    }
  });
}

export const CARPETES_UI_H8 = Object.freeze(['app', 'apps', 'components', 'sections', 'hooks', 'pages', 'pwa', 'natiu', 'utils', 'config']);
/* src/host.js queda fora a posta: és l'únic punt que enxufa data/supabase/ (host.js:220). */
export const EXCEPCIONS_H8 = Object.freeze(new Set([]));
const RE_CAPA_H8 = /data\/(?:supabase|local|adaptadors\/(?:sollutia|supabase))\//;
/* Un import estàtic (amb o sense from), un export ... from, o un import() dinàmic.
   El tram lliure s'atura a ; ' " ` per a no recórrer mai el fitxer sencer. */
const RE_ESTATIC_H8 = /\b(?:import|export)\b(?:[^;'"`]*?\bfrom)?\s*['"]([^'"\n]*)['"]/g;
const RE_DINAMIC_H8 = /\bimport\s*\(\s*['"]([^'"\n]*)['"]/g;
const RE_PROVA = /\.(?:test|spec)\.[cm]?jsx?$/;
export const H8 = Object.freeze({ id: 'H8', titol: 'cap capa de UI de src/ importa data/supabase/, data/local/ ni data/adaptadors/(sollutia|supabase)/', ubicacio: 'la UI parla amb el port neutral src/data/backendPort.js; només src/host.js enxufa l\'adaptador' });
export function infraccionsH8(fonts) {
  const eixida = [];
  for (const { ruta, text } of fonts) {
    if (EXCEPCIONS_H8.has(ruta)) continue;
    const net = senseComentaris(text);
    for (const re of [RE_ESTATIC_H8, RE_DINAMIC_H8]) {
      for (const m of net.matchAll(re)) if (RE_CAPA_H8.test(m[1])) eixida.push(`${ruta} → ${m[1]}`);
    }
  }
  return eixida;
}

export const H9 = Object.freeze({ id: 'H9', titol: 'cap fitxer solt de l\'arrel casa amb PATRONS_BROSSA (tooling/higiene/neteja_brossa_arrel.mjs)', ubicacio: 'les sondes i eixides van a l\'Escriptori o a la carpeta temporal de la sessió; node tooling/higiene/neteja_brossa_arrel.mjs --aplica les retira a .sdp-paperera/' });
/* Mateix perímetre que candidats() de l'eina: fitxers solts que no comencen per «.». */
export function infraccionsH9(noms) {
  return noms.filter((n) => !n.startsWith('.') && PATRONS_BROSSA.some((re) => re.test(n)));
}

/* ─────────────────────────── Proves sobre el món real ─────────────────────────── */

function ambGit(t) {
  const llista = seguits();
  if (!llista) t.skip('git ls-files no respon en esta màquina: la regla (git) no es pot comprovar, i no es fingix cap verd');
  return llista;
}

test('H1 · cap brossa del sistema ni artefacte seguit per git', (t) => {
  const llista = ambGit(t);
  if (!llista) return;
  assert.ok(llista.length > 100, 'git ls-files ha tornat massa poc: no és el repositori sencer');
  assertaBuit(infraccionsH1(llista), H1);
});

test('H2 · cap eixida de build seguida per git', (t) => {
  const llista = ambGit(t);
  if (!llista) return;
  assertaBuit(infraccionsH2(llista), H2);
});

test('H3 · cap .env seguit per git llevat de les plantilles *.example', (t) => {
  const llista = ambGit(t);
  if (!llista) return;
  assert.ok(llista.includes('.env.example'), '.env.example ha de ser al repositori: és la plantilla pública dels secrets');
  assertaBuit(infraccionsH3(llista), H3);
});

test('H4 · wordpress-plugin/ només té les entrades del connector', () => {
  const entrades = primerNivell('wordpress-plugin');
  assert.ok(entrades.includes('socdepoble-enxufe.php'), 'el connector ha de ser a wordpress-plugin/');
  assertaBuit(infraccionsH4(entrades), H4);
});

/* La llista de l'adaptador sense passar per comprovaHigienePaquet(): ADAPTADOR.fitxers més el
   recorregut propi de ADAPTADOR.carpetes (amb ocults). Només s'usa quan fitxersAdaptador() llança,
   perquè H5 puga imprimir la llista completa en el seu format (A4, àrbitre 261102). */
function adaptadorSenseFiltre() {
  const rels = [...empaquetador.ADAPTADOR.fitxers];
  for (const carpeta of empaquetador.ADAPTADOR.carpetes) {
    for (const ruta of recorre(`wordpress-plugin/${carpeta}`)) if (!ruta.endsWith('/')) rels.push(ruta.slice('wordpress-plugin/'.length));
  }
  return rels;
}

test('H5 · l\'adaptador (fitxersAdaptador) no porta vitrina, desenvolupament ni ocults', () => {
  let rels = null;
  let rebuig = null;
  if (typeof empaquetador.fitxersAdaptador === 'function') {
    try { rels = empaquetador.fitxersAdaptador().map((e) => e.rel); } catch (error) { rebuig = error.message; }
  }
  if (!rels) rels = adaptadorSenseFiltre();
  assert.ok(rels.includes('socdepoble-enxufe.php') && rels.includes('readme.txt'), 'l\'adaptador ha de portar el connector i el readme');
  const infraccions = infraccionsH5(rels);
  // L'empaquetador ha rebutjat l'adaptador per un motiu que H5 no cobrix: roig igualment, amb el seu motiu.
  if (rebuig !== null && infraccions.length === 0) infraccions.push(`(rebuig de fitxersAdaptador) ${rebuig.replace(/\n/g, ' ')}`);
  assertaBuit(infraccions, H5);
});

test('H6 · wordpress-plugin/assets/ és només la vitrina de WordPress.org', () => {
  const noms = primerNivell('wordpress-plugin/assets');
  assert.ok(noms.includes('icon.svg'), 'la vitrina ha de tindre icon.svg');
  const dinsBlueprints = noms.includes('blueprints') && existixCarpeta('wordpress-plugin/assets/blueprints') ? primerNivell('wordpress-plugin/assets/blueprints') : [];
  assertaBuit(infraccionsH6(noms, dinsBlueprints), H6);
});

test('H7 · cap prova ni documentació fora de la seua capa', () => {
  const rutes = [];
  for (const carpeta of ['public', 'src', 'tooling', 'wordpress-plugin']) {
    assert.ok(existixCarpeta(carpeta), `${carpeta}/ ha d'existir: sense ella la regla seria un verd buit`);
    recorre(carpeta, rutes, SALTATS_H7);
  }
  assert.ok(rutes.length > 100, 'el recorregut ha tornat massa poc: no és el repositori sencer');
  assertaBuit(infraccionsH7(rutes), H7);
});

test('H8 · la UI de src/ no importa cap adaptador de dades directament', () => {
  const fonts = [];
  for (const carpeta of CARPETES_UI_H8) {
    const rel = `src/${carpeta}`;
    assert.ok(existixCarpeta(rel), `${rel}/ ha d'existir: la llista de capes de UI és la del prompt 261102_1532`);
    for (const ruta of recorre(rel)) {
      if (ruta.endsWith('/') || !/\.jsx?$/.test(ruta) || RE_PROVA.test(nomDe(ruta))) continue;
      fonts.push({ ruta, text: fs.readFileSync(path.join(ARREL, ruta), 'utf8') });
    }
  }
  assert.ok(fonts.length > 100, 'massa pocs fitxers de UI llegits: no és el repositori sencer');
  assertaBuit(infraccionsH8(fonts), H8);
});

test('H9 · cap brossa solta a l\'arrel del repositori', () => {
  const noms = fs.readdirSync(ARREL, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name).sort();
  assert.ok(noms.includes('package.json') && noms.includes('AGENTS.md'), 'l\'arrel ha de ser la del repositori');
  assertaBuit(infraccionsH9(noms), H9);
});

/* ─────────────────────────── La guarda mossega ─────────────────────────── */

test('la guarda mossega (sonda)', () => {
  assert.deepEqual(infraccionsH1(['a/.DS_Store', 'b/._resource', 'builds/x.ZIP', 'android/clau.keystore', 'src/ok.js']),
    ['a/.DS_Store', 'b/._resource', 'builds/x.ZIP', 'android/clau.keystore']);
  assert.deepEqual(infraccionsH2(['dist/index.html', 'ios/App/Pods/x.m', 'android/app/build/a', 'src/ok.js']),
    ['dist/index.html', 'ios/App/Pods/x.m', 'android/app/build/a']);
  assert.deepEqual(infraccionsH3(['.env', 'bot/.env.local', '.env.example', '.env.botigues.example', '.env.example.local', 'src/env.js']),
    ['.env', 'bot/.env.local', '.env.example.local']);
  assert.deepEqual(infraccionsH4(['assets', 'vendor', '.DS_Store', 'dist', 'node_modules', 'readme.txt']), ['vendor', 'node_modules']);
  assert.deepEqual(infraccionsH5(['assets/icon.svg', 'readme.md', 'includes/.amagat.php', 'includes/x.test.js', 'includes/ok.php']),
    ['assets/icon.svg', 'readme.md', 'includes/.amagat.php', 'includes/x.test.js']);
  assert.deepEqual(infraccionsH6(
    ['banner-772x250.png', 'banner-1544x500.jpg', 'logo.png', 'icon-64x64.png', 'screenshot-1.png', 'screenshot-2.gif', 'banner-772x250.webp', 'blueprints'],
    ['blueprint.json', 'notes.md'],
  ), ['logo.png', 'icon-64x64.png', 'banner-772x250.webp', 'blueprints/notes.md']);
  assert.deepEqual(infraccionsH7([
    'public/x.test.js', 'public/notes.md', 'public/__fixtures__/', 'public/__fixtures__/a.json', 'src/a.test.mjs', 'src/sections/android/x.test.mjs',
    'tooling/b.test.js', 'tooling/c.test.jsx', 'wordpress-plugin/d.test.php', 'src/ok.test.js', 'public/foto.jpg', 'tooling/ok.test.mjs',
    'public/opendata/llicencies.md', 'public/opendata/sub/notes.md', 'public/opendata/x.test.js', 'public/docs/opendata/notes.md',
  ]), ['public/x.test.js', 'public/notes.md', 'public/__fixtures__/', 'public/__fixtures__/a.json', 'src/a.test.mjs', 'src/sections/android/x.test.mjs', 'tooling/b.test.js', 'tooling/c.test.jsx', 'wordpress-plugin/d.test.php',
    'public/opendata/sub/notes.md', 'public/opendata/x.test.js', 'public/docs/opendata/notes.md']);
  // A3: el recorregut salta per nom només node_modules i .git, i per ruta exacta les eixides de build.
  assert.equal(salta('src/sections/android', 'android', SALTATS_H7), false);
  assert.equal(salta('public/build', 'build', SALTATS_H7), false);
  assert.equal(salta('wordpress-plugin/includes/dist', 'dist', SALTATS_H7), false);
  assert.equal(salta('wordpress-plugin/dist', 'dist', SALTATS_H7), true);
  assert.equal(salta('src/x/node_modules', 'node_modules', SALTATS_H7), true);
  assert.deepEqual(infraccionsH8([
    { ruta: 'src/sections/x.jsx', text: "import { a } from '../data/supabase/index.js';" },
    { ruta: 'src/utils/y.js', text: "const m = await import('../../data/local/notes.js');" },
    { ruta: 'src/hooks/z.js', text: "export { b } from\n  '../data/adaptadors/sollutia/client.js';" },
    { ruta: 'src/pages/w.jsx', text: "// import x from '../data/supabase/index.js'\n/* import y from '../data/local/x.js' */\nimport { port } from '../data/backendPort.js';\nconst url = 'https://socdepoble.org/data/supabase/';" },
    { ruta: 'src/apps/v.js', text: "import { n } from '../data/adaptadors/noticies/client.js';" },
    // A1 (àrbitre 261102): «/*» dins d'una cadena (glob de Vite) no obri cap comentari de bloc.
    { ruta: 'src/components/g.js', text: "const F = import.meta.glob('../assets/alergens/*.svg', { eager: true });\nimport { s } from '../data/supabase/index.js';\n/* bloc real */\nexport default F;" },
    // A1: «//» dins d'una cadena no obri cap comentari de línia.
    { ruta: 'src/pwa/h.js', text: "const base = 'cdn//ruta'; import { l } from '../data/local/notes.js';" },
  ]), [
    'src/sections/x.jsx → ../data/supabase/index.js',
    'src/utils/y.js → ../../data/local/notes.js',
    'src/hooks/z.js → ../data/adaptadors/sollutia/client.js',
    'src/components/g.js → ../data/supabase/index.js',
    'src/pwa/h.js → ../data/local/notes.js',
  ]);
  assert.deepEqual(infraccionsH9(['probe_x.mjs', 'eixida.log', 'README.md', 'pegat.patch', '.env.local']), ['probe_x.mjs', 'eixida.log', 'pegat.patch']);

  // senseComentaris: correcte sobre un fitxer gran, conserva la llargària i les URL amb «//».
  // L'escàner és lineal per construcció; el llindar ample només caça una regressió grossa (A5).
  const gran = "const u = 'https://socdepoble.org'; /* bloc */ let x = 1; // línia\n".repeat(20000);
  const inici = Date.now();
  const net = senseComentaris(gran);
  assert.ok(Date.now() - inici < 10000, 'senseComentaris ha tardat massa: ja no és lineal');
  assert.equal(net.length, gran.length);
  assert.ok(net.includes("'https://socdepoble.org'") && !net.includes('bloc') && !net.includes('línia'));
  // Casos de vora de l'escàner: regex amb «\/», apòstrof de JSX tancat al salt de línia, plantilla multilínia.
  assert.equal(senseComentaris("const re = /https?:\\/\\//; // x"), "const re = /https?:\\/\\//;     ");
  assert.equal(senseComentaris("<p>L'aixada</p>\n// fora\nimport a from 'b';"), "<p>L'aixada</p>\n       \nimport a from 'b';");
  assert.equal(senseComentaris("const t = `a // b\n/* c */`; /* d */"), "const t = `a // b\n/* c */`;        ");
});
