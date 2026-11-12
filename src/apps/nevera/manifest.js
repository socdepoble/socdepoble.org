/**
 * La Nevera de Casa (La Compra, a l'estil de Bring!) · manifest sdp.app.v1.
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'nevera' (la ruta és /app/nevera, no es declara);
 *   · P0-113 (ordre del Mestre, 261111): eina gratuïta oberta en producció
 *     (entorn 'produccio', actiuPerDefecte true) i en proves (Beta oberta);
 *   · `carrega` darrere del literal de compilació EXACTE de baix: el tros
 *     diferit d'AppNevera entra al build per defecte, i amb
 *     VITE_SDP_APP_NEVERA=0 Vite el trau del paquet (l'app continua sent
 *     desendollable, a més de les capes de l'amfitrió i de la persona);
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
    { slug: 'rebost', titol: { ca: 'Rebost', es: 'Despensa' }, icona: 'Boxes' },
    { slug: 'llistes', titol: { ca: 'Llistes', es: 'Listas' }, icona: 'LayoutDashboard' },
    { slug: 'llista', titol: { ca: 'La compra', es: 'La compra' }, icona: 'ClipboardList' },
    { slug: 'cataleg', titol: { ca: 'Catàleg', es: 'Catálogo' }, icona: 'LayoutGrid' },
    { slug: 'casa', titol: { ca: 'A casa', es: 'En casa' }, icona: 'Boxes' },
    /* Onada 12 (261011; ordres 261011_0130, punt 6) · Què es pot cuinar amb el que hi ha a casa. */
    { slug: 'receptes', titol: { ca: 'Receptes', es: 'Recetas' }, icona: 'ChefHat' },
    { slug: 'temporada', titol: { ca: 'Temporada', es: 'Temporada' }, icona: 'CalendarDays' },
    { slug: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes' }, icona: 'Settings' }
  ],
  entradaPerDefecte: 'rebost',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: false,
  carrega: import.meta.env.VITE_SDP_APP_NEVERA !== '0' ? () => import('./AppNevera.jsx') : null
};
