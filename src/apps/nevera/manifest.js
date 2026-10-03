/**
 * La Nevera de Casa (La Compra, a l'estil de Bring!) · manifest sdp.app.v1.
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'nevera' (la ruta és /app/nevera, no es declara);
 *   · `carrega` darrere del literal de compilació EXACTE de baix: sense
 *     VITE_SDP_APP_NEVERA=1 al build de producció, Vite trau AppNevera del
 *     paquet; en desenvolupament sempre hi és;
 *   · el component és l'export per defecte d'AppNevera.jsx.
 * Gratuïta i sense dades personals: les llistes viuen només en este
 * dispositiu (magatzem local) i no hi ha cap crida de xarxa.
 */
export default {
  schema: 'sdp.app.v1',
  id: 'nevera',
  titol: { ca: 'La Nevera de Casa', es: 'La Nevera de Casa' },
  icona: 'ShoppingCart',
  entrades: [
    { slug: 'llistes', titol: { ca: 'Llistes', es: 'Listas' }, icona: 'LayoutDashboard' },
    { slug: 'llista', titol: { ca: 'La compra', es: 'La compra' }, icona: 'ClipboardList' },
    { slug: 'cataleg', titol: { ca: 'Catàleg', es: 'Catálogo' }, icona: 'LayoutGrid' },
    { slug: 'casa', titol: { ca: 'A casa', es: 'En casa' }, icona: 'Boxes' },
    { slug: 'temporada', titol: { ca: 'Temporada', es: 'Temporada' }, icona: 'CalendarDays' },
    { slug: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes' }, icona: 'Settings' }
  ],
  entradaPerDefecte: 'llista',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: false,
  entorn: 'desenvolupament',
  dadesPersonals: false,
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_NEVERA === '1' ? () => import('./AppNevera.jsx') : null
};
