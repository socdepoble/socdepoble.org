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
  creaSessioNode0,
  precarregaVeu as precarregaNode0,
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
  ca: Object.freeze({ etiquetes: ['ca-es-valencia', 'ca-es', 'ca*'], perDefecte: 'ca-ES-valencia' }),
  es: Object.freeze({ etiquetes: ['es-es', 'es*'], perDefecte: 'es-ES' }),
  eu: Object.freeze({ etiquetes: ['eu-es', 'eu*'], perDefecte: 'eu-ES' }),
  gl: Object.freeze({ etiquetes: ['gl-es', 'gl*'], perDefecte: 'gl-ES' }),
  en: Object.freeze({ etiquetes: ['en-gb', 'en*'], perDefecte: 'en-GB' }),
});

/* Quan la persona ha triat explícitament una veu catalana oriental o balear i
   cau al navegador, prioritzem ca-ES estàndard abans de ca-ES-valencia. */
const VEUS_ORIENTALS = new Set(['elia_central', 'olga_balear']);
const RE_IDENTITAT_VALENCIANA = /valenci[aà]|\bpau\b/i;

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

/* Les dues passades històriques no travessen LF. Cada cerca avança més
   enllà del primer delimitador invàlid o de tot el match; no rescaneja '['.
   Imatges abans d'enllaços: una etiqueta derivada pot contindre un enllaç. */
function llevaDestinsDeVeu(text, imatges) {
  const token = imatges ? '![' : '[';
  return text.split('\n').map(line => {
    const parts = []; let copied = 0, open = line.indexOf(token);
    while (open !== -1) {
      const start = open + token.length, close = line.indexOf(']', start);
      if (close === -1) break;
      if (line[close + 1] !== '(') { open = line.indexOf(token, close + 1); continue; }
      const end = line.indexOf(')', close + 2);
      if (end === -1) break;
      parts.push(line.slice(copied, open), line.slice(start, close)); copied = end + 1;
      open = line.indexOf(token, copied);
    }
    parts.push(line.slice(copied)); return parts.join('');
  }).join('\n');
}

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
    .replace(/<[^>\n]{1,200}>/g, ' ');
  t = llevaDestinsDeVeu(llevaDestinsDeVeu(t, true), false)
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
let preparacioImplicit = null;
const sessions = new Set();
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
  for (const sessio of [...sessions]) sessio.tanca();
  preparacioImplicit = null;
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
  preparacioImplicit?.sessio.tanca(); preparacioImplicit = null;
  // Sense propietari, només es cancel·la una cua nativa que encara existix.
  if (!actual) {
    const synth = sintesi();
    if (synth?.speaking || synth?.pending) { try { synth.cancel(); } catch { /* motor no disponible */ } }
  }
}

/* ------------------------------------------------------------------ */
/* Camí del navegador                                                   */
/* ------------------------------------------------------------------ */

const etiquetaNormal = (lang) => String(lang || '').toLowerCase().replace(/_/g, '-');

/** Tria la millor veu per prioritat de llengua i variant; null si no n'hi ha cap. */
export function triaVeu(veus, idioma = 'ca', veuId = null) {
  const llengua = llenguaTriada(idioma);
  const prioritat = PRIORITAT_VEUS[llengua];
  const esOriental = llengua === 'ca' && Boolean(veuId && VEUS_ORIENTALS.has(veuId));
  const etiquetes = esOriental
    ? ['ca-es', 'ca-es-valencia', 'ca*']
    : prioritat.etiquetes;
  const llista = Array.isArray(veus) ? veus : [];
  for (const etiqueta of etiquetes) {
    const prefix = etiqueta.endsWith('*') ? etiqueta.slice(0, -1) : null;
    const candidates = llista.filter((veu) => {
      const lang = etiquetaNormal(veu?.lang);
      return prefix ? (lang === prefix || lang.startsWith(`${prefix}-`)) : lang === etiqueta;
    });
    if (candidates.length > 0) {
      /* IDEA-337 · En fallback offline per a valencià, si el navegador etiqueta totes les veus
         com a ca-ES (ex. macOS/iOS on Pau comparteix ca-ES amb Jordi/Montse), prioritzem la veu
         amb nom o URI valencià abans d'una veu oriental genèrica. */
      if (llengua === 'ca' && !esOriental && etiqueta !== 'ca-es-valencia') {
        const valencianaPerNom = candidates.find((veu) => RE_IDENTITAT_VALENCIANA.test(`${veu?.name || ''} ${veu?.voiceURI || ''}`));
        if (valencianaPerNom) return valencianaPerNom;
      }
      return candidates[0];
    }
  }
  return null;
}

/* voiceschanged pot arribar tard: si encara no hi ha veus, s'espera un poc. */
function esperaVeus(synth, signal) {
  const ara = synth.getVoices?.() || [];
  if (ara.length || typeof synth.addEventListener !== 'function') return Promise.resolve(ara);
  return new Promise((resolve) => {
    const acaba = () => {
      clearTimeout(temps);
      synth.removeEventListener('voiceschanged', acaba);
      signal?.removeEventListener('abort', acaba);
      resolve(synth.getVoices?.() || []);
    };
    const temps = setTimeout(acaba, ESPERA_VEUS_MS);
    synth.addEventListener('voiceschanged', acaba);
    signal?.addEventListener('abort', acaba, { once: true });
    if (signal?.aborted) acaba();
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

function creaCuaNavegador(idioma, signal, veuId, enFallada) {
  const synth = sintesi();
  const treballs = [];
  const enCua = new Set();
  let veu = null, llesta = false, tancada = false;
  const tanca = (error = nouError(CODI_VEU_AVORTADA, 'Locució aturada.')) => {
    if (tancada) return;
    tancada = true;
    const teniaCua = enCua.size > 0;
    for (const enunciat of enCua) { enunciat.onstart = null; enunciat.onend = null; enunciat.onerror = null; }
    enCua.clear();
    for (const treball of treballs.splice(0)) treball.reject(error);
    signal.removeEventListener('abort', enAvortar);
    if (teniaCua) { try { synth?.cancel(); } catch { /* la cua ja s'ha aturat */ } }
  };
  const enAvortar = () => tanca();
  signal.addEventListener('abort', enAvortar, { once: true });
  const impulsa = () => {
    if (!llesta || tancada || signal.aborted) return;
    while (enCua.size < 2) {
      const treball = treballs.find((t) => t.proxim < t.blocs.length);
      if (!treball) return;
      const primer = treball.proxim === 0;
      const enunciat = new window.SpeechSynthesisUtterance(treball.blocs[treball.proxim++]);
      const perDefecte = llenguaTriada(idioma) === 'ca' && veuId && VEUS_ORIENTALS.has(veuId)
        ? 'ca-ES'
        : PRIORITAT_VEUS[llenguaTriada(idioma)].perDefecte;
      enunciat.lang = veu?.lang || perDefecte;
      if (veu) enunciat.voice = veu;
      enCua.add(enunciat);
      enunciat.onstart = () => { if (!tancada && !signal.aborted && primer) treball.onInici?.(); };
      enunciat.onend = () => {
        if (tancada || !enCua.delete(enunciat)) return;
        enunciat.onstart = null; enunciat.onend = null; enunciat.onerror = null;
        treball.acabats += 1;
        if (treball.acabats === treball.blocs.length) { treballs.splice(treballs.indexOf(treball), 1); treball.resolve(); }
        impulsa();
      };
      enunciat.onerror = (esdeveniment) => {
        const motiu = esdeveniment?.error;
        const error = motiu === 'canceled' || motiu === 'interrupted'
          ? nouError(CODI_VEU_AVORTADA, 'Locució aturada.')
          : nouError(CODI_VEU_NO_DISPONIBLE, 'La síntesi del navegador ha fallat.', motiu);
        tanca(error); enFallada(error);
      };
      try { synth.speak(enunciat); }
      catch (cause) { const error = nouError(CODI_VEU_NO_DISPONIBLE, 'La síntesi del navegador ha fallat.', cause); tanca(error); enFallada(error); return; }
    }
  };
  const veusLlesta = synth ? esperaVeus(synth, signal) : Promise.reject(nouError(CODI_VEU_NO_DISPONIBLE, 'Este navegador no té síntesi de veu.'));
  veusLlesta.then((veus) => { if (!tancada && !signal.aborted) { veu = triaVeu(veus, idioma, veuId); llesta = true; impulsa(); } })
    .catch((error) => { tanca(error); enFallada(error); });
  return {
    parla: (text, onInici) => new Promise((resolve, reject) => {
      if (tancada || signal.aborted) { reject(nouError(CODI_VEU_AVORTADA, 'Locució aturada.')); return; }
      treballs.push({ blocs: parteixEnBlocsDeVeu(text, MAX_CARACTERS_BLOC_NAVEGADOR), proxim: 0, acabats: 0, resolve, reject, onInici });
      impulsa();
    }),
    tanca
  };
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
export function creaSessioVeu({ idioma = 'ca', privat = false, signal, veu } = {}) {
  const llengua = llenguaTriada(idioma);
  const veuTriada = veu !== undefined ? validaVeuPreferida(veu) : veuPreferidaExplicita();
  const forcaNavegador = veuTriada === VEU_AUTO_NAVEGADOR;
  const veuPerNode0 = veuTriada && !forcaNavegador ? veuTriada : null;
  const punt = privat || forcaNavegador ? null : puntNode0();
  const control = new AbortController();
  const node = creaSessioNode0(control.signal);
  const treballs = [];
  let navegador = null, drenant = false, camiNode = Boolean(punt), tancada = false;
  const entrada = { cancela: () => tanca() };
  const tanca = (error = nouError(CODI_VEU_AVORTADA, 'Locució aturada.')) => {
    if (tancada) return;
    tancada = true;
    // La cua pròpia lleva listeners abans de l'abort; no toca cap veu aliena.
    navegador?.tanca(error);
    control.abort(); node.tanca();
    for (const treball of treballs.splice(0)) treball.reject(error);
    signal?.removeEventListener('abort', enAvortar);
    sessions.delete(sessio); desubscriuPreferencia();
    if (preparacioImplicit?.sessio === sessio) preparacioImplicit = null;
    if (activa === entrada) { activa = null; notificaEstat(); }
  };
  const enAvortar = () => tanca();
  const viu = () => { if (tancada || control.signal.aborted) throw nouError(CODI_VEU_AVORTADA, 'Locució aturada.'); };
  const prenVeu = () => {
    viu();
    if (activa !== entrada) {
      atura(); activa = entrada; notificaEstat();
    }
  };
  const passaAlNavegador = () => {
    navegador ||= creaCuaNavegador(llengua, control.signal, veuTriada, tanca);
    for (const treball of treballs) {
      if (treball.enviat) continue;
      treball.enviat = true;
      navegador.parla(treball.net, treball.onInici).then(() => {
        const index = treballs.indexOf(treball); if (index >= 0) treballs.splice(index, 1);
        treball.resolve();
      }, (error) => { treball.reject(error); tanca(error); });
    }
  };
  const drena = async () => {
    if (!camiNode) { passaAlNavegador(); return; }
    if (drenant) return;
    drenant = true;
    try {
      while (treballs.length && !tancada) {
        const treball = treballs[0];
        try {
          await parlaPerNodeZero(punt, treball.net, llengua, control.signal, () => {}, veuPerNode0, parteixEnBlocsDeVeu, node, treball.onInici);
        } catch (error) {
          if (error?.codi === CODI_VEU_AVORTADA || control.signal.aborted) { tanca(); return; }
          // Una fallada de preparació futura només es degrada quan li toca sonar.
          camiNode = false; node.tanca(); passaAlNavegador(); return;
        }
        viu(); treballs.shift(); treball.resolve();
      }
    } catch (error) { tanca(error); }
    finally { drenant = false; }
  };
  const sessio = {
    parla: (text, { onInici } = {}) => {
      try { prenVeu(); } catch (error) { return Promise.reject(error); }
      const net = normalitzaPerVeu(text, llengua);
      if (!net) return Promise.resolve();
      const promesa = new Promise((resolve, reject) => treballs.push({ net, onInici: () => { if (!tancada && activa === entrada) onInici?.(); }, resolve, reject, enviat: false }));
      drena().catch(tanca);
      return promesa;
    },
    precarregaVeu: async (text) => {
      viu();
      if (!punt || !camiNode) return false;
      const net = normalitzaPerVeu(text, llengua);
      if (!net) return false;
      return precarregaNode0(punt, net, llengua, control.signal, veuPerNode0, parteixEnBlocsDeVeu, node);
    },
    tanca
  };
  const desubscriuPreferencia = subscriuVeuPreferida(() => tanca());
  sessions.add(sessio);
  signal?.addEventListener('abort', enAvortar, { once: true });
  if (signal?.aborted) tanca();
  return sessio;
}

const clauPreparacio = (opcions) => JSON.stringify([llenguaTriada(opcions.idioma), Boolean(opcions.privat), opcions.veu ?? veuPreferidaExplicita(), puntNode0()]);

/** Prepara sense reproduir. Amb sessió explícita, compartix la finestra bounded
 * de lectura; sense, guarda una preparació curta per a la pròxima parla. */
export function precarregaVeu(text, opcions = {}) {
  if (opcions.sessio) return opcions.sessio.precarregaVeu(text);
  if (opcions.privat || opcions.veu === VEU_AUTO_NAVEGADOR) return Promise.resolve(false);
  const clau = clauPreparacio(opcions);
  if (!preparacioImplicit || preparacioImplicit.clau !== clau || preparacioImplicit.signal !== opcions.signal) {
    preparacioImplicit?.sessio.tanca();
    preparacioImplicit = { clau, signal: opcions.signal, sessio: creaSessioVeu(opcions) };
  }
  return preparacioImplicit.sessio.precarregaVeu(text);
}

export async function parla(text, opcions = {}) {
  if (opcions.sessio) return opcions.sessio.parla(text, { onInici: opcions.onInici });
  let sessio;
  if (preparacioImplicit?.clau === clauPreparacio(opcions) && preparacioImplicit.signal === opcions.signal) {
    sessio = preparacioImplicit.sessio; preparacioImplicit = null;
  } else {
    sessio = creaSessioVeu(opcions);
  }
  try { return await sessio.parla(text, { onInici: opcions.onInici }); }
  finally { sessio.tanca(); }
}

/** Només per a proves: torna l'estat intern i la preferència al de l'arrencada. */
export function reiniciaVeuPerProves() {
  atura();
  for (const sessio of [...sessions]) sessio.tanca();
  puntFixat = undefined;
  desaVeuPreferida(null);
  reiniciaSalutNode0();
}
