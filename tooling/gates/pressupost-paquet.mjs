#!/usr/bin/env node
/* P1-20 · D15 (Assalt 10/10, T4a, 261101) · El pressupost del tros d'entrada
 * del web, mesurat sobre el build de veres.
 *
 *   node tooling/gates/pressupost-paquet.mjs [--dist dist] [--sostre 250000]
 *     [--sostre-arrencada <bytes>] [--json]
 *
 * Llig dist/index.html (el de `vite build`, abans del prerender social), hi
 * pren l'entrada (el <script type="module" src>) i els trossos que l'HTML fa
 * baixar en paral·lel (<link rel="modulepreload" href>), i en comprimix els
 * bytes amb gzip de nivell 9 (zlib de Node: deterministe i sense cap
 * dependència). Codis d'eixida:
 *   · 0, l'entrada no passa del sostre (250.000 B gzip -9, el KPI de D15) ni,
 *     si se'n dona un, l'arrencada del seu;
 *   · 1, en passa algun: build:web encadena esta porta i el build falla;
 *   · 2, ús, dist/ incomplet (sense index.html, sense una entrada única, un
 *     recurs absent o fora de dist/) o un error de lectura (EISDIR, EACCES…):
 *     mai no es confon amb un sostre passat.
 * L'arrencada estàtica (entrada + modulepreload) sempre s'informa: diu on van
 * els bytes que l'entrada ja no porta. El seu sostre és opcional
 * (--sostre-arrencada): els trossos d'arrencada creixen amb cada clau del
 * diccionari valencià, i fixar-ne un per defecte és una decisió a banda.
 * Per què una porta i no només la prova: src/config/paquetDArrencada.test.js
 * només coneix els mòduls pesants que nomena; un import estàtic nou a la
 * closca, no. Ací es veu en bytes. Només llig: no escriu res. */
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

export const SOSTRE_PER_DEFECTE = 250_000;
const PREFIX = '[pressupost-paquet]';

/* Una sola passada per etiqueta i per atribut (cap quantificador niat). */
const ETIQUETA = /<(script|link)\b([^>]*)>/gi;
const ATRIBUT = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function atributs(text) {
  const valors = {};
  for (const [, nom, doble, simple, nu] of text.matchAll(ATRIBUT)) {
    const clau = nom.toLowerCase();
    if (!(clau in valors)) valors[clau] = doble ?? simple ?? nu ?? '';
  }
  return valors;
}

/** L'entrada i els modulepreload que demana un HTML, en l'ordre de l'HTML. */
export function recursosDArrencada(html) {
  const entrades = [];
  const precarregues = [];
  for (const [, etiqueta, text] of String(html).matchAll(ETIQUETA)) {
    const a = atributs(text);
    if (etiqueta.toLowerCase() === 'script') {
      if ((a.type || '').toLowerCase() === 'module' && a.src) entrades.push(a.src);
    } else if ((a.rel || '').toLowerCase().split(/\s+/).includes('modulepreload') && a.href) {
      if (!precarregues.includes(a.href)) precarregues.push(a.href);
    }
  }
  return { entrades, precarregues };
}

class ErrorDUs extends Error {}

/* Un recurs de l'HTML com a fitxer de dist/: camí del lloc (amb o sense '/'
   inicial), sense consulta ni fragment, i mai fora de dist/. */
function fitxerDelRecurs(dist, referencia) {
  if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(referencia)) throw new ErrorDUs(`recurs d'un altre origen: ${referencia}`);
  let relatiu;
  try {
    relatiu = decodeURIComponent(referencia.replace(/[?#].*$/, '')).replace(/^\/+/, '');
  } catch {
    throw new ErrorDUs(`recurs amb un camí mal codificat: ${referencia}`);
  }
  const fitxer = path.resolve(dist, relatiu);
  if (!fitxer.startsWith(path.resolve(dist) + path.sep)) throw new ErrorDUs(`recurs fora de dist/: ${referencia}`);
  if (!fs.existsSync(fitxer) || !fs.statSync(fitxer).isFile()) throw new ErrorDUs(`recurs absent: ${referencia}`);
  return fitxer;
}

function midaDe(dist, referencia) {
  const bytes = fs.readFileSync(fitxerDelRecurs(dist, referencia));
  return { recurs: referencia, bytes: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
}

/** Les mides de l'arrencada estàtica d'un dist/ i si caben dins dels sostres. */
export function mesura(dist, { sostre = SOSTRE_PER_DEFECTE, sostreArrencada = null } = {}) {
  const index = path.join(dist, 'index.html');
  if (!fs.existsSync(index)) throw new ErrorDUs(`no hi ha ${index}: cal fer abans el build`);
  const { entrades, precarregues } = recursosDArrencada(fs.readFileSync(index, 'utf8'));
  if (entrades.length !== 1) throw new ErrorDUs(`l'HTML ha de portar una sola entrada <script type="module" src>, i en porta ${entrades.length}`);
  const entrada = midaDe(dist, entrades[0]);
  const trossos = precarregues.filter((p) => p !== entrades[0]).map((p) => midaDe(dist, p));
  const totes = [entrada, ...trossos];
  const arrencada = {
    fitxers: totes.length,
    bytes: totes.reduce((s, r) => s + r.bytes, 0),
    gzip: totes.reduce((s, r) => s + r.gzip, 0)
  };
  return {
    sostre,
    sostreArrencada,
    entrada,
    precarregues: trossos,
    arrencada,
    dinsDelSostre: entrada.gzip <= sostre,
    arrencadaDinsDelSostre: sostreArrencada === null || arrencada.gzip <= sostreArrencada
  };
}

function llegixOpcions(args) {
  const opcions = { dist: 'dist', sostre: SOSTRE_PER_DEFECTE, sostreArrencada: null, json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') opcions.json = true;
    else if (arg === '--dist' && args[i + 1]) opcions.dist = args[++i];
    else if (arg === '--sostre' && /^\d+$/.test(args[i + 1] || '')) opcions.sostre = Number(args[++i]);
    else if (arg === '--sostre-arrencada' && /^\d+$/.test(args[i + 1] || '')) opcions.sostreArrencada = Number(args[++i]);
    else throw new ErrorDUs(`opció desconeguda o sense valor: ${arg} (ús: --dist <dir> --sostre <bytes> --sostre-arrencada <bytes> --json)`);
  }
  return opcions;
}

/** La porta: torna el codi d'eixida (0, 1 o 2) i escriu l'informe. */
export function main(args = process.argv.slice(2), { cwd = process.cwd(), out = console.log, err = console.error } = {}) {
  let opcions;
  let resultat;
  try {
    opcions = llegixOpcions(args);
    resultat = mesura(path.resolve(cwd, opcions.dist), { sostre: opcions.sostre, sostreArrencada: opcions.sostreArrencada });
  } catch (error) {
    // Qualsevol error abans de mesurar és 2: el codi 1 només vol dir «passa del sostre».
    err(error instanceof ErrorDUs ? `${PREFIX} ${error.message}` : `${PREFIX} no s'ha pogut llegir el dist/: ${error?.message ?? error}`);
    return 2;
  }
  if (opcions.json) {
    out(JSON.stringify(resultat, null, 2));
  } else {
    const { entrada, arrencada, precarregues, sostre, sostreArrencada } = resultat;
    out(`${PREFIX} Entrada ${entrada.recurs}: ${entrada.bytes} B, ${entrada.gzip} B gzip -9 (sostre ${sostre} B).`);
    out(`${PREFIX} Arrencada estàtica, entrada i ${precarregues.length} modulepreload: ${arrencada.bytes} B, ${arrencada.gzip} B gzip -9${sostreArrencada === null ? '' : ` (sostre ${sostreArrencada} B)`}.`);
  }
  let codi = 0;
  if (!resultat.dinsDelSostre) {
    err(`${PREFIX} L'entrada passa del sostre en ${resultat.entrada.gzip - resultat.sostre} B gzip -9. Un import estàtic nou a la closca? Vegeu trossDArrencada (vite.config.js) i src/config/paquetDArrencada.test.js.`);
    codi = 1;
  }
  if (!resultat.arrencadaDinsDelSostre) {
    err(`${PREFIX} L'arrencada estàtica passa del sostre en ${resultat.arrencada.gzip - resultat.sostreArrencada} B gzip -9. Algun tros d'arrencada (react, estils, dompurify, ca) ha crescut o n'hi ha un de nou.`);
    codi = 1;
  }
  return codi;
}

// Com a ordre (també per un enllaç), no quan una prova la importa.
// La forma que reconeix la Porta Arrel (A4); el realpath fa que també arranque per un enllaç.
if (process.argv[1] && fs.existsSync(process.argv[1])
  && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  process.exitCode = main();
}
