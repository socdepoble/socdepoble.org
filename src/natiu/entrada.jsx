/**
 * natiu/entrada.jsx — Entrada pròpia de l'app nativa (Fases 1 i 2 de
 * l'empaquetat mòbil, 261003). La munta vite.natiu.config.js en lloc de
 * main.jsx. Disseny: _wiki_de_poble/04_escriptori/02_investigacio_ia/
 * 261003_1330_empaquetat_mobil_claude/ARQUITECTURA.txt, §1.2 i §5.
 *
 * L'app nativa no és cap amfitrió: és Sóc de Poble mateix, com socdepoble.org.
 * Per això entra com main.jsx i fixa la capa del paquet per la via interna.
 *
 * VERSIÓ MÍNIMA, d'abans de la lease de Capacitor: no importa cap paquet de
 * Capacitor. Fa els passos 2, 3 i 4b del §1.2 amb el tenant del build
 * (FASES_1_I_2.txt §2.1c, dia 1). Arribaran després de la lease, i en este
 * ordre: el pas 0 (adaptadors natius), l'1 (tria del poble i sessió duradora),
 * el 4a (selector de poble) i el 5 (escoltes natives).
 *
 * Diferències amb main.jsx, totes del §1.2:
 *   · el mode de dades és sempre 'remote';
 *   · no s'exposa window.SocDePoble: dins de l'app no hi ha cap amfitrió;
 *   · no es registra cap worker (la CSP de l'app porta worker-src 'none').
 */

import styles from '../css/index.css?inline';
import { createRoot } from 'react-dom/client';
import PedraSecaEmbed from '../PedraSecaEmbed.jsx';
import { configura, arrenca } from '../host.js';
import { capaDelPaquet, fixaCapaDelPaquet } from '../config/capaDelPaquet.js';

const styleNode = document.createElement('style');
styleNode.textContent = styles;
document.head.appendChild(styleNode);

/* El que és del lloc, com a main.jsx: l'app és l'ama de la URL i de la capçalera. */
const DEL_LLOC = Object.freeze({
  pluginUrl: '/',
  manageDocumentHead: true,
  routerType: 'browser'
});

const init = () => {
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {

    /* Pas 2 del §1.2: la capa, abans de res més. El backend segellat al build
       (errorsEntornNatiu el vol https i públic) i el tenant del build, fins que
       hi haja selector de poble. Sense VITE_TENANT_ID, la capa va sense tenant. */
    fixaCapaDelPaquet({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      dataMode: 'remote',
      tenantId: import.meta.env.VITE_TENANT_ID
    });

    // Pas 3: exactament com main.jsx.
    configura({
      config: DEL_LLOC,
      auth: {
        issuer: import.meta.env.VITE_APP_ISSUER || 'https://auth.socdepoble.org',
        audiences: (import.meta.env.VITE_APP_AUDIENCES || 'authenticated').split(','),
        persistencia: 'local'
      }
    });

    arrenca();

    // Pas 4b: la capa del paquet per davall de la del lloc, com main.jsx.
    createRoot(arrel).render(<PedraSecaEmbed config={{ ...capaDelPaquet(), ...DEL_LLOC }} isFirstInstance={true} targetNode={arrel} />);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
