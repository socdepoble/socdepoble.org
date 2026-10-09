/**
 * qrDibuix.js — el DIBUIX del codi QR que porta cada factura: un codificador
 * propi de la norma ISO/IEC 18004, sense cap dependència.
 *
 * Onada 6 (261009, front «gestoria-facturació»): qr.js compon el TEXT de
 * l'URL de cotejo; ací es fa la matriu de mòduls que el dibuixa. Només el que
 * demana l'AEAT per al QR de les factures (ESPECIFICACIO_QR de qr.js):
 *   · mode byte (el text en UTF-8, sense ECI: l'URL de cotejo és ASCII);
 *   · nivell de correcció M;
 *   · la versió més xicoteta (1 a 40) on cap el text;
 *   · les huit màscares, i es queda la de menys penalització (les quatre
 *     regles N1-N4 de la norma), amb els bits de format i de versió BCH.
 * Les taules (blocs i codis de correcció de cada versió al nivell M) són les
 * de la norma; qrDibuix.test.js les contrasta amb la capacitat de cada
 * versió, amb dos vectors Reed-Solomon coneguts («HELLO WORLD» 1-M i
 * l'exemple «01234567» 1-M de la norma) i amb un lector escrit dins de la
 * prova, que torna a llegir cada matriu des de zero.
 * El camí SVG (camiSvgQR) és un text: qui el pinta tria la mida (de 30 a
 * 40 mm a la factura) i els colors. JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi } from './comu.js';

export const NIVELL_CORRECCIO = 'M';
export const VERSIO_MAXIMA = 40;
/* La zona de silenci que demana la norma: quatre mòduls clars a cada costat. */
export const MARGE_SILENCI = 4;

/* Nivell M, per versió (l'índex és la versió): codis de correcció de cada
   bloc i nombre de blocs (ISO/IEC 18004, taula 9). */
const CORRECCIO_PER_BLOC = Object.freeze([0,
  10, 16, 26, 18, 24, 16, 18, 22, 22, 26,
  30, 22, 22, 24, 24, 28, 28, 26, 26, 26,
  26, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28]);
const BLOCS = Object.freeze([0,
  1, 1, 1, 2, 2, 4, 4, 4, 5, 5,
  5, 8, 9, 9, 10, 10, 11, 13, 14, 16,
  17, 17, 18, 20, 21, 23, 25, 26, 28, 29,
  31, 33, 35, 37, 38, 40, 43, 45, 47, 49]);

/* Els bits del nivell M al format (L 01, M 00, Q 11, H 10) i la màscara fixa del format. */
const BITS_NIVELL = 0b00;
const MASCARA_FORMAT = 0x5412;
/* Polinomis generadors BCH del format (15,5) i de la versió (18,6). */
const GENERADOR_FORMAT = 0x537;
const GENERADOR_VERSIO = 0x1f25;
const MODE_BYTE = 0b0100;
const FARCITS = Object.freeze([0xec, 0x11]);

/* Penalitzacions de la norma per a triar la màscara. */
const N1 = 3;
const N2 = 3;
const N3 = 40;
const N4 = 10;

const esVersio = (v) => Number.isInteger(v) && v >= 1 && v <= VERSIO_MAXIMA;
function comprovaVersio(v) {
  if (!esVersio(v)) throw errorAmbCodi('QR_INVALID', `La versió del QR és un enter de 1 a ${VERSIO_MAXIMA}.`);
}

/* ── El cos de Galois GF(256) amb el polinomi x^8 + x^4 + x^3 + x^2 + 1 ── */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
}
const multiplica = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/* El generador de grau n: (x - α^0)(x - α^1)…(x - α^(n-1)), sense el coeficient principal. */
function generador(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const seguent = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      seguent[j] ^= g[j];
      seguent[j + 1] ^= multiplica(g[j], EXP[i]);
    }
    g = seguent;
  }
  return g.slice(1);
}

/**
 * Els codis de correcció Reed-Solomon d'un bloc de dades: el residu de
 * dades·x^n entre el generador de grau n.
 * @param {ArrayLike<number>} dades bytes
 * @param {number} n quants codis de correcció
 * @returns {number[]}
 */
export function codisDeCorreccio(dades, n) {
  if (!Number.isInteger(n) || n < 1 || n > 68) throw errorAmbCodi('QR_INVALID', 'El nombre de codis de correcció ha de ser de 1 a 68.');
  const g = generador(n);
  const residu = new Array(n).fill(0);
  for (const byte of dades) {
    const factor = byte ^ residu.shift();
    residu.push(0);
    for (let i = 0; i < n; i++) residu[i] ^= multiplica(g[i], factor);
  }
  return residu;
}

/* ── Geometria de cada versió ── */

/** El costat de la matriu d'una versió, en mòduls: 21 a la 1, 177 a la 40. */
export const midaDe = (v) => 17 + 4 * v;

/**
 * Els centres dels patrons d'alineament (files i columnes) d'una versió.
 * @param {number} v
 * @returns {number[]}
 */
export function posicionsAlineament(v) {
  comprovaVersio(v);
  if (v === 1) return [];
  const quants = Math.floor(v / 7) + 2;
  const pas = Math.floor((v * 8 + quants * 3 + 5) / (quants * 4 - 4)) * 2;
  const posicions = [6];
  for (let pos = midaDe(v) - 7; posicions.length < quants; pos -= pas) posicions.splice(1, 0, pos);
  return posicions;
}

/* Els mòduls de dades i correcció d'una versió (sense els patrons, el format ni la versió). */
function modulsDeDades(v) {
  let moduls = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const quants = Math.floor(v / 7) + 2;
    moduls -= (25 * quants - 10) * quants - 55;
    if (v >= 7) moduls -= 36;
  }
  return moduls;
}

/**
 * Els codis (bytes) que caben en una versió: els de dades i correcció junts.
 * @param {number} v
 * @returns {number}
 */
export function codisTotals(v) {
  comprovaVersio(v);
  return Math.floor(modulsDeDades(v) / 8);
}

/**
 * Els blocs d'una versió al nivell M: { blocs, correccio, curts, dadesCurt }.
 * Els curts van primer; els llargs porten un codi de dades més.
 * @param {number} v
 */
export function blocsDe(v) {
  const totals = codisTotals(v);
  const blocs = BLOCS[v];
  const correccio = CORRECCIO_PER_BLOC[v];
  const curts = blocs - (totals % blocs);
  return { blocs, correccio, curts, dadesCurt: Math.floor(totals / blocs) - correccio };
}

/** Els codis de dades d'una versió al nivell M. */
export function codisDeDades(v) {
  const { blocs, correccio } = blocsDe(v);
  return codisTotals(v) - blocs * correccio;
}

/* Els bits del comptador de longitud del mode byte: 8 fins a la versió 9, 16 després. */
const bitsComptador = (v) => (v <= 9 ? 8 : 16);

/**
 * Quants bytes caben en mode byte a una versió, al nivell M.
 * @param {number} v
 * @returns {number}
 */
export function capacitatBytes(v) {
  return Math.floor((codisDeDades(v) * 8 - 4 - bitsComptador(v)) / 8);
}

/* ── Bits de format i de versió (BCH) ── */

/**
 * Els 15 bits de format del nivell M i una màscara, amb la seua correcció BCH i la màscara fixa.
 * @param {number} mascara 0 a 7
 * @returns {number}
 */
export function bitsDeFormat(mascara) {
  if (!Number.isInteger(mascara) || mascara < 0 || mascara > 7) throw errorAmbCodi('QR_INVALID', 'La màscara és un enter de 0 a 7.');
  const dades = (BITS_NIVELL << 3) | mascara;
  let residu = dades;
  for (let i = 0; i < 10; i++) residu = (residu << 1) ^ ((residu >>> 9) * GENERADOR_FORMAT);
  return ((dades << 10) | residu) ^ MASCARA_FORMAT;
}

/**
 * Els 18 bits de versió (de la 7 a la 40), amb la seua correcció BCH.
 * @param {number} v
 * @returns {number}
 */
export function bitsDeVersio(v) {
  comprovaVersio(v);
  if (v < 7) throw errorAmbCodi('QR_INVALID', 'Només les versions 7 a 40 porten bits de versió.');
  let residu = v;
  for (let i = 0; i < 12; i++) residu = (residu << 1) ^ ((residu >>> 11) * GENERADOR_VERSIO);
  return (v << 12) | residu;
}

/* ── La matriu ── */

const bit = (valor, i) => ((valor >>> i) & 1) === 1;

/* Una matriu buida: els mòduls (1 fosc) i quins són de funció (patrons, format, versió). */
function matriuBuida(v) {
  const mida = midaDe(v);
  return { v, mida, moduls: new Uint8Array(mida * mida), funcio: new Uint8Array(mida * mida) };
}
function posaFuncio(m, fila, columna, fosc) {
  const i = fila * m.mida + columna;
  m.moduls[i] = fosc ? 1 : 0;
  m.funcio[i] = 1;
}

/* Un patró de cerca de 7×7 centrat a (fila, columna), amb el separador clar al voltant. */
function patroDeCerca(m, fila, columna) {
  for (let df = -4; df <= 4; df++) {
    for (let dc = -4; dc <= 4; dc++) {
      const f = fila + df;
      const c = columna + dc;
      if (f < 0 || f >= m.mida || c < 0 || c >= m.mida) continue;
      const distancia = Math.max(Math.abs(df), Math.abs(dc));
      posaFuncio(m, f, c, distancia !== 2 && distancia !== 4);
    }
  }
}

/* Un patró d'alineament de 5×5 centrat a (fila, columna). */
function patroAlineament(m, fila, columna) {
  for (let df = -2; df <= 2; df++) {
    for (let dc = -2; dc <= 2; dc++) posaFuncio(m, fila + df, columna + dc, Math.max(Math.abs(df), Math.abs(dc)) !== 1);
  }
}

/* Les dues còpies del format; també reserva les seues caselles i el mòdul fosc fix. */
function dibuixaFormat(m, mascara) {
  const bits = bitsDeFormat(mascara);
  const n = m.mida;
  for (let i = 0; i <= 5; i++) posaFuncio(m, i, 8, bit(bits, i));
  posaFuncio(m, 7, 8, bit(bits, 6));
  posaFuncio(m, 8, 8, bit(bits, 7));
  posaFuncio(m, 8, 7, bit(bits, 8));
  for (let i = 9; i < 15; i++) posaFuncio(m, 8, 14 - i, bit(bits, i));
  for (let i = 0; i < 8; i++) posaFuncio(m, 8, n - 1 - i, bit(bits, i));
  for (let i = 8; i < 15; i++) posaFuncio(m, n - 15 + i, 8, bit(bits, i));
  posaFuncio(m, n - 8, 8, true);
}

/* Les dues còpies dels bits de versió (versions 7 a 40). */
function dibuixaVersio(m) {
  if (m.v < 7) return;
  const bits = bitsDeVersio(m.v);
  for (let i = 0; i < 18; i++) {
    const a = m.mida - 11 + (i % 3);
    const b = Math.floor(i / 3);
    posaFuncio(m, b, a, bit(bits, i));
    posaFuncio(m, a, b, bit(bits, i));
  }
}

/* Tots els patrons de funció d'una versió, amb el format reservat. */
function patronsDeFuncio(v) {
  const m = matriuBuida(v);
  for (let i = 0; i < m.mida; i++) {
    posaFuncio(m, 6, i, i % 2 === 0);
    posaFuncio(m, i, 6, i % 2 === 0);
  }
  patroDeCerca(m, 3, 3);
  patroDeCerca(m, 3, m.mida - 4);
  patroDeCerca(m, m.mida - 4, 3);
  const alineament = posicionsAlineament(v);
  const ultim = alineament.length - 1;
  alineament.forEach((fila, i) => alineament.forEach((columna, j) => {
    const solapa = (i === 0 && j === 0) || (i === 0 && j === ultim) || (i === ultim && j === 0);
    if (!solapa) patroAlineament(m, fila, columna);
  }));
  dibuixaFormat(m, 0);
  dibuixaVersio(m);
  return m;
}

/* Els bytes en mode byte, amb el terminador i el farcit, fins a omplir els codis de dades. */
function bitsDeDades(bytes, v) {
  const bits = [];
  const afig = (valor, quants) => {
    for (let i = quants - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };
  afig(MODE_BYTE, 4);
  afig(bytes.length, bitsComptador(v));
  for (const byte of bytes) afig(byte, 8);
  const capacitat = codisDeDades(v) * 8;
  afig(0, Math.min(4, capacitat - bits.length));
  afig(0, (8 - (bits.length % 8)) % 8);
  const codis = [];
  for (let i = 0; i < bits.length; i += 8) codis.push(bits.slice(i, i + 8).reduce((byte, b) => (byte << 1) | b, 0));
  for (let i = 0; codis.length < codisDeDades(v); i++) codis.push(FARCITS[i % 2]);
  return codis;
}

/* Els codis de dades repartits en blocs, cada un amb la seua correcció, i entrellaçats. */
function entrellaca(dades, v) {
  const { blocs, correccio, curts, dadesCurt } = blocsDe(v);
  const delsBlocs = [];
  let posicio = 0;
  for (let b = 0; b < blocs; b++) {
    const llargaria = dadesCurt + (b < curts ? 0 : 1);
    const bloc = dades.slice(posicio, posicio + llargaria);
    posicio += llargaria;
    delsBlocs.push({ dades: bloc, correccio: codisDeCorreccio(bloc, correccio) });
  }
  const resultat = [];
  for (let i = 0; i <= dadesCurt; i++) {
    for (const bloc of delsBlocs) if (i < bloc.dades.length) resultat.push(bloc.dades[i]);
  }
  for (let i = 0; i < correccio; i++) {
    for (const bloc of delsBlocs) resultat.push(bloc.correccio[i]);
  }
  return resultat;
}

/* Els codis a les caselles lliures, en zig-zag de dos columnes des de baix a la dreta (la 6 se salta). */
function colocaCodis(m, codis) {
  const n = m.mida;
  let i = 0;
  let amunt = true;
  for (let dreta = n - 1; dreta >= 1; dreta -= 2) {
    if (dreta === 6) dreta = 5;
    for (let k = 0; k < n; k++) {
      const fila = amunt ? n - 1 - k : k;
      for (const columna of [dreta, dreta - 1]) {
        const casella = fila * n + columna;
        if (m.funcio[casella]) continue;
        m.moduls[casella] = i < codis.length * 8 && bit(codis[i >>> 3], 7 - (i & 7)) ? 1 : 0;
        i += 1;
      }
    }
    amunt = !amunt;
  }
}

/* Les huit màscares de la norma (fila i, columna j). */
const MASCARES = Object.freeze([
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0
]);

function ambMascara(base, mascara) {
  const m = { ...base, moduls: base.moduls.slice(), funcio: base.funcio.slice() };
  const formula = MASCARES[mascara];
  for (let i = 0; i < m.mida; i++) {
    for (let j = 0; j < m.mida; j++) {
      const casella = i * m.mida + j;
      if (!m.funcio[casella] && formula(i, j)) m.moduls[casella] ^= 1;
    }
  }
  dibuixaFormat(m, mascara);
  return m;
}

/* El patró 1:1:3:1:1 amb quatre clars a un costat, en una tira (els de fora compten com a clars). */
const SEMBLANT_CERCA = Object.freeze([
  Object.freeze([0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1]),
  Object.freeze([1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0])
]);
function penalitzacioDeTira(tira) {
  let punts = 0;
  let longitud = 1;
  for (let i = 1; i <= tira.length; i++) {
    if (i < tira.length && tira[i] === tira[i - 1]) {
      longitud += 1;
      continue;
    }
    if (longitud >= 5) punts += N1 + (longitud - 5);
    longitud = 1;
  }
  const ambMarge = [0, 0, 0, 0, ...tira, 0, 0, 0, 0];
  for (let i = 0; i + 11 <= ambMarge.length; i++) {
    for (const patro of SEMBLANT_CERCA) {
      if (patro.every((valor, k) => ambMarge[i + k] === valor)) punts += N3;
    }
  }
  return punts;
}

/**
 * La penalització d'una matriu quadrada (files de 0 i 1) amb les quatre
 * regles de la norma: tires de cinc o més iguals (N1), quadres 2×2 iguals
 * (N2), semblants al patró de cerca (N3) i desequilibri de foscos (N4).
 * @param {ArrayLike<ArrayLike<number|boolean>>} files
 * @returns {number}
 */
export function penalitzacio(files) {
  const n = files.length;
  const valor = (i, j) => (files[i][j] ? 1 : 0);
  let punts = 0;
  let foscos = 0;
  for (let i = 0; i < n; i++) {
    const fila = [];
    const columna = [];
    for (let j = 0; j < n; j++) {
      fila.push(valor(i, j));
      columna.push(valor(j, i));
      foscos += valor(i, j);
    }
    punts += penalitzacioDeTira(fila) + penalitzacioDeTira(columna);
  }
  for (let i = 0; i + 1 < n; i++) {
    for (let j = 0; j + 1 < n; j++) {
      const v = valor(i, j);
      if (v === valor(i, j + 1) && v === valor(i + 1, j) && v === valor(i + 1, j + 1)) punts += N2;
    }
  }
  const total = n * n;
  const k = Math.ceil(Math.abs(foscos * 20 - total * 10) / total) - 1;
  return punts + Math.max(0, k) * N4;
}

function filesDe(m) {
  const files = [];
  for (let i = 0; i < m.mida; i++) files.push(Object.freeze(Array.from(m.moduls.subarray(i * m.mida, (i + 1) * m.mida), (x) => x === 1)));
  return Object.freeze(files);
}

/**
 * La versió més xicoteta on cap un text d'eixos bytes al nivell M.
 * @param {number} quantsBytes
 * @returns {number}
 */
export function versioPer(quantsBytes) {
  for (let v = 1; v <= VERSIO_MAXIMA; v++) if (quantsBytes <= capacitatBytes(v)) return v;
  throw errorAmbCodi('QR_MASSA_LLARG', `El text del QR passa de ${capacitatBytes(VERSIO_MAXIMA)} bytes: no cap en cap versió al nivell M.`);
}

/**
 * El codi QR d'un text: mode byte (UTF-8), nivell M, la versió més xicoteta
 * on cap i la màscara de menys penalització (o la que es demana, per a les
 * proves). Llança QR_INVALID (no és un text, o una màscara fora de 0-7) i
 * QR_MASSA_LLARG.
 * @param {string} text
 * @param {{ mascara?: number|null }} [opcions]
 * @returns {Readonly<{ versio: number, mida: number, mascara: number, penalitzacio: number,
 *   nivell: 'M', moduls: ReadonlyArray<ReadonlyArray<boolean>> }>} moduls[fila][columna], cert si és fosc
 */
export function codificaQR(text, { mascara = null } = {}) {
  if (typeof text !== 'string') throw errorAmbCodi('QR_INVALID', 'El QR codifica un text.');
  if (mascara !== null && !(Number.isInteger(mascara) && mascara >= 0 && mascara <= 7)) {
    throw errorAmbCodi('QR_INVALID', 'La màscara és un enter de 0 a 7.');
  }
  const bytes = new TextEncoder().encode(text);
  const v = versioPer(bytes.length);
  const base = patronsDeFuncio(v);
  colocaCodis(base, entrellaca(bitsDeDades(bytes, v), v));
  let millor = null;
  for (const candidata of mascara === null ? [0, 1, 2, 3, 4, 5, 6, 7] : [mascara]) {
    const m = ambMascara(base, candidata);
    const files = filesDe(m);
    const punts = penalitzacio(files);
    if (!millor || punts < millor.punts) millor = { mascara: candidata, files, punts };
  }
  return Object.freeze({
    versio: v, mida: base.mida, nivell: NIVELL_CORRECCIO, mascara: millor.mascara, penalitzacio: millor.punts, moduls: millor.files
  });
}

/**
 * El camí SVG dels mòduls foscos (un rectangle per tira horitzontal), amb la
 * zona de silenci al voltant: el viewBox és «0 0 costat costat».
 * @param {{ mida: number, moduls: ReadonlyArray<ReadonlyArray<boolean>> }} qr el de codificaQR
 * @param {{ marge?: number }} [opcions] mòduls clars a cada costat (per defecte, els quatre de la norma)
 * @returns {{ costat: number, d: string }}
 */
export function camiSvgQR(qr, { marge = MARGE_SILENCI } = {}) {
  if (!qr || !Array.isArray(qr.moduls) || qr.moduls.length !== qr.mida) throw errorAmbCodi('QR_INVALID', 'Cal un QR de codificaQR.');
  if (!Number.isInteger(marge) || marge < 0) throw errorAmbCodi('QR_INVALID', 'El marge és un enter de mòduls, zero o més.');
  const trossos = [];
  qr.moduls.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      if (!fila[x]) {
        x += 1;
        continue;
      }
      const inici = x;
      while (x < fila.length && fila[x]) x += 1;
      trossos.push(`M${inici + marge} ${y + marge}h${x - inici}v1h-${x - inici}z`);
    }
  });
  return { costat: qr.mida + 2 * marge, d: trossos.join('') };
}
