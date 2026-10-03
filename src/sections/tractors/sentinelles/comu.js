/**
 * comu.js — peces pures que comparteixen els sentinelles.
 *
 * Cap lectura pròpia: els fitxers arriben com a { nom, bytes } (o { nom, text })
 * perquè els ha triat la persona i el panell els ha llegit en memòria. Res
 * d'ací toca la xarxa, el disc ni l'emmagatzematge del navegador.
 *
 * Els bytes es descodifiquen amb la mateixa política que la Gestoria
 * (gestoria/nucli/csv.js, decodificaText): UTF-16LE si porta el seu BOM,
 * UTF-8 estricte i, si no ho és, windows-1252. Per això csv.js és una de les
 * FONTS_COMUNES: si canvia, cal tornar a aprovar tots els sentinelles.
 */
import { decodificaText } from '../../gestoria/nucli/csv.js';
import { ErrorSentinella } from './contracte.js';

export const avis = (codi, severitat, missatge, font) => ({ codi, severitat, missatge, font });

export const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
export const textPle = (valor) => typeof valor === 'string' && valor.trim().length > 0;

/* Gestoria → sentinella: alta és roja, mitjana groga, i la resta informativa. */
export function severitatDe(gestoria) {
  if (gestoria === 'alta') return 'roja';
  if (gestoria === 'mitjana') return 'groga';
  return 'info';
}

/* La marca d'ordre de bytes, per codi: cap caràcter invisible literal al codi font. */
const BOM = String.fromCharCode(0xfeff);
const senseBom = (text) => (text.startsWith(BOM) ? text.slice(1) : text);

/* El text d'un fitxer (sense BOM), siga text o bytes: UTF-8, UTF-16LE o windows-1252, com la Gestoria. */
export function textDe(contingut) {
  if (typeof contingut === 'string') return senseBom(contingut);
  if (contingut instanceof ArrayBuffer || contingut instanceof Uint8Array) return senseBom(decodificaText(contingut));
  throw new ErrorSentinella('ENTRADA_INVALIDA', 'El fitxer no porta ni text ni bytes.');
}

export const nomDe = (fitxer) => (textPle(fitxer?.nom) ? fitxer.nom : 'el fitxer');
export const extensioDe = (nom) => (/\.([a-z0-9]+)$/i.exec(String(nom ?? ''))?.[1] ?? '').toLowerCase();

/* El contingut d'un fitxer triat: els bytes si n'hi ha, si no el text. */
export const contingutDe = (fitxer) => (fitxer?.bytes !== undefined ? fitxer.bytes : fitxer?.text);

export function llegixJson(fitxer) {
  let text;
  try {
    text = textDe(contingutDe(fitxer));
  } catch (error) {
    throw new ErrorSentinella('ENTRADA_INVALIDA', `«${nomDe(fitxer)}» no es pot llegir com a text.`, { cause: error });
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ErrorSentinella('ENTRADA_INVALIDA', `«${nomDe(fitxer)}» no és un JSON vàlid.`, { cause: error });
  }
}

/* La llista de fitxers triats; buida o mal formada, error en valencià. */
export function fitxersTriats(fitxers) {
  const llista = Array.isArray(fitxers) ? fitxers.filter(esObjecte) : [];
  if (!llista.length) throw new ErrorSentinella('ENTRADA_INVALIDA', 'Tria almenys un fitxer.');
  return llista;
}

/* 123456 → «1.234,56 €». Un import desconegut ho diu amb paraules. */
export function eurosDe(cents) {
  if (!Number.isSafeInteger(cents)) return 'import desconegut';
  const abs = Math.abs(cents);
  const enters = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cents < 0 ? '-' : ''}${enters},${String(abs % 100).padStart(2, '0')} €`;
}

/* 0.256 → «25,6 %». */
export function percentDe(fraccio) {
  if (!Number.isFinite(fraccio)) return 'percentatge desconegut';
  return `${String(Math.round(fraccio * 1000) / 10).replace('.', ',')} %`;
}

/* Minúscules i sense diacrítics: «Farmàcia» i «farmacia» compten igual. */
export function senseAccents(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/* La mediana d'una llista de números (null si és buida). */
export function mediana(valors) {
  const ordenats = valors.filter(Number.isFinite).sort((a, b) => a - b);
  if (!ordenats.length) return null;
  const mig = Math.floor(ordenats.length / 2);
  return ordenats.length % 2 ? ordenats[mig] : (ordenats[mig - 1] + ordenats[mig]) / 2;
}

/* «2 de 7» en llistes llargues: els primers n i quants en queden. */
export function primers(llista, n) {
  return llista.length > n ? [...llista.slice(0, n), `i ${llista.length - n} més`] : llista;
}

/* Una data ISO en UTC, llegible i curta: «02/10/2026 21:30 (UTC)». */
export function momentDe(iso) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return 'data desconeguda';
  const d = new Date(ms);
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(d.getUTCDate())}/${dos(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())} (UTC)`;
}
