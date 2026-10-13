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
 * La barra de l'app és l'única navegació (ordre de MarIA 261012_2145, acatada
 * pel Mestre: fora el rail intern de la closca): els mòduls de la closca i
 * els del pont (la Facturació, l'Històric, Aprendre i, des del 13-10-2026,
 * Identitat i Finestreta), en grups que la
 * BarraApp global pinta amb el seu component, el seu plegat i el seu calaix.
 * Les entrades s'escriuen en l'ordre en què es pinten (el Tauler, sense grup,
 * i després cada grup sencer), i així l'ordre del manifest és el de la barra.
 * El manifest només declara textos i icones, cap dada financera.
 * Dades financeres que no ixen d'este ordinador: cap capacitat del backend.
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B: «la boina taronja
 * de TOTES les pàgines de la Gestoria porta el titular real autenticat») ·
 * permisos.titular 'sessio': el pont de sessió (useSessioApp().titular) dona
 * a la Gestoria el nom, l'avatar i el poble de la persona que ha entrat, i
 * res més (cap id, correu, rol ni testimoni). Sense sessió, null: la boina
 * diu «Titular sense configurar», amb l'entrada al compte.
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H) · l'entrada
 * «Identitat i Finestreta», al grup Operacions: la fitxa d'identitat privada,
 * darrere del cofre, i els tràmits preparats per a copiar. La icona és
 * ClipboardList: la llista tancada d'icones (iconesApp.js) no té cap carnet,
 * i Contact, la més pròxima, ja és la de Contactes, al mateix grup.
 */
export default {
  schema: 'sdp.app.v1',
  id: 'gestoria',
  titol: { ca: 'Gestoria de Poble', es: 'Gestoría del Pueblo' },
  icona: 'Calculator',
  grups: [
    { id: 'operacions', titol: { ca: 'Operacions', es: 'Operaciones' } },
    { id: 'diners', titol: { ca: 'Diners i impostos', es: 'Dinero e impuestos' } },
    { id: 'arxiu', titol: { ca: 'Arxiu i eines', es: 'Archivo y herramientas' } }
  ],
  entrades: [
    { slug: 'tauler', titol: { ca: 'Tauler d’Inici', es: 'Tablero de Inicio' }, icona: 'LayoutDashboard' },
    { slug: 'facturacio', titol: { ca: 'Facturació', es: 'Facturación' }, icona: 'FileText', grup: 'operacions' },
    { slug: 'contactes', titol: { ca: 'Contactes', es: 'Contactos' }, icona: 'Contact', grup: 'operacions' },
    { slug: 'burocracia', titol: { ca: 'Burocràcia', es: 'Burocracia' }, icona: 'Landmark', grup: 'operacions' },
    /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la fitxa d'identitat i la Finestreta, pel pont. */
    { slug: 'identitat', titol: { ca: 'Identitat i Finestreta', es: 'Identidad y Ventanilla' }, icona: 'ClipboardList', grup: 'operacions' },
    { slug: 'bancs', titol: { ca: 'Bancs', es: 'Bancos' }, icona: 'Building2', grup: 'diners' },
    { slug: 'impostos', titol: { ca: 'Impostos', es: 'Impuestos' }, icona: 'Percent', grup: 'diners' },
    { slug: 'full', titol: { ca: 'Full trimestral', es: 'Hoja trimestral' }, icona: 'FileSpreadsheet', grup: 'diners' },
    /* Onada 6, ordre del Mestre (261009): l'històric del banc, la despesa en IA, les simulacions i el llibre per a la gestora. */
    { slug: 'historic', titol: { ca: 'Històric i IA', es: 'Histórico e IA' }, icona: 'Activity', grup: 'diners' },
    { slug: 'informes', titol: { ca: 'Informes', es: 'Informes' }, icona: 'ChartColumn', grup: 'arxiu' },
    { slug: 'escaner', titol: { ca: 'Escàner Local', es: 'Escáner Local' }, icona: 'ScanLine', grup: 'arxiu' },
    { slug: 'aprendre', titol: { ca: 'Aprendre', es: 'Aprender' }, icona: 'NotebookPen', grup: 'arxiu' }
  ],
  entradaPerDefecte: 'tauler',
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el titular de la
     sessió (vegeu la capçalera), declarat exactament quan este manifest pot
     carregar l'app interna: darrere del mateix literal de compilació que
     `carrega`. Compilada com a mòdul (ADR-2026-12, vite.modul.config.js, que
     llig eixe literal com a fals), la Gestoria no el declara: cap mòdul no rep
     cap dada de la persona (validaManifestApp, origen 'modul'). */
  permisos: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_GESTORIA === '1'
    ? { veure: 'public', titular: 'sessio' }
    : { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: false,
  entorn: 'desenvolupament',
  dadesPersonals: 'financeres',
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_GESTORIA === '1' ? () => import('./AppGestoria.jsx') : null
};
