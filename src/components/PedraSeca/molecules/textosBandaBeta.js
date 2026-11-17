/**
 * textosBandaBeta.js · Onada R32.5 (P0-112 / IDEA-285 + T3-UI-03) · Els textos de BandaBetaMicroApp en
 * les 5 llengües oficials (ca, es, en, eu, gl). Viuen fora del .jsx perquè la porta del catàleg
 * (tooling/gates/tractor-cataleg.mjs, C1) compta com a component tota constant en majúscules d'un
 * .jsx de PedraSeca; ací només hi ha dades i una funció pura.
 */
export const TEXTOS_BANDA_BETA = Object.freeze({
  ca: Object.freeze({
    regio: 'Avís de fase beta',
    text: '🧪 Fase Beta (Proves) — Eina d’autoorganització personal; no utilitzar per a producció crítica ni com a facturació oficial Verifactu.',
  }),
  es: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Pruebas) — Herramienta de autoorganización personal; no utilizar para producción crítica ni como facturación oficial Verifactu.',
  }),
  en: Object.freeze({
    regio: 'Beta phase notice',
    text: '🧪 Beta Phase (Testing) — Personal self-organisation tool; do not use for critical production or as official Verifactu invoicing.',
  }),
  eu: Object.freeze({
    regio: 'Beta faseko oharra',
    text: '🧪 Beta Fasea (Probak) — Norberaren antolaketarako tresna; ez erabili ekoizpen kritikorako ezta Verifactu fakturazio ofizial gisa ere.',
  }),
  gl: Object.freeze({
    regio: 'Aviso de fase beta',
    text: '🧪 Fase Beta (Probas) — Ferramenta de autoorganización persoal; non utilizar para produción crítica nin como facturación oficial Verifactu.',
  }),
});

export function textosBandaBeta(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_BANDA_BETA, codi) ? TEXTOS_BANDA_BETA[codi] : TEXTOS_BANDA_BETA.ca;
}
