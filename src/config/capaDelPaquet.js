/**
 * capaDelPaquet.js — Model B: el backend i l'abast de dades del paquet
 * ---------------------------------------------------------------------------
 * Decisions A1 i A3 del Mestre (261003). El backend (URL, clau pública, mode
 * de dades i identificador) i l'abast de dades (tenant) els tria i els segella
 * Sóc de Poble. L'SPA és cega al seu amfitrió: cap canal d'amfitrió (atributs
 * de l'element, JSON config o config-id, propietat JS config, el global, la
 * cua, configura({config}), configura({backend | backend_url | tenant_id}) ni
 * les opcions d'injectaSessio(), per l'API, la cua o el pont d'iframe) no els
 * pot fixar ni trepitjar. El que hi arriba es descarta amb un avís a la
 * consola, una sola vegada per canal i clau.
 *
 * VIA INTERNA. Les entrades pròpies de Sóc de Poble (main.jsx al lloc propi,
 * embed.jsx al paquet autònom) declaren la capa amb fixaCapaDelPaquet() abans
 * de muntar. És una funció de mòdul: no penja de window.SocDePoble ni de cap
 * altre global, i cap amfitrió no l'abasta. Si cap entrada no l'ha fixada, val
 * la de compilació (les VITE_* que el build segella dins del paquet).
 *
 * L'adaptador de backend injectat (el port del Model A) també és només del
 * paquet: host.js:injectaBackendDelPaquet(), igual d'interna.
 *
 * Quines claus són del paquet ho diu el contracte (contracteAmfitrio.js,
 * `modelB`): el validador d'amfitrions i el nucli fan servir la mateixa llista.
 *
 * Correcció de l'A1 (261003): els serveis propis de Sóc de Poble (el relé
 * d'OAuth, el bot, l'emissor de Sollutia i la clau morta `version`, és a dir,
 * `clausDeConfig.propiesDeSdP` del contracte) tampoc no els pot declarar cap
 * amfitrió. Abans entraven per qualsevol canal, i un `oauth-relay-url` d'un
 * origen permés desviava l'entrada amb Google. Es descarten igual, amb el
 * mateix avís. Cap entrada pròpia no els declara: valen els de dins del paquet.
 * Des de P1 (261003) l'entrada amb Google ja no té relé: torna a la pàgina de
 * l'amfitrió (data/oauthRelay.js, urlDeTornada), i `oauthRelayUrl` és una clau
 * reservada que no llig ningú.
 */

import { CONTRACTE_AMFITRIO_V1 } from './contracteAmfitrio.js';

/** Les claus que pot portar la capa del paquet: el backend, el tenant i
 *  (CU, Onada 3) l'adreça d'instal·lació de l'extensió del Snippet, que
 *  llig la fitxa de Control (sections/control/destiSnippet.js). Si un
 *  amfitrió la poguera posar, podria portar la gent a instal·lar una
 *  extensió que no és nostra: per això és del paquet i del contracte
 *  (`clausDeConfig.propiesDeSdP`), i cap canal de l'amfitrió no hi arriba. */
export const CLAUS_DEL_PAQUET = Object.freeze(['supabaseUrl', 'supabaseAnonKey', 'dataMode', 'tenantId', 'backendId', 'snippetChromeUrl']);

/* Les que cap canal de l'amfitrió no pot portar: el backend i el tenant, amb
   els seus àlies (backendUrl, backend_url, anonKey, tenant_id) i l'adaptador,
   i els serveis propis de Sóc de Poble (oauthRelayUrl, botApiUrl,
   sollutiaIssuer, version, snippetChromeUrl). Totes ixen del contracte. */
const PROPIES_DEL_PAQUET = Object.freeze(new Set([
  ...CONTRACTE_AMFITRIO_V1.modelB.clausDeBackend,
  ...CONTRACTE_AMFITRIO_V1.modelB.clausDeTenant,
  ...CONTRACTE_AMFITRIO_V1.clausDeConfig.propiesDeSdP
]));

/* ─────────────────────────── La capa del paquet ─────────────────────────── */

/** Només el text no buit, sense blancs als extrems: una variable buida no tapa cap capa. */
function nomesTextNoBuit(valors) {
  const net = {};
  for (const [clau, valor] of Object.entries(valors)) {
    if (typeof valor === 'string' && valor.trim()) net[clau] = valor.trim();
  }
  return Object.freeze(net);
}

/* La de compilació: les VITE_* del build (o les de `npm run dev`). Es congela
   una vegada, en avaluar el paquet. */
export const CAPA_DE_COMPILACIO = nomesTextNoBuit({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  dataMode: import.meta.env.VITE_DATA_MODE,
  tenantId: import.meta.env.VITE_TENANT_ID,
  snippetChromeUrl: import.meta.env.VITE_SNIPPET_CHROME_URL
});

let capaFixada = null;

const mateixaCapa = (a, b) => Object.keys(a).length === Object.keys(b).length
  && Object.keys(a).every((clau) => Object.hasOwn(b, clau) && a[clau] === b[clau]);

/**
 * Via interna: una entrada pròpia de Sóc de Poble declara el backend i el
 * tenant del paquet abans de muntar. Només claus de CLAUS_DEL_PAQUET, i només
 * el text no buit. És immutable: tornar-la a fixar amb els mateixos valors
 * torna la mateixa capa; amb uns altres, llança.
 * @param {object} valors
 * @returns {Readonly<object>} la capa congelada
 */
export function fixaCapaDelPaquet(valors = {}) {
  if (!valors || typeof valors !== 'object' || Array.isArray(valors)) {
    throw new TypeError('[capaDelPaquet] La capa del paquet és un objecte de valors.');
  }
  const alienes = Object.keys(valors).filter((clau) => !CLAUS_DEL_PAQUET.includes(clau));
  if (alienes.length) throw new TypeError(`[capaDelPaquet] Claus fora de la capa del paquet: ${alienes.join(', ')}.`);
  const capa = nomesTextNoBuit(valors);
  if (capaFixada) {
    if (mateixaCapa(capaFixada, capa)) return capaFixada;
    throw new Error('[capaDelPaquet] La capa del paquet ja està fixada i és immutable.');
  }
  capaFixada = capa;
  return capaFixada;
}

/**
 * La capa del paquet que mana: la que ha fixat l'entrada o, si no n'hi ha
 * cap, la de compilació. Un tenant que no és UUID es descarta amb un avís
 * (senseTenantInvalid): l'element no s'ha de quedar en blanc per això.
 * @returns {object}
 */
export function capaDelPaquet() {
  return senseTenantInvalid(capaFixada ?? CAPA_DE_COMPILACIO, 'paquet');
}

/* ─────────────────────── Tenant invàlid (P0-b, 261002) ─────────────────────── */

/* La mateixa forma que exigix backendConfig.js:normalizeBackendConfig. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAUS_DE_TENANT = Object.freeze(['tenantId', 'tenant_id']);

/**
 * Lleva d'una capa el tenant que normalizeBackendConfig faria llançar (no és
 * text UUID). Un text buit o de blancs no és cap declaració i se'n va en
 * silenci; la resta, amb un avís. La capa no es muta: si cal, se'n fa còpia.
 * null i undefined són «sense tenant» i es conserven. Des de 261003 només la
 * capa del paquet pot portar tenant: les de l'amfitrió ja no n'arriben a dur.
 */
export function senseTenantInvalid(capa, nom) {
  if (!capa || typeof capa !== 'object') return {};
  let neta = capa;
  for (const clau of CLAUS_DE_TENANT) {
    if (!Object.hasOwn(capa, clau)) continue;
    const valor = capa[clau];
    if (valor === null || valor === undefined || (typeof valor === 'string' && UUID.test(valor))) continue;
    if (neta === capa) neta = { ...capa };
    delete neta[clau];
    if (typeof valor !== 'string' || valor.trim()) {
      console.warn(`[soc-de-poble] La capa «${nom}» porta un tenant que no és UUID: es descarta i mana el de les capes de davall.`);
    }
  }
  return neta;
}

/* ─────────────────── Les capes de l'amfitrió, sense el paquet ─────────────────── */

const esBuit = (valor) => valor === undefined || valor === null || (typeof valor === 'string' && !valor.trim());

/**
 * Separa d'una capa de l'amfitrió les claus que només posa el paquet. No muta
 * la capa: si en porta cap, en torna una còpia sense elles; si no, la mateixa.
 * Un valor buit (undefined, null, text buit o de blancs) no és cap declaració:
 * se'n va igual, però no compta com a descartat ni avisa.
 * @param {unknown} capa
 * @param {string} [prefix] davant del nom de cada clau descartada (p. ex. 'config.')
 * @returns {{ neta: object, descartades: string[] }}
 */
export function separaClausDelPaquet(capa, prefix = '') {
  if (!capa || typeof capa !== 'object' || Array.isArray(capa)) return { neta: {}, descartades: [] };
  let neta = capa;
  const descartades = [];
  for (const clau of Object.keys(capa)) {
    if (!PROPIES_DEL_PAQUET.has(clau)) continue;
    if (neta === capa) neta = { ...capa };
    if (!esBuit(capa[clau])) descartades.push(`${prefix}${clau}`);
    delete neta[clau];
  }
  return { neta, descartades };
}

/* Un avís per canal i clau en tota la pàgina: la configuració de l'element es
   torna a calcular a cada canvi d'atribut, i el mateix descart no es repetix. */
const avisades = new Set();

/**
 * Avisa a la consola de les claus del paquet que un canal de l'amfitrió ha
 * volgut declarar, només la primera vegada que el canal en porta cadascuna.
 * @param {string} canal 'atributs', 'config', 'propietat', 'global', 'configura' o 'sessio'
 * @param {string[]} descartades
 * @returns {string[]} les que s'han avisat ara (buit si ja s'havien avisat)
 */
export function avisaClausDescartades(canal, descartades) {
  const noves = descartades.filter((clau) => !avisades.has(`${canal}:${clau}`));
  if (!noves.length) return noves;
  for (const clau of noves) avisades.add(`${canal}:${clau}`);
  console.warn(`[soc-de-poble] Model B (${CONTRACTE_AMFITRIO_V1.id}): el canal «${canal}» porta ${noves.join(', ')}. `
    + 'El backend, l’abast de dades i els serveis propis de Sóc de Poble només els segella el paquet: es descarten.');
  return noves;
}

/** Una capa de l'amfitrió sense les claus del paquet, amb l'avís si en portava cap. */
export function nomesDeLAmfitrio(capa, canal) {
  const { neta, descartades } = separaClausDelPaquet(capa);
  avisaClausDescartades(canal, descartades);
  return neta;
}

/** Només per a les proves: oblida els avisos que ja s'han donat. */
export function _reiniciaAvisos() {
  avisades.clear();
}
