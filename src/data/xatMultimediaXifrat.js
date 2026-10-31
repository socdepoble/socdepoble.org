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

/**
 * P1-12 pas 17 · Disseny §4.7: el registre de `blob:` desxifrats té un LRU de
 * 48 MB al mòbil i 100 MB a l'escriptori (mai per damunt de 100 MB). Pur: els
 * senyals de l'aparell (app nativa, punter gruixut, memòria en GB) els passa
 * qui crida (host.js); ací no es llig cap global.
 */
export function pressupostBlobsAdjunts({ natiu = false, punterGruixut = false, memoriaGb = null } = {}) {
  if (natiu === true || punterGruixut === true) return PRESSUPOST_BLOBS_MOBIL;
  if (typeof memoriaGb === 'number' && Number.isFinite(memoriaGb) && memoriaGb > 0 && memoriaGb <= 4) return PRESSUPOST_BLOBS_MOBIL;
  return PRESSUPOST_BLOBS_ESCRIPTORI;
}

/* QA-C01 (Gauntlet 261029_1858) · El sostre dur del registre: per molt que
   s'hi retinga, mai més de 100 MB de blob: desxifrats vius (decisions.md, §4.7). */
export const SOSTRE_BLOBS_ADJUNTS = PRESSUPOST_BLOBS_ESCRIPTORI;

/**
 * Registre LRU de les URL `blob:` dels adjunts desxifrats, per clau
 * (adjunt, SHA-256(FK)). Compta els bytes en clar de cada adjunt; en passar
 * del pressupost revoca (amb `revoca`, injectat) les menys recents, mai la que
 * acaba d'entrar. Una entrada més gran que el pressupost hi entra a soles i la
 * trau el `desa` següent (hui impossible: MAXIM_BLOB_ADJUNT ≤ PRESSUPOST_BLOBS_MOBIL).
 * `obte` toca l'entrada (el que es torna a demanar no és el primer en eixir).
 *
 * QA-C01 (Gauntlet 261029_1858) · Retenció per referències. `reten(clau)` la
 * pren qui pinta o reprodueix la URL (AdjuntXat, a través del motor, en el
 * mateix tic que se li servix) i torna l'alliberament (idempotent). Una entrada
 * retinguda no es desallotja mai:
 *   · si totes les altres ho estan, el pressupost se supera temporalment, fins
 *     al SOSTRE_BLOBS_ADJUNTS (100 MB); per damunt, `desa` rebutja la URL nova
 *     sense tocar res (qui crida la revoca) i `hiCap(bytes)` ho diu abans de
 *     descarregar i desxifrar;
 *   · en alliberar l'última referència es torna dins del pressupost;
 *   · si una clau es renova mentre la URL vella és retinguda, la vella queda
 *     òrfena (compta en bytes) i es revoca quan s'allibera.
 * `oblida` i `buida` (canvi de persona o d'actor, eixida) ho revoquen tot,
 * retingut o no; els alliberaments posteriors no fan res.
 */
export function creaRegistreBlobsAdjunts({ pressupost = PRESSUPOST_BLOBS_MOBIL, revoca } = {}) {
  if (!Number.isSafeInteger(pressupost) || pressupost < 1 || pressupost > PRESSUPOST_BLOBS_ESCRIPTORI) {
    throw new RangeError('El pressupost és un enter de bytes entre 1 i 100.000.000.');
  }
  if (typeof revoca !== 'function') throw new TypeError('Cal revoca(url).');
  /* clau → entrada { url, bytes, refs, viva, orfe }; l'ordre d'inserció és l'ordre d'ús: la primera és la menys recent. */
  const entrades = new Map();
  /* Entrades renovades mentre eren retingudes: viuen (i compten) fins a l'últim alliberament. */
  const orfes = new Set();
  let total = 0;
  /* Una URL només es revoca quan ja no la servix cap entrada (mai dues vegades la mateixa per un sol desallotjament). */
  const enUs = (url) => {
    for (const e of entrades.values()) if (e.url === url) return true;
    for (const e of orfes) if (e.url === url) return true;
    return false;
  };
  const allibera = (url) => {
    if (enUs(url)) return;
    try { revoca(url); } catch { /* revocació tardana */ }
  };
  const mor = (entrada) => {
    entrada.viva = false;
    total -= entrada.bytes;
  };
  const lleva = (clau) => {
    const entrada = entrades.get(clau);
    if (!entrada) return null;
    entrades.delete(clau);
    mor(entrada);
    return entrada;
  };
  const retingut = () => {
    let bytes = 0;
    for (const e of entrades.values()) if (e.refs > 0) bytes += e.bytes;
    for (const e of orfes) bytes += e.bytes;
    return bytes;
  };
  /* De la menys recent: fora les no retingudes fins a tornar dins del pressupost (mai `excepte`, la que acaba d'entrar). */
  const ajusta = (excepte = null) => {
    for (const [clau, entrada] of entrades) {
      if (total <= pressupost) break;
      if (clau === excepte || entrada.refs > 0) continue;
      allibera(lleva(clau).url);
    }
  };
  return Object.freeze({
    obte(clau) {
      const entrada = entrades.get(clau);
      if (!entrada) return null;
      entrades.delete(clau);
      entrades.set(clau, entrada);
      return entrada.url;
    },
    desa(clau, url, bytes) {
      if (typeof clau !== 'string' || !clau) throw new TypeError('clau és un text no buit.');
      if (typeof url !== 'string' || !url) throw new TypeError('url és un text no buit.');
      if (!Number.isSafeInteger(bytes) || bytes < 0) throw new RangeError('bytes és un enter ≥ 0.');
      const previa = entrades.get(clau) ?? null;
      const mateixa = previa !== null && previa.url === url;
      /* El sostre, abans de tocar res: el que ja és retingut (sense l'entrada que es reaprofita) més la nova. */
      if (retingut() - (mateixa && previa.refs > 0 ? previa.bytes : 0) + bytes > SOSTRE_BLOBS_ADJUNTS) throw errorPressupostBlobs();
      let vella = null;
      if (previa) {
        entrades.delete(clau);
        if (mateixa) total -= previa.bytes;
        else if (previa.refs > 0) { previa.orfe = true; orfes.add(previa); }
        else { mor(previa); vella = previa.url; }
      }
      const entrada = mateixa ? previa : { url, bytes, refs: 0, viva: true, orfe: false };
      entrada.bytes = bytes;
      entrades.set(clau, entrada);
      total += bytes;
      /* Renovar la mateixa clau: la URL vella fora (si no és retinguda), sense comptar-la dues vegades. */
      if (vella !== null) allibera(vella);
      ajusta(clau);
      return url;
    },
    reten(clau) {
      const entrada = entrades.get(clau);
      if (!entrada) return null;
      entrada.refs += 1;
      entrades.delete(clau);
      entrades.set(clau, entrada);
      let alliberada = false;
      return () => {
        if (alliberada) return;
        alliberada = true;
        if (!entrada.viva) return;
        entrada.refs -= 1;
        if (entrada.refs > 0) return;
        if (entrada.orfe) {
          orfes.delete(entrada);
          mor(entrada);
          allibera(entrada.url);
        }
        /* Gauntlet c2 (C10, Codex 0256) · També després d'una òrfena: el que ja es pot
           desallotjar ix ara, i el registre torna dins del pressupost. */
        ajusta();
      };
    },
    hiCap: (bytes) => Number.isSafeInteger(bytes) && bytes >= 0 && retingut() + bytes <= SOSTRE_BLOBS_ADJUNTS,
    oblida(clau) {
      const entrada = lleva(clau);
      if (entrada) allibera(entrada.url);
      return entrada !== null;
    },
    buida() {
      const totes = [...entrades.values(), ...orfes];
      entrades.clear();
      orfes.clear();
      total = 0;
      for (const entrada of totes) entrada.viva = false;
      for (const url of new Set(totes.map((e) => e.url))) allibera(url);
    },
    estat: () => Object.freeze({ entrades: entrades.size, bytes: total, pressupost })
  });
}
/* La classe del protocol per a cada família de MIME_XAT, i el `tipus` de
   missatge de sempre per a cada classe (Bombolla i AdjuntXat no canvien). */
export const CLASSE_DEL_TIPUS = Object.freeze({ imatge: CLASSE_ADJUNT.foto, veu: CLASSE_ADJUNT.veu, video: CLASSE_ADJUNT.video });
export const TIPUS_DE_CLASSE = Object.freeze({ [CLASSE_ADJUNT.foto]: 'foto', [CLASSE_ADJUNT.veu]: 'veu', [CLASSE_ADJUNT.video]: 'video' });
export const MIMES_ADJUNT_XIFRAT = Object.freeze(Object.keys(MIME_XAT));
export const CODI_ADJUNT = Object.freeze({
  buit: 'adjunt-buit', mime: 'adjunt-mime', sostre: 'adjunt-sostre', durada: 'adjunt-durada', invalid: 'adjunt-invalid',
  manipulat: 'adjunt-manipulat', incoherent: 'adjunt-incoherent', senseCapacitat: 'sense-capacitat-e2ee',
  pressupost: 'adjunt-pressupost'
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

/* QA-C01 · Sense lloc dins del SOSTRE_BLOBS_ADJUNTS (tot el que hi ha és retingut):
   cap blob: nou, i la peça mostra «No hem pogut obrir el fitxer» amb «Torna-ho a provar». */
export function errorPressupostBlobs() {
  return Object.assign(errorAdjunt('obrir', CODI_ADJUNT.pressupost), { reintentable: true });
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
  if (!esBytes(blob) || blob.length !== midaBlobAdjunt(bytes.length)) {
    /* Gauntlet c2 (G4) · Qui crida no rebrà mai este `a`: la FK, a zero ací. */
    if (esBytes(a?.k)) a.k.fill(0);
    throw errorAdjunt('obrir', CODI_ADJUNT.incoherent);
  }
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
