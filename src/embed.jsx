/**
 * embed.jsx — Punt d'entrada del paquet autònom (vite.standalone.config.js,
 * IIFE: soc-de-poble.standalone.js). És el que carrega qualsevol amfitrió.
 * Arrenca els elements <soc-de-poble> que l'amfitrió ha escrit al seu
 * marcatge i no en crea cap. socdepoble.org (build de desenvolupament i de
 * producció del lloc) entra per main.jsx, no per ací.
 *
 * CANVI 260830: abans cridava `defineCustomElement()` directament, cosa que
 * segellava el backend a l'instant i no deixava cap finestra perquè un host
 * (Sollutia) injectara la seua implementació. Ara l'arrencada passa per
 * `host.js`, que separa configuració i segellat en dues fases.
 *
 * Ordre resultant:
 *   0 · el paquet fixa la seua capa (backend i tenant de compilació)
 *   1 · es carrega el bundle i s'exposa `window.SocDePoble`
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

// Si el build standalone no és ESM, un entorn host que el carregue
// amb un script pla necessita un global.
exposaGlobal();

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
