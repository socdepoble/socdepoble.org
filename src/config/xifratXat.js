/**
 * src/config/xifratXat.js — Configuració d'orígens de confiança i banderes del
 * xifratge d'extrem a extrem del xat (`sdp-xat-v1`, P1-12 / IDEA-19;
 * `_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`
 * §3, §8.1, §8.2 i §10).
 *
 * Aquesta configuració és una porta d'honestedat, no una frontera criptogràfica:
 *   · Apagada per defecte per flag (`E2EE_ACTIU_PER_DEFECTE = false`) fins a
 *     l'activació de les fases F2a/F2b/F2c.
 *   · Orígens de confiança per destinació: web (`https://socdepoble.org`),
 *     Android (`https://localhost`), iOS (`capacitor://localhost`), i
 *     desenvolupament local (`http://localhost:3340`) només quan `dev === true`.
 *   · Dins d'un marc incrustat (`enMarc === true`, ex. enxufe WordPress/Sollutia,
 *     CS-26 / D-10), l'E2EE està desactivat a la v1.
 *   · Cap accés a globals (`window`, `globalThis`): tot entra per arguments.
 */

export const IAIA_UUID = '11111111-1a1a-0000-0000-000000000000';

export const E2EE_ACTIU_PER_DEFECTE = false;

export const DATA_TOPALL_F2C = '2027-01-15T00:00:00.000Z';
export const DATA_TOPALL_F3 = '2027-03-01T00:00:00.000Z';

export const ORIGEN_CONFIANCA = Object.freeze({
  web: 'https://socdepoble.org',
  android: 'https://localhost',
  ios: 'capacitor://localhost',
  dev: 'http://localhost:3340'
});

const ORIGENS_PRODUCCIO = new Set([
  ORIGEN_CONFIANCA.web,
  ORIGEN_CONFIANCA.android,
  ORIGEN_CONFIANCA.ios
]);

/**
 * Comprova si un origen d'execució està autoritzat per operar amb claus E2EE.
 * Pura: no llig `window.location` ni `window.top`.
 */
export function esOrigenDeConfianca(origen, { dev = false, enMarc = false } = {}) {
  if (enMarc === true) return false;
  if (typeof origen !== 'string' || !origen) return false;
  const net = origen.trim().replace(/\/+$/, '');
  if (ORIGENS_PRODUCCIO.has(net)) return true;
  if (dev === true && net === ORIGEN_CONFIANCA.dev) return true;
  return false;
}
