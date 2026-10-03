/**
 * Amfitrió Sollutia SIMULAT per a tests/conformitat-amfitrio.test.mjs.
 *
 * És un amfitrió de MARCATGE, no un backend (Model B): emet les tres peces de
 * sdp.markup.v1 i res més, tal com ho hauria de fer Sollutia segons la llista
 * tancada de l'informe d'enxufe (T2b, §4):
 *   1 · el global `window.SocDePobleConfig` amb `nomPoble` i `poble`, abans del paquet;
 *   2 · `<soc-de-poble plugin-url fonts-href [ruta-inicial]>` dins d'una caixa amb alçada;
 *   3 · el paquet com a `<script src>` clàssic.
 * El poble ja ve normalitzat (el nucli no translitera) i la ruta inicial, dins
 * del límit del contracte. No importa res del nucli: és un amfitrió de fora.
 * `propietat` és el canal 6 (host.js): un script en línia, després de
 * l'element, que li assigna `element.config = {…}` amb claus de l'amfitrió.
 *
 * `desviacions` (només per a la sonda de la bateria) fa que l'amfitrió emeta
 * el que el contracte prohibix, per a comprovar que la bateria ho veu.
 * Totes les dades són sintètiques; cap URL és real.
 */

const PATRO_POBLE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const LIMIT_RUTA = 200;
const DIST_PER_DEFECTE = 'https://cdn.sollutia.test/socdepoble/1.0.0/';

const escapaAtribut = (valor) => String(valor)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* JSON dins de <script>: cap valor pot tancar l'etiqueta ni trencar la línia. */
const jsonPerAScript = (valor) => JSON.stringify(valor)
  .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const esRutaDeLApp = (ruta) => typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//')
  && ruta.length <= LIMIT_RUTA && !/[\s\\#]/.test(ruta);

/**
 * @param {object} opcions
 * @param {string} [opcions.nomPoble]
 * @param {string} [opcions.poble]       id ja normalitzat; un altre no s'emet
 * @param {string} [opcions.rutaInicial] ruta de l'app; per damunt de 200 no s'emet
 * @param {string} [opcions.distUrl]     on Sollutia servix dist/ sencer
 * @param {object} [opcions.propietat]   el que assigna a element.config (canal 6)
 * @param {string[]} [opcions.desviacions] 'tenant' | 'backend' | 'servei' | 'modul' | 'cua' | 'propietat' (sonda)
 * @returns {string} HTML de les tres peces
 */
export function emetMarcatge({ nomPoble, poble, rutaInicial, distUrl = DIST_PER_DEFECTE, propietat, desviacions = [] } = {}) {
  const base = distUrl.endsWith('/') ? distUrl : `${distUrl}/`;

  const global = {};
  if (typeof nomPoble === 'string' && nomPoble.trim()) global.nomPoble = nomPoble.trim();
  if (typeof poble === 'string' && PATRO_POBLE.test(poble)) global.poble = poble;

  const atributs = [['plugin-url', base], ['fonts-href', `${base}fonts/noto-sans.css`]];
  if (esRutaDeLApp(rutaInicial)) atributs.push(['ruta-inicial', rutaInicial]);
  if (desviacions.includes('tenant')) atributs.push(['tenant-id', '55555555-5555-4555-8555-555555555555']);
  if (desviacions.includes('backend')) atributs.push(['supabase-url', 'https://backend.sollutia.test']);
  if (desviacions.includes('servei')) atributs.push(['oauth-relay-url', 'https://relay.sollutia.test/cb']);

  const linies = [];
  const declaracions = [];
  if (desviacions.includes('cua')) {
    declaracions.push(`window.SocDePobleCua = window.SocDePobleCua || []; window.SocDePobleCua.push(["configura", ${jsonPerAScript({ config: { tenantId: '55555555-5555-4555-8555-555555555555' } })}]);`);
  }
  if (Object.keys(global).length) declaracions.push(`window.SocDePobleConfig = Object.freeze(${jsonPerAScript(global)});`);
  if (declaracions.length) linies.push(`<script>${declaracions.join(' ')}</script>`);
  linies.push(`<div class="socdepoble-enxufe"><soc-de-poble ${atributs.map(([nom, valor]) => `${nom}="${escapaAtribut(valor)}"`).join(' ')}></soc-de-poble></div>`);
  const config = { ...(propietat && typeof propietat === 'object' ? propietat : {}) };
  if (desviacions.includes('propietat')) Object.assign(config, { tenantId: '55555555-5555-4555-8555-555555555555', supabaseUrl: 'https://backend.sollutia.test' });
  if (Object.keys(config).length) linies.push(`<script>document.querySelector("soc-de-poble").config = ${jsonPerAScript(config)};</script>`);
  linies.push(`<script${desviacions.includes('modul') ? ' type="module"' : ''} src="${escapaAtribut(`${base}soc-de-poble.standalone.js`)}"></script>`);
  return linies.join('\n');
}
