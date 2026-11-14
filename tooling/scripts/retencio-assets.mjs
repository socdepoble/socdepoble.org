#!/usr/bin/env node
/* Onada R24 · Consola Zero (P-A de l'informe 261114 «consola_404_chunks») ·
 * Retenció dels recursos amb empremta entre desplegaments de Firebase Hosting.
 *
 *   node tooling/scripts/retencio-assets.mjs arxiva    --dist dist --arxiu <A> [--creat ISO] [--commit X] [--json]
 *   node tooling/scripts/retencio-assets.mjs incorpora --dist dist --arxiu <A> [--builds 3] [--dies 30] [--max-mb 64] [--retira <nom>]… [--json]
 *   node tooling/scripts/retencio-assets.mjs comprova  --dist dist [--html <index.html d'un altre build>] [--json]
 *
 * Per què: Firebase publica versions atòmiques des de dist/ i `vite build`
 * buida dist/; una pestanya oberta abans d'un desplegament demana trossos
 * que ja no existixen (404 de modulepreload, «about:client:1»). L'únic remei
 * que deixa la consola a zero és que el fitxer vell continue existint.
 *
 * L'ordre de desplegament és build → arxiva → incorpora → deploy
 * (scripts/botigues/publica-tot.mjs). L'arxiu és fora del repositori i fora
 * de dist/, i --arxiu és OBLIGATORI: cap valor per defecte no crea carpetes
 * (la ubicació la decidix el Mestre, D-consola-1). Ha d'existir; dins s'hi
 * creen pool/ (un nom = un contingut), builds/ (un manifest
 * sdp.retencio-assets.v1 per build) i rebuts/ (què ha afegit cada incorpora).
 *
 *   · arxiva copia al pool cada fitxer de l'arrel de dist/assets que casa amb
 *     NOM_AMB_EMPREMTA (la mateixa expressió de public/sw.js i
 *     src/pwa/registre.js, sense «/assets/») i escriu el manifest. Un nom que
 *     ja hi és amb un altre SHA-256 avorta ABANS de copiar res (col·lisió o
 *     build no determinista). La mateixa entrada amb els mateixos fitxers no
 *     repetix manifest (idempotent). Cap enllaç simbòlic.
 *   · incorpora exigix que el build actual ja estiga arxivat (així l'ordre no
 *     es pot saltar), pren com a molt --builds manifests anteriors dins de
 *     --dies, i retén builds SENCERS o res: un build a mitges tornaria a donar
 *     404. Si un build no hi cap dins del sostre (--max-mb), ni ell ni cap més
 *     vell. Abans de copiar comprova la clausura de cada build (cada from,
 *     import d'efecte, import() i nom de __vite__mapDeps ha de ser a dist/ o
 *     al mateix build); si en falta un, el build queda fora amb un avís.
 *     --retira <nom> no copia eixe tros (un defecte de seguretat corregit) i
 *     el rebut ho diu. Només escriu dist/assets/<nom amb empremta>; el rebut va
 *     a <arxiu>/rebuts/, mai dins de dist/.
 *     R24 · Gauntlet (G-client-6, 7 i 8) · --retira també esborra de
 *     dist/assets el tros que una incorpora anterior ja hi havia copiat
 *     (postcondició: cap nom retirat no hi és, i el rebut ho diu a
 *     `retiratsDeDist`). Cada còpia planificada es valida al pool (existència i
 *     SHA-256) ABANS de copiar-ne cap: un pool corrupte no deixa cap build a
 *     mitges. I l'arxiu i el dist han de ser carpetes separades (realpath): un
 *     --arxiu dins de --dist (o al revés) publicaria el pool a Hosting (codi 2).
 *   · comprova recorre el graf d'un index.html (per defecte el de --dist)
 *     dins de dist/assets i diu cada tros que falta.
 *
 * Codis d'eixida: 0 bé; 1 refusat (col·lisió, clausura que falla a comprova,
 * build actual sense arxivar, pool corrupte); 2 ús o arxiu inexistent. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { recursosDArrencada } from '../gates/pressupost-paquet.mjs';

export const ESQUEMA = 'sdp.retencio-assets.v1';
export const ESQUEMA_REBUT = 'sdp.retencio-assets.rebut.v1';
/* public/sw.js i src/pwa/registre.js: RECURS_AMB_EMPREMTA sense «/assets/» (la prova en fixa la paritat). */
export const NOM_AMB_EMPREMTA = /^[^/]+-[A-Za-z0-9_-]{8}\.(js|mjs|css|woff2?)$/;
export const PER_DEFECTE = Object.freeze({ builds: 3, dies: 30, maxMb: 64 });
const PREFIX = '[retencio-assets]';
const DIA = 24 * 60 * 60 * 1000;

export class ErrorDeRetencio extends Error {}
class ErrorDUs extends Error {}

/* Les tres formes d'importar que escriu Rollup (minimitzat o no) i la llista de
   dependències de l'ajudant de precàrrega de Vite. Una sola passada cadascuna
   i cap quantificador niat. Mai el text lliure: wikiManifest ANOMENA trossos
   de builds vells en el seu contingut, i no n'importa cap. */
const NOM = '([^"\'`\\s/\\\\]+-[A-Za-z0-9_-]{8}\\.(?:js|mjs|css|woff2?))';
const IMPORT_ESTATIC = new RegExp(`(?:\\bfrom|\\bimport)\\s*["']\\./${NOM}["']`, 'g');
const IMPORT_DINAMIC = new RegExp(`\\bimport\\(\\s*["']\\./${NOM}["']\\s*\\)`, 'g');
const MAPA_DE_DEPENDENCIES = /__vite__mapDeps=\(i,m=__vite__mapDeps,d=\(m\.f\|\|\(m\.f=\[([^\]]*)\]/g;
const DEPENDENCIA = new RegExp(`["']assets/${NOM}["']`, 'g');
const URL_CSS = new RegExp(`url\\(\\s*["']?(?:\\./|/assets/)${NOM}["']?\\s*\\)`, 'g');

/** Els noms amb empremta que un tros JS o CSS importa del mateix directori. */
export function referenciesDelTros(text, nom = '') {
  const refs = new Set();
  const codi = String(text);
  if (/\.css$/.test(nom)) {
    for (const [, ref] of codi.matchAll(URL_CSS)) refs.add(ref);
    return refs;
  }
  for (const [, ref] of codi.matchAll(IMPORT_ESTATIC)) refs.add(ref);
  for (const [, ref] of codi.matchAll(IMPORT_DINAMIC)) refs.add(ref);
  for (const [, llista] of codi.matchAll(MAPA_DE_DEPENDENCIES)) {
    for (const [, ref] of llista.matchAll(DEPENDENCIA)) refs.add(ref);
  }
  return refs;
}

/* Un camí de l'HTML com a nom de l'arrel de /assets/, o null. */
const nomDeLAsset = (referencia) => {
  const m = /^\/assets\/([^/?#]+)$/.exec(String(referencia || ''));
  return m && NOM_AMB_EMPREMTA.test(m[1]) ? m[1] : null;
};

/** L'entrada del build: l'únic <script type="module" src="/assets/…">. */
export function entradaDeLHtml(html) {
  const { entrades } = recursosDArrencada(html);
  const noms = entrades.map(nomDeLAsset).filter(Boolean);
  if (entrades.length !== 1 || noms.length !== 1) {
    throw new ErrorDeRetencio(`l'index.html ha de tindre una sola entrada <script type="module" src="/assets/…"> (en té ${entrades.length})`);
  }
  return noms[0];
}

/** Els noms amb empremta que l'HTML fa baixar: l'entrada, els modulepreload i els full d'estil d'/assets/. */
export function referenciesDeLHtml(html) {
  const { entrades, precarregues } = recursosDArrencada(html);
  const estils = [...String(html).matchAll(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*>/gi)]
    .map(([etiqueta]) => /\bhref\s*=\s*["']?([^"'\s>]+)/i.exec(etiqueta)?.[1]);
  return [...new Set([...entrades, ...precarregues, ...estils].map(nomDeLAsset).filter(Boolean))];
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function carpetaExistent(cami, que) {
  const estat = fs.statSync(cami, { throwIfNoEntry: false });
  if (!estat || !estat.isDirectory()) throw new ErrorDUs(`${que} no existix o no és una carpeta: ${cami}`);
  return cami;
}

/* G-client-8 · L'arxiu no pot ser dins del dist (es desplegaria) ni contenir-lo. */
const conte = (pare, fill) => {
  const relatiu = path.relative(pare, fill);
  return relatiu === '' || (relatiu !== '..' && !relatiu.startsWith(`..${path.sep}`) && !path.isAbsolute(relatiu));
};
function carpetesSeparades(dist, arxiu) {
  carpetaExistent(dist, '--dist');
  const realDist = fs.realpathSync(dist);
  const realArxiu = fs.realpathSync(arxiu);
  if (conte(realDist, realArxiu) || conte(realArxiu, realDist)) {
    throw new ErrorDUs(`--arxiu (${realArxiu}) i --dist (${realDist}) han de ser carpetes separades: cap no pot ser dins de l'altra`);
  }
}

/* Una subcarpeta pròpia de l'arxiu (pool, builds, rebuts): real, mai un enllaç. */
function subcarpeta(arxiu, nom, { crea }) {
  const cami = path.join(arxiu, nom);
  const estat = fs.lstatSync(cami, { throwIfNoEntry: false });
  if (!estat) {
    if (!crea) return null;
    fs.mkdirSync(cami);
    return cami;
  }
  if (estat.isSymbolicLink() || !estat.isDirectory()) throw new ErrorDeRetencio(`${nom}/ de l'arxiu ha de ser una carpeta pròpia, no un enllaç simbòlic: ${cami}`);
  return cami;
}

/** Els fitxers amb empremta de l'arrel de dist/assets, ordenats, amb bytes i SHA-256. Cap enllaç simbòlic. */
export function inventariaAssets(dist) {
  const assets = carpetaExistent(path.join(dist, 'assets'), 'dist/assets');
  const fitxers = [];
  for (const entrada of fs.readdirSync(assets, { withFileTypes: true })) {
    if (!NOM_AMB_EMPREMTA.test(entrada.name)) continue;
    if (entrada.isSymbolicLink()) throw new ErrorDeRetencio(`enllaç simbòlic a dist/assets: ${entrada.name}`);
    if (!entrada.isFile()) continue;
    const bytes = fs.readFileSync(path.join(assets, entrada.name));
    fitxers.push({ nom: entrada.name, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return fitxers.sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0));
}

/* aammdd_hhmm a Europe/Madrid, com els documents del repositori. */
export function segellDeTemps(data) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(data).map(({ type, value }) => [type, value]));
  return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`;
}

const sensePunt = (nom) => nom.replace(/\.(?:m?js|css)$/, '');

function validaManifest(manifest, origen) {
  const bo = manifest && manifest.schema === ESQUEMA && typeof manifest.entrada === 'string' && NOM_AMB_EMPREMTA.test(manifest.entrada)
    && typeof manifest.creat === 'string' && Number.isFinite(Date.parse(manifest.creat)) && Array.isArray(manifest.fitxers)
    && manifest.fitxers.every((f) => f && typeof f.nom === 'string' && NOM_AMB_EMPREMTA.test(f.nom)
      && Number.isInteger(f.bytes) && f.bytes >= 0 && /^[0-9a-f]{64}$/.test(f.sha256))
    && manifest.fitxers.some((f) => f.nom === manifest.entrada);
  if (!bo) throw new ErrorDeRetencio(`manifest invàlid (${ESQUEMA}): ${origen}`);
  return manifest;
}

/** Els manifests de <arxiu>/builds, del més nou al més vell. */
export function llegixManifests(arxiu) {
  const builds = subcarpeta(arxiu, 'builds', { crea: false });
  if (!builds) return [];
  return fs.readdirSync(builds).filter((nom) => nom.endsWith('.json')).sort()
    .map((nom) => validaManifest(JSON.parse(fs.readFileSync(path.join(builds, nom), 'utf8')), nom))
    .sort((a, b) => Date.parse(b.creat) - Date.parse(a.creat));
}

/* Escriptura atòmica i exclusiva: un nom que ja hi és rep un sufix, mai se sobreescriu. */
function escriuNou(carpeta, base, text) {
  for (let n = 1; n < 100; n += 1) {
    const desti = path.join(carpeta, `${base}${n === 1 ? '' : `-${n}`}.json`);
    if (fs.existsSync(desti)) continue;
    const temporal = `${desti}.${process.pid}.tmp`;
    fs.writeFileSync(temporal, text, { flag: 'wx' });
    fs.renameSync(temporal, desti);
    return desti;
  }
  throw new ErrorDeRetencio(`massa fitxers amb el mateix nom a ${carpeta}: ${base}`);
}

/* Copia exclusiva i comprovada: el destí no existia i té el SHA-256 esperat. */
function copiaComprovada(origen, desti, esperat) {
  const temporal = `${desti}.${process.pid}.tmp`;
  fs.copyFileSync(origen, temporal, fs.constants.COPYFILE_EXCL);
  if (sha256(fs.readFileSync(temporal)) !== esperat) {
    fs.rmSync(temporal, { force: true });
    throw new ErrorDeRetencio(`la còpia de ${path.basename(desti)} no té el SHA-256 esperat`);
  }
  fs.renameSync(temporal, desti);
}

/* Un fitxer del pool: regular, mai un enllaç; null si no hi és. */
function fitxerDelPool(pool, nom) {
  const cami = path.join(pool, nom);
  const estat = fs.lstatSync(cami, { throwIfNoEntry: false });
  if (!estat) return null;
  if (estat.isSymbolicLink()) throw new ErrorDeRetencio(`enllaç simbòlic al pool: ${nom}`);
  if (!estat.isFile()) throw new ErrorDeRetencio(`el pool té una entrada que no és un fitxer: ${nom}`);
  return cami;
}

const mateixosFitxers = (a, b) => a.length === b.length && a.every((f, i) => f.nom === b[i].nom && f.sha256 === b[i].sha256);

/**
 * Arxiva el build de `dist` al pool i en escriu el manifest. Torna
 * { manifest, fitxer, nous, idempotent, noAbastables }. El manifest és el
 * graf de l'index.html (entrada, modulepreload i tot el que importen): un
 * dist/ que ja porta trossos retinguts (un incorpora fet abans d'hora) no els
 * fa passar per seus; es diuen a noAbastables.
 */
export function arxiva({ dist, arxiu, creat = new Date(), commit = null }) {
  carpetaExistent(arxiu, '--arxiu');
  carpetesSeparades(dist, arxiu);
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const entrada = entradaDeLHtml(html);
  const inventari = inventariaAssets(dist);
  if (!inventari.some((f) => f.nom === entrada)) throw new ErrorDeRetencio(`l'entrada ${entrada} no és a dist/assets`);
  const graf = comprovaClausura({ dist, html });
  if (graf.falten.length) throw new ErrorDeRetencio(`el build de dist/ és incomplet: falta ${graf.falten[0].nom} (demanat per ${graf.falten[0].desDe})`);
  const delGraf = new Set(graf.presents);
  const fitxers = inventari.filter((f) => delGraf.has(f.nom));
  const noAbastables = inventari.filter((f) => !delGraf.has(f.nom)).map((f) => f.nom);
  const existent = llegixManifests(arxiu).find((m) => m.entrada === entrada);
  if (existent) {
    if (!mateixosFitxers([...existent.fitxers].sort((a, b) => (a.nom < b.nom ? -1 : 1)), fitxers)) {
      throw new ErrorDeRetencio(`la mateixa entrada ${entrada} ja és a l'arxiu amb uns altres fitxers: build no determinista`);
    }
  }
  const pool = subcarpeta(arxiu, 'pool', { crea: true });
  // Primer totes les comprovacions: una col·lisió no deixa cap còpia a mitges.
  const nous = [];
  for (const f of fitxers) {
    const cami = fitxerDelPool(pool, f.nom);
    if (!cami) nous.push(f);
    else if (sha256(fs.readFileSync(cami)) !== f.sha256) throw new ErrorDeRetencio(`col·lisió: ${f.nom} ja és al pool amb un altre SHA-256`);
  }
  for (const f of nous) copiaComprovada(path.join(dist, 'assets', f.nom), path.join(pool, f.nom), f.sha256);
  if (existent) return { manifest: existent, fitxer: null, nous: nous.map((f) => f.nom), idempotent: true, noAbastables };
  const manifest = {
    schema: ESQUEMA,
    creat: new Date(creat).toISOString(),
    entrada,
    commit: commit ?? null,
    fitxers,
    totalBytes: fitxers.reduce((suma, f) => suma + f.bytes, 0)
  };
  const builds = subcarpeta(arxiu, 'builds', { crea: true });
  const fitxer = escriuNou(builds, `${segellDeTemps(new Date(manifest.creat))}_${sensePunt(entrada)}`, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, fitxer, nous: nous.map((f) => f.nom), idempotent: false, noAbastables };
}

/**
 * El pla pur: quins builds anteriors es retenen sencers i quins fitxers cal
 * copiar. `actuals` és nom → SHA-256 del dist/ d'ara; `referencies(nom)` torna
 * el Set del que importa un tros del pool, o null si el tros no hi és.
 */
export function planDeRetencio({ manifests, entradaActual, actuals, ara = new Date(), builds = PER_DEFECTE.builds,
  dies = PER_DEFECTE.dies, maxBytes = PER_DEFECTE.maxMb * 1024 * 1024, retira = new Set(), referencies }) {
  const candidats = manifests.filter((m) => m.entrada !== entradaActual)
    .sort((a, b) => Date.parse(b.creat) - Date.parse(a.creat));
  const planificats = new Map();
  const retinguts = [];
  const exclosos = [];
  let bytes = 0;
  let tancat = null;
  for (const m of candidats) {
    const base = { entrada: m.entrada, creat: m.creat };
    if (tancat) { exclosos.push({ ...base, motiu: tancat, detall: 'un build més nou ja ha tancat la retenció' }); continue; }
    if (Date.parse(ara) - Date.parse(m.creat) > dies * DIA) { exclosos.push({ ...base, motiu: 'massa-vell', detall: `més de ${dies} dies` }); continue; }
    if (retinguts.length >= builds) { exclosos.push({ ...base, motiu: 'fora-dels-n-builds', detall: `ja se'n retenen ${builds}` }); continue; }
    const delBuild = new Map(m.fitxers.map((f) => [f.nom, f]));
    const nous = [];
    const retirats = [];
    let compartits = 0;
    for (const f of m.fitxers) {
      if (retira.has(f.nom)) { retirats.push(f.nom); continue; }
      if (actuals.has(f.nom)) {
        if (actuals.get(f.nom) !== f.sha256) throw new ErrorDeRetencio(`col·lisió: ${f.nom} és al build actual amb un altre SHA-256 que el del build ${m.entrada}`);
        compartits += 1;
        continue;
      }
      const ja = planificats.get(f.nom);
      if (ja) {
        if (ja.sha256 !== f.sha256) throw new ErrorDeRetencio(`col·lisió: ${f.nom} té dos SHA-256 en dos builds retinguts`);
        compartits += 1;
        continue;
      }
      nous.push(f);
    }
    // La clausura: tot el que importa cada tros ha de ser a dist/ (l'actual o el planificat) o al mateix build.
    let falla = null;
    for (const f of m.fitxers) {
      if (retira.has(f.nom) || !/\.(?:m?js|css)$/.test(f.nom)) continue;
      const refs = referencies(f.nom);
      if (refs === null) { falla = { motiu: 'falta-al-pool', detall: `${f.nom} no és al pool` }; break; }
      const absent = [...refs].find((ref) => !actuals.has(ref) && !delBuild.has(ref) && !planificats.has(ref));
      if (absent) { falla = { motiu: 'clausura', detall: `${f.nom} importa ${absent}, que no és enlloc` }; break; }
    }
    if (falla) { exclosos.push({ ...base, ...falla }); continue; }
    const pes = nous.reduce((suma, f) => suma + f.bytes, 0);
    if (bytes + pes > maxBytes) {
      exclosos.push({ ...base, motiu: 'sostre', detall: `${pes} B no caben dins dels ${maxBytes - bytes} B que queden` });
      tancat = 'sostre';
      continue;
    }
    bytes += pes;
    for (const f of nous) planificats.set(f.nom, f);
    retinguts.push({ ...base, nous: nous.map((f) => f.nom), compartits, retirats });
  }
  return { retinguts, exclosos, copia: [...planificats.values()], bytes };
}

/**
 * Copia a dist/assets els builds anteriors retinguts i escriu el rebut a
 * <arxiu>/rebuts/. Torna el rebut.
 */
export function incorpora({ dist, arxiu, builds = PER_DEFECTE.builds, dies = PER_DEFECTE.dies, maxMb = PER_DEFECTE.maxMb,
  retira = [], ara = new Date() }) {
  carpetaExistent(arxiu, '--arxiu');
  carpetesSeparades(dist, arxiu);
  const entradaActual = entradaDeLHtml(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
  const inventari = inventariaAssets(dist);
  const actuals = new Map(inventari.map((f) => [f.nom, f.sha256]));
  const manifests = llegixManifests(arxiu);
  const propi = manifests.find((m) => m.entrada === entradaActual);
  // Els fitxers que una incorpora anterior ja hi ha afegit no compten per al build actual.
  const delBuildActual = propi && new Set(propi.fitxers.map((f) => f.nom));
  if (!propi || propi.fitxers.some((f) => actuals.get(f.nom) !== f.sha256)) {
    throw new ErrorDeRetencio(`el build actual (${entradaActual}) no és a l'arxiu: cal fer arxiva abans d'incorpora`);
  }
  for (const nom of retira) {
    if (!NOM_AMB_EMPREMTA.test(nom)) throw new ErrorDUs(`--retira espera un nom amb empremta de l'arrel d'/assets: ${nom}`);
    if (delBuildActual.has(nom)) throw new ErrorDUs(`--retira no pot traure un tros del build actual: ${nom}`);
  }
  const pool = subcarpeta(arxiu, 'pool', { crea: false });
  const referencies = (nom) => {
    const cami = pool && fitxerDelPool(pool, nom);
    return cami ? referenciesDelTros(fs.readFileSync(cami, 'utf8'), nom) : null;
  };
  // Cap fitxer de la incorpora anterior no col·lidix: es compten com a «actuals» (ja hi són, iguals o no).
  const pla = planDeRetencio({
    manifests, entradaActual, actuals, ara, builds, dies, maxBytes: Math.floor(maxMb * 1024 * 1024),
    retira: new Set(retira), referencies
  });
  /* G-client-7 · Tot el pla, validat al pool abans de tocar dist/assets. */
  const origens = pla.copia.map((f) => {
    const origen = pool && fitxerDelPool(pool, f.nom);
    if (!origen || sha256(fs.readFileSync(origen)) !== f.sha256) throw new ErrorDeRetencio(`pool corrupte: ${f.nom} no hi és o no té el SHA-256 del manifest`);
    return [f, origen];
  });
  /* G-client-6 · Un tros retirat que una incorpora anterior ja havia copiat
     (no és del build actual: ho garantix la comprovació de --retira) se'n va. */
  const retiratsDeDist = [];
  for (const nom of retira) {
    const cami = path.join(dist, 'assets', nom);
    const estat = fs.lstatSync(cami, { throwIfNoEntry: false });
    if (!estat) continue;
    if (!estat.isFile() && !estat.isSymbolicLink()) throw new ErrorDeRetencio(`--retira: ${nom} de dist/assets no és un fitxer`);
    fs.rmSync(cami, { force: true });
    retiratsDeDist.push(nom);
  }
  let copiats = 0;
  for (const [f, origen] of origens) {
    copiaComprovada(origen, path.join(dist, 'assets', f.nom), f.sha256);
    copiats += 1;
  }
  // Postcondició (G-client-6): cap nom retirat no és a dist/assets.
  const encara = retira.find((nom) => fs.lstatSync(path.join(dist, 'assets', nom), { throwIfNoEntry: false }));
  if (encara) throw new ErrorDeRetencio(`després d'incorpora, el tros retirat ${encara} encara és a dist/assets`);
  // Postcondició: cada fitxer de cada build retingut (llevat dels retirats) és a dist/assets.
  for (const r of pla.retinguts) {
    const m = manifests.find((x) => x.entrada === r.entrada);
    const absent = m.fitxers.find((f) => !r.retirats.includes(f.nom) && !fs.existsSync(path.join(dist, 'assets', f.nom)));
    if (absent) throw new ErrorDeRetencio(`després d'incorpora, ${absent.nom} del build ${r.entrada} no és a dist/assets`);
  }
  const rebut = {
    schema: ESQUEMA_REBUT,
    creat: new Date(ara).toISOString(),
    entradaActual,
    parametres: { builds, dies, maxMb, retira: [...retira] },
    retinguts: pla.retinguts,
    exclosos: pla.exclosos,
    retiratsDeDist,
    copiats,
    bytes: pla.bytes
  };
  const rebuts = subcarpeta(arxiu, 'rebuts', { crea: true });
  rebut.fitxer = path.basename(escriuNou(rebuts, `${segellDeTemps(new Date(ara))}_incorpora_${sensePunt(entradaActual)}`, `${JSON.stringify(rebut, null, 2)}\n`));
  return rebut;
}

/** El graf d'un index.html dins de dist/assets: { abastables, presents, falten: [{ nom, desDe }] }. */
export function comprovaClausura({ dist, html }) {
  const assets = carpetaExistent(path.join(dist, 'assets'), 'dist/assets');
  const vistos = new Set();
  const falten = [];
  const cua = referenciesDeLHtml(html).map((nom) => [nom, 'index.html']);
  while (cua.length) {
    const [nom, desDe] = cua.shift();
    if (vistos.has(nom)) continue;
    vistos.add(nom);
    const cami = path.join(assets, nom);
    const estat = fs.lstatSync(cami, { throwIfNoEntry: false });
    if (!estat || !estat.isFile()) { falten.push({ nom, desDe }); continue; }
    if (/\.(?:m?js|css)$/.test(nom)) for (const ref of referenciesDelTros(fs.readFileSync(cami, 'utf8'), nom)) cua.push([ref, nom]);
  }
  const absents = new Set(falten.map((f) => f.nom));
  return { abastables: vistos.size - falten.length, presents: [...vistos].filter((nom) => !absents.has(nom)).sort(), falten };
}

const ADMESOS = Object.freeze({ '--dist': 'valor', '--arxiu': 'valor', '--creat': 'valor', '--commit': 'valor', '--builds': 'valor',
  '--dies': 'valor', '--max-mb': 'valor', '--retira': 'llista', '--html': 'valor', '--json': 'bandera' });
const ORDRES = Object.freeze(['arxiva', 'incorpora', 'comprova']);
const US = 'Ús: retencio-assets.mjs arxiva|incorpora|comprova --dist dist --arxiu <carpeta existent> [--creat ISO] [--commit X] [--builds 3] [--dies 30] [--max-mb 64] [--retira <nom>]… [--html <index.html>] [--json]';

function analitza(argv) {
  const [ordre, ...resta] = argv;
  if (!ORDRES.includes(ordre)) throw new ErrorDUs(US);
  const opcions = { ordre, retira: [] };
  for (let i = 0; i < resta.length; i += 1) {
    const clau = resta[i];
    const tipus = ADMESOS[clau];
    if (!tipus) throw new ErrorDUs(`opció desconeguda: ${clau}. ${US}`);
    if (tipus === 'bandera') { opcions.json = true; continue; }
    const valor = resta[i + 1];
    if (valor === undefined || valor.startsWith('--')) throw new ErrorDUs(`${clau} necessita un valor`);
    i += 1;
    if (tipus === 'llista') opcions.retira.push(valor);
    else opcions[clau.slice(2)] = valor;
  }
  const enter = (clau, perDefecte) => {
    if (opcions[clau] === undefined) return perDefecte;
    const n = Number(opcions[clau]);
    if (!Number.isInteger(n) || n < 1) throw new ErrorDUs(`--${clau} ha de ser un enter positiu`);
    return n;
  };
  opcions.builds = enter('builds', PER_DEFECTE.builds);
  opcions.dies = enter('dies', PER_DEFECTE.dies);
  if (opcions['max-mb'] !== undefined) {
    const mb = Number(opcions['max-mb']);
    if (!Number.isFinite(mb) || mb <= 0) throw new ErrorDUs('--max-mb ha de ser un nombre positiu');
    opcions.maxMb = mb;
  } else opcions.maxMb = PER_DEFECTE.maxMb;
  if (opcions.creat !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(opcions.creat) || !Number.isFinite(Date.parse(opcions.creat))) {
      throw new ErrorDUs('--creat ha de ser una data ISO amb zona (Z o ±hh:mm)');
    }
    opcions.creatData = new Date(opcions.creat);
  }
  opcions.dist = path.resolve(opcions.dist || 'dist');
  if (ordre !== 'comprova') {
    if (!opcions.arxiu) throw new ErrorDUs(`--arxiu és obligatori (cap valor per defecte; la ubicació la decidix el Mestre). ${US}`);
    opcions.arxiu = path.resolve(opcions.arxiu);
    carpetaExistent(opcions.arxiu, '--arxiu');
    carpetesSeparades(opcions.dist, opcions.arxiu);
  }
  return opcions;
}

/** L'ordre. Torna el codi d'eixida; no crida mai process.exit. */
export function main(argv = process.argv.slice(2), { out = (t) => process.stdout.write(`${t}\n`), err = (t) => process.stderr.write(`${t}\n`) } = {}) {
  let opcions;
  try {
    opcions = analitza(argv);
  } catch (error) {
    err(`${PREFIX} ${error.message}`);
    return 2;
  }
  try {
    if (opcions.ordre === 'arxiva') {
      const r = arxiva({ dist: opcions.dist, arxiu: opcions.arxiu, creat: opcions.creatData ?? new Date(), commit: opcions.commit ?? null });
      if (opcions.json) out(JSON.stringify({ ...r, fitxer: r.fitxer && path.basename(r.fitxer) }, null, 2));
      else out(`${PREFIX} ${r.idempotent ? 'Ja arxivat' : 'Arxivat'}: ${r.manifest.entrada}, ${r.manifest.fitxers.length} fitxers (${r.manifest.totalBytes} B), ${r.nous.length} nous al pool.`);
      if (r.noAbastables.length) err(`${PREFIX} AVÍS · ${r.noAbastables.length} fitxers amb empremta de dist/assets no són del graf de l'index.html i no s'arxiven com a seus (${r.noAbastables.slice(0, 5).join(', ')}).`);
      return 0;
    }
    if (opcions.ordre === 'incorpora') {
      const r = incorpora({ dist: opcions.dist, arxiu: opcions.arxiu, builds: opcions.builds, dies: opcions.dies, maxMb: opcions.maxMb, retira: opcions.retira });
      if (opcions.json) out(JSON.stringify(r, null, 2));
      else {
        out(`${PREFIX} Retinguts ${r.retinguts.length} builds (${r.retinguts.map((x) => x.entrada).join(', ') || 'cap'}): ${r.copiats} fitxers, ${r.bytes} B copiats a dist/assets. Rebut: ${r.fitxer}.`);
        for (const e of r.exclosos) err(`${PREFIX} AVÍS · fora ${e.entrada} (${e.motiu}): ${e.detall}.`);
      }
      return 0;
    }
    const html = fs.readFileSync(opcions.html ? path.resolve(opcions.html) : path.join(opcions.dist, 'index.html'), 'utf8');
    const r = comprovaClausura({ dist: opcions.dist, html });
    if (opcions.json) out(JSON.stringify(r, null, 2));
    else out(`${PREFIX} Graf: ${r.abastables} trossos presents, ${r.falten.length} absents.`);
    for (const f of r.falten) err(`${PREFIX} FALTA ${f.nom} (demanat per ${f.desDe}).`);
    return r.falten.length ? 1 : 0;
  } catch (error) {
    err(`${PREFIX} ${error.message}`);
    return error instanceof ErrorDUs ? 2 : 1;
  }
}

// Com a ordre (també per un enllaç), no quan una prova la importa (la forma de la Porta Arrel, A4).
if (process.argv[1] && fs.existsSync(process.argv[1])
  && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = main();
}
