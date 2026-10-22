import styles from './css/index.css?inline';

const styleNode = document.createElement('style');
styleNode.textContent = styles;
document.head.appendChild(styleNode);
import { createRoot } from 'react-dom/client';
import PedraSecaEmbed from './PedraSecaEmbed.jsx';
import { configura, arrenca, exposaGlobal } from './host.js';
import { capaDelPaquet, fixaCapaDelPaquet } from './config/capaDelPaquet.js';
import { registraServiceWorker } from './pwa/registre.js';
import { capturaInstalacio } from './pwa/instalacio.js';
import { pintaAmbDiccionari } from './config/i18n.js';
import { instalaFallbackDeBessones } from './config/fallbackBessones.js';

const init = () => {
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {

    /* Pla 261022_1645 (tasca 3) · El salvavides de les bessones, abans del
       primer pintat: una .webp que no arriba es torna a demanar en l'extensió
       del seu original (fallbackBessones.js). L'SPA pròpia es pinta dins de
       #root, al DOM de la pàgina (cap shadow root), i un escoltador en
       captura sobre l'arrel veu l'error de qualsevol <img> de l'app, sense
       tocar el cos de la pàgina (LLEI_06, encapsulament). */
    instalaFallbackDeBessones(arrel);

    /* Model B (decisions A1 i A3 del Mestre, 261003): el backend i l'abast de
       dades del lloc propi entren per la capa del paquet, una via interna que
       cap amfitrió no abasta, amb les mateixes VITE_* de sempre. configura()
       només porta el que és del lloc (router i capçalera) i la sessió. */
    fixaCapaDelPaquet({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      dataMode: import.meta.env.VITE_DATA_MODE,
      tenantId: import.meta.env.VITE_TENANT_ID
    });
    const delLloc = {
      pluginUrl: '/',
      manageDocumentHead: true,
      routerType: 'browser'
    };

    // Configuració de l'amfitrió síncrona abans d'arrencar React
    configura({
      config: delLloc,
      auth: {
        issuer: import.meta.env.VITE_APP_ISSUER || 'https://auth.socdepoble.org',
        audiences: (import.meta.env.VITE_APP_AUDIENCES || 'authenticated').split(','),
        // D1 (260926): el refresh token sobreviu a la pestanya; el JWT i l'usuari, no.
        persistencia: 'local'
      }
    });
    
    // C15: Exposar l'API de contractes al window (SocDePoble)
    exposaGlobal();

    // Segellar l'adaptador abans de pintar
    /* Onada 12 (261011; ordres 261011_0130, punt 7) · Una arrencada fallida
       (el tros de l'adaptador que no baixa) no queda com un rebuig sense amo:
       les vistes ja el reben per quanLlest(), que hi torna en el reintent. */
    arrenca().catch((e) => console.error('[main] Arrencada fallida:', e));

    const root = createRoot(arrel);

    // La capa del paquet per davall, com fa l'element amb composaCapes().
    /* Fase D (261020, tasca 4.1) · L1 · Amb una llengua d'arrencada que no és
       el valencià (la tria desada), el primer pintat espera el seu diccionari,
       com a molt ESPERA_DEL_PRIMER_PINTAT ms: cap fotograma en valencià. */
    pintaAmbDiccionari(() => root.render(<PedraSecaEmbed config={{ ...capaDelPaquet(), ...delLloc }} isFirstInstance={true} targetNode={arrel} />));
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* Fase 0 de l'empaquetat mòbil (261003): la PWA és de l'entrada pròpia i de
   ningú més. Només en producció, en context segur, fora d'iframe i fora de
   l'app nativa; el paquet autònom (embed.jsx) no la registra mai. */
registraServiceWorker();

/* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · L'oferta
   d'instal·lar a l'ordinador (beforeinstallprompt) es captura ací, en avaluar
   el mòdul: el navegador la dispara una sola volta per càrrega i un component
   muntat tard la perdria. Només l'entrada pròpia; ni embed.jsx ni
   natiu/entrada.jsx (src/pwa/instalacio.js). */
capturaInstalacio();
