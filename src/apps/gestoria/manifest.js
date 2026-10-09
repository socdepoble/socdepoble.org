/**
 * Gestoria de Poble · manifest sdp.app.v1.
 *
 * Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
 * Gestoria i Wiki»): la Gestoria ix de la Wiki i viu en la seua app pròpia,
 * /app/gestoria. És el lloc que ja deixava escrit la decisió D3: «/app/gestoria,
 * més avant; /gestoria, mai».
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'gestoria' (la ruta és /app/gestoria, no es declara);
 *   · `carrega` darrere del literal de compilació EXACTE de baix: sense
 *     VITE_SDP_APP_GESTORIA=1 al build de producció, Vite trau AppGestoria del
 *     paquet; en desenvolupament sempre hi és. I encara que algú compilara
 *     l'app en producció, AppGestoria només porta el codi de la Gestoria dins
 *     de DEV (gestoria/privacitat.test.js ho compila);
 *   · entorn 'desenvolupament' i actiuPerDefecte false: fora del servidor de
 *     desenvolupament la plataforma no l'obri mai (interruptors.js, motiu
 *     'entorn-desenvolupament');
 *   · el component és l'export per defecte d'AppGestoria.jsx.
 * La barra de l'app és l'única navegació: els nou mòduls de la closca i
 * Aprendre. El manifest només declara textos i icones, cap dada financera.
 * Dades financeres que no ixen d'este ordinador: cap capacitat del backend.
 */
export default {
  schema: 'sdp.app.v1',
  id: 'gestoria',
  titol: { ca: 'Gestoria de Poble', es: 'Gestoría del Pueblo' },
  icona: 'Calculator',
  entrades: [
    { slug: 'tauler', titol: { ca: 'Tauler d’Inici', es: 'Tablero de Inicio' }, icona: 'LayoutDashboard' },
    { slug: 'facturacio', titol: { ca: 'Facturació', es: 'Facturación' }, icona: 'FileText' },
    { slug: 'contactes', titol: { ca: 'Contactes', es: 'Contactos' }, icona: 'Contact' },
    { slug: 'burocracia', titol: { ca: 'Burocràcia', es: 'Burocracia' }, icona: 'Landmark' },
    { slug: 'bancs', titol: { ca: 'Bancs', es: 'Bancos' }, icona: 'Building2' },
    { slug: 'impostos', titol: { ca: 'Impostos', es: 'Impuestos' }, icona: 'Percent' },
    { slug: 'full', titol: { ca: 'Full trimestral', es: 'Hoja trimestral' }, icona: 'FileSpreadsheet' },
    /* Onada 6, ordre del Mestre (261009): l'històric del banc, la despesa en IA, les simulacions i el llibre per a la gestora. */
    { slug: 'historic', titol: { ca: 'Històric i IA', es: 'Histórico e IA' }, icona: 'Activity' },
    { slug: 'informes', titol: { ca: 'Informes', es: 'Informes' }, icona: 'ChartColumn' },
    { slug: 'escaner', titol: { ca: 'Escàner Local', es: 'Escáner Local' }, icona: 'ScanLine' },
    { slug: 'aprendre', titol: { ca: 'Aprendre', es: 'Aprender' }, icona: 'NotebookPen' }
  ],
  entradaPerDefecte: 'tauler',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: false,
  entorn: 'desenvolupament',
  dadesPersonals: 'financeres',
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_GESTORIA === '1' ? () => import('./AppGestoria.jsx') : null
};
