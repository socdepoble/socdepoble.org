/**
 * textosBandaBeta.js · Onada R32.5 / R32.10 (P0-112 / D-v127-BANDA + T3-UI-03) · Els textos de
 * BandaBetaMicroApp en les 5 llengües oficials (ca, es, en, eu, gl) i en les dues variants
 * declaratives del manifest (`avisBeta: 'fiscal' | 'general'`, Llei 7: zero if per slug).
 * Viuen fora del .jsx perquè la porta del catàleg (tooling/gates/tractor-cataleg.mjs, C1) compta
 * com a component tota constant en majúscules d'un .jsx de PedraSeca; ací només hi ha dades i una funció pura.
 */
export const TIPUS_AVIS_BETA = Object.freeze(['general', 'fiscal']);

export const TEXTOS_BANDA_BETA_GENERAL = Object.freeze({
  ca: Object.freeze({
    regio: 'Avís de fase beta',
    text: '🧪 Fase Beta (Proves) — Funcionalitat en proves d’autoorganització personal; no utilitzar per a producció crítica.',
  }),
  es: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Pruebas) — Funcionalidad en pruebas de autoorganización personal; no utilizar para producción crítica.',
  }),
  en: Object.freeze({
    regio: 'Beta phase notice',
    text: '🧪 Beta Phase (Testing) — Personal self-organisation feature in testing; do not use for critical production.',
  }),
  eu: Object.freeze({
    regio: 'Beta faseko oharra',
    text: '🧪 Beta Fasea (Probak) — Norberaren antolaketarako probetako funtzionalitatea; ez erabili ekoizpen kritikorako.',
  }),
  gl: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Probas) — Funcionalidade en probas de autoorganización persoal; non utilizar para produción crítica.',
  }),
});

export const TEXTOS_BANDA_BETA_FISCAL = Object.freeze({
  ca: Object.freeze({
    regio: 'Avís de fase beta',
    text: '🧪 Fase Beta (Proves) — Eina d’autoorganització personal; no utilitzar per a producció crítica ni com a facturació oficial Verifactu davant l’AEAT.',
  }),
  es: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Pruebas) — Herramienta de autoorganización personal; no utilizar para producción crítica ni como facturación oficial Verifactu ante la AEAT.',
  }),
  en: Object.freeze({
    regio: 'Beta phase notice',
    text: '🧪 Beta Phase (Testing) — Personal self-organisation tool; do not use for critical production or as official Verifactu invoicing for the AEAT.',
  }),
  eu: Object.freeze({
    regio: 'Beta faseko oharra',
    text: '🧪 Beta Fasea (Probak) — Norberaren antolaketarako tresna; ez erabili ekoizpen kritikorako ezta AEATen aurreko Verifactu fakturazio ofizial gisa ere.',
  }),
  gl: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Probas) — Ferramenta de autoorganización persoal; non utilizar para produción crítica nin como facturación oficial Verifactu ante a AEAT.',
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
