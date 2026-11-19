#!/usr/bin/env node
/* P1-20 · D15 (Assalt 10/10, T4a, 261101) · El pressupost del tros d'entrada
 * del web, mesurat sobre el build de veres.
 *
 *   node tooling/gates/pressupost-paquet.mjs [--dist dist] [--sostre 250000]
 *     [--sostre-arrencada <bytes>] [--icones] [--json]
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
 * closca, no. Ací es veu en bytes.
 * P-E (IDEA-260 c) · Amb --icones, també revisa els trossos de les icones de
 * lucide-react (assets/<icona>-<hash>.js, amb els noms de
 * node_modules/lucide-react/dist/esm/icons): cap no importa del tros
 * d'entrada, i almenys un importa del tros 'lucide-nucli' (trossDArrencada).
 * Si no, les icones tornen a canviar de nom a cada desplegament: codi 1.
 * Només llig: no escriu res. */
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

/* Un tros de Rollup: «<nom>-<hash de 8>.js». Un import estàtic minificat:
   from"./x.js" o import"./x.js" (els import() dinàmics no compten). */
const TROS = /^(.+)-[A-Za-z0-9_-]{8}\.js$/;
const IMPORT_ESTATIC = /(?:\bfrom|\bimport)\s*["']\.\/([^"'/]+)["']/g;
const DEL_NUCLI_DE_LUCIDE = /^lucide-nucli-[A-Za-z0-9_-]{8}\.js$/;

/** Els noms de les icones de lucide-react (sense el barril icons/index.mjs). */
export function iconesDeLucide(arrel) {
  const carpeta = path.join(arrel, 'node_modules/lucide-react/dist/esm/icons');
  if (!fs.existsSync(carpeta)) throw new ErrorDUs(`no hi ha ${carpeta}: no se saben els noms de les icones`);
  return new Set(fs.readdirSync(carpeta).filter((f) => f.endsWith('.mjs') && f !== 'index.mjs').map((f) => f.slice(0, -4)));
}

/** P-E (IDEA-260 c) · Quins trossos d'icona importen del tros d'entrada i quants del nucli de lucide. */
export function revisaIcones(dist, { icones, entrada }) {
  const assets = path.join(dist, 'assets');
  const nomDeLEntrada = path.posix.basename(String(entrada).replace(/[?#].*$/, ''));
  const trossos = fs.readdirSync(assets).filter((f) => icones.has(TROS.exec(f)?.[1])).sort();
  const ambLEntrada = [];
  let ambElNucli = 0;
  for (const tros of trossos) {
    const importats = [...fs.readFileSync(path.join(assets, tros), 'utf8').matchAll(IMPORT_ESTATIC)].map((m) => m[1]);
    if (importats.includes(nomDeLEntrada)) ambLEntrada.push(tros);
    if (importats.some((nom) => DEL_NUCLI_DE_LUCIDE.test(nom))) ambElNucli += 1;
  }
  return { trossos: trossos.length, ambLEntrada, ambElNucli, correcte: ambLEntrada.length === 0 && ambElNucli > 0 };
}

function llegixOpcions(args) {
  const opcions = { dist: 'dist', sostre: SOSTRE_PER_DEFECTE, sostreArrencada: null, icones: false, json: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--json') opcions.json = true;
    else if (arg === '--icones') opcions.icones = true;
    else if (arg === '--dist' && args[i + 1]) opcions.dist = args[++i];
    else if (arg === '--sostre' && /^\d+$/.test(args[i + 1] || '')) opcions.sostre = Number(args[++i]);
    else if (arg === '--sostre-arrencada' && /^\d+$/.test(args[i + 1] || '')) opcions.sostreArrencada = Number(args[++i]);
    else throw new ErrorDUs(`opció desconeguda o sense valor: ${arg} (ús: --dist <dir> --sostre <bytes> --sostre-arrencada <bytes> --icones --json)`);
  }
  return opcions;
}

/** La porta: torna el codi d'eixida (0, 1 o 2) i escriu l'informe. */
export function main(args = process.argv.slice(2), { cwd = process.cwd(), out = console.log, err = console.error } = {}) {
  let opcions;
  let resultat;
  try {
    opcions = llegixOpcions(args);
    const dist = path.resolve(cwd, opcions.dist);
    resultat = mesura(dist, { sostre: opcions.sostre, sostreArrencada: opcions.sostreArrencada });
    if (opcions.icones) resultat.icones = revisaIcones(dist, { icones: iconesDeLucide(cwd), entrada: resultat.entrada.recurs });
  } catch (error) {
    // Qualsevol error abans de mesurar és 2: el codi 1 només vol dir «passa del sostre» (o, amb --icones, que les icones no depenen del nucli de lucide).
    err(error instanceof ErrorDUs ? `${PREFIX} ${error.message}` : `${PREFIX} no s'ha pogut llegir el dist/: ${error?.message ?? error}`);
    return 2;
  }
  if (opcions.json) {
    out(JSON.stringify(resultat, null, 2));
  } else {
    const { entrada, arrencada, precarregues, sostre, sostreArrencada } = resultat;
    out(`${PREFIX} Entrada ${entrada.recurs}: ${entrada.bytes} B, ${entrada.gzip} B gzip -9 (sostre ${sostre} B).`);
    out(`${PREFIX} Arrencada estàtica, entrada i ${precarregues.length} modulepreload: ${arrencada.bytes} B, ${arrencada.gzip} B gzip -9${sostreArrencada === null ? '' : ` (sostre ${sostreArrencada} B)`}.`);
    if (resultat.icones) out(`${PREFIX} Icones de lucide: ${resultat.icones.trossos} trossos, ${resultat.icones.ambElNucli} importen de lucide-nucli i ${resultat.icones.ambLEntrada.length} de l'entrada.`);
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
  if (resultat.icones && !resultat.icones.correcte) {
    const { ambLEntrada } = resultat.icones;
    err(`${PREFIX} Els trossos de les icones no depenen només del nucli de lucide${ambLEntrada.length ? ` (importen de l'entrada: ${ambLEntrada.slice(0, 5).join(', ')}${ambLEntrada.length > 5 ? '…' : ''})` : ' (cap importa de lucide-nucli)'}: canviaran de nom a cada desplegament. Vegeu la regla 'lucide-nucli' de tooling/vite/trossos-arrencada.mjs.`);
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
