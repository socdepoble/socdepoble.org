/**
 * main.jsx — Punt d'entrada del build de desenvolupament i del standalone.
 *
 * CANVI 260830: abans cridava `defineCustomElement()` directament, cosa que
 * segellava el backend a l'instant i no deixava cap finestra perquè un host
 * (Sollutia) injectara la seua implementació. Ara l'arrencada passa per
 * `host.js`, que separa configuració i segellat en dues fases.
 *
 * Ordre resultant:
 *   1 · es carrega el bundle i s'exposa `window.SocDePoble`
 *   2 · un <script> del host pot cridar `window.SocDePoble.configura({...})`
 *   3 · `arrencaAuto()` segella i defineix l'element al següent tick
 *
 * Si ningú configura res, el comportament és idèntic al d'abans: Supabase.
 */

import { arrencaAuto, exposaGlobal } from './host.js';

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
    element.setAttribute('fonts-href', '/fonts/noto-sans.css');
    
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const isManual = searchParams ? searchParams.get('arrencada') === 'manual' : false;
    
    if (isManual) {
      element.setAttribute('arrencada', 'manual');
    }

    element.setAttribute('config', JSON.stringify({
      pluginUrl: '/',
      manageDocumentHead: false,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      dataMode: import.meta.env.VITE_DATA_MODE || undefined,
      tenantId: import.meta.env.VITE_TENANT_ID || null,
    }));
    arrel.appendChild(element);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
