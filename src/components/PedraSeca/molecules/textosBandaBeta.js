/**
 * textosBandaBeta.js · Onada R32.5 / R32.10 (P0-112 / D-v127-BANDA + T3-UI-03) · Els textos de
 * BandaBetaMicroApp en les 5 llengües oficials (ca, es, en, eu, gl) i en les dues variants
 * declaratives del manifest (`avisBeta: 'fiscal' | 'general'`, Llei 7: zero if per slug).
 * Viuen fora del .jsx perquè la porta del catàleg (tooling/gates/tractor-cataleg.mjs, C1) compta
 * com a component tota constant en majúscules d'un .jsx de PedraSeca; ací només hi ha dades i una funció pura.
 */
import { delVal, getVal, setVal } from '../../../config/storage.js';

export const TIPUS_AVIS_BETA = Object.freeze(['general', 'fiscal']);

const CLAU_BANDA_BETA_PLEGADA = 'banda_beta_plegada_v1';

/* v1.2.17 · Gauntlet R1 (L3-10c) · La fiscal (clàusula Verifactu/AEAT) no es plega: sempre sencera,
   ni es llig ni es desa cap plec (decisió conservadora pendent del Mestre). La general sí, i l'aparell se'n recorda. */
export const bandaBetaPlegable = (avisBeta = 'general') => avisBeta !== 'fiscal';

export function bandaBetaPlegada(avisBeta = 'general') {
  if (!bandaBetaPlegable(avisBeta)) return false;
  return getVal(`${CLAU_BANDA_BETA_PLEGADA}_general`, false) === true;
}

export function desaBandaBetaPlegada(avisBeta = 'general', plegada = false) {
  if (!bandaBetaPlegable(avisBeta)) return false;
  const clau = `${CLAU_BANDA_BETA_PLEGADA}_general`;
  return plegada ? setVal(clau, true) : delVal(clau);
}

export const TEXTOS_BANDA_BETA_GENERAL = Object.freeze({
  ca: Object.freeze({
    regio: 'Avís de fase beta',
    text: '🧪 Fase Beta (Proves) — Funcionalitat en proves d’autoorganització personal; no utilitzar per a producció crítica.',
    etiquetaCurta: 'Fase Beta (Proves)',
    plega: 'Plega l’avís de fase beta',
  }),
  es: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Pruebas) — Funcionalidad en pruebas de autoorganización personal; no utilizar para producción crítica.',
    etiquetaCurta: 'Fase Beta (Pruebas)',
    plega: 'Plegar el aviso de fase beta',
  }),
  en: Object.freeze({
    regio: 'Beta phase notice',
    text: '🧪 Beta Phase (Testing) — Personal self-organisation feature in testing; do not use for critical production.',
    etiquetaCurta: 'Beta Phase (Testing)',
    plega: 'Collapse beta phase notice',
  }),
  eu: Object.freeze({
    regio: 'Beta faseko oharra',
    text: '🧪 Beta Fasea (Probak) — Norberaren antolaketarako probetako funtzionalitatea; ez erabili ekoizpen kritikorako.',
    etiquetaCurta: 'Beta Fasea (Probak)',
    plega: 'Tolestu beta faseko oharra',
  }),
  gl: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Probas) — Funcionalidade en probas de autoorganización persoal; non utilizar para produción crítica.',
    etiquetaCurta: 'Fase Beta (Probas)',
    plega: 'Pregar o aviso de fase beta',
  }),
});

/* v1.2.17 · Gauntlet R1 (L3-10c) · etiquetaCurta i plega de la fiscal queden reservats: ara no es plega. */
export const TEXTOS_BANDA_BETA_FISCAL = Object.freeze({
  ca: Object.freeze({
    regio: 'Avís de fase beta',
    text: '🧪 Fase Beta (Proves) — Eina d’autoorganització personal; no utilitzar per a producció crítica ni com a facturació oficial Verifactu davant l’AEAT.',
    etiquetaCurta: 'Fase Beta · No Verifactu',
    plega: 'Plega l’avís de fase beta',
  }),
  es: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Pruebas) — Herramienta de autoorganización personal; no utilizar para producción crítica ni como facturación oficial Verifactu ante la AEAT.',
    etiquetaCurta: 'Fase Beta · No Verifactu',
    plega: 'Plegar el aviso de fase beta',
  }),
  en: Object.freeze({
    regio: 'Beta phase notice',
    text: '🧪 Beta Phase (Testing) — Personal self-organisation tool; do not use for critical production or as official Verifactu invoicing for the AEAT.',
    etiquetaCurta: 'Beta Phase · Non-Verifactu',
    plega: 'Collapse beta phase notice',
  }),
  eu: Object.freeze({
    regio: 'Beta faseko oharra',
    text: '🧪 Beta Fasea (Probak) — Norberaren antolaketarako tresna; ez erabili ekoizpen kritikorako ezta AEATen aurreko Verifactu fakturazio ofizial gisa ere.',
    etiquetaCurta: 'Beta Fasea · Ez Verifactu',
    plega: 'Tolestu beta faseko oharra',
  }),
  gl: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Probas) — Ferramenta de autoorganización persoal; non utilizar para produción crítica nin como facturación oficial Verifactu ante a AEAT.',
    etiquetaCurta: 'Fase Beta · Non Verifactu',
    plega: 'Pregar o aviso de fase beta',
  }),
});

export const TEXTOS_BANDA_BETA = Object.freeze({
  general: TEXTOS_BANDA_BETA_GENERAL,
  fiscal: TEXTOS_BANDA_BETA_FISCAL,
  ...TEXTOS_BANDA_BETA_GENERAL,
});

export function textosBandaBeta(idioma, avisBeta = 'general') {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  const taula = avisBeta === 'fiscal' ? TEXTOS_BANDA_BETA_FISCAL : TEXTOS_BANDA_BETA_GENERAL;
  return Object.hasOwn(taula, codi) ? taula[codi] : taula.ca;
}
