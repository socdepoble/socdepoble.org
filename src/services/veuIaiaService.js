/**
 * veuIaiaService.js · IDEA-108 (Onada R7, 261106) + Onada R23 (veus territorials) ·
 * La veu de la IAIA i de Sóc de Poble.
 *
 * Una sola porta per a fer parlar el sistema, amb dos camins:
 *
 *   1. Node 0 (veu neuronal del servidor), OPCIONAL i desactivat per defecte.
 *      Només s'usa si es compleixen les QUATRE condicions:
 *        a) `privat` és false (el text no ix mai del dispositiu si és privat);
 *        b) la veu triada no és `auto_navegador`;
 *        c) hi ha un punt HTTPS configurat (`VITE_SDP_VEU_NODE0_URL` en el
 *           build, o `fixaPuntNode0()` en temps d'execució); per defecte NO
 *           n'hi ha, i ha de començar per `https://`;
 *        d) una comprovació de salut recent (en memòria, uns 5 minuts) ha anat bé.
 *      Qualsevol error o temps esgotat cau en silenci al camí 2.
 *   2. Veu del navegador (`window.speechSynthesis`), sempre disponible quan el
 *      navegador té síntesi. Tria la veu per llengua i variant amb prioritat
 *      (ca: ca-ES-valencia, ca-ES, ca*; es: es-ES; eu: eu-ES; gl: gl-ES; en: en-*).
 *
 * CONTRACTE QUE HAURÀ DE COMPLIR EL SERVIDOR (`/api/v1/node0/veu`):
 *   · `GET  {punt}/salut` → 200 quan el motor de veu està llest.
 *   · `POST {punt}` amb `Content-Type: application/json` i cos
 *     `{ "text": string, "idioma": "ca"|"es"|"en"|"eu"|"gl", "veu"?: string }`
 *     → 200 amb un cos d'àudio (`Content-Type: audio/*`, p. ex. audio/wav o
 *     audio/mpeg). Qualsevol altre estat o tipus es tracta com a fallada.
 */

import {
  CODI_VEU_AVORTADA,
  CODI_VEU_NO_DISPONIBLE,
  PUNT_NODE0_PUBLIC,
  TEMPS_LIMIT_NODE0_MS,
  TEMPS_LIMIT_SALUT_MS,
  VIDA_SALUT_BONA_MS,
  VIDA_SALUT_DOLENTA_MS,
  nouError,
  parlaPerNodeZero,
  reiniciaSalutNode0,
} from './veuNode0.js';
import {
  CLAU_VEU_PREFERIDA,
  IDS_VEU_VALIDA,
  VEUS_TERRITORIALS,
  VEU_AUTO_NAVEGADOR,
  VEU_PER_DEFECTE,
  desaVeuPreferida,
  llegeixVeuPreferida,
  subscriuVeuPreferida,
  validaPuntHttpsVeu,
  validaVeuPreferida,
  veuPreferidaExplicita,
} from './veusTerritorials.js';

/* Les crides de xarxa del Node 0 viuen a veuNode0.js: cap fitxer de la IAIA
   del client no en fa (legal.iaia.test.js, P1-24). */
export {
  CLAU_VEU_PREFERIDA,
  CODI_VEU_AVORTADA,
  CODI_VEU_NO_DISPONIBLE,
  IDS_VEU_VALIDA,
  TEMPS_LIMIT_NODE0_MS,
  TEMPS_LIMIT_SALUT_MS,
  VEUS_TERRITORIALS,
  VEU_AUTO_NAVEGADOR,
  VEU_PER_DEFECTE,
  VIDA_SALUT_BONA_MS,
  VIDA_SALUT_DOLENTA_MS,
  desaVeuPreferida,
  llegeixVeuPreferida,
  subscriuVeuPreferida,
  validaVeuPreferida,
  veuPreferidaExplicita,
};

const ESPERA_VEUS_MS = 1200;
const MAX_CARACTERS = 120000;
const MAX_CARACTERS_BLOC_NAVEGADOR = 1200;

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

/* Quan la persona ha triat explícitament una veu catalana oriental o balear i
   cau al navegador, prioritzem ca-ES estàndard abans de ca-ES-valencia. */
const VEUS_ORIENTALS = new Set(['elia_central', 'olga_balear']);

/* ------------------------------------------------------------------ */
/* Normalització per a la veu                                           */
/* ------------------------------------------------------------------ */

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
const oientsEstat = new Set();

function notificaEstat() {
  const parlant = activa !== null;
  for (const oient of oientsEstat) oient(parlant);
}

/** Subscriu canvis en l'estat `estaParlant()` (útil per a sincronitzar menús i botons). */
export function subscriuEstatVeu(oient) {
  if (typeof oient !== 'function') return () => {};
  oientsEstat.add(oient);
  return () => { oientsEstat.delete(oient); };
}

const sintesi = () => (typeof window !== 'undefined' && window.speechSynthesis
  && typeof window.SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null);

/**
 * Fixa (o lleva, amb null) el punt HTTPS del Node 0 en temps d'execució. Si
 * no és una adreça https:// vàlida es descarta i el camí Node 0 queda apagat.
 */
export function fixaPuntNode0(url) {
  puntFixat = url === null ? null : (validaPuntHttpsVeu(url) ?? null);
  reiniciaSalutNode0();
}

/** El punt HTTPS del Node 0 configurat (en producció/dev usa el túnel verificat del Node 0; en proves és null per defecte). */
export function puntNode0() {
  if (puntFixat !== undefined) return puntFixat;
  const variableEntorn = import.meta.env?.VITE_SDP_VEU_NODE0_URL;
  if (variableEntorn !== undefined && variableEntorn !== '') {
    return validaPuntHttpsVeu(variableEntorn);
  }
  if (!import.meta.env?.VITEST && import.meta.env?.MODE && import.meta.env.MODE !== 'test') {
    return PUNT_NODE0_PUBLIC;
  }
  return null;
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
  if (actual) notificaEstat();
  actual?.cancela();
  try { sintesi()?.cancel(); } catch { /* sense síntesi: res a aturar */ }
}

/* ------------------------------------------------------------------ */
/* Camí del navegador                                                   */
/* ------------------------------------------------------------------ */

const etiquetaNormal = (lang) => String(lang || '').toLowerCase().replace(/_/g, '-');

/** Tria la millor veu per prioritat de llengua i variant; null si no n'hi ha cap. */
export function triaVeu(veus, idioma = 'ca', veuId = null) {
  const llengua = llenguaTriada(idioma);
  const prioritat = PRIORITAT_VEUS[llengua];
  const etiquetes = llengua === 'ca' && veuId && VEUS_ORIENTALS.has(veuId)
    ? ['ca-es', 'ca-es-valencia', 'ca*']
    : prioritat.etiquetes;
  const llista = Array.isArray(veus) ? veus : [];
  for (const etiqueta of etiquetes) {
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

/**
 * Parteix un text llarg en blocs segurs per a `SpeechSynthesisUtterance`
 * (evita el tall natiu ~15 s / ~2.000 caràcters de Chrome, Android i Safari
 * mòbil en articles llargs, respectant sempre els finals de frase).
 */
export function parteixEnBlocsDeVeu(text, maxBloc = MAX_CARACTERS_BLOC_NAVEGADOR) {
  const net = typeof text === 'string' ? text.trim() : '';
  if (!net) return [];
  if (net.length <= maxBloc) return [net];

  const frases = net.split(/(?<=[.!?;:…])\s+/u).filter(Boolean);
  const blocs = [];
  let actual = '';

  const empenyTrosLlarg = (tros) => {
    let restant = tros.trim();
    while (restant.length > maxBloc) {
      let tall = restant.lastIndexOf(' ', maxBloc);
      if (tall <= 0) tall = maxBloc;
      blocs.push(restant.slice(0, tall).trim());
      restant = restant.slice(tall).trim();
    }
    if (restant) actual = restant;
  };

  for (const frase of frases) {
    if (!actual) {
      if (frase.length <= maxBloc) {
        actual = frase;
      } else {
        empenyTrosLlarg(frase);
      }
      continue;
    }
    if (`${actual} ${frase}`.length <= maxBloc) {
      actual = `${actual} ${frase}`;
    } else {
      blocs.push(actual);
      actual = '';
      if (frase.length <= maxBloc) {
        actual = frase;
      } else {
        empenyTrosLlarg(frase);
      }
    }
  }
  if (actual) blocs.push(actual);
  return blocs;
}

async function parlaPerNavegador(text, idioma, signal, registra, veuId = null) {
  const synth = sintesi();
  if (!synth) throw nouError(CODI_VEU_NO_DISPONIBLE, 'Este navegador no té síntesi de veu.');
  const veus = await esperaVeus(synth);
  if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  const veu = triaVeu(veus, idioma, veuId);
  const blocs = parteixEnBlocsDeVeu(text, MAX_CARACTERS_BLOC_NAVEGADOR);
  if (!blocs.length) return;

  try {
    synth.cancel();
  } catch {
    /* sense locució prèvia */
  }

  for (const bloc of blocs) {
    if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
    await new Promise((resolve, reject) => {
      const enunciat = new window.SpeechSynthesisUtterance(bloc);
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
        synth.speak(enunciat);
      } catch (causa) {
        acaba(nouError(CODI_VEU_NO_DISPONIBLE, 'La síntesi del navegador ha fallat.', causa));
      }
    });
  }
}

/* ------------------------------------------------------------------ */
/* API                                                                  */
/* ------------------------------------------------------------------ */

/**
 * Diu un text en veu alta. Torna una promesa resolta en acabar.
 * @param {string} text
 * @param {{ idioma?: string, privat?: boolean, signal?: AbortSignal, veu?: string }} [opcions]
 *   `privat: true` garanteix que no es fa cap petició de xarxa.
 *   `veu` admet un id de `IDS_VEU_VALIDA`; si s'omet, usa la preferència desada.
 * @returns {Promise<void>} rebutjada amb Error({ codi }) VEU_NO_DISPONIBLE o VEU_AVORTADA.
 */
export async function parla(text, { idioma = 'ca', privat = false, signal, veu } = {}) {
  atura();
  if (signal?.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  const llengua = llenguaTriada(idioma);
  const net = normalitzaPerVeu(text, llengua);
  if (!net) return;

  const veuTriada = veu !== undefined ? validaVeuPreferida(veu) : veuPreferidaExplicita();
  const forcaNavegador = veuTriada === VEU_AUTO_NAVEGADOR;
  const veuPerNode0 = veuTriada && !forcaNavegador ? veuTriada : null;

  const control = new AbortController();
  let cancelaActual = null;
  const entrada = {
    cancela: () => {
      control.abort();
      cancelaActual?.(CODI_VEU_AVORTADA);
    },
  };
  activa = entrada;
  notificaEstat();
  /* Onada R29 · R29-CV-04 · Avortar amb el signal calla també la síntesi del navegador (atura() fa
     el cancel()) si la locució encara és la vigent; si ja n'hi ha una altra, només rebutja la seua. */
  const enAvortar = () => {
    if (activa === entrada) atura();
    else entrada.cancela();
  };
  signal?.addEventListener('abort', enAvortar, { once: true });
  const registra = (cancela) => { cancelaActual = cancela; };
  const avortadaSiCal = () => {
    if (control.signal.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
  };

  try {
    const punt = privat || forcaNavegador ? null : puntNode0();
    if (punt) {
      try {
        await parlaPerNodeZero(punt, net, llengua, control.signal, registra, veuPerNode0, parteixEnBlocsDeVeu);
        return;
      } catch (error) {
        if (error?.codi === CODI_VEU_AVORTADA || control.signal.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.');
        /* Cau en silenci a la veu del navegador. */
      }
    }
    avortadaSiCal();
    await parlaPerNavegador(net, llengua, control.signal, registra, veuTriada);
  } finally {
    signal?.removeEventListener('abort', enAvortar);
    if (activa === entrada) {
      activa = null;
      notificaEstat();
    }
  }
}

/** Només per a proves: torna l'estat intern i la preferència al de l'arrencada. */
export function reiniciaVeuPerProves() {
  atura();
  puntFixat = undefined;
  desaVeuPreferida(null);
  reiniciaSalutNode0();
}
