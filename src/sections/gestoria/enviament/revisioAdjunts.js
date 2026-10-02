/**
 * revisioAdjunts.js — la revisió humana dels adjunts del correu a la
 * gestoria, lligada als BYTES exactes que s'exporten.
 *
 * Bucle adversarial (auditoria Codex 261002_0148, punt 11) · Marcar «He
 * revisat el full i l'adjunt» captura una CÒPIA dels adjunts (nom, tipus i un
 * Uint8Array nou amb els bytes: congelar l'objecte de fora no congela els
 * bytes d'un Uint8Array) i en calcula l'empremta d'aprovació, SHA-256, amb
 * crypto.subtle. Les eixides (Gmail i la descàrrega, l'.eml, compartir) usen
 * NOMÉS eixa còpia, i abans comproven que els adjunts d'ara són els
 * mateixos.
 *
 * La comprovació d'abans d'actuar és byte a byte contra la còpia de la qual
 * s'ha tret l'empremta: és el mateix que comparar l'empremta (els mateixos
 * bytes donen la mateixa SHA-256), sense col·lisions, i és síncrona. Ha de
 * ser-ho: la pestanya de Gmail i el menú de compartir s'han d'obrir dins del
 * gest de la persona, i un `await` pel mig els faria bloquejar (Safari).
 *
 * Pur: sense React, sense DOM i sense xarxa. `subtle` s'injecta (proves).
 */

export const ALGORISME_EMPREMTA = 'SHA-256';

const codificador = new TextEncoder();
const DOS_A_LA_32 = 2 ** 32;

function bytesDe(dades) {
  if (ArrayBuffer.isView(dades)) return new Uint8Array(dades.buffer, dades.byteOffset, dades.byteLength);
  if (Object.prototype.toString.call(dades) === '[object ArrayBuffer]') return new Uint8Array(dades);
  return null;
}

/** Hi ha amb què calcular l'empremta? (crypto.subtle només existix en un context segur: https o localhost.) */
export const potCalcularEmpremta = (subtle) => typeof subtle?.digest === 'function';

/**
 * Una còpia dels adjunts que ningú més té: cada un amb el seu nom, el seu
 * tipus i un Uint8Array NOU amb els bytes (mai la referència de l'original).
 * Un adjunt sense bytes es queda com està: el correu ja dirà que no en porta.
 */
export function copiaAdjunts(adjunts) {
  if (!Array.isArray(adjunts)) return Object.freeze([]);
  return Object.freeze(adjunts.map((adjunt) => {
    const bytes = bytesDe(adjunt?.dades);
    return Object.freeze({ nom: adjunt?.nom, tipus: adjunt?.tipus, dades: bytes ? bytes.slice() : (adjunt?.dades ?? null) });
  }));
}

/** Els adjunts d'ara són exactament els de la còpia? El mateix nombre i, un per un, el mateix nom, el mateix tipus i els mateixos bytes. */
export function mateixosAdjunts(adjunts, copia) {
  if (!Array.isArray(adjunts) || !Array.isArray(copia) || adjunts.length !== copia.length) return false;
  return adjunts.every((adjunt, i) => {
    const desat = copia[i];
    if (adjunt?.nom !== desat?.nom || adjunt?.tipus !== desat?.tipus) return false;
    const ara = bytesDe(adjunt?.dades);
    const abans = bytesDe(desat?.dades);
    if (!ara || !abans) return !ara && !abans && adjunt?.dades === desat?.dades;
    if (ara.length !== abans.length) return false;
    for (let j = 0; j < ara.length; j += 1) {
      if (ara[j] !== abans[j]) return false;
    }
    return true;
  });
}

/* Una llargada en 8 octets, big-endian. */
function llargada(n) {
  const tros = new Uint8Array(8);
  const vista = new DataView(tros.buffer);
  vista.setUint32(0, Math.floor(n / DOS_A_LA_32));
  vista.setUint32(4, n >>> 0);
  return tros;
}

/**
 * La forma canònica que es resumix: el nombre d'adjunts i, per a cada un, el
 * nom (UTF-8), el tipus (UTF-8) i els bytes, cadascun precedit de la seua
 * llargada. Dos llistes diferents no donen mai la mateixa seqüència.
 */
export function formaCanonica(copia) {
  const trossos = [llargada(copia.length)];
  for (const adjunt of copia) {
    const camps = [
      codificador.encode(String(adjunt?.nom ?? '')),
      codificador.encode(String(adjunt?.tipus ?? '')),
      bytesDe(adjunt?.dades) ?? new Uint8Array(0)
    ];
    for (const bytes of camps) trossos.push(llargada(bytes.length), bytes);
  }
  const total = new Uint8Array(trossos.reduce((suma, tros) => suma + tros.length, 0));
  let posicio = 0;
  for (const tros of trossos) {
    total.set(tros, posicio);
    posicio += tros.length;
  }
  return total;
}

/** L'empremta d'aprovació: SHA-256 de la forma canònica de la còpia, en 64 xifres hexadecimals. Sense crypto.subtle, rebutja. */
export async function empremtaAdjunts(copia, subtle = globalThis.crypto?.subtle) {
  if (!potCalcularEmpremta(subtle)) throw new Error('Este navegador no pot calcular l’empremta SHA-256.');
  const resum = new Uint8Array(await subtle.digest(ALGORISME_EMPREMTA, formaCanonica(copia)));
  return Array.from(resum, (octet) => octet.toString(16).padStart(2, '0')).join('');
}
