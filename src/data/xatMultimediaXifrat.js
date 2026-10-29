/**
 * src/data/xatMultimediaXifrat.js — Adjunts xifrats del xat (`sdp-xat-v1`,
 * P1-12 Fase 4; pla 261029_1305, Bloc C, E1.2; disseny §4.7, §7.7, §8.2, §8.6
 * i §15.7). La capa prima entre la interfície (el preprocés d'adjuntLocal.js
 * va ABANS de xifrar: EXIF, ubicació, compressió) i el protocol
 * (xifratXatProtocol.js: xifraAdjunt / obriAdjunt).
 *
 * Fitxer pla a src/data (D-21), pur: `cripto` injectat, cap global (ni Blob,
 * ni URL, ni crypto), cap xarxa. Qui crida posa a zero `bytes` i `a.k`.
 *
 * Garanties:
 *   · El MIME real només viatja dins del cos xifrat (`a.m`); al servidor hi
 *     arriba `application/octet-stream` i la mida exacta del blob.
 *   · El hash SHA-256 del blob (`a.h`) es comprova ABANS de desxifrar
 *     (IS-15): un blob manipulat no toca mai AES-GCM.
 *   · Llista blanca de MIME al receptor: els de MIME_XAT i cap més (mai
 *     text/html ni image/svg+xml).
 *   · Sostres: els del protocol en clar (MAXIM_CLAR_ADJUNT) i els
 *     20.000.000 B del bucket per al blob farcit (Padmé).
 */
import { MAX_VIDEO_MS, MIME_XAT, errorAdjuntXat } from './xatMultimedia.js';
import { BYTES_ETIQUETA, BYTES_IV, bytesIguals, exigixCripto, midaPadme, sha256 } from './xifratXatCripto.js';
import { BYTES_CLAU, BYTES_HASH, CLASSE_ADJUNT, MAXIM_CLAR_ADJUNT } from './xifratXatFormats.js';
import { CODI, esErrorProtocol, obriAdjunt, xifraAdjunt } from './xifratXatProtocol.js';

export const MIME_XIFRAT = 'application/octet-stream';
export const MAXIM_BLOB_ADJUNT = 20_000_000;
export const PRESSUPOST_BLOBS_MOBIL = 48_000_000;
export const PRESSUPOST_BLOBS_ESCRIPTORI = 100_000_000;
export { CLASSE_ADJUNT, MAXIM_CLAR_ADJUNT };
/* La classe del protocol per a cada família de MIME_XAT, i el `tipus` de
   missatge de sempre per a cada classe (Bombolla i AdjuntXat no canvien). */
export const CLASSE_DEL_TIPUS = Object.freeze({ imatge: CLASSE_ADJUNT.foto, veu: CLASSE_ADJUNT.veu, video: CLASSE_ADJUNT.video });
export const TIPUS_DE_CLASSE = Object.freeze({ [CLASSE_ADJUNT.foto]: 'foto', [CLASSE_ADJUNT.veu]: 'veu', [CLASSE_ADJUNT.video]: 'video' });
export const MIMES_ADJUNT_XIFRAT = Object.freeze(Object.keys(MIME_XAT));
export const CODI_ADJUNT = Object.freeze({
  buit: 'adjunt-buit', mime: 'adjunt-mime', sostre: 'adjunt-sostre', durada: 'adjunt-durada', invalid: 'adjunt-invalid',
  manipulat: 'adjunt-manipulat', incoherent: 'adjunt-incoherent', senseCapacitat: 'sense-capacitat-e2ee'
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const esBytes = (v) => Object.prototype.toString.call(v) === '[object Uint8Array]';
const esBytesDe = (v, n) => esBytes(v) && v.length === n;
const esAmbitCanviat = (error) => error?.codi === 'ambit-canviat' || error?.name === 'AbortError';

/* Cada error ix amb un `code` d'ERRORS_ADJUNT_XAT (cap clau d'i18n nova) i un
   `codi` estable de CODI_ADJUNT (o el del protocol). */
function errorAdjunt(code, codi, cause) {
  return errorAdjuntXat(code, { codi, ...(cause ? { cause } : {}) });
}

/** blob = iv12 ‖ Padmé(bytes ‖ 0x80) ‖ etiqueta16. */
export function midaBlobAdjunt(bytesEnClar) {
  if (!Number.isSafeInteger(bytesEnClar) || bytesEnClar < 1) throw new RangeError('bytesEnClar és un enter ≥ 1.');
  return midaPadme(bytesEnClar + 1) + BYTES_IV + BYTES_ETIQUETA;
}

/** Cap al bucket: el clar dins del sostre de la classe i el blob dins dels 20.000.000 B. */
export function capAlBucket(bytesEnClar, classe) {
  const sostre = MAXIM_CLAR_ADJUNT[classe];
  if (sostre === undefined || !Number.isSafeInteger(bytesEnClar) || bytesEnClar < 1) return false;
  return bytesEnClar <= sostre && midaBlobAdjunt(bytesEnClar) <= MAXIM_BLOB_ADJUNT;
}

/** El `metadades.adjunt` de sempre, reconstruït des del cos xifrat `a`. */
export const metadadesAdjuntDe = (a) => Object.freeze({ id: a.id, bytes: a.b, mime: a.m, duradaMs: a.d ?? null });

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Clau de la memòria cau: (adjunt_id, SHA-256(FK)), mai només l'id. */
export async function clauCauAdjunt({ cripto, a }) {
  exigixCripto(cripto);
  return `${a.id}:${hex(await sha256(cripto, a.k))}`;
}

/** SHA-256 del blob comparat en temps constant amb `hash` (32 B). */
export async function verificaHashAdjunt({ cripto, blob, hash }) {
  exigixCripto(cripto);
  if (!esBytes(blob) || !esBytesDe(hash, BYTES_HASH)) throw new TypeError('blob i hash són bytes (el hash, de 32).');
  return bytesIguals(await sha256(cripto, blob), hash);
}

function duradaValida(classe, durada) {
  if (classe === CLASSE_ADJUNT.foto) return durada === null;
  if (!Number.isSafeInteger(durada) || durada < 1) return false;
  return classe === CLASSE_ADJUNT.veu || durada <= MAX_VIDEO_MS;
}

/**
 * Xifra un adjunt ja preprocessat. Torna { blob, a, mida }: el blob va al
 * bucket privat com a octet-stream; `a` és el `cos.a` que viatja dins del
 * missatge xifrat (amb FK i hash en bytes). Cap crida criptogràfica abans de
 * validar forma, MIME, sostre i durada.
 */
export async function xifraAdjuntXat({ cripto, fil, adjunt, emissor, bytes, mime, durada = null, vigent = null } = {}) {
  exigixCripto(cripto);
  if (!esBytes(bytes) || bytes.length < 1) throw errorAdjunt('buit', CODI_ADJUNT.buit);
  const familia = typeof mime === 'string' && Object.hasOwn(MIME_XAT, mime) ? MIME_XAT[mime] : null;
  const classe = familia === null ? undefined : CLASSE_DEL_TIPUS[familia];
  if (classe === undefined) throw errorAdjunt('format', CODI_ADJUNT.mime);
  if (!capAlBucket(bytes.length, classe)) throw errorAdjunt('SDP-XAT-020', CODI_ADJUNT.sostre);
  if (!duradaValida(classe, durada)) throw errorAdjunt('durada', CODI_ADJUNT.durada);
  let resultat;
  try {
    resultat = await xifraAdjunt(cripto, { fil, adjunt, emissor, bytes, mime, durada, vigent });
  } catch (error) {
    if (esAmbitCanviat(error)) throw error;
    throw errorAdjunt('format', esErrorProtocol(error) ? error.codi : CODI_ADJUNT.invalid, error);
  }
  const { blob, a } = resultat;
  if (!esBytes(blob) || blob.length !== midaBlobAdjunt(bytes.length)) throw errorAdjunt('obrir', CODI_ADJUNT.incoherent);
  return Object.freeze({ blob, a, mida: blob.length });
}

/**
 * Desxifra un blob baixat: forma d'`a`, llista blanca de MIME, coherència de
 * mides, HASH ABANS DE DESXIFRAR, i només aleshores el protocol (que torna a
 * comprovar el hash, deriva Kenc_A i lleva el farciment). Torna
 * { bytes, mime, classe, tipus, durada }; qui crida embolcalla `bytes` en un
 * Blob i els posa a zero.
 */
export async function desxifraAdjuntXat({ cripto, fil, emissor, a, blob, vigent = null } = {}) {
  exigixCripto(cripto);
  const formaBe = a && typeof a === 'object' && typeof a.id === 'string' && UUID.test(a.id)
    && esBytesDe(a.k, BYTES_CLAU) && esBytesDe(a.h, BYTES_HASH) && Number.isSafeInteger(a.b) && a.b >= 1
    && Object.hasOwn(TIPUS_DE_CLASSE, a.c) && typeof a.m === 'string' && (a.d === null || a.d === undefined || (Number.isSafeInteger(a.d) && a.d >= 1));
  if (!formaBe) throw errorAdjunt('obrir', CODI_ADJUNT.invalid);
  const familia = Object.hasOwn(MIME_XAT, a.m) ? MIME_XAT[a.m] : null;
  if (familia === null || CLASSE_DEL_TIPUS[familia] !== a.c) throw errorAdjunt('format', CODI_ADJUNT.mime);
  if (!esBytes(blob) || a.b > MAXIM_CLAR_ADJUNT[a.c] || blob.length !== midaBlobAdjunt(a.b) || blob.length > MAXIM_BLOB_ADJUNT) {
    throw errorAdjunt('obrir', CODI_ADJUNT.incoherent);
  }
  if (!(await verificaHashAdjunt({ cripto, blob, hash: a.h }))) throw errorAdjunt('obrir', CODI_ADJUNT.manipulat);
  vigent?.();
  let obert;
  try {
    obert = await obriAdjunt(cripto, { fil, emissor, a, blob, vigent });
  } catch (error) {
    if (esAmbitCanviat(error)) throw error;
    const codi = error?.codi === CODI.adjuntManipulat ? CODI_ADJUNT.manipulat
      : error?.codi === CODI.adjuntIncoherent ? CODI_ADJUNT.incoherent : CODI_ADJUNT.invalid;
    throw errorAdjunt('obrir', codi, error);
  }
  const bytes = esBytes(obert) ? obert : obert?.bytes;
  if (!esBytes(bytes) || bytes.length !== a.b) throw errorAdjunt('obrir', CODI_ADJUNT.incoherent);
  return Object.freeze({ bytes, mime: a.m, classe: a.c, tipus: TIPUS_DE_CLASSE[a.c], durada: a.d ?? null });
}
