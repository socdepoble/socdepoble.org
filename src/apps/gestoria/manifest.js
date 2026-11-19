/**
 * Gestoria de Poble · manifest sdp.app.v1.
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): la Gestoria ix de la Wiki i viu en la seua app pròpia,
 * /app/gestoria. És el lloc que ja deixava escrit la decisió D3: «/app/gestoria,
 * més avant; /gestoria, mai».
 *
 * Onada R32.10 · Camp declaratiu `avisBeta: 'fiscal'` i internacionalització
 * completa del manifest (títol, grups i les 12 entrades) en les 5 llengües
 * oficials (ca, es, en, eu, gl).
 */
export default {
  schema: 'sdp.app.v1',
  id: 'gestoria',
  titol: {
    ca: 'Gestoria de Poble',
    es: 'Gestoría del Pueblo',
    en: 'Village Bookkeeping',
    eu: 'Herriko Gestoria',
    gl: 'Xestoría de Pobo'
  },
  icona: 'Calculator',
  grups: [
    {
      id: 'operacions',
      titol: { ca: 'Operacions', es: 'Operaciones', en: 'Operations', eu: 'Eragiketak', gl: 'Operacións' }
    },
    {
      id: 'diners',
      titol: { ca: 'Diners i impostos', es: 'Dinero e impuestos', en: 'Money and taxes', eu: 'Dirua eta zergak', gl: 'Diñeiro e impostos' }
    },
    {
      id: 'arxiu',
      titol: { ca: 'Arxiu i eines', es: 'Archivo y herramientas', en: 'Archive and tools', eu: 'Artxiboa eta tresnak', gl: 'Arquivo e ferramentas' }
    }
  ],
  entrades: [
    {
      slug: 'tauler',
      titol: { ca: 'Tauler d’Inici', es: 'Tablero de Inicio', en: 'Home Dashboard', eu: 'Hasierako Mahaia', gl: 'Taboleiro de Inicio' },
      icona: 'LayoutDashboard'
    },
    {
      slug: 'facturacio',
      titol: { ca: 'Facturació', es: 'Facturación', en: 'Invoicing', eu: 'Fakturazioa', gl: 'Facturación' },
      icona: 'FileText',
      grup: 'operacions'
    },
    {
      slug: 'contactes',
      titol: { ca: 'Contactes', es: 'Contactos', en: 'Contacts', eu: 'Kontaktuak', gl: 'Contactos' },
      icona: 'Contact',
      grup: 'operacions'
    },
    {
      slug: 'burocracia',
      titol: { ca: 'Burocràcia', es: 'Burocracia', en: 'Paperwork', eu: 'Burokrazia', gl: 'Burocracia' },
      icona: 'Landmark',
      grup: 'operacions'
    },
    {
      slug: 'identitat',
      titol: { ca: 'Identitat i Finestreta', es: 'Identidad y Ventanilla', en: 'Identity and One-Stop Desk', eu: 'Nortasuna eta Leihatila', gl: 'Identidade e Xanela' },
      icona: 'ClipboardList',
      grup: 'operacions'
    },
    {
      slug: 'bancs',
      titol: { ca: 'Bancs', es: 'Bancos', en: 'Banking', eu: 'Bankuak', gl: 'Bancos' },
      icona: 'Building2',
      grup: 'diners'
    },
    {
      slug: 'impostos',
      titol: { ca: 'Impostos', es: 'Impuestos', en: 'Taxes', eu: 'Zergak', gl: 'Impostos' },
      icona: 'Percent',
      grup: 'diners'
    },
    {
      slug: 'full',
      titol: { ca: 'Full trimestral', es: 'Hoja trimestral', en: 'Quarterly sheet', eu: 'Hiruhileko orria', gl: 'Folla trimestral' },
      icona: 'FileSpreadsheet',
      grup: 'diners'
    },
    {
      slug: 'historic',
      titol: { ca: 'Històric i IA', es: 'Histórico e IA', en: 'History and AI', eu: 'Historikoa eta AA', gl: 'Histórico e IA' },
      icona: 'Activity',
      grup: 'diners'
    },
    {
      slug: 'informes',
      titol: { ca: 'Informes', es: 'Informes', en: 'Reports', eu: 'Txostenak', gl: 'Informes' },
      icona: 'ChartColumn',
      grup: 'arxiu'
    },
    {
      slug: 'escaner',
      titol: { ca: 'Escàner Local', es: 'Escáner Local', en: 'Local Scanner', eu: 'Tokiko Eskanerra', gl: 'Escáner Local' },
      icona: 'ScanLine',
      grup: 'arxiu'
    },
    {
      slug: 'aprendre',
      titol: { ca: 'Aprendre', es: 'Aprender', en: 'Learn', eu: 'Ikasi', gl: 'Aprender' },
      icona: 'NotebookPen',
      grup: 'arxiu'
    }
  ],
  entradaPerDefecte: 'facturacio',
  permisos: import.meta.env.VITE_SDP_APP_GESTORIA !== '0'
    ? { veure: 'public', titular: 'sessio' }
    : { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: 'financeres',
  avisBeta: 'fiscal',
  carrega: import.meta.env.VITE_SDP_APP_GESTORIA !== '0' ? () => import('./AppGestoria.jsx') : null
};
