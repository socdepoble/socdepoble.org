/**
 * El Bar · manifest sdp.app.v1 (lot BAR, T4: TPV d'hostaleria).
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'bar': la ruta és /app/bar i no es declara;
 *   · P0-113 (ordre del Mestre, 261111): tot el sistema és gratuït i lliure.
 *     El Bar és una eina gratuïta oberta en producció (entorn 'produccio',
 *     actiuPerDefecte true), en proves (Beta oberta), sense cap nivell de
 *     pagament ni dret;
 *   · `carrega` darrere del literal de compilació EXACTE de baix: el tros
 *     diferit d'AppBar entra al build per defecte, i amb VITE_SDP_APP_BAR=0
 *     Vite el trau del paquet (l'app continua sent desendollable, a més de
 *     les capes de l'amfitrió i de la persona);
 *   · el component és l'export per defecte d'AppBar.jsx;
 *   · les entrades són la barra lateral de l'app (disseny del Bar §A.8) i
 *     el primer tram de cada ruta interna (rutesBar.js). `entradaPerDefecte`
 *     és `'cataleg'` (i «TPV» / «Caixa» s'obrin en 1 clic des de la barra i
 *     les accions ràpides, sense passos previs bloquejants — IDEA-348).
 * Les dades són locals per disseny (IndexedDB del dispositiu, sense
 * sincronitzar): cap capacitat del backend, cap dada personal.
 * permisos.escriure 'sessio': la plataforma el traduïx a un booleà
 * (useSessioApp().potEscriure) que no bloqueja res per si mateix. El fa
 * complir TOT el Bar (ordre del Mestre, 261006): l'estat (ProveidorBar)
 * refusa cada escriptura sense el permís i les vistes ho diuen (AvisSessio).
 * En mode de proves i amb la sessió desada que la xarxa o el servidor no han
 * deixat comprovar, el Bar ven igualment: la sessió desada només cau quan la
 * persona ix o el servidor rebutja el testimoni.
 * LÍMIT CONEGUT (decisió del Mestre pendent; vegeu la capçalera de
 * plataforma/sessioApp.js): amb una sessió de l'amfitrió (Model B), amb la
 * política auth.persistencia 'pestanya' o amb el recurs efímer per quota, no
 * hi ha cap sessió desada al registre persistent, i vendre sense xarxa només
 * dura fins que caduca el JWT.
 *
 * Onada R32.10 · Camp declaratiu `avisBeta: 'fiscal'` i internacionalització
 * completa del manifest (títol, grups, entrades i interruptors) en les 5
 * llengües oficials (ca, es, en, eu, gl).
 * v1.2.9 (integració) · Es restituïx el contracte de dalt, que el lot 00 de
 * Gemini R32.11 havia llevat: el codi no ha canviat i el contracte continua viu.
 */
export default {
  schema: 'sdp.app.v1',
  id: 'bar',
  titol: {
    ca: 'El Bar',
    es: 'El Bar',
    en: 'The Bar',
    eu: 'Taberna',
    gl: 'O Bar'
  },
  icona: 'Coffee',
  grups: [
    { id: 'servei', titol: { ca: 'Servei', es: 'Servicio', en: 'Service', eu: 'Zerbitzua', gl: 'Servizo' } },
    { id: 'carta', titol: { ca: 'Carta', es: 'Carta', en: 'Menu', eu: 'Karta', gl: 'Carta' } },
    { id: 'torn', titol: { ca: 'Torn', es: 'Turno', en: 'Shift', eu: 'Txanda', gl: 'Quenda' } },
    { id: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes', en: 'Settings', eu: 'Ezarpenak', gl: 'Axustes' } }
  ],
  entrades: [
    { slug: 'caixa', titol: { ca: 'Caixa', es: 'Caja', en: 'Register', eu: 'Kutxa', gl: 'Caixa' }, icona: 'Receipt', grup: 'servei' },
    { slug: 'tpv', titol: { ca: 'TPV', es: 'TPV', en: 'POS', eu: 'STG', gl: 'TPV' }, icona: 'Store', grup: 'servei' },
    { slug: 'taules', titol: { ca: 'Taules', es: 'Mesas', en: 'Tables', eu: 'Mahaiak', gl: 'Mesas' }, icona: 'LayoutGrid', grup: 'servei' },
    { slug: 'emportar', titol: { ca: 'Per emportar', es: 'Para llevar', en: 'Takeaway', eu: 'Eramateko', gl: 'Para levar' }, icona: 'Package', grup: 'servei' },
    { slug: 'tiquets', titol: { ca: 'Tiquets del torn', es: 'Tiques del turno', en: 'Shift receipts', eu: 'Txandako tiketak', gl: 'Tíckets da quenda' }, icona: 'FileText', grup: 'servei' },
    { slug: 'cuina', titol: { ca: 'Cuina (KDS)', es: 'Cocina (KDS)', en: 'Kitchen (KDS)', eu: 'Sukaldea (KDS)', gl: 'Cociña (KDS)' }, icona: 'ClipboardList', grup: 'servei' },
    { slug: 'cataleg', titol: { ca: 'Catàleg', es: 'Catálogo', en: 'Catalogue', eu: 'Katalogoa', gl: 'Catálogo' }, icona: 'LayoutGrid', grup: 'carta' },
    { slug: 'productes', titol: { ca: 'Productes', es: 'Productos', en: 'Products', eu: 'Produktuak', gl: 'Produtos' }, icona: 'Coffee', grup: 'carta' },
    { slug: 'categories', titol: { ca: 'Categories', es: 'Categorías', en: 'Categories', eu: 'Kategoriak', gl: 'Categorías' }, icona: 'LayoutDashboard', grup: 'carta' },
    { slug: 'modificadors', titol: { ca: 'Modificadors', es: 'Modificadores', en: 'Modifiers', eu: 'Aldatzaileak', gl: 'Modificadores' }, icona: 'ClipboardList', grup: 'carta' },
    { slug: 'escandalls', titol: { ca: 'Escandalls', es: 'Escandallos', en: 'Recipe costing', eu: 'Eskandalloak', gl: 'Escandallos' }, icona: 'Calculator', grup: 'carta' },
    { slug: 'ingredients', titol: { ca: 'Ingredients', es: 'Ingredientes', en: 'Ingredients', eu: 'Osagaiak', gl: 'Ingredientes' }, icona: 'Boxes', grup: 'carta' },
    { slug: 'torn', titol: { ca: 'Torn actual', es: 'Turno actual', en: 'Current shift', eu: 'Uneko txanda', gl: 'Quenda actual' }, icona: 'Users', grup: 'torn' },
    { slug: 'tancament', titol: { ca: 'Tancament', es: 'Cierre', en: 'Closing', eu: 'Itxiera', gl: 'Peche' }, icona: 'ChartColumn', grup: 'torn' },
    { slug: 'torns', titol: { ca: 'Historial de torns', es: 'Historial de turnos', en: 'Shift history', eu: 'Txanden historia', gl: 'Historial de quendas' }, icona: 'CalendarDays', grup: 'torn' },
    { slug: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes', en: 'Settings', eu: 'Ezarpenak', gl: 'Axustes' }, icona: 'Settings', grup: 'ajustos' }
  ],
  entradaPerDefecte: 'cataleg',
  interruptors: [
    { id: 'taules', titol: { ca: 'Taules', es: 'Mesas', en: 'Tables', eu: 'Mahaiak', gl: 'Mesas' }, actiuPerDefecte: true },
    { id: 'escandalls', titol: { ca: 'Escandalls i ingredients', es: 'Escandallos e ingredientes', en: 'Recipe costing and ingredients', eu: 'Eskandalloak eta osagaiak', gl: 'Escandallos e ingredientes' }, actiuPerDefecte: true },
    { id: 'cuina', titol: { ca: 'Cuina (fase 2)', es: 'Cocina (fase 2)', en: 'Kitchen (phase 2)', eu: 'Sukaldea (2. fasea)', gl: 'Cociña (fase 2)' }, actiuPerDefecte: false }
  ],
  permisos: { veure: 'public', escriure: 'sessio' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: false,
  avisBeta: 'fiscal',
  carrega: import.meta.env.VITE_SDP_APP_BAR !== '0' ? () => import('./AppBar.jsx') : null
};
