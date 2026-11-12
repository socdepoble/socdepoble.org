/**
 * Notícies del Poble (el Lector RSS, a l'estil de Feedly) · manifest sdp.app.v1.
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'lector' (la ruta és /app/lector, no es declara);
 *   · P0-113 (ordre del Mestre, 261111): eina gratuïta oberta en producció
 *     (entorn 'produccio', actiuPerDefecte true) i en proves (Beta oberta);
 *   · `carrega` darrere del literal de compilació EXACTE de baix: el tros
 *     diferit d'AppLector entra al build per defecte, i amb
 *     VITE_SDP_APP_LECTOR=0 Vite el trau del paquet (l'app continua sent
 *     desendollable, a més de les capes de l'amfitrió i de la persona);
 *   · el component és l'export per defecte d'AppLector.jsx.
 * Gratuïta i sense dades personals: el que la persona llig, desa o seguix viu
 * només en este dispositiu (magatzem local); l'adreça d'una font personal la
 * llig el servei de notícies del backend (fontRemota.js, feedPersonal), mai el
 * navegador. L'app no fa cap crida de xarxa:
 * les notícies entren pel port (fontNoticies.js). T5 (261024) · El port de
 * producció el fa el servei de notícies del poble que dona la plataforma
 * (useServeiNoticies; la funció `noticies` del backend, que desplega el
 * Mestre). Obrir-la en producció era decisió del Mestre, i ja l'ha presa
 * (P0-113, ordre del Mestre, 261111).
 */
export default {
  schema: 'sdp.app.v1',
  id: 'lector',
  titol: { ca: 'Lector de notícies', es: 'Lector de noticias' },
  icona: 'BookOpen',
  /* Ordre del Mestre (261024, 15:05) · Una sola entrada: les fonts viuen a l'arbre de les
     notícies, i /fonts ja no és cap pàgina (l'enllaç vell, RutaApps el porta a /noticies). */
  entrades: [
    { slug: 'noticies', titol: { ca: 'Notícies', es: 'Noticias' }, icona: 'Inbox' }
  ],
  entradaPerDefecte: 'noticies',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: false,
  carrega: import.meta.env.VITE_SDP_APP_LECTOR !== '0' ? () => import('./AppLector.jsx') : null
};
