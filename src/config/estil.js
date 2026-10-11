/* Onada 11 (261010; prompt 261010_1730, tasca 2; brainstorming 261009_2005 §5
   nivell 1, F3) · L'estil del poble com a tokens tipats, no com a CSS lliure
   (descartat pel Mestre, 261010_1140: «enfocar-se a l'editor de tokens
   estructurats»). Mòdul pur: cap DOM, cap xarxa.
   · TOKENS_EDITABLES: la llista TANCADA dels semàntics de la capa 2 de
     tokens.css (:105-181, tema clar) que el superadmin pot canviar, amb el
     tipus que admet cada un: 'color' (#rrggbb) per als de fons, text, accent,
     acció i estat; 'radi' (un valor de l'escala) per a --sdp-radi-s/-m/-g/-xl.
     Els primitius (--sdp-pedra-*, --sdp-primary-*, --sdp-secondary-*) i els
     --sdp-crom-* no hi són ni hi seran (tokens.css:9-17; tractor-crom.mjs).
     --sdp-fons-vel queda fora: és una rgba() translúcida, no un #rrggbb.
   · PARELLS_DE_CONTRAST: [text, fons] que han d'arribar a CONTRAST_MINIM (7:1,
     AAA: Q1 del Mestre, 261004) quan es coneixen els dos valors. El valor del
     token que no es canvia es llig de CANON: els valors del tema clar de
     tokens.css, només els dels tokens que participen en un parell. El cànon
     complix tots els parells (ho fixa estil.test.js): un estil buit sempre val.
   · validaEstil(payload) → errors[] (buit si val). cssDePersonalitzacio(payload)
     → el CSS que s'aplica: només declaracions `--sdp-x: valor;` de tokens de la
     llista amb un valor del seu tipus, dins del bloc `:root, :host, .sdp-root`
     i, repetit, dins del selector del tema fosc de tokens.css (:525-526), que
     amb més especificitat tornaria a guanyar. Un valor que no passe el tipus
     no es serialitza: cap ';', '}', 'url(', '\\', 'expression', '<' ni '>' pot
     formar part d'un #rrggbb ni d'un radi de l'escala.
   Forma del payload: { v: 1, tokens: { [nom]: valor }, crom: { to } | null },
   amb `to` el gir de to del crom (crom.js) entre -180 i 180 graus. */
import { contrast, esHex6 } from './contrast.js';

export const VERSIO_ESTIL = 1;
export const CONTRAST_MINIM = 7;
export const ESCALA_RADIS = Object.freeze(['8px', '12px', '16px', '28px', '999px']);
const CAMPS_PAYLOAD = Object.freeze(['v', 'tokens', 'crom']);

const colors = (grup, noms) => noms.map((nom) => Object.freeze({ nom, tipus: 'color', grup }));

/** La llista tancada: { nom, tipus: 'color' | 'radi', grup }. L'ordre és el de tokens.css. */
export const TOKENS_EDITABLES = Object.freeze([
  ...colors('fons', ['--sdp-fons-app', '--sdp-fons-targeta', '--sdp-fons-elevat', '--sdp-fons-superficie',
    '--sdp-fons-roca', '--sdp-sobre-roca', '--sdp-fons-subtil', '--sdp-fons-invers']),
  ...colors('text', ['--sdp-text-titol', '--sdp-text-cos', '--sdp-text-suau', '--sdp-text-invers', '--sdp-text-desactivat']),
  ...colors('accent', ['--sdp-accent', '--sdp-accent-hover', '--sdp-accent-subtil', '--sdp-sobre-accent',
    '--sdp-accent-text', '--sdp-accent-text-hover', '--sdp-accent-titol']),
  ...colors('accio', ['--sdp-accio', '--sdp-accio-hover', '--sdp-accio-forta', '--sdp-accio-subtil',
    '--sdp-accio-control', '--sdp-accio-control-hover', '--sdp-sobre-accio', '--sdp-accio-text',
    '--sdp-focus', '--sdp-focus-invers', '--sdp-focus-sobre-accio']),
  ...colors('estat', ['--sdp-error', '--sdp-error-fons', '--sdp-error-text', '--sdp-avis', '--sdp-avis-fons', '--sdp-avis-text',
    '--sdp-exit', '--sdp-exit-fons', '--sdp-exit-text', '--sdp-info', '--sdp-info-fons', '--sdp-info-text']),
  ...['--sdp-radi-s', '--sdp-radi-m', '--sdp-radi-g', '--sdp-radi-xl'].map((nom) => Object.freeze({ nom, tipus: 'radi', grup: 'radi' }))
]);

const TIPUS = Object.freeze(Object.fromEntries(TOKENS_EDITABLES.map((t) => [t.nom, t.tipus])));

/** Els parells [text, fons] que han d'arribar a 7:1. Cada un passa amb el cànon. */
export const PARELLS_DE_CONTRAST = Object.freeze([
  ['--sdp-text-cos', '--sdp-fons-app'],
  ['--sdp-text-titol', '--sdp-fons-targeta'],
  ['--sdp-text-cos', '--sdp-fons-targeta'],
  ['--sdp-text-suau', '--sdp-fons-targeta'],
  ['--sdp-accio-text', '--sdp-fons-targeta'],
  ['--sdp-sobre-roca', '--sdp-fons-roca'],
  /* El blanc va sobre --sdp-accio-control (9,21:1), no sobre --sdp-accio: el
     blau de marca amb text blanc fa 3,87:1 i tokens.css:94 el reserva a icones
     i text gran; un parell que el cànon no passa bloquejaria «Desar» sempre. */
  ['--sdp-sobre-accio', '--sdp-accio-control'],
  ['--sdp-sobre-accent', '--sdp-accent'],
  ['--sdp-error-text', '--sdp-error-fons'],
  ['--sdp-avis-text', '--sdp-avis-fons'],
  ['--sdp-exit-text', '--sdp-exit-fons'],
  ['--sdp-info-text', '--sdp-info-fons']
].map((parell) => Object.freeze(parell)));

/* El tema clar de tokens.css resolt a hex, només per als tokens dels parells.
   Hex cru a posta (ALLOW_RAW_COLOR): és la font de veritat copiada, no un color
   nou; si tokens.css canvia, estil.test.js ho diu. */
export const CANON = Object.freeze({
  '--sdp-fons-app': /* ALLOW_RAW_COLOR */ '#f3f0ec',
  '--sdp-fons-targeta': '#ffffff',
  '--sdp-fons-roca': /* ALLOW_RAW_COLOR */ '#0e0d0c',
  '--sdp-sobre-roca': '#ffffff',
  '--sdp-text-titol': /* ALLOW_RAW_COLOR */ '#0e0d0c',
  '--sdp-text-cos': /* ALLOW_RAW_COLOR */ '#3d3b35',
  '--sdp-text-suau': /* ALLOW_RAW_COLOR */ '#4c4841',
  '--sdp-accent': '#ff7300',
  '--sdp-sobre-accent': /* ALLOW_RAW_COLOR */ '#0e0d0c',
  '--sdp-accio-control': /* ALLOW_RAW_COLOR */ '#004983',
  '--sdp-sobre-accio': '#ffffff',
  '--sdp-accio-text': /* ALLOW_RAW_COLOR */ '#004983',
  '--sdp-error-text': /* ALLOW_RAW_COLOR */ '#92000c',
  '--sdp-error-fons': /* ALLOW_RAW_COLOR */ '#ffedeb',
  '--sdp-avis-text': /* ALLOW_RAW_COLOR */ '#6e4901',
  '--sdp-avis-fons': /* ALLOW_RAW_COLOR */ '#fff1df',
  '--sdp-exit-text': /* ALLOW_RAW_COLOR */ '#005c27',
  '--sdp-exit-fons': /* ALLOW_RAW_COLOR */ '#e4f8e7',
  '--sdp-info-text': /* ALLOW_RAW_COLOR */ '#004983',
  '--sdp-info-fons': /* ALLOW_RAW_COLOR */ '#f1f8ff'
});

/** Els radis del cànon (tokens.css:177-180): el valor de partida de cada Selector de la faceta. */
export const CANON_RADIS = Object.freeze({ '--sdp-radi-s': '8px', '--sdp-radi-m': '12px', '--sdp-radi-g': '16px', '--sdp-radi-xl': '28px' });

/* Doble xarxa darrere del tipus: cap valor que passe el tipus la conté. */
const PROHIBIT = /[;{}<>\\]|url\(|expression/i;

/** Cert si `valor` és un valor admés per al token `nom` de la llista. */
export function valorValid(nom, valor) {
  const tipus = TIPUS[nom];
  if (!tipus || typeof valor !== 'string' || PROHIBIT.test(valor)) return false;
  return tipus === 'color' ? esHex6(valor) : ESCALA_RADIS.includes(valor);
}

/** El gir del crom, dut a (-180, 180]. */
export function normalitzaTo(delta) {
  const n = Number(delta);
  if (!Number.isFinite(n)) return 0;
  const gir = ((n + 180) % 360 + 360) % 360 - 180;
  return gir === -180 ? 180 : gir;
}

/** Cert si `crom` és null/undefined o { to } amb un nombre finit entre -180 i 180. */
export function cromValid(crom) {
  if (crom === null || crom === undefined) return true;
  if (!crom || typeof crom !== 'object' || Array.isArray(crom)) return false;
  if (Object.keys(crom).some((clau) => clau !== 'to')) return false;
  return typeof crom.to === 'number' && Number.isFinite(crom.to) && Math.abs(crom.to) <= 180;
}

const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);

/** Les declaracions vàlides del payload, en l'ordre de la llista: [[nom, valor]]. */
export function declaracionsDe(payload) {
  const tokens = esObjecte(payload?.tokens) ? payload.tokens : {};
  return TOKENS_EDITABLES.filter((t) => valorValid(t.nom, tokens[t.nom])).map((t) => [t.nom, tokens[t.nom]]);
}

/* El valor efectiu d'un token per al contrast: el personalitzat vàlid, el vigent
   conegut (un #rrggbb) o el cànon; null si no se'n sap cap. */
function valorEfectiu(nom, tokens, vigents) {
  if (valorValid(nom, tokens[nom])) return tokens[nom];
  if (esHex6(vigents?.[nom])) return vigents[nom];
  return CANON[nom] ?? null;
}

/**
 * El contrast de cada parell amb els tokens donats: [{ text, fons, valorText,
 * valorFons, ratio, passa }]. `ratio` i `passa` són null quan falta algun
 * valor. `vigents` (opcional) són els valors que es veuen ara (p. ex. llegits
 * amb getComputedStyle), per davant del cànon.
 */
export function contrastosDe(tokens = {}, vigents = CANON) {
  const t = esObjecte(tokens) ? tokens : {};
  return PARELLS_DE_CONTRAST.map(([text, fons]) => {
    const valorText = valorEfectiu(text, t, vigents);
    const valorFons = valorEfectiu(fons, t, vigents);
    const ratio = contrast(valorText, valorFons);
    return { text, fons, valorText, valorFons, ratio, passa: ratio === null ? null : ratio >= CONTRAST_MINIM };
  });
}

const descriuTipus = (tipus) => (tipus === 'color' ? 'un color #rrggbb' : `un radi de l'escala (${ESCALA_RADIS.join(', ')})`);

/**
 * Els errors del payload, en valencià; [] si val. `vigents` (opcional) són els
 * valors que es veuen ara, per davant del cànon, per al contrast (contrastosDe).
 */
export function validaEstil(payload, vigents = CANON) {
  if (!esObjecte(payload)) return ['L’estil ha de ser un objecte { v, tokens, crom }.'];
  const errors = [];
  if (payload.v !== VERSIO_ESTIL) errors.push(`La versió de l’estil ha de ser ${VERSIO_ESTIL}.`);
  for (const clau of Object.keys(payload)) {
    if (!CAMPS_PAYLOAD.includes(clau)) errors.push(`Camp desconegut a l’estil: ${clau}.`);
  }
  if (!esObjecte(payload.tokens)) {
    errors.push('Els tokens han de ser un objecte { nom: valor }.');
  } else {
    for (const [nom, valor] of Object.entries(payload.tokens)) {
      if (!TIPUS[nom]) errors.push(`Token fora de la llista: ${nom}.`);
      else if (!valorValid(nom, valor)) errors.push(`Valor invàlid per a ${nom}: cal ${descriuTipus(TIPUS[nom])}.`);
    }
    for (const c of contrastosDe(payload.tokens, vigents)) {
      if (c.passa === false) errors.push(`Contrast insuficient de ${c.text} sobre ${c.fons}: ${c.ratio.toFixed(2)}:1 (cal ${CONTRAST_MINIM}:1).`);
    }
  }
  if (!cromValid(payload.crom)) errors.push('El crom ha de ser null o { to } amb un gir entre -180 i 180 graus.');
  return errors;
}

/* El selector base i el del tema fosc de tokens.css (:34 i :525-526). El fosc
   es repetix perquè, amb més especificitat, tornaria a guanyar la capa 2. */
const SELECTORS = Object.freeze([
  ':root, :host, .sdp-root',
  ':root[data-theme="dark"], :host([data-theme="dark"]), :root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root'
]);

/** El CSS de la personalització: només `--sdp-x: valor;` vàlids, o '' si no n'hi ha cap. */
export function cssDePersonalitzacio(payload) {
  const declaracions = declaracionsDe(payload);
  if (!declaracions.length) return '';
  const cos = declaracions.map(([nom, valor]) => `  ${nom}: ${valor};`).join('\n');
  return SELECTORS.map((selector) => `${selector} {\n${cos}\n}`).join('\n') + '\n';
}

/** Un payload nou amb els tokens de `base` (si en té) i el gir `to` (0 → crom null). */
export function ambCrom(base, to) {
  const gir = normalitzaTo(to);
  return { v: VERSIO_ESTIL, tokens: esObjecte(base?.tokens) ? { ...base.tokens } : {}, crom: gir === 0 ? null : { to: gir } };
}
