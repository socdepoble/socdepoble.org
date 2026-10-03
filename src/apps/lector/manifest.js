/**
 * Notícies del Poble (el Lector RSS, a l'estil de Feedly) · manifest sdp.app.v1.
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'lector' (la ruta és /app/lector, no es declara);
 *   · `carrega` darrere del literal de compilació EXACTE de baix: sense
 *     VITE_SDP_APP_LECTOR=1 al build de producció, Vite trau AppLector del
 *     paquet; en desenvolupament sempre hi és;
 *   · el component és l'export per defecte d'AppLector.jsx.
 * Gratuïta i sense dades personals: el que la persona llig, desa o seguix viu
 * només en este dispositiu (magatzem local). L'app no fa cap crida de xarxa:
 * les notícies entren pel port (fontNoticies.js), que en producció proveirà
 * l'amfitrió. Fins llavors, només en desenvolupament.
 */
export default {
  schema: 'sdp.app.v1',
  id: 'lector',
  titol: { ca: 'Notícies del Poble', es: 'Noticias del Pueblo' },
  icona: 'BookOpen',
  entrades: [
    { slug: 'noticies', titol: { ca: 'Notícies', es: 'Noticias' }, icona: 'Inbox' },
    { slug: 'fonts', titol: { ca: 'Fonts', es: 'Fuentes' }, icona: 'LayoutGrid' }
  ],
  entradaPerDefecte: 'noticies',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: false,
  entorn: 'desenvolupament',
  dadesPersonals: false,
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_LECTOR === '1' ? () => import('./AppLector.jsx') : null
};
