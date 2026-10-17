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
 */
import { useEffect, useState } from 'react';
import { MAX_BYTES_EXIF, llegixExif } from '../../components/universal/enquadrament/exif.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { esFontImatgePropia } from '../../utils/sanitize.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';

const MAX_MEMORIA = 60;
const memoria = new Map();

const SENSE = Object.freeze({ estat: 'sense', exif: null });

/** Es pot llegir l'EXIF d'este src sense eixir de casa? */
export function esLlegible(src) {
  return typeof src === 'string' && src.trim() !== '' && !esMitjaOpac(src) && esFontImatgePropia(src);
}

/* Els primers `maxim` bytes d'una URL: Range i, si arriba sencera, el flux
   tallat. null si no es pot. */
export async function llegixPrefix(url, maxim, signal) {
  const resposta = await fetch(url, { headers: { Range: `bytes=0-${maxim - 1}` }, signal, credentials: 'same-origin' });
  if (!resposta.ok) return null;
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
    llegixPrefix(resolRecursPropi(src), MAX_BYTES_EXIF, control?.signal)
      .then((bytes) => (bytes ? llegixExif(bytes, { ambCamera: true, ambGps: !persona }) : null))
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
