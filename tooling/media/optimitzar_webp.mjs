#!/usr/bin/env node
/**
 * optimitzar_webp.mjs — Tractor de mitjans WebP (encàrrec de la IAIA MarIA, torn 261018).
 *
 * Tres ordres, cap destructiva:
 *
 *   cens          Inventari de les imatges de public/ (l'ordre per defecte). Per a cada imatge
 *                 diu pes, mides, si ja té bessona .webp i qui la referencia:
 *                   · codi     el seu camí públic o el seu nom apareixen al codi o a la
 *                              configuració (src, index.html, public, vite, wordpress-plugin,
 *                              supabase, scripts, tooling, bot);
 *                   · dinamic  cap literal, però una plantilla del codi la pot construir
 *                              (`/assets/towns/${slug}/1.jpg`) o el codi cita la seua carpeta
 *                              com a prefix ('/assets/towns/');
 *                   · wiki     només la citen documents de _wiki_de_poble (mai 90_arxiu_historic);
 *                   · orfe     ningú no la cita ni la pot construir.
 *                 La bessona .webp d'un original (src/config/politicaDeMitjans.js) que ningú no
 *                 cita hereta l'estat del seu original: els paquets (l'autònom i el
 *                 directori) la demanen en lloc d'ell.
 *                 El cens només llista: no mou ni esborra res. Una orfe és candidata a revisió
 *                 humana, no a la paperera: el cens no veu qui la usa des de fora del repositori
 *                 (Yoast, xarxes socials, enllaços publicats).
 *
 *   converteix    Converteix imatges entrants (PNG i JPEG) a .webp amb el costat llarg limitat
 *                 (--max, 1600 px per defecte; la franja de l'encàrrec és 1200-1600) i sense
 *                 ampliar-les mai. Sense --aplica calcula el resultat en memòria i no escriu res.
 *                 Amb --aplica escriu NOM.webp al costat de l'original (o dins de --eixida),
 *                 primer en un temporal i després amb un canvi de nom: una conversió tallada no
 *                 deixa mai un .webp a mitges. L'original no es toca mai, cap .webp existent se
 *                 sobreescriu sense --sobreescriu, i si el .webp no pesa menys que l'original no
 *                 s'escriu. Amb --nomes-candidates (encàrrec 261019_1425) només entren les
 *                 candidates del cens: PNG/JPEG de més de --llindar-kb o de més de --max px.
 *
 *   codificadors  Diu quins codificadors WebP hi ha en aquesta màquina.
 *
 * Codificadors (adaptadors enxufables, en aquest ordre): la maquinària del Mas
 * (tooling/maquinaria/convertir_a_webp.mjs, mode 'original', amb python3 i Pillow), que
 * conserva l'EXIF de les fotos de patrimoni (GPS i data de captura); sharp (si algun dia
 * s'instal·la); cwebp (libwebp); magick (ImageMagick 7), i Google Chrome sense capçal
 * (canvas.toDataURL), que és el que ja hi ha a qualsevol Mac del Mas. El tractor no afig cap
 * dependència: `npm install` necessita aprovació del Mestre. La maquinària tria la qualitat
 * ella mateixa (84) i no fa cas de --qualitat. La maquinària, Chrome i magick respecten
 * l'orientació EXIF; cwebp no, i per això rebutja les fotos amb orientació diferent d'1.
 *
 * Ús (des de l'arrel; també `npm run media:webp -- ORDRE ...`):
 *   node tooling/media/optimitzar_webp.mjs [cens] [--llindar-kb 300] [--max 1600] [--json]
 *   node tooling/media/optimitzar_webp.mjs converteix CAMÍ... [--max 1600] [--qualitat 80]
 *        [--eixida DIR] [--codificador auto|maquinaria|sharp|cwebp|magick|chrome] [--aplica]
 *        [--sobreescriu] [--nomes-candidates [--llindar-kb 300]] [--json]
 *   node tooling/media/optimitzar_webp.mjs codificadors [--json]
 *
 * Eixida: 0 bé; 1 alguna conversió ha fallat; 2 ús incorrecte o cap codificador disponible.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { PROJECT_DIR, WIKI_DIR } from '../wiki/lib/project_paths.mjs';
import { bessonaDe, bessonesDe } from '../../src/config/politicaDeMitjans.js';

export const MAX_PER_DEFECTE = 1600;
export const QUALITAT_PER_DEFECTE = 80;
export const LLINDAR_KB_PER_DEFECTE = 300;
export const EXTENSIONS_IMATGE = Object.freeze(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg']);
export const EXTENSIONS_CONVERTIBLES = Object.freeze(['.png', '.jpg', '.jpeg']);
export const ORDRE_CODIFICADORS = Object.freeze(['maquinaria', 'sharp', 'cwebp', 'magick', 'chrome']);
/* Revisió adversarial (261018) · La maquinària només rep JPEG: el seu Python
   passa a RGB els PNG de paleta o de grisos amb transparència (fons negre), i
   l'EXIF que conserva és el de les fotos. Els PNG van al codificador següent. */
export const FORMATS_DEL_CODIFICADOR = Object.freeze({
  maquinaria: Object.freeze(['jpeg']),
  sharp: Object.freeze(['png', 'jpeg']),
  cwebp: Object.freeze(['png', 'jpeg']),
  magick: Object.freeze(['png', 'jpeg']),
  chrome: Object.freeze(['png', 'jpeg']),
});

/** On es busquen referències de codi i configuració. La Wiki va a part. */
export const ARRELS_CODI = Object.freeze(['src', 'public', 'index.html', 'vite.config.js', 'vite.modul.config.js',
  'vite.natiu.config.js', 'vite.standalone.config.js', 'vercel.json', 'wordpress-plugin', 'supabase', 'scripts',
  'tooling', 'bot', 'assets']);
/** La Wiki, pel seu camí de la SSOT (project_paths.mjs), relatiu a l'arrel. */
export const ARRELS_WIKI = Object.freeze([path.relative(PROJECT_DIR, WIKI_DIR)]);
const DIRECTORIS_IGNORATS = new Set(['node_modules', 'dist', '.git', 'builds', '90_arxiu_historic']);
const EXTENSIONS_TEXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.html', '.css', '.md',
  '.php', '.sql', '.yml', '.yaml', '.txt', '.webmanifest', '.xml', '.svg']);
const MAX_BYTES_TEXT = 4 * 1024 * 1024;
const US = 'Ús: optimitzar_webp.mjs [cens|converteix CAMÍ...|codificadors] [--max N] [--qualitat N] [--eixida DIR] [--codificador NOM] [--aplica] [--sobreescriu] [--nomes-candidates] [--llindar-kb N] [--json]';

const posix = (rel) => rel.split(path.sep).join('/');
const kb = (bytes) => Math.round(bytes / 1024);

/* ═════════════════════════ Arguments ═════════════════════════ */

/** Llig l'ordre i les opcions. Llança Error amb missatge d'ús si alguna cosa no quadra. */
export function opcions(argv) {
  const o = { ordre: 'cens', camins: [], max: MAX_PER_DEFECTE, qualitat: QUALITAT_PER_DEFECTE,
    llindarKb: LLINDAR_KB_PER_DEFECTE, codificador: 'auto', eixida: null, aplica: false, sobreescriu: false,
    nomesCandidates: false, json: false };
  const valor = (i, nom) => {
    if (i >= argv.length || argv[i].startsWith('--')) throw new Error(`${nom} necessita un valor. ${US}`);
    return argv[i];
  };
  const enter = (text, nom, min, max) => {
    const n = Number(text);
    if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${nom} ha de ser un enter entre ${min} i ${max}.`);
    return n;
  };
  let i = 0;
  if (argv[0] && !argv[0].startsWith('--')) { o.ordre = argv[0]; i = 1; }
  if (!['cens', 'converteix', 'codificadors'].includes(o.ordre)) throw new Error(`Ordre desconeguda: ${o.ordre}. ${US}`);
  for (; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--aplica') o.aplica = true;
    else if (a === '--sobreescriu') o.sobreescriu = true;
    else if (a === '--nomes-candidates') o.nomesCandidates = true;
    else if (a === '--json') o.json = true;
    else if (a === '--max') o.max = enter(valor(++i, a), a, 320, 4096);
    else if (a === '--qualitat') o.qualitat = enter(valor(++i, a), a, 1, 100);
    else if (a === '--llindar-kb') o.llindarKb = enter(valor(++i, a), a, 1, 1024 * 1024);
    else if (a === '--eixida') o.eixida = valor(++i, a);
    else if (a === '--codificador') {
      o.codificador = valor(++i, a);
      if (o.codificador !== 'auto' && !ORDRE_CODIFICADORS.includes(o.codificador)) {
        throw new Error(`Codificador desconegut: ${o.codificador}. Opcions: auto, ${ORDRE_CODIFICADORS.join(', ')}.`);
      }
    } else if (a.startsWith('--')) throw new Error(`Opció desconeguda: ${a}. ${US}`);
    else if (o.ordre === 'converteix') o.camins.push(a);
    else throw new Error(`L'ordre ${o.ordre} no accepta camins (${a}). ${US}`);
  }
  if (o.ordre === 'converteix' && o.camins.length === 0) throw new Error(`converteix necessita almenys un fitxer o carpeta. ${US}`);
  return o;
}

/* ═════════════════════════ Capçaleres d'imatge ═════════════════════════ */

/** Orientació EXIF (1-8) d'un segment APP1 de JPEG, o 1 si no n'hi ha. */
function orientacioExif(buf, inici, fi) {
  if (buf.toString('latin1', inici, inici + 6) !== 'Exif\0\0') return 1;
  const tiff = inici + 6;
  const le = buf.toString('latin1', tiff, tiff + 2) === 'II';
  const u16 = (p) => (le ? buf.readUInt16LE(p) : buf.readUInt16BE(p));
  const u32 = (p) => (le ? buf.readUInt32LE(p) : buf.readUInt32BE(p));
  if (tiff + 8 > fi) return 1;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > fi) return 1;
  const entrades = u16(ifd);
  for (let k = 0; k < entrades; k++) {
    const e = ifd + 2 + k * 12;
    if (e + 12 > fi) break;
    if (u16(e) === 0x0112) {
      const v = u16(e + 8);
      return v >= 1 && v <= 8 ? v : 1;
    }
  }
  return 1;
}

/**
 * Format i mides d'una imatge llegint només la capçalera (PNG, JPEG, GIF i WebP), sense
 * dependències. Torna null si el format no es reconeix o la capçalera està tallada.
 * `orientacio` és l'EXIF dels JPEG (5-8 giren la imatge 90°).
 */
export function mides(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf.readUInt32BE(0) === 0x89504e47 && buf.length >= 24 && buf.toString('latin1', 12, 16) === 'IHDR') {
    return { format: 'png', amplada: buf.readUInt32BE(16), alcada: buf.readUInt32BE(20), orientacio: 1 };
  }
  if (buf.toString('latin1', 0, 4) === 'GIF8' && buf.length >= 10) {
    return { format: 'gif', amplada: buf.readUInt16LE(6), alcada: buf.readUInt16LE(8), orientacio: 1 };
  }
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP' && buf.length >= 30) {
    const bloc = buf.toString('latin1', 12, 16);
    if (bloc === 'VP8X') return { format: 'webp', amplada: 1 + buf.readUIntLE(24, 3), alcada: 1 + buf.readUIntLE(27, 3), orientacio: 1 };
    if (bloc === 'VP8 ') return { format: 'webp', amplada: buf.readUInt16LE(26) & 0x3fff, alcada: buf.readUInt16LE(28) & 0x3fff, orientacio: 1 };
    if (bloc === 'VP8L' && buf[20] === 0x2f) {
      const b = buf.readUInt32LE(21);
      return { format: 'webp', amplada: (b & 0x3fff) + 1, alcada: ((b >> 14) & 0x3fff) + 1, orientacio: 1 };
    }
    return null;
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let p = 2;
    let orientacio = 1;
    while (p + 4 <= buf.length) {
      if (buf[p] !== 0xff) { p++; continue; }
      const marca = buf[p + 1];
      if (marca === 0xff) { p++; continue; }
      if (marca === 0xd8 || marca === 0x01 || (marca >= 0xd0 && marca <= 0xd7)) { p += 2; continue; }
      if (marca === 0xd9 || marca === 0xda) break;
      const llarg = buf.readUInt16BE(p + 2);
      if (llarg < 2) break;
      /* Només l'APP1 d'EXIF diu l'orientació: un APP1 d'XMP darrere no la torna a 1. */
      if (marca === 0xe1 && buf.toString('latin1', p + 4, p + 10) === 'Exif\0\0') {
        orientacio = orientacioExif(buf, p + 4, Math.min(buf.length, p + 2 + llarg));
      }
      const sof = (marca >= 0xc0 && marca <= 0xcf) && ![0xc4, 0xc8, 0xcc].includes(marca);
      if (sof && p + 9 <= buf.length) {
        return { format: 'jpeg', amplada: buf.readUInt16BE(p + 7), alcada: buf.readUInt16BE(p + 5), orientacio };
      }
      p += 2 + llarg;
    }
    return null;
  }
  return null;
}

/** Les mides d'un fitxer, llegint-ne només el cap (fins a 256 KiB, prou per a l'EXIF). */
export function midesDeFitxer(abs) {
  const fd = fs.openSync(abs, 'r');
  try {
    const buf = Buffer.alloc(Math.min(fs.fstatSync(fd).size, 256 * 1024));
    fs.readSync(fd, buf, 0, buf.length, 0);
    return mides(buf);
  } finally { fs.closeSync(fd); }
}

/**
 * Mides de destí: l'orientació EXIF 5-8 intercanvia amplada i alçada, el costat llarg queda
 * dins de `max` i mai s'amplia.
 */
export function midaDesti({ amplada, alcada, orientacio = 1 }, max) {
  const [w, h] = orientacio >= 5 ? [alcada, amplada] : [amplada, alcada];
  const escala = Math.min(1, max / Math.max(w, h));
  return { amplada: Math.max(1, Math.round(w * escala)), alcada: Math.max(1, Math.round(h * escala)), redueix: escala < 1 };
}

/* ═════════════════════════ Cens de public/ ═════════════════════════ */

function recorre(abs, visita) {
  let estat;
  try { estat = fs.statSync(abs); } catch { return; }
  if (estat.isFile()) { visita(abs, estat); return; }
  if (!estat.isDirectory()) return;
  for (const nom of fs.readdirSync(abs).sort()) {
    if (nom.startsWith('.') || DIRECTORIS_IGNORATS.has(nom)) continue;
    recorre(path.join(abs, nom), visita);
  }
}

/** Les imatges de public/, en camins relatius a public/ (el camí que servix el web). */
export function imatgesPubliques(arrel) {
  const publica = path.join(arrel, 'public');
  const llista = [];
  recorre(publica, (abs, estat) => {
    const ext = path.extname(abs).toLowerCase();
    if (EXTENSIONS_IMATGE.includes(ext)) llista.push({ cami: posix(path.relative(publica, abs)), abs, bytes: estat.size, ext });
  });
  return llista;
}

/** Tot el text on es poden citar imatges, unit en un sol bloc per grup. */
export function corpus(arrel, arrels) {
  const trossos = [];
  for (const r of arrels) {
    recorre(path.join(arrel, r), (abs, estat) => {
      if (!EXTENSIONS_TEXT.has(path.extname(abs).toLowerCase()) || estat.size > MAX_BYTES_TEXT) return;
      try { trossos.push(fs.readFileSync(abs, 'utf8')); } catch { /* il·legible: no hi ha referència */ }
    });
  }
  return trossos.join('\n');
}

const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Plantilles de codi que construïxen camins d'imatge (`/assets/towns/${slug}/1.jpg`),
 * convertides en expressions que s'avaluen contra el camí públic de cada imatge.
 * Només compten les que porten una barra i almenys quatre caràcters literals.
 */
export function patronsDinamics(text) {
  const patrons = new Map();
  for (const m of text.matchAll(/`([^`\n]{1,240})`/g)) {
    /* Una adreça absoluta (https://socdepoble.org/assets/…) es compara pel camí. */
    const plantilla = m[1].replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '');
    if (!plantilla.includes('${')) continue;
    const literals = plantilla.split(/\$\{[^}]*\}/);
    const fix = literals.join('');
    if (!fix.includes('/') || fix.replace(/[/.]/g, '').length < 4) continue;
    const font = literals.map(escapa).join('.*');
    if (!patrons.has(font)) patrons.set(font, new RegExp(`${font}$`));
  }
  return [...patrons.values()];
}

/**
 * Classifica cada imatge: codi, dinamic, wiki o orfe (vegeu la capçalera). `codi` i `wiki`
 * són els textos units de cada grup; `patrons` són els de patronsDinamics() del codi.
 */
export function classifica(imatges, { codi, wiki, patrons = patronsDinamics(codi) }) {
  const cita = (text, img) => {
    const nom = path.posix.basename(img.cami);
    return text.includes(img.cami) || text.includes(encodeURI(img.cami)) || text.includes(nom) || text.includes(encodeURI(nom));
  };
  /* Dos maneres de citar una carpeta en el codi:
     · un prefix amb barra final ('/assets/towns/') construïx imatges d'eixa
       carpeta, i només d'eixa;
     · una constant base sense barra final ('/assets/towns', com a BASE de
       `${BASE}/${slug}.jpg`) en pot construir també de les subcarpetes. La
       primera carpeta sola ('assets') no compta: ho cobriria tot. */
  const memo = new Map();
  const citaAmb = (dir, sufixos) => {
    const clau = `${dir}|${sufixos}`;
    if (!memo.has(clau)) {
      memo.set(clau, sufixos.some((sufix) => ['/', "'", '"', '`'].some((abans) => codi.includes(`${abans}${dir}${sufix}`))));
    }
    return memo.get(clau);
  };
  const perCarpeta = (dir) => {
    if (dir && citaAmb(dir, ["/'", '/"', '/`'])) return true;
    const trossos = dir.split('/').filter(Boolean);
    for (let n = trossos.length; n >= 2; n--) if (citaAmb(trossos.slice(0, n).join('/'), ["'", '"', '`'])) return true;
    return false;
  };
  return imatges.map((img) => {
    let estat = 'orfe';
    if (cita(codi, img)) estat = 'codi';
    else if (patrons.some((re) => re.test(`/${img.cami}`)) || perCarpeta(path.posix.dirname(img.cami))) estat = 'dinamic';
    else if (cita(wiki, img)) estat = 'wiki';
    return { ...img, estat };
  });
}

/**
 * Cert si una imatge és candidata a WebP: un PNG o JPEG de més de `llindarKb` o amb
 * el costat llarg de més de `max` px. El mateix criteri per al cens i per a
 * `converteix --nomes-candidates`.
 */
export function esCandidata({ ext, bytes, mides: m }, { max = MAX_PER_DEFECTE, llindarKb = LLINDAR_KB_PER_DEFECTE } = {}) {
  if (!EXTENSIONS_CONVERTIBLES.includes(String(ext).toLowerCase())) return false;
  return bytes > llindarKb * 1024 || (Boolean(m) && Math.max(m.amplada, m.alcada) > max);
}

/** Cens complet de public/: classificació, mides i candidates a WebP. */
export function cens(arrel, { max = MAX_PER_DEFECTE, llindarKb = LLINDAR_KB_PER_DEFECTE } = {}) {
  const imatges = imatgesPubliques(arrel);
  const codi = corpus(arrel, ARRELS_CODI);
  const wiki = corpus(arrel, ARRELS_WIKI);
  /* Encàrrec 261019_1425 · La regla de les bessones és la de l'app i del paquet
     (politicaDeMitjans.js): una bessona sense cap cita no és cap orfe, és el
     fitxer que els paquets (l'autònom, el directori i, des de la Fase C, el
     natiu) demanen en lloc del seu original; socdepoble.org continua demanant
     l'original. */
  const ambBessona = new Set(bessonesDe(imatges.map((i) => i.cami)));
  const originalDe = new Map([...ambBessona].map((original) => [bessonaDe(original), original]));
  const perCami = new Map();
  const classificades = classifica(imatges, { codi, wiki }).map((img) => {
    const m = img.ext === '.svg' ? null : (() => { try { return midesDeFitxer(img.abs); } catch { return null; } })();
    const net = { ...img, mides: m, teWebp: ambBessona.has(img.cami), candidataWebp: esCandidata({ ...img, mides: m }, { max, llindarKb }) };
    if (originalDe.has(img.cami)) net.bessonaDe = originalDe.get(img.cami);
    delete net.abs;
    perCami.set(net.cami, net);
    return net;
  });
  for (const img of classificades) {
    if (img.bessonaDe && img.estat === 'orfe') img.estat = perCami.get(img.bessonaDe)?.estat ?? 'orfe';
  }
  const resum = { total: classificades.length, bytes: 0, perEstat: { codi: 0, dinamic: 0, wiki: 0, orfe: 0 }, bytesOrfes: 0,
    candidatesWebp: 0, bytesCandidates: 0 };
  for (const img of classificades) {
    resum.bytes += img.bytes;
    resum.perEstat[img.estat]++;
    if (img.estat === 'orfe') resum.bytesOrfes += img.bytes;
    if (img.candidataWebp) { resum.candidatesWebp++; resum.bytesCandidates += img.bytes; }
  }
  return { resum, imatges: classificades };
}

/* ═════════════════════════ Codificadors ═════════════════════════ */

function enPath(binari) {
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [binari], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.split('\n')[0].trim() || null : null;
}

/** On és Chrome/Chromium: SDP_CHROME o CHROME_PATH, les rutes de macOS i el PATH. */
export function rutaChrome(entorn = process.env, existix = fs.existsSync) {
  for (const candidat of [entorn.SDP_CHROME, entorn.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium']) {
    if (candidat && existix(candidat)) return candidat;
  }
  for (const binari of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const ruta = enPath(binari);
    if (ruta) return ruta;
  }
  return null;
}

/** Cert si hi ha python3 amb Pillow: el que necessita la maquinària del Mas. */
function tePillow() {
  const r = spawnSync('python3', ['-c', 'import PIL'], { stdio: 'ignore' });
  return r.status === 0;
}

/** Quins codificadors respon aquesta màquina, en l'ordre de preferència. */
export async function codificadorsDisponibles() {
  const disponibles = [];
  if (tePillow()) disponibles.push({ nom: 'maquinaria', ruta: 'tooling/maquinaria/convertir_a_webp.mjs' });
  try { await import('sharp'); disponibles.push({ nom: 'sharp', ruta: 'node_modules/sharp' }); } catch { /* no instal·lat */ }
  const cwebp = enPath('cwebp');
  if (cwebp) disponibles.push({ nom: 'cwebp', ruta: cwebp });
  const magick = enPath('magick');
  if (magick) disponibles.push({ nom: 'magick', ruta: magick });
  const chrome = rutaChrome();
  if (chrome) disponibles.push({ nom: 'chrome', ruta: chrome });
  return disponibles;
}

/**
 * El codificador que toca: el demanat si hi és, o el primer disponible amb `auto`.
 * Amb `format` ('png' | 'jpeg'), només un que el sàpia codificar.
 */
export function triaCodificador(disponibles, demanat = 'auto', format = null) {
  const sap = (c) => !format || (FORMATS_DEL_CODIFICADOR[c.nom] || []).includes(format);
  if (demanat === 'auto') return disponibles.find(sap) || null;
  const triat = disponibles.find((c) => c.nom === demanat) || null;
  return triat && sap(triat) ? triat : null;
}

const MIME = { png: 'image/png', jpeg: 'image/jpeg' };
/** Pressupost per a la maquinària: prou ample perquè no rebaixe mai la qualitat per a complir-lo. */
const PRESSUPOST_KB_MAQUINARIA = 1024 * 1024;

/** Pàgina d'un sol ús que Chrome executa sense capçal: redimensiona i codifica amb canvas. */
export function paginaChrome(base64, mime, max, qualitat) {
  return `<!doctype html><html><body><script>
const img = new Image();
img.onload = () => {
  const escala = Math.min(1, ${max} / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * escala));
  const h = Math.max(1, Math.round(img.naturalHeight * escala));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  const url = c.toDataURL('image/webp', ${qualitat / 100});
  document.querySelectorAll('script').forEach((s) => s.remove());
  const eixida = document.createElement('pre');
  eixida.id = 'sdp-webp';
  eixida.textContent = url;
  document.body.appendChild(eixida);
};
img.onerror = () => { document.body.textContent = 'SDP-WEBP-ERROR'; };
img.src = 'data:${mime};base64,${base64}';
</script></body></html>`;
}

/** Extrau el WebP de la pàgina que torna Chrome amb --dump-dom. */
export function webpDeDom(dom) {
  const m = /data:image\/webp;base64,([A-Za-z0-9+/=]+)/.exec(dom);
  if (!m) throw new Error(/SDP-WEBP-ERROR/.test(dom) ? 'Chrome no ha pogut decodificar la imatge' : 'Chrome no ha tornat cap WebP');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') throw new Error('Chrome ha tornat un fitxer que no és WebP');
  return buf;
}

/** Codifica `orig` i torna el Buffer WebP. `m` són les mides d'origen; `desti`, les de destí. */
export async function codifica(codificador, orig, m, desti, { max, qualitat }) {
  if (codificador.nom === 'sharp') {
    const sharp = (await import('sharp')).default;
    return sharp(orig).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality: qualitat }).toBuffer();
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-webp-'));
  try {
    const eixida = path.join(tmp, 'eixida.webp');
    if (codificador.nom === 'maquinaria') {
      /* La maquinària del Mas: mode 'original' (proporcions, costat llarg ≤ max) i un
         pressupost de pes que no la força mai a degradar la imatge; si el .webp no pesa
         menys que l'original, ho decidix executa(). */
      const { convertirImatgeAWebp } = await import('../maquinaria/convertir_a_webp.mjs');
      convertirImatgeAWebp(orig, eixida, { mode: 'original', midaPx: max, maxKb: PRESSUPOST_KB_MAQUINARIA });
    } else if (codificador.nom === 'cwebp') {
      if (m.orientacio !== 1) throw new Error(`orientació EXIF ${m.orientacio}: cwebp no la gira; useu --codificador chrome o magick`);
      const mida = desti.redueix ? ['-resize', String(desti.amplada), String(desti.alcada)] : [];
      execFileSync(codificador.ruta, ['-quiet', '-q', String(qualitat), '-metadata', 'none', ...mida, orig, '-o', eixida], { stdio: 'pipe' });
    } else if (codificador.nom === 'magick') {
      execFileSync(codificador.ruta, [orig, '-auto-orient', '-resize', `${max}x${max}>`, '-strip', '-quality', String(qualitat), eixida], { stdio: 'pipe' });
    } else if (codificador.nom === 'chrome') {
      const pagina = path.join(tmp, 'pagina.html');
      fs.writeFileSync(pagina, paginaChrome(fs.readFileSync(orig).toString('base64'), MIME[m.format], max, qualitat));
      /* cwd: Chrome sense capçal pot crear la memòria cau sota un «~/Downloads» literal i
         relatiu; dins de la carpeta temporal, se'n va amb ella. */
      const dom = execFileSync(codificador.ruta, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        '--disable-extensions', '--disable-sync', '--mute-audio', `--user-data-dir=${path.join(tmp, 'perfil')}`,
        '--virtual-time-budget=30000', '--dump-dom', `file://${pagina}`],
      { cwd: tmp, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 });
      return webpDeDom(dom);
    } else {
      throw new Error(`Codificador desconegut: ${codificador.nom}`);
    }
    return fs.readFileSync(eixida);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/* ═════════════════════════ Conversió ═════════════════════════ */

/** Expandix fitxers i carpetes a la llista d'imatges PNG/JPEG, sense repetits. */
export function entrades(camins, base = process.cwd()) {
  const vistes = new Set();
  const llista = [];
  for (const c of camins) {
    const abs = path.resolve(base, c);
    if (!fs.existsSync(abs)) throw new Error(`No existix: ${c}`);
    recorre(abs, (fitxer) => {
      if (!EXTENSIONS_CONVERTIBLES.includes(path.extname(fitxer).toLowerCase()) || vistes.has(fitxer)) return;
      vistes.add(fitxer);
      llista.push(fitxer);
    });
  }
  return llista;
}

/**
 * Les candidates d'una llista de fitxers (esCandidata, el criteri del cens) i quantes
 * se'n queden fora. Llig només el cap de cada fitxer.
 */
export function nomesCandidates(fitxers, { max = MAX_PER_DEFECTE, llindarKb = LLINDAR_KB_PER_DEFECTE } = {}) {
  const candidates = fitxers.filter((abs) => {
    let m = null;
    try { m = midesDeFitxer(abs); } catch { /* il·legible: el pla ja ho dirà */ }
    return esCandidata({ ext: path.extname(abs), bytes: fs.statSync(abs).size, mides: m }, { max, llindarKb });
  });
  return { candidates, descartades: fitxers.length - candidates.length };
}

/**
 * Pla de conversió, sense escriure res: destí, mides i, si n'hi ha, per què es salta.
 * Dos originals que donarien el mateix .webp (foto.jpg i foto.png) se salten tots dos,
 * també si només un dels dos entra al pla: la carpeta de l'original mana.
 */
export function pla(fitxers, { max = MAX_PER_DEFECTE, eixida = null, sobreescriu = false, base = process.cwd() } = {}) {
  /* Encàrrec 261019_1425 · Amb --nomes-candidates (o un sol fitxer) el germà
     petit no entra al pla, i el .webp seria d'un original o de l'altre segons
     qui el demanara. Es mira la carpeta: si hi ha un altre PNG/JPEG amb el
     mateix nom, sense distingir majúscules, ningú no té bessona. */
  /* Amb --eixida la bessona viu a una altra carpeta: hi compten els seus
     PNG/JPEG del mateix nom que no són este original. */
  const germans = (orig, desti) => {
    const nom = path.basename(orig, path.extname(orig)).toLowerCase();
    const carpeta = path.dirname(desti);
    try {
      return fs.readdirSync(carpeta).filter((fill) => EXTENSIONS_CONVERTIBLES.includes(path.extname(fill).toLowerCase())
        && path.basename(fill, path.extname(fill)).toLowerCase() === nom && path.join(carpeta, fill) !== orig).length;
    } catch { return 0; }
  };
  const passos = fitxers.map((orig) => {
    const nom = `${path.basename(orig, path.extname(orig))}.webp`;
    const desti = eixida ? path.resolve(base, eixida, nom) : path.join(path.dirname(orig), nom);
    const bytes = fs.statSync(orig).size;
    let m = null;
    try { m = midesDeFitxer(orig); } catch { /* il·legible */ }
    const pas = { orig, desti, bytes, mides: m, midesDesti: m ? midaDesti(m, max) : null, salta: null };
    if (!m || !['png', 'jpeg'].includes(m.format)) pas.salta = 'capçalera no reconeguda com a PNG o JPEG';
    else if (fs.existsSync(desti) && !sobreescriu) pas.salta = 'ja existix el .webp (useu --sobreescriu)';
    else if (germans(orig, desti) > 0) pas.salta = 'dos originals donarien el mateix .webp';
    return pas;
  });
  /* Revisió adversarial (261018) · Sense distingir majúscules: el disc d'un Mac
     no les distingix, i Foto.jpg i foto.png s'escriurien damunt. */
  const perDesti = new Map();
  const clau = (desti) => desti.toLowerCase();
  for (const p of passos) perDesti.set(clau(p.desti), (perDesti.get(clau(p.desti)) || 0) + 1);
  for (const p of passos) if (perDesti.get(clau(p.desti)) > 1 && !p.salta) p.salta = 'dos originals donarien el mateix .webp';
  return passos;
}

/** El motiu d'una eixida fallida: la primera línia i, si n'hi ha, l'última de l'stderr de l'eina. */
export function motiuDError(e) {
  const primera = String(e?.message ?? e).split('\n')[0];
  const stderr = e?.stderr ? String(e.stderr).trim().split('\n').filter(Boolean).at(-1) : '';
  return stderr && !primera.includes(stderr) ? `${primera} · ${stderr}` : primera;
}

/**
 * Executa el pla. `codificador` és un codificador o una funció (format) → codificador
 * que el tria per a cada imatge. Només escriu amb `aplica`. `codificaAmb` és per a les proves.
 */
export async function executa(passos, codificador, { max, qualitat, aplica }, codificaAmb = codifica) {
  for (const p of passos) {
    if (p.salta) continue;
    const triat = typeof codificador === 'function' ? codificador(p.mides?.format ?? null) : codificador;
    if (!triat) { p.error = `cap codificador disponible per a ${p.mides?.format ?? 'esta imatge'}`; continue; }
    p.codificador = triat.nom;
    try {
      const webp = await codificaAmb(triat, p.orig, p.mides, p.midesDesti, { max, qualitat });
      p.bytesWebp = webp.length;
      if (webp.length >= p.bytes) { p.salta = `el .webp (${kb(webp.length)} KB) no pesa menys que l'original`; continue; }
      if (aplica) {
        fs.mkdirSync(path.dirname(p.desti), { recursive: true });
        /* Encàrrec 261019_1425 · Temporal i canvi de nom: si la conversió es talla a
           mitges, no queda cap NOM.webp trencat que la passada següent saltaria
           («ja existix») i l'app serviria. */
        /* Ocult (amb punt): si mai en quedara un, ni el tractor ni el paquet
           (PROPIS_DEL_LLOC.prefixOcult) no el prenen per cap imatge. */
        const temporal = path.join(path.dirname(p.desti), `.${path.basename(p.desti)}.${process.pid}.tmp`);
        try {
          fs.writeFileSync(temporal, webp, { flag: 'wx' });
          fs.renameSync(temporal, p.desti);
        } catch (e) {
          fs.rmSync(temporal, { force: true });
          throw e;
        }
        p.escrit = true;
      }
    } catch (e) {
      p.error = motiuDError(e);
    }
  }
  return passos;
}

/* ═════════════════════════ Informes ═════════════════════════ */

function informeCens({ resum, imatges }, { max, llindarKb }, arrel) {
  const linies = [`[media:webp] Cens de public/ a ${arrel}`,
    `   ${resum.total} imatges · ${kb(resum.bytes)} KB · codi ${resum.perEstat.codi} · dinàmiques ${resum.perEstat.dinamic} · només wiki ${resum.perEstat.wiki} · orfes ${resum.perEstat.orfe} (${kb(resum.bytesOrfes)} KB)`,
    `   Candidates a WebP (PNG/JPEG de més de ${llindarKb} KB o de més de ${max} px): ${resum.candidatesWebp} (${kb(resum.bytesCandidates)} KB)`];
  const orfes = imatges.filter((i) => i.estat === 'orfe');
  if (orfes.length) {
    linies.push('', '   Orfes (ningú no les cita ni les pot construir; revisió humana, el tractor no les mou):');
    for (const i of orfes) linies.push(`     · public/${i.cami} (${kb(i.bytes)} KB)`);
  }
  const wiki = imatges.filter((i) => i.estat === 'wiki');
  if (wiki.length) {
    linies.push('', '   Només citades per la Wiki:');
    for (const i of wiki) linies.push(`     · public/${i.cami} (${kb(i.bytes)} KB)`);
  }
  const candidates = imatges.filter((i) => i.candidataWebp).sort((a, b) => b.bytes - a.bytes);
  if (candidates.length) {
    linies.push('', '   Candidates a WebP, de més a menys pes:');
    for (const i of candidates) {
      const dim = i.mides ? `${i.mides.amplada}×${i.mides.alcada}` : '¿?';
      linies.push(`     · public/${i.cami} (${kb(i.bytes)} KB, ${dim}${i.teWebp ? ', ja té .webp' : ''}, ${i.estat})`);
    }
  }
  linies.push('', '   Per convertir: npm run media:webp -- converteix CAMÍ... (afegiu --aplica per escriure).');
  return linies.join('\n');
}

function informeConversio(passos, { aplica, max, qualitat, nomesCandidates = false, llindarKb, descartades = 0 }) {
  const usats = [...new Set(passos.map((p) => p.codificador).filter(Boolean))];
  const etiquetaQualitat = usats.includes('maquinaria') ? `qualitat ${qualitat} (la maquinària tria la seua: 84)` : `qualitat ${qualitat}`;
  const linies = [`[media:webp] ${aplica ? 'Conversió' : 'Pla (sense --aplica no s\'escriu res)'} · codificador ${usats.join(' i ') || 'cap'} · màx. ${max} px · ${etiquetaQualitat}`];
  if (nomesCandidates) linies.push(`   Només candidates (més de ${llindarKb} KB o de ${max} px): ${passos.length}; ${descartades} imatges no candidates fora del pla.`);
  let abans = 0;
  let despres = 0;
  for (const p of passos) {
    const dim = p.midesDesti ? `${p.mides.amplada}×${p.mides.alcada} → ${p.midesDesti.amplada}×${p.midesDesti.alcada}` : '';
    let estat;
    if (p.error) estat = `ERROR: ${p.error}`;
    else if (p.salta) estat = `saltada: ${p.salta}`;
    else if (p.bytesWebp != null) {
      abans += p.bytes; despres += p.bytesWebp;
      estat = `${kb(p.bytes)} KB → ${kb(p.bytesWebp)} KB${p.escrit ? ' · escrit' : ''}`;
    } else estat = `${kb(p.bytes)} KB`;
    const amb = p.codificador && usats.length > 1 ? ` (${p.codificador})` : '';
    linies.push(`   · ${p.orig} → ${path.basename(p.desti)} ${dim} · ${estat}${amb}`);
  }
  if (abans) linies.push(`   Total: ${kb(abans)} KB → ${kb(despres)} KB (−${Math.round((1 - despres / abans) * 100)} %). Els originals no s'han tocat.`);
  return linies.join('\n');
}

/* ═════════════════════════ CLI ═════════════════════════ */

export async function main(argv = process.argv.slice(2), { arrel = null, sortida = console } = {}) {
  let o;
  try { o = opcions(argv); } catch (e) { sortida.error(e.message); return 2; }
  const base = arrel || arrelSegura();
  if (o.ordre === 'cens') {
    const resultat = cens(base, o);
    sortida.log(o.json ? JSON.stringify(resultat, null, 2) : informeCens(resultat, o, base));
    return 0;
  }
  const disponibles = await codificadorsDisponibles();
  if (o.ordre === 'codificadors') {
    sortida.log(o.json ? JSON.stringify(disponibles, null, 2)
      : disponibles.length ? `[media:webp] Codificadors disponibles: ${disponibles.map((c) => `${c.nom} (${c.ruta})`).join(', ')}`
        : '[media:webp] Cap codificador WebP disponible.');
    return disponibles.length ? 0 : 2;
  }
  let fitxers;
  try { fitxers = entrades(o.camins); } catch (e) { sortida.error(e.message); return 2; }
  let descartades = 0;
  if (o.nomesCandidates) ({ candidates: fitxers, descartades } = nomesCandidates(fitxers, o));
  const passos = pla(fitxers, o);
  if (!triaCodificador(disponibles, o.codificador)) {
    sortida.error(o.codificador === 'auto'
      ? '[media:webp] Cap codificador WebP disponible: instal·leu Pillow per a python3 (la maquinària del Mas), libwebp (brew install webp) o Google Chrome. sharp només amb aprovació del Mestre (npm install).'
      : `[media:webp] El codificador ${o.codificador} no és disponible en aquesta màquina.`);
    return 2;
  }
  /* Cada imatge, amb el primer codificador que en sap el format (o el demanat, si en sap). */
  await executa(passos, (format) => triaCodificador(disponibles, o.codificador, format), o);
  sortida.log(o.json ? JSON.stringify({ disponibles, passos, ...(o.nomesCandidates ? { descartades } : {}) }, null, 2)
    : informeConversio(passos, { ...o, descartades }));
  return passos.some((p) => p.error) ? 1 : 0;
}

if (esMain(import.meta.url)) {
  main().then((codi) => { process.exitCode = codi; }, (e) => { console.error(`[media:webp] ${e.message}`); process.exitCode = 1; });
}
