/**
 * xifratLocal.js — Arbre Genealògic · el xifrat opcional de la base local
 * amb una frase de pas (P1-81 / IDEA-253), per als dispositius compartits.
 *
 *   derivaClau(frase, sal, iteracions)  PBKDF2-HMAC-SHA-256 → clau AES-GCM-256 no extraïble
 *   xifra(clau, objecte, aad)           { v: 1, iv, ct } (IV aleatori de 12 B a cada crida, base64)
 *   desxifra(clau, sobre, aad)          l'objecte; codi 'frase-incorrecta' si l'autenticació GCM falla
 *   exigixFrase(frase)                  la regla de la frase del cofre de la Gestoria (avaluaFrase)
 *   nousParametres(iteracions)          { versio, sal, iteracions } per a la meta 'xifrat'
 *
 * És l'ÚNIC fitxer de l'app que toca WebCrypto (privacitat.test.js ho vigila).
 * No importa res: la regla de la frase i el base64 es copien del cofre de la
 * Gestoria (src/sections/gestoria/cofre/nucli/cripto.js), que l'app no pot
 * importar per la frontera de privacitat. La frase i la clau no es desen mai:
 * la clau viu en memòria mentre la base està oberta.
 */
export const VERSIO_XIFRAT = 1;
export const ITERACIONS_KDF = 600000;
/* El mínim que s'accepta en llegir la meta, perquè les proves puguen fer
   claus ràpides (com MIN_ITERACIONS_PROVES del cofre). L'app sempre escriu
   ITERACIONS_KDF. A diferència del cofre (llegixParametres), la lectura no
   exigix ITERACIONS_KDF: una meta amb menys iteracions sense la frase no
   desxifra res (la clau no coincidix i ix 'frase-incorrecta'). */
export const MIN_ITERACIONS = 1000;
export const MAX_ITERACIONS = 10000000;
export const BYTES_SAL = 16;
export const BYTES_IV = 12;
export const MIN_CARACTERS = 12;
export const MIN_PARAULES = 4;
const MIN_DIFERENTS = 5;
export const MAX_CARACTERS = 1024;
export const AAD_GENEALOGIA = 'sdp.genealogia.v1';

const errorAmbCodi = (codi, missatge, causa) => Object.assign(
  new Error(missatge, causa === undefined ? undefined : { cause: causa }),
  { codi }
);
const codifica = (text) => new TextEncoder().encode(text);

/* ── Base64 canònic ─────────────────────────────────────────────────── */

/* Una classe de caràcters i la llargària múltiple de 4: lineal també amb
   desenes de megues (cap grup repetit que faça créixer la pila del motor). */
const CARACTERS_B64 = /^[A-Za-z0-9+/]*={0,2}$/;
const formaB64 = (text) => typeof text === 'string' && text.length % 4 === 0 && CARACTERS_B64.test(text);
const TROS = 0x8000;

/** Bytes → base64 (a trossos: un arbre gran no esgota la pila). */
export function aBase64(bytes) {
  let binari = '';
  for (let i = 0; i < bytes.length; i += TROS) binari += String.fromCharCode(...bytes.subarray(i, i + TROS));
  return btoa(binari);
}

/** Base64 canònic → bytes. Llança TypeError amb qualsevol altra forma. */
export function deBase64(text) {
  if (!formaB64(text)) throw new TypeError('No és un text en base64.');
  let binari;
  try { binari = atob(text); } catch { throw new TypeError('No és un text en base64.'); }
  const bytes = new Uint8Array(binari.length);
  for (let i = 0; i < binari.length; i += 1) bytes[i] = binari.charCodeAt(i);
  if (aBase64(bytes) !== text) throw new TypeError('El base64 no és canònic.');
  return bytes;
}

/** Un base64 canònic d'exactament `n` bytes (per a camps curts: la sal i l'IV). */
export function esBase64DeBytes(text, n) {
  if (!formaB64(text) || text.length !== 4 * Math.ceil(n / 3)) return false;
  try { return deBase64(text).length === n; } catch { return false; }
}

/** Un text amb forma de base64 i com a molt `maxim` caràcters (per al text xifrat, que pot ser gran). */
export const esBase64Fitat = (text, maxim) => formaB64(text) && text.length > 0 && text.length <= maxim;

/* ── La frase ───────────────────────────────────────────────────────── */

function normalitza(frase) {
  if (typeof frase !== 'string') throw errorAmbCodi('frase-invalida', 'La frase de pas és un text.');
  if (frase === '') throw errorAmbCodi('frase-curta', 'Escriu la frase de pas.');
  if (frase.length > MAX_CARACTERS * 2) throw errorAmbCodi('frase-llarga', 'La frase de pas és massa llarga.');
  return frase.normalize('NFC');
}

/*
 * La llargària «efectiva» (còpia de la del cofre): cada tram de caràcters
 * iguals o consecutius (aaa, 1234, abc, 1212, cba) compta com a molt 2.
 */
function llargariaEfectiva(caracters) {
  let total = 0;
  let tram = 0;
  let anterior = null;
  for (const c of caracters) {
    const punt = c.codePointAt(0);
    tram = anterior !== null && Math.abs(punt - anterior) <= 1 ? tram + 1 : 1;
    if (tram <= 2) total += 1;
    anterior = punt;
  }
  return total;
}

/**
 * La frase en NFC si compleix la regla d'avaluaFrase del cofre: com a molt
 * 1024 caràcters; 12 caràcters o 4 paraules (de 3 lletres o més, que no siguen
 * un sol tram com «aaa» o «abc»); almenys 5 caràcters diferents
 * ('frase-repetida') i sense ser previsible ('frase-previsible': seqüències i
 * repeticions com «123456789012»). Si no, un error amb codi.
 */
export function exigixFrase(frase) {
  const text = normalitza(frase);
  const caracters = [...text].length;
  if (caracters > MAX_CARACTERS) throw errorAmbCodi('frase-llarga', 'La frase de pas és massa llarga.');
  const paraules = (text.match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((paraula) => llargariaEfectiva([...paraula.toLowerCase()]) >= 3).length;
  if (caracters < MIN_CARACTERS && paraules < MIN_PARAULES) {
    throw errorAmbCodi('frase-curta', `La frase de pas ha de tindre almenys ${MIN_CARACTERS} caràcters o ${MIN_PARAULES} paraules.`);
  }
  if (new Set(text).size < MIN_DIFERENTS) throw errorAmbCodi('frase-repetida', 'La frase de pas repetix massa caràcters.');
  if (llargariaEfectiva([...text.toLowerCase()]) < MIN_CARACTERS && paraules < MIN_PARAULES) {
    throw errorAmbCodi('frase-previsible', 'La frase de pas és massa previsible (seqüències o repeticions).');
  }
  return text;
}

/* ── Paràmetres i clau ──────────────────────────────────────────────── */

const iteracionsValides = (n) => Number.isSafeInteger(n) && n >= MIN_ITERACIONS && n <= MAX_ITERACIONS;

/** La meta 'xifrat' neta, o un TypeError. */
export function netejaParametres(valor) {
  if (!valor || typeof valor !== 'object' || valor.versio !== VERSIO_XIFRAT
    || !esBase64DeBytes(valor.sal, BYTES_SAL) || !iteracionsValides(valor.iteracions)) {
    throw new TypeError('Paràmetres de xifrat no vàlids.');
  }
  return { versio: VERSIO_XIFRAT, sal: valor.sal, iteracions: valor.iteracions };
}

/** Uns paràmetres nous: sal aleatòria de 16 bytes. */
export function nousParametres(iteracions = ITERACIONS_KDF, { cripto = globalThis.crypto } = {}) {
  return netejaParametres({ versio: VERSIO_XIFRAT, sal: aBase64(cripto.getRandomValues(new Uint8Array(BYTES_SAL))), iteracions });
}

/**
 * La clau AES-GCM-256 d'una frase (normalitzada en NFC), no extraïble i
 * només per a xifrar i desxifrar. `sal`: bytes o base64.
 */
export async function derivaClau(frase, sal, iteracions = ITERACIONS_KDF, { cripto = globalThis.crypto } = {}) {
  const text = normalitza(frase);
  const bytesSal = typeof sal === 'string' ? deBase64(sal) : sal;
  if (!(bytesSal instanceof Uint8Array) || bytesSal.length !== BYTES_SAL) throw new TypeError(`La sal ha de fer ${BYTES_SAL} bytes.`);
  if (!iteracionsValides(iteracions)) throw new TypeError('Nombre d’iteracions fora de rang.');
  const base = await cripto.subtle.importKey('raw', codifica(text), 'PBKDF2', false, ['deriveKey']);
  return cripto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: bytesSal, iterations: iteracions },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/* ── El sobre ───────────────────────────────────────────────────────── */

/** Xifra l'objecte (en JSON) amb un IV nou: { v, iv, ct } en base64. */
export async function xifra(clau, objecte, aad = AAD_GENEALOGIA, { cripto = globalThis.crypto } = {}) {
  const iv = cripto.getRandomValues(new Uint8Array(BYTES_IV));
  const ct = await cripto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: codifica(aad) }, clau, codifica(JSON.stringify(objecte)));
  return { v: VERSIO_XIFRAT, iv: aBase64(iv), ct: aBase64(new Uint8Array(ct)) };
}

/**
 * Desxifra un sobre. Una frase errònia, un byte canviat (IV o text xifrat) o
 * una AAD diferent fan fallar l'autenticació GCM: codi 'frase-incorrecta'.
 */
export async function desxifra(clau, sobre, aad = AAD_GENEALOGIA, { cripto = globalThis.crypto } = {}) {
  let iv;
  let ct;
  try {
    if (sobre?.v !== VERSIO_XIFRAT) throw new TypeError('Versió de sobre desconeguda.');
    iv = deBase64(sobre.iv);
    ct = deBase64(sobre.ct);
    if (iv.length !== BYTES_IV) throw new TypeError('IV no vàlid.');
  } catch (error) {
    throw errorAmbCodi('sobre-invalid', 'Les dades xifrades no tenen la forma esperada.', error);
  }
  let pla;
  try {
    pla = await cripto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: codifica(aad) }, clau, ct);
  } catch (error) {
    throw errorAmbCodi('frase-incorrecta', 'La frase de pas no és la bona (o les dades s’han alterat).', error);
  }
  return JSON.parse(new TextDecoder().decode(pla));
}
