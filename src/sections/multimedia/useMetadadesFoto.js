/**
 * useMetadadesFoto.js — l'EXIF de la foto oberta al visor de l'Arxiu visual.
 *
 * Onada 0.3 (Gauntlet 261016, M06) · El visor llig l'EXIF AL CLIENT i només de
 * la foto oberta: els primers MAX_BYTES_EXIF (256 KB) del fitxer, amb una
 * petició Range i, si el servidor no la respecta, tallant el flux en arribar-hi
 * (MCR 261016, risc 9: abans es parlava de baixar l'original sencer). El llig
 * exif.js (llegixExif, pur i fitat), amb ambCamera per a la càmera, l'autor i
 * els drets.
 *   · Cap tercer: només es demana una imatge PRÒPIA (esFontImatgePropia: el
 *     mateix lloc o el nostre servidor de mitjans), mai una URL de fora ni una
 *     sdp-media:// (la resol el port).
 *   · Privacitat: de la foto d'una persona no es llig el GPS (ambGps: false).
 *   · Una lectura per foto i per sessió (memòria de MAX_MEMORIA entrades); en
 *     canviar de foto o tancar, la lectura en vol s'avorta.
 * Torna { estat: 'sense' | 'llegint' | 'llest', exif }.
 *
 * Gauntlet 261017 (C03 de Codex) · En WebP el tros EXIF sol anar darrere de
 * la imatge, fora del prefix, i el lector estricte el rebutjava: d'un WebP de
 * més de 256 KB es perdia la càmera. Ara, si el prefix és un WebP que anuncia
 * EXIF (lecturaExifWebp.js) i el servidor ha respost 206 amb un Content-Range
 * coherent, es recorren les capçaleres dels trossos amb peticions Range de
 * 8 bytes, es llig només el tros EXIF i es passa a llegixExif dins d'un WebP
 * mínim. Cada peça ha de tornar 206 amb el rang demanat i el mateix total (i
 * la mateixa ETag, si n'hi ha) i no es pot redirigir; el prefix, tampoc fora
 * del seu origen. Com a molt MAX_PETICIONS_WEBP peticions i TEMPS_MAXIM_WEBP
 * en total, i s'avorta amb la foto. Si alguna cosa no quadra, o el servidor
 * ignora Range, queda el prefix de sempre: mai l'original sencer. JPEG i PNG,
 * com abans.
 */
import { useEffect, useState } from 'react';
import { MAX_BYTES_EXIF, llegixExif } from '../../components/universal/enquadrament/exif.js';
import { extreuTiff } from '../../components/universal/enquadrament/exifIncrustat.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { cercaExifWebp, rangDeContentRange, webpAmbExifFora, webpMinim } from './lecturaExifWebp.js';

const MAX_MEMORIA = 60;
const memoria = new Map();
/** Peticions Range que pot fer el recorregut d'un WebP, capçaleres i tros EXIF inclosos. */
export const MAX_PETICIONS_WEBP = 6;
/** Temps total del recorregut d'un WebP, en mil·lisegons. */
export const TEMPS_MAXIM_WEBP = 8000;
/* Revisió del Gauntlet 261017 (C03, «temps total») · El prefix també té
   sostre: un servidor que envia les capçaleres i després calla deixava la
   lectura (i el «Llegint…» del panell) penjada fins a tancar la foto. 20 s
   basten per a 256 KB fins i tot en una connexió rural lenta. */
export const TEMPS_MAXIM_PREFIX = 20000;

const SENSE = Object.freeze({ estat: 'sense', exif: null });

/** Es pot llegir l'EXIF d'este src sense eixir de casa? */
export function esLlegible(src) {
  return typeof src === 'string' && src.trim() !== '' && !esMitjaOpac(src) && esFontImatgePropia(src);
}

/* El cos d'una resposta fins a `maxim` bytes: en arribar-hi, el flux es
   talla (si el servidor ignora Range, no es baixa la resta). */
async function llegixCos(resposta, maxim) {
  const lector = resposta.body?.getReader?.();
  if (!lector) {
    const sencer = new Uint8Array(await resposta.arrayBuffer());
    return sencer.subarray(0, Math.min(sencer.byteLength, maxim));
  }
  const trossos = [];
  let total = 0;
  while (total < maxim) {
    const { done, value } = await lector.read();
    if (done || !value) break;
    trossos.push(value);
    total += value.byteLength;
  }
  lector.cancel?.().catch?.(() => {});
  const bytes = new Uint8Array(Math.min(total, maxim));
  let pos = 0;
  for (const tros of trossos) {
    const part = tros.subarray(0, Math.min(tros.byteLength, bytes.byteLength - pos));
    bytes.set(part, pos);
    pos += part.byteLength;
    if (pos >= bytes.byteLength) break;
  }
  return bytes;
}

/* Els primers `maxim` bytes d'una URL, amb la resposta que els porta: Range
   i, si arriba sencera, el flux tallat. null si no es pot. */
async function llegixPrefix(url, maxim, signal) {
  const resposta = await fetch(url, { headers: { Range: `bytes=0-${maxim - 1}` }, signal, credentials: 'same-origin' });
  if (!resposta.ok) return null;
  return { resposta, bytes: await llegixCos(resposta, maxim) };
}

/* El prefix amb el seu sostre de temps: un AbortController propi, lligat al
   de qui llig, que talla la petició (i el flux) en esgotar-se `temps`. */
async function llegixPrefixFitat(url, signal, temps) {
  if (typeof AbortController !== 'function') return llegixPrefix(url, MAX_BYTES_EXIF, signal);
  const control = new AbortController();
  const avorta = () => control.abort();
  const rellotge = setTimeout(avorta, temps);
  signal?.addEventListener('abort', avorta);
  if (signal?.aborted) avorta();
  try {
    return await llegixPrefix(url, MAX_BYTES_EXIF, control.signal);
  } finally {
    clearTimeout(rellotge);
    signal?.removeEventListener('abort', avorta);
  }
}

/* On es demanen les peces d'un recorregut: on ha acabat la resposta del
   prefix, si una redirecció no l'ha treta de l'origen demanat; si no, null. */
function destiDe(resposta, url) {
  if (!resposta.redirected) return url;
  try {
    const base = globalThis.location?.href;
    return new URL(resposta.url, base).origin === new URL(url, base).origin ? resposta.url : null;
  } catch {
    return null;
  }
}

/* `n` bytes des de `pos`, amb una petició Range que no es pot redirigir. Ha de
   tornar 206 amb eixe rang exacte i el total del fitxer (i la mateixa ETag, si
   totes dos en porten); el cos es talla a `n`. Si no, null, i el cos es
   cancel·la sense llegir-lo: mai l'original sencer. */
async function llegixRang(url, pos, n, fitxer, signal) {
  const resposta = await fetch(url, { headers: { Range: `bytes=${pos}-${pos + n - 1}` }, signal, credentials: 'same-origin', redirect: 'error' });
  const rang = rangDeContentRange(resposta.headers.get('Content-Range'));
  const etag = resposta.headers.get('ETag');
  const quadra = resposta.status === 206 && rang && rang.inici === pos && rang.fi === pos + n - 1 && rang.total === fitxer.total
    && !(etag && fitxer.etag && etag !== fitxer.etag);
  if (!quadra) {
    resposta.body?.cancel?.().catch?.(() => {});
    return null;
  }
  const bytes = await llegixCos(resposta, n);
  return bytes.byteLength === n ? new DataView(bytes.buffer, bytes.byteOffset, n) : null;
}

/* Gauntlet 261017 (C03 de Codex) · El WebP mínim amb el tros EXIF d'un WebP
   que acaba a `fi`, fora del prefix. Només si el prefix ha arribat amb un 206
   «bytes 0-N/TOTAL» que quadra amb els bytes llegits i amb el RIFF. Les
   capçaleres i el tros que ja són al prefix no es tornen a demanar; la resta,
   com a molt MAX_PETICIONS_WEBP peticions en `temps` ms. null si no quadra o
   no es troba; rebutja si s'esgota el temps, falla la xarxa o s'avorta. */
async function recorreWebp(url, { resposta, bytes: prefix }, fi, signal, temps) {
  const rang = rangDeContentRange(resposta.headers.get('Content-Range'));
  if (resposta.status !== 206 || !rang || rang.inici !== 0 || rang.fi !== prefix.byteLength - 1 || fi > rang.total) return null;
  const desti = destiDe(resposta, url);
  if (!desti || typeof AbortController !== 'function') return null;
  const fitxer = { total: rang.total, etag: resposta.headers.get('ETag') };
  const control = new AbortController();
  const avorta = () => control.abort();
  const rellotge = setTimeout(avorta, temps);
  signal?.addEventListener('abort', avorta);
  if (signal?.aborted) avorta();
  let peticions = 0;
  const llig = (pos, n) => {
    if (pos + n <= prefix.byteLength) return new DataView(prefix.buffer, prefix.byteOffset + pos, n);
    if (peticions >= MAX_PETICIONS_WEBP) return null;
    peticions += 1;
    return llegixRang(desti, pos, n, fitxer, control.signal);
  };
  try {
    const cerca = cercaExifWebp(fi);
    let pas = cerca.next();
    while (!pas.done) pas = cerca.next(await llig(pas.value, 8));
    const tros = pas.value ? await llig(pas.value.inici, pas.value.mida) : null;
    return tros ? webpMinim(prefix, new Uint8Array(tros.buffer, tros.byteOffset, tros.byteLength)) : null;
  } finally {
    clearTimeout(rellotge);
    signal?.removeEventListener('abort', avorta);
  }
}

/**
 * L'EXIF d'una imatge pròpia per URL: el prefix de MAX_BYTES_EXIF i, d'un WebP
 * que l'anuncia fora del prefix, el tros EXIF trobat per recorreWebp. Les
 * opcions són les de llegixExif, més `signal`, `temps` (el del recorregut) i
 * `tempsPrefix` (el de la primera petició, capçaleres i cos).
 * P1-64 (revisió adversarial 261028) · Amb `ambTiff: true`, també `tiff`: el
 * bloc TIFF dels bytes llegits (extreuTiff) o null, perquè qui publica
 * (sections/notes/geoDeLesFotos.js) en llija la marca de la precisió
 * (precisioDeGps). Sense l'opció, el resultat de sempre.
 * null si el servidor no dona la imatge; rebutja si s'avorta, falla la xarxa o
 * s'esgota algun dels dos temps.
 */
export async function llegixExifRemot(url, { signal, temps = TEMPS_MAXIM_WEBP, tempsPrefix = TEMPS_MAXIM_PREFIX, ambTiff = false, ...opcions } = {}) {
  const prefix = await llegixPrefixFitat(url, signal, tempsPrefix);
  if (!prefix) return null;
  const fi = webpAmbExifFora(prefix.bytes);
  const webp = fi ? await recorreWebp(url, prefix, fi, signal, temps) : null;
  const bytes = webp || prefix.bytes;
  const exif = llegixExif(bytes, opcions);
  return ambTiff === true ? { ...exif, tiff: extreuTiff(bytes) } : exif;
}

function recorda(clau, exif) {
  if (memoria.size >= MAX_MEMORIA) memoria.delete(memoria.keys().next().value);
  memoria.set(clau, exif);
}

/** Per a les proves: oblida el que s'ha llegit. */
export function oblidaMetadades() {
  memoria.clear();
}

export function useMetadadesFoto(src, { persona = false } = {}) {
  const llegible = esLlegible(src) && typeof fetch === 'function';
  const clau = llegible ? `${src}|${persona ? 'p' : 'g'}` : null;
  const [lectura, setLectura] = useState(() => (clau && memoria.has(clau) ? { clau, estat: 'llest', exif: memoria.get(clau) } : null));

  useEffect(() => {
    if (!clau || memoria.has(clau)) return undefined;
    const control = typeof AbortController === 'function' ? new AbortController() : null;
    let viu = true;
    setLectura({ clau, estat: 'llegint', exif: null });
    llegixExifRemot(resolRecursPropi(src), { ambCamera: true, ambGps: !persona, signal: control?.signal })
      .catch(() => null)
      .then((exif) => {
        if (!viu) return;
        if (exif) recorda(clau, exif);
        setLectura({ clau, estat: exif ? 'llest' : 'sense', exif });
      });
    return () => {
      viu = false;
      control?.abort();
    };
  }, [clau, src, persona]);

  if (!clau) return SENSE;
  if (memoria.has(clau)) return { estat: 'llest', exif: memoria.get(clau) };
  if (lectura?.clau === clau) return { estat: lectura.estat, exif: lectura.exif };
  return { estat: 'llegint', exif: null };
}
