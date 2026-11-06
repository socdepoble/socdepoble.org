/**
 * veuIaiaService.js · IDEA-108 (Onada R7, 261106) · La veu de la IAIA.
 *
 * Una sola porta per a fer parlar la IAIA, amb dos camins:
 *
 *   1. Node 0 (veu neuronal del servidor), OPCIONAL i desactivat per defecte.
 *      Només s'usa si es compleixen les TRES condicions:
 *        a) `privat` és false (el text no ix mai del dispositiu si és privat);
 *        b) hi ha un punt HTTPS configurat (`VITE_SDP_VEU_NODE0_URL` en el
 *           build, o `fixaPuntNode0()` en temps d'execució); per defecte NO
 *           n'hi ha, i ha de començar per `https://`;
 *        c) una comprovació de salut recent (en memòria, uns 5 minuts) ha anat bé.
 *      Qualsevol error o temps esgotat cau en silenci al camí 2.
 *   2. Veu del navegador (`window.speechSynthesis`), sempre disponible quan el
 *      navegador té síntesi. Tria la veu per llengua amb prioritat
 *      (ca: ca-ES-valencia, ca-ES, ca*; es: es-ES; eu: eu-ES; gl: gl-ES; en: en-*).
 *
 * Per què no s'apunta a l'adreça de xarxa privada del Mac mini: des d'una
 * pàgina HTTPS el navegador no pot cridar un punt HTTP ni una adreça privada
 * (contingut mixt i accés a xarxa privada). El client només parla amb un
 * punt HTTPS públic (passarel·la inversa) que reenvia al motor local.
 *
 * CONTRACTE QUE HAURÀ DE COMPLIR EL SERVIDOR (`/api/v1/node0/veu`). NO EXISTEIX
 * ENCARA: ací només es documenta, no s'implementa. Necessita maquinari (Node 0).
 *   · `GET  {punt}/salut` → 200 quan el motor de veu està llest.
 *   · `POST {punt}` amb `Content-Type: application/json` i cos
 *     `{ "text": string, "idioma": "ca"|"es"|"en"|"eu"|"gl" }`
 *     → 200 amb un cos d'àudio (`Content-Type: audio/*`, p. ex. audio/wav o
 *     audio/mpeg). Qualsevol altre estat o tipus es tracta com a fallada.
 *   · CORS: ha de permetre l'origen de la PWA i el mètode POST amb capçalera
 *     Content-Type. Sense galetes ni credencials (el client no n'envia).
 *   · CSP del client (firebase.json): connect-src admet https: i media-src
 *     admet blob:, de manera que no cal canviar-la.
 *
 * Errors: totes les promeses rebutjades porten `error.codi`:
 *   VEU_NO_DISPONIBLE · no hi ha cap síntesi utilitzable;
 *   VEU_AVORTADA      · s'ha cridat `atura()`, ha vingut una locució nova o el
 *                       `signal` s'ha cancel·lat.
 */

import {
  CODI_VEU_AVORTADA,
  CODI_VEU_NO_DISPONIBLE,
  TEMPS_LIMIT_NODE0_MS,
  TEMPS_LIMIT_SALUT_MS,
  VIDA_SALUT_BONA_MS,
  VIDA_SALUT_DOLENTA_MS,
  nouError,
  parlaPerNodeZero,
  reiniciaSalutNode0,
} from './veuNode0.js';

/* Les crides de xarxa del Node 0 viuen a veuNode0.js: cap fitxer de la IAIA
   del client no en fa (legal.iaia.test.js, P1-24). */
export {
  CODI_VEU_AVORTADA,
  CODI_VEU_NO_DISPONIBLE,
  TEMPS_LIMIT_NODE0_MS,
  TEMPS_LIMIT_SALUT_MS,
  VIDA_SALUT_BONA_MS,
  VIDA_SALUT_DOLENTA_MS,
};
const ESPERA_VEUS_MS = 1200;
const MAX_CARACTERS = 4000;

const IDIOMES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

/* Prioritat de llengües de veu: cada entrada és un comparador sobre la
   etiqueta ja normalitzada (minúscules, guionet). L'última és la llengua per
   a l'enunciat quan no hi ha cap veu que coincidisca. */
const PRIORITAT_VEUS = Object.freeze({
  ca: Object.freeze({ etiquetes: ['ca-es-valencia', 'ca-es', 'ca*'], perDefecte: 'ca-ES' }),
  es: Object.freeze({ etiquetes: ['es-es', 'es*'], perDefecte: 'es-ES' }),
  eu: Object.freeze({ etiquetes: ['eu-es', 'eu*'], perDefecte: 'eu-ES' }),
  gl: Object.freeze({ etiquetes: ['gl-es', 'gl*'], perDefecte: 'gl-ES' }),
  en: Object.freeze({ etiquetes: ['en-gb', 'en*'], perDefecte: 'en-GB' }),
});

/* ------------------------------------------------------------------ */
/* Normalització per a la veu                                           */
/* ------------------------------------------------------------------ */

/**
 * PENDENT DE REVISIÓ DEL MESTRE · Abreviatures que es desplegen abans de
 * parlar. Cada parell és [expressió, text]. Només abreviatures i símbols, mai
 * pronúncies inventades. Afegir-ne és tan senzill com afegir una línia.
 */
export const ABREVIATURES_VEU = Object.freeze({
  ca: Object.freeze([
    [/(?<![\p{L}\p{N}])c\/\s*/giu, 'carrer '],
    [/(?<![\p{L}\p{N}])núm\./giu, 'número'],
    [/(?<![\p{L}\p{N}])pàg\./giu, 'pàgina'],
    [/(?<![\p{L}\p{N}])p\.\s?ex\./giu, 'per exemple'],
    [/(?<![\p{L}\p{N}])etc\./giu, 'etcètera.'],
    [/(?<![\p{L}\p{N}])sra\./giu, 'senyora'],
    [/(?<![\p{L}\p{N}])sr\./giu, 'senyor'],
    [/\s&\s/g, ' i '],
  ]),
  es: Object.freeze([
    [/(?<![\p{L}\p{N}])c\/\s*/giu, 'calle '],
    [/(?<![\p{L}\p{N}])núm\./giu, 'número'],
    [/(?<![\p{L}\p{N}])pág\./giu, 'página'],
    [/(?<![\p{L}\p{N}])p\.\s?ej\./giu, 'por ejemplo'],
    [/(?<![\p{L}\p{N}])etc\./giu, 'etcétera.'],
    [/(?<![\p{L}\p{N}])sra\./giu, 'señora'],
    [/(?<![\p{L}\p{N}])sr\./giu, 'señor'],
    [/\s&\s/g, ' y '],
  ]),
  en: Object.freeze([
    [/(?<![\p{L}\p{N}])e\.g\./giu, 'for example'],
    [/(?<![\p{L}\p{N}])etc\./giu, 'et cetera.'],
    [/(?<![\p{L}\p{N}])mrs\./giu, 'missus'],
    [/(?<![\p{L}\p{N}])mr\./giu, 'mister'],
    [/\s&\s/g, ' and '],
  ]),
  eu: Object.freeze([
    [/(?<![\p{L}\p{N}])zk\./giu, 'zenbakia'],
    [/\s&\s/g, ' eta '],
  ]),
  gl: Object.freeze([
    [/(?<![\p{L}\p{N}])núm\./giu, 'número'],
    [/(?<![\p{L}\p{N}])páx\./giu, 'páxina'],
    [/(?<![\p{L}\p{N}])p\.\s?ex\./giu, 'por exemplo'],
    [/(?<![\p{L}\p{N}])etc\./giu, 'etcétera.'],
    [/\s&\s/g, ' e '],
  ]),
});

/**
 * PENDENT DE REVISIÓ DEL MESTRE · Lèxic mínim de paraules que es reescriuen
 * per a la veu (clau exacta, sensible a majúscules → text). `'*'` val per a
 * totes les llengües. Només hi ha el que no és dubtós; el vocabulari del
 * Tresor del Valencià Meridional es declara ací quan el Mestre el revise.
 */
export const LEXIC_PRONUNCIA = Object.freeze({
  '*': Object.freeze({ IAIA: 'iaia' }),
  ca: Object.freeze({}),
  es: Object.freeze({}),
  en: Object.freeze({}),
  eu: Object.freeze({}),
  gl: Object.freeze({}),
});

const escapaRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function aplicaLexic(text, idioma) {
  const parells = { ...LEXIC_PRONUNCIA['*'], ...(LEXIC_PRONUNCIA[idioma] || {}) };
  let resultat = text;
  for (const [clau, valor] of Object.entries(parells)) {
    const expressio = new RegExp(`(?<![\\p{L}\\p{N}])${escapaRegex(clau)}(?![\\p{L}\\p{N}])`, 'gu');
    resultat = resultat.replace(expressio, valor);
  }
  return resultat;
}

const llenguaTriada = (idioma) => (IDIOMES.includes(idioma) ? idioma : 'ca');

/**
 * Neteja un text perquè se'n puga dir en veu alta: lleva el Markdown, les
 * etiquetes HTML, les adreces web i els emojis; desplega les abreviatures i
 * aplica el lèxic revisable; col·lapsa els espais. Pura i sense efectes.
 * @param {string} text
 * @param {string} [idioma='ca']
 * @returns {string}
 */
export function normalitzaPerVeu(text, idioma = 'ca') {
  if (typeof text !== 'string' || !text) return '';
  const llengua = llenguaTriada(idioma);
  let t = text.slice(0, MAX_CARACTERS * 2);

  t = t
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>\n]{1,200}>/g, ' ')
    .replace(/!\[([^\]\n]*)\]\([^)\n]*\)/g, '$1')
    .replace(/\[([^\]\n]*)\]\([^)\n]*\)/g, '$1')
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/`([^`\n]*)`/g, '$1');

  const linies = t.split(/\r?\n/).map((linia) => linia
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/^\s*>+\s?/, '')
    .replace(/^\s*(?:[-*+]|\d{1,3}[.)])\s+/, '')
    .replace(/^\s*(?:[-*_]\s*){3,}$/, '')
    .replace(/\|/g, ' ')
    .replace(/(\*\*|__|\*|~~)/g, '')
    .replace(/(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, '')
    .replace(/\p{Extended_Pictographic}|\u{FE0E}|\u{FE0F}|\u{200D}|\u{20E3}|\p{Regional_Indicator}|\p{Emoji_Modifier}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim());

  const frases = linies
    .filter(Boolean)
    .map((linia) => (/[.!?:;,…]$/.test(linia) ? linia : `${linia}.`));
  let net = ` ${frases.join(' ')} `;

  for (const [expressio, substitut] of ABREVIATURES_VEU[llengua]) net = net.replace(expressio, substitut);
  net = aplicaLexic(net, llengua);
  return net.replace(/\s+/g, ' ').replace(/\s+([.,;:!?…])/g, '$1').trim().slice(0, MAX_CARACTERS);
}

/* ------------------------------------------------------------------ */
/* Estat                                                                */
/* ------------------------------------------------------------------ */

let activa = null; // { cancela(codi) } de la locució en curs
let puntFixat;

const sintesi = () => (typeof window !== 'undefined' && window.speechSynthesis
  && typeof window.SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null);

function validaPunt(valor) {
  if (typeof valor !== 'string') return null;
  const net = valor.trim();
  if (!/^https:\/\//i.test(net)) return null;
  try {
    const url = new URL(net);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return net.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/**
 * Fixa (o lleva, amb null) el punt HTTPS del Node 0 en temps d'execució. Si
 * no és una adreça https:// vàlida es descarta i el camí Node 0 queda apagat.
 */
export function fixaPuntNode0(url) {
  puntFixat = url === null ? null : (validaPunt(url) ?? null);
  reiniciaSalutNode0();
}

/** El punt HTTPS del Node 0 configurat, o null (el cas per defecte). */
export function puntNode0() {
  if (puntFixat !== undefined) return puntFixat;
  return validaPunt(import.meta.env?.VITE_SDP_VEU_NODE0_URL);
}

/**
 * Hi ha alguna veu per a esta locució? Amb `privat` només compta el navegador.
 * @param {{ privat?: boolean }} [opcions]
 */
export function veuDisponible({ privat = false } = {}) {
  return Boolean(sintesi()) || (!privat && Boolean(puntNode0()));
}

export function estaParlant() {
  return activa !== null;
}

/** Atura qualsevol locució en curs; la seua promesa es rebutja amb VEU_AVORTADA. */
export function atura() {
  const actual = activa;
  activa = null;
  actual?.cancela();
  try { sintesi()?.cancel(); } catch { /* sense síntesi: res a aturar */ }
}

/* ------------------------------------------------------------------ */
/* Camí Node 0                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Camí del navegador                                                   */
/* ------------------------------------------------------------------ */

const etiquetaNormal = (lang) => String(lang || '').toLowerCase().replace(/_/g, '-');

/** Tria la millor veu per prioritat de llengua; null si no n'hi ha cap. */
export function triaVeu(veus, idioma = 'ca') {
  const prioritat = PRIORITAT_VEUS[llenguaTriada(idioma)];
  const llista = Array.isArray(veus) ? veus : [];
  for (const etiqueta of prioritat.etiquetes) {
    const prefix = etiqueta.endsWith('*') ? etiqueta.slice(0, -1) : null;
    const trobada = llista.find((veu) => {
      const lang = etiquetaNormal(veu?.lang);
      return prefix ? (lang === prefix || lang.startsWith(`${prefix}-`)) : lang === etiqueta;
    });
    if (trobada) return trobada;
  }
  return null;
}

/* voiceschanged pot arribar tard: si encara no hi ha veus, s'espera un poc. */
function esperaVeus(synth) {
  const ara = synth.getVoices?.() || [];
  if (ara.length || typeof synth.addEventListener !== 'function') return Promise.resolve(ara);
  return new Promise((resolve) => {
    const acaba = () => {
      clearTimeout(temps);
      synth.removeEventListener('voiceschanged', acaba);
      resolve(synth.getVoices?.() || []);
    };
    const temps = setTimeout(acaba, ESPERA_VEUS_MS);
    synth.addEventListener('voiceschanged', acaba);
  });
}

async function parlaPerNavegador(text, idioma, signal, registra) {
  const synth = sintesi();
  if (!synth) throw nouError(CODI_VEU_NO_DISPONIBLE, 'Este navegador no té síntesi de veu.');
  const veus = await esperaVeus(synth);
  if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  const veu = triaVeu(veus, idioma);
  await new Promise((resolve, reject) => {
    const enunciat = new window.SpeechSynthesisUtterance(text);
    enunciat.lang = veu?.lang || PRIORITAT_VEUS[llenguaTriada(idioma)].perDefecte;
    if (veu) enunciat.voice = veu;
    let acabada = false;
    const acaba = (error) => {
      if (acabada) return;
      acabada = true;
      if (error) reject(error); else resolve();
    };
    registra((codi) => acaba(nouError(codi, 'Locució aturada.')));
    enunciat.onend = () => acaba();
    enunciat.onerror = (esdeveniment) => {
      const motiu = esdeveniment?.error;
      acaba(motiu === 'canceled' || motiu === 'interrupted'
        ? nouError(CODI_VEU_AVORTADA, 'Locució aturada.')
        : nouError(CODI_VEU_NO_DISPONIBLE, 'La síntesi del navegador ha fallat.', motiu));
    };
    try {
      synth.cancel();
      synth.speak(enunciat);
    } catch (causa) {
      acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'La síntesi del navegador ha fallat.', causa));
    }
  });
}

/* ------------------------------------------------------------------ */
/* API                                                                  */
/* ------------------------------------------------------------------ */

/**
 * Diu un text en veu alta. Torna una promesa resolta en acabar.
 * @param {string} text
 * @param {{ idioma?: string, privat?: boolean, signal?: AbortSignal }} [opcions]
 *   `privat: true` garanteix que no es fa cap petició de xarxa.
 * @returns {Promise<void>} rebutjada amb Error({ codi }) VEU_NO_DISPONIBLE o VEU_AVORTADA.
 */
export async function parla(text, { idioma = 'ca', privat = false, signal } = {}) {
  atura();
  if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  const llengua = llenguaTriada(idioma);
  const net = normalitzaPerVeu(text, llengua);
  if (!net) return;

  const control = new AbortController();
  let cancelaActual = null;
  const entrada = {
    cancela: () => {
      control.abort();
      cancelaActual?.(CODI_VEU_AVORTADA);
    },
  };
  activa = entrada;
  signal?.addEventListener('abort', entrada.cancela, { once: true });
  const registra = (cancela) => { cancelaActual = cancela; };
  const avortadaSiCal = () => {
    if (control.signal.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  };

  try {
    const punt = privat ? null : puntNode0();
    if (punt) {
      try {
        await parlaPerNodeZero(punt, net, llengua, control.signal, registra);
        return;
      } catch (error) {
        if (error?.codi === CODI_VEU_AVORTADA || control.signal.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
        /* Cau en silenci a la veu del navegador. */
      }
    }
    avortadaSiCal();
    await parlaPerNavegador(net, llengua, control.signal, registra);
  } finally {
    signal?.removeEventListener('abort', entrada.cancela);
    if (activa === entrada) activa = null;
  }
}

/** Només per a proves: torna l'estat intern al de l'arrencada. */
export function reiniciaVeuPerProves() {
  atura();
  puntFixat = undefined;
  reiniciaSalutNode0();
}
