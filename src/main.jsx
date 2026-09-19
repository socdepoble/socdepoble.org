import './css/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import PedraSecaEmbed from './PedraSecaEmbed.jsx';
import { configura, arrenca, exposaGlobal } from './host.js';

const init = () => {
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {
    
    // Configuració de l'amfitrió síncrona abans d'arrencar React
    configura({
      auth: {
        issuer: import.meta.env.VITE_APP_ISSUER || 'https://auth.socdepoble.org',
        audiences: (import.meta.env.VITE_APP_AUDIENCES || 'authenticated').split(',')
      }
    });
    
    // C15: Exposar l'API de contractes al window (SocDePoble)
    exposaGlobal();

    // Segellar l'adaptador abans de pintar
    arrenca();

    const root = createRoot(arrel);
    const config = {
      pluginUrl: '/',
      manageDocumentHead: true,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      dataMode: import.meta.env.VITE_DATA_MODE || undefined,
      tenantId: import.meta.env.VITE_TENANT_ID || null,
      routerType: 'browser'
    };

    root.render(<PedraSecaEmbed config={config} isFirstInstance={true} />);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
