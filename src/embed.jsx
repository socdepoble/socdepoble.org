/**
 * embed.jsx — Punt d'entrada del paquet autònom (vite.standalone.config.js).
 * És el que carrega qualsevol amfitrió amb el <script src> clàssic de
 * soc-de-poble.standalone.js. Arrenca els elements <soc-de-poble> que
 * l'amfitrió ha escrit al seu marcatge i no en crea cap. socdepoble.org
 * (build de desenvolupament i de producció del lloc) entra per main.jsx.
 *
 * Decisió 5 del Mestre (261007) · paquet trossejat. Per defecte,
 * soc-de-poble.standalone.js és un carregador clàssic menut
 * (config/carregadorDelPaquet.js) que deixa un window.SocDePoble provisional i
 * fa import() d'este fitxer, compilat com a mòdul ESM amb els seus trossos amb
 * hash a dist/trossos/: les rutes lazy tornen a ser lazy a l'amfitrió. Amb
 * l'interruptor SDP_PAQUET=monolitic (i sempre en la variant del directori de
 * WordPress), el paquet és l'IIFE d'abans, sense carregador ni provisional.
 *
 * CANVI 260830: abans cridava `defineCustomElement()` directament, cosa que
 * segellava el backend a l'instant i no deixava cap finestra perquè un host
 * (Sollutia) injectara la seua implementació. Ara l'arrencada passa per
 * `host.js`, que separa configuració i segellat en dues fases.
 *
 * Ordre resultant:
 *   0' · (trossejat) el carregador clàssic deixa el provisional, que encua
 *        les crides dels <script> posteriors, i demana este mòdul; en
 *        avaluar-se, provisionalDelPaquet.js fixa la base de recursos
 *   0 · el paquet fixa la seua capa (backend i tenant de compilació)
 *   1 · es pren el provisional, s'exposa `window.SocDePoble` (es buida la
 *       SocDePobleCua) i el provisional hi reprodueix les seues crides
 *   2 · un <script> del host pot cridar `window.SocDePoble.configura({...})`
 *   3 · `arrencaAuto()` segella i defineix l'element al següent tick
 *
 * Si ningú configura res, el comportament és idèntic al d'abans: Supabase.
 *
 * CANVI 260929 (enxufe universal): l'element ja no es fa amo de la URL per
 * defecte. Fins al 261003 el #root del standalone ho declarava ací
 * (`routerType: 'browser'`); eixe muntatge ja no existix (vegeu W4-01).
 *
 * CANVI 261003 (Model B, decisions A1 i A3 del Mestre): el pas 2 ja no pot
 * injectar cap implementació de backend ni cap tenant. El paquet els segella
 * per la capa del paquet (config/capaDelPaquet.js), una via interna que es
 * fixa ací, abans d'exposar l'API i de drenar la cua. L'element els pren de
 * la capa del paquet, mai del seu JSON.
 *
 * CANVI 261003 (W4-01, auditoria de Codex): el paquet ja no munta res sobre
 * un `#root`. Abans, si `document.getElementById('root')` era buit, hi penjava
 * un <soc-de-poble> amb `routerType: 'browser'`. En un WordPress eixe #root
 * pot ser d'un altre plugin o del tema: el paquet hi creava una segona
 * instància que no era seua i, si muntava primer, es feia ama de la URL de
 * l'amfitrió. Que un #root estiga buit no diu de qui és. Ara només arrenquen
 * els elements explícits (el shortcode, el bloc o qualsevol amfitrió amb el
 * marcatge universal sdp.markup.v1); sense cap element, cap instància, i
 * cada element navega segons el que declara (memòria si no diu res).
 * Cap consumidor del repositori depenia de l'autoarrencada (revisats el
 * connector de WordPress, els bancs de tests/manual i index.html, que entra
 * per main.jsx). Si mai en cal un, l'ha de demanar amb una marca explícita i
 * exclusiva de Sóc de Poble, documentada al contracte, mai deduïda del DOM.
 * Proves: src/embed.arrel.test.jsx i, amb el host.js de veritat (arrencada,
 * cicle de vida i cap service worker), src/embed.arrencada.test.jsx.
 */

/* Decisió 5 del Mestre (261007) · PRIMER import, abans de host.js: en
   avaluar-se fixa la base de recursos amb la del carregador, abans que
   s'avaluen els mòduls que resolen imatges en importar-se. Cap ordenador
   d'imports l'ha de moure (src/embed.carregador.test.jsx ho vigila). */
import { comprovaUrlDelModul, prenProvisional } from './config/provisionalDelPaquet.js';
import { arrencaAuto, exposaGlobal } from './host.js';
import { fixaCapaDelPaquet } from './config/capaDelPaquet.js';

/* El registre de customElements conserva la classe anterior a un HMR.
   Mesclar eixa instància amb providers nous trenca la identitat dels
   contextos React. El banc encastat recarrega complet; la SPA manté HMR. */
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => window.location.reload());
}

/* Model B: el backend i el tenant del paquet, abans que cap amfitrió parle
   (la cua es drena dins d'exposaGlobal). Les VITE_* que segella el build. */
fixaCapaDelPaquet({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  dataMode: import.meta.env.VITE_DATA_MODE,
  tenantId: import.meta.env.VITE_TENANT_ID
});

/* L'amfitrió parla amb un global: el carrega amb un script pla, siga l'IIFE
   monolític o el carregador del paquet trossejat. Relleu 261007 (decisió 5) ·
   amb el carregador, primer es pren el seu provisional (si no, exposaGlobal
   hi veuria una propietat i no definiria l'API real), es definix l'API real i
   el provisional hi reprodueix, en ordre, les crides que haja encuat. Sense
   provisional (monolític) no es pren ni s'adopta res.
   Relleu 261007 · ordre entre canals. exposaGlobal buida SocDePobleCua
   (processarCua) ABANS que adopta reproduïsca les crides al provisional. Les
   ordres que l'amfitrió deixa a SocDePobleCua abans del paquet són anteriors
   a tota crida al provisional, i l'ordre es conserva. Un push a SocDePobleCua
   DESPRÉS del carregador i abans que arribe este mòdul, en canvi, s'executa
   abans que les crides al provisional que el precedien (amb l'IIFE, push ja
   executava a l'instant): `configura` pel provisional i després
   `SocDePobleCua.push(['sessio', …])` valida la sessió sense emissor i la
   rebutja (fail-closed). SocDePobleCua és el canal d'abans del paquet; després,
   l'API window.SocDePoble. Ho fixa src/embed.carregador.test.jsx. Conservar
   l'ordre cronològic demanaria que el carregador encuara també eixos push, i
   el carregador no llig SocDePobleCua: és pregunta del Mestre.
   Una redirecció de dist/trossos/ es delata a la consola (comprovaUrlDelModul). */
const control = prenProvisional(window);
comprovaUrlDelModul(control, import.meta.url);
const api = exposaGlobal();
if (control && api) control.adopta(api);

/* Programa el segellat per al següent tick: un <script> col·locat després del
   bundle encara arriba a temps de cridar configura(). En segellar es definix
   <soc-de-poble> i cada element explícit del document munta la seua
   instància. S'espera el DOM perquè arrencaAuto() veja tots els elements
   (també un `arrencada="manual"`) quan el bundle va al <head>. */
const init = () => {
  arrencaAuto();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
