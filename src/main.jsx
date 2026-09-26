import styles from './css/index.css?inline';
import React from 'react';

const styleNode = document.createElement('style');
styleNode.textContent = styles;
document.head.appendChild(styleNode);
import { createRoot } from 'react-dom/client';
import PedraSecaEmbed from './PedraSecaEmbed.jsx';
import { configura, arrenca, exposaGlobal } from './host.js';

const init = () => {
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {
    
    const config = {
      pluginUrl: '/',
      manageDocumentHead: true,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      dataMode: import.meta.env.VITE_DATA_MODE || undefined,
      tenantId: import.meta.env.VITE_TENANT_ID || null,
      routerType: 'browser'
    };

    // Configuració de l'amfitrió síncrona abans d'arrencar React
    configura({
      config,
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
    arrenca();

    const root = createRoot(arrel);


    root.render(<PedraSecaEmbed config={config} isFirstInstance={true} targetNode={arrel} />);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
