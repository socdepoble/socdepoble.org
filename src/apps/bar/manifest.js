/**
 * El Bar · manifest sdp.app.v1 (lot BAR, T4: TPV d'hostaleria).
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'bar': la ruta és /app/bar i no es declara;
 *   · `carrega` darrere del literal de compilació EXACTE de baix: sense
 *     VITE_SDP_APP_BAR=1 al build de producció, Vite trau AppBar del paquet;
 *   · el component és l'export per defecte d'AppBar.jsx;
 *   · les entrades són la barra lateral de l'app (disseny del Bar §A.8) i
 *     el primer tram de cada ruta interna (rutesBar.js). «TPV» (ordre del
 *     Mestre, 261006) és el TPV Universal, al costat de la Caixa, que no
 *     canvia i continua sent l'entrada per defecte.
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
 */
export default {
  schema: 'sdp.app.v1',
  id: 'bar',
  titol: { ca: 'El Bar', es: 'El Bar' },
  icona: 'Coffee',
  grups: [
    { id: 'servei', titol: { ca: 'Servei', es: 'Servicio' } },
    { id: 'carta', titol: { ca: 'Carta', es: 'Carta' } },
    { id: 'torn', titol: { ca: 'Torn', es: 'Turno' } },
    { id: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes' } }
  ],
  entrades: [
    { slug: 'caixa', titol: { ca: 'Caixa', es: 'Caja' }, icona: 'Receipt', grup: 'servei' },
    { slug: 'tpv', titol: { ca: 'TPV', es: 'TPV' }, icona: 'Store', grup: 'servei' },
    { slug: 'taules', titol: { ca: 'Taules', es: 'Mesas' }, icona: 'LayoutGrid', grup: 'servei' },
    { slug: 'emportar', titol: { ca: 'Per emportar', es: 'Para llevar' }, icona: 'Package', grup: 'servei' },
    { slug: 'tiquets', titol: { ca: 'Tiquets del torn', es: 'Tiques del turno' }, icona: 'FileText', grup: 'servei' },
    { slug: 'productes', titol: { ca: 'Productes', es: 'Productos' }, icona: 'Coffee', grup: 'carta' },
    { slug: 'categories', titol: { ca: 'Categories', es: 'Categorías' }, icona: 'LayoutDashboard', grup: 'carta' },
    { slug: 'modificadors', titol: { ca: 'Modificadors', es: 'Modificadores' }, icona: 'ClipboardList', grup: 'carta' },
    { slug: 'escandalls', titol: { ca: 'Escandalls', es: 'Escandallos' }, icona: 'Calculator', grup: 'carta' },
    { slug: 'ingredients', titol: { ca: 'Ingredients', es: 'Ingredientes' }, icona: 'Boxes', grup: 'carta' },
    { slug: 'torn', titol: { ca: 'Torn actual', es: 'Turno actual' }, icona: 'Users', grup: 'torn' },
    { slug: 'tancament', titol: { ca: 'Tancament', es: 'Cierre' }, icona: 'ChartColumn', grup: 'torn' },
    { slug: 'torns', titol: { ca: 'Historial de torns', es: 'Historial de turnos' }, icona: 'CalendarDays', grup: 'torn' },
    { slug: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes' }, icona: 'Settings', grup: 'ajustos' }
  ],
  entradaPerDefecte: 'caixa',
  interruptors: [
    { id: 'taules', titol: { ca: 'Taules', es: 'Mesas' }, actiuPerDefecte: true },
    { id: 'escandalls', titol: { ca: 'Escandalls i ingredients', es: 'Escandallos e ingredientes' }, actiuPerDefecte: true },
    { id: 'cuina', titol: { ca: 'Cuina (fase 2)', es: 'Cocina (fase 2)' }, actiuPerDefecte: false }
  ],
  permisos: { veure: 'public', escriure: 'sessio' },
  capacitats: [],
  nivell: 'premium',
  dret: 'sdp.app.bar',
  actiuPerDefecte: false,
  entorn: 'desenvolupament',
  dadesPersonals: false,
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_BAR === '1' ? () => import('./AppBar.jsx') : null
};
