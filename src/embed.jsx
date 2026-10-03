/**
 * embed.jsx — Punt d'entrada del paquet autònom (vite.standalone.config.js,
 * IIFE: soc-de-poble.standalone.js). És el que carrega qualsevol amfitrió i el
 * que munta el standalone quan troba un #root buit. socdepoble.org (build de
 * desenvolupament i de producció del lloc) entra per main.jsx, no per ací.
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
 * defecte. El #root del standalone ho declara ací (`routerType: 'browser'`),
 * com ho feia implícitament fins ara, i les fonts es demanen al costat del
 * paquet, no a l'arrel del domini on s'haja incrustat.
 *
 * CANVI 261003 (Model B, decisions A1 i A3 del Mestre): el pas 2 ja no pot
 * injectar cap implementació de backend ni cap tenant. El paquet els segella
 * per la capa del paquet (config/capaDelPaquet.js), una via interna que es
 * fixa ací, abans d'exposar l'API i de drenar la cua. El #root tampoc no els
 * passa pel JSON de l'element: l'element els pren de la capa del paquet.
 */

import { arrencaAuto, exposaGlobal } from './host.js';
import { fixaCapaDelPaquet } from './config/capaDelPaquet.js';

/* El registre de customElements conserva la classe anterior a un HMR.
   Mesclar eixa instància amb providers nous trenca la identitat dels
   contextos React. El banc encastat recarrega complet; la SPA manté HMR. */
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => window.location.reload());
}

/* On viu el paquet. `document.currentScript` només val mentre s'avalua de
   manera síncrona un <script> clàssic: es captura ací, al nivell superior, o
   es perd. En un mòdul ES (desenvolupament) val null. */
const SRC_DEL_PAQUET = (() => {
  if (typeof document === 'undefined') return '';
  const src = document.currentScript?.src;
  return typeof src === 'string' ? src : '';
})();

/* Les fonts viatgen dins del paquet (dist/fonts/). Sense saber on viu el
   paquet, la ruta de sempre. */
function fontsDelPaquet() {
  if (!SRC_DEL_PAQUET) return '/fonts/noto-sans.css';
  try {
    return new URL('fonts/noto-sans.css', SRC_DEL_PAQUET).href;
  } catch {
    return '/fonts/noto-sans.css';
  }
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

const init = () => {
  // Programa el segellat per al següent tick. Un <script> col·locat després
  // del bundle encara arriba a temps de cridar configura().
  arrencaAuto();

  // Instanciem l'element si trobem l'arrel de muntatge.
  // Açò permet l'ús standalone tant en DEV com en el build final.
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {
    const element = document.createElement('soc-de-poble');
    element.setAttribute('fonts-href', fontsDelPaquet());

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isManual = searchParams ? searchParams.get('arrencada') === 'manual' : false;

    if (isManual) {
      element.setAttribute('arrencada', 'manual');
    }

    // El backend i el tenant no hi van: l'element els pren de la capa del paquet.
    element.setAttribute('config', JSON.stringify({
      pluginUrl: '/',
      // El #root del standalone és l'amo de la URL: ho declara, no s'endevina.
      routerType: 'browser',
      manageDocumentHead: false
    }));
    arrel.appendChild(element);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
