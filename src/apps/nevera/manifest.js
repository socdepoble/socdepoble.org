/**
 * La Nevera de Casa (La Compra, a l'estil de Bring!) · manifest sdp.app.v1.
 *
 * Onada R32.10 · Camp declaratiu `avisBeta: 'general'` i internacionalització
 * completa del manifest en les 5 llengües oficials (ca, es, en, eu, gl).
 */
export default {
  schema: 'sdp.app.v1',
  id: 'nevera',
  titol: {
    ca: 'La Nevera de Casa',
    es: 'La Nevera de Casa',
    en: 'Home Pantry & Fridge',
    eu: 'Etxeko Hozkailua',
    gl: 'A Neveira da Casa'
  },
  icona: 'ShoppingCart',
  entrades: [
    { slug: 'rebost', titol: { ca: 'Rebost', es: 'Despensa', en: 'Pantry', eu: 'Jakitegia', gl: 'Despensa' }, icona: 'Boxes' },
    { slug: 'llistes', titol: { ca: 'Llistes', es: 'Listas', en: 'Lists', eu: 'Zerrendak', gl: 'Listas' }, icona: 'LayoutDashboard' },
    { slug: 'llista', titol: { ca: 'La compra', es: 'La compra', en: 'Shopping list', eu: 'Erosketak', gl: 'A compra' }, icona: 'ClipboardList' },
    { slug: 'cataleg', titol: { ca: 'Catàleg', es: 'Catálogo', en: 'Catalogue', eu: 'Katalogoa', gl: 'Catálogo' }, icona: 'LayoutGrid' },
    { slug: 'casa', titol: { ca: 'A casa', es: 'En casa', en: 'At home', eu: 'Etxean', gl: 'Na casa' }, icona: 'Boxes' },
    { slug: 'receptes', titol: { ca: 'Receptes', es: 'Recetas', en: 'Recipes', eu: 'Errezetak', gl: 'Receitas' }, icona: 'ChefHat' },
    { slug: 'temporada', titol: { ca: 'Temporada', es: 'Temporada', en: 'In season', eu: 'Sasoikoa', gl: 'Tempada' }, icona: 'CalendarDays' },
    { slug: 'ajustos', titol: { ca: 'Ajustos', es: 'Ajustes', en: 'Settings', eu: 'Ezarpenak', gl: 'Axustes' }, icona: 'Settings' }
  ],
  entradaPerDefecte: 'rebost',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: false,
  avisBeta: 'general',
  carrega: import.meta.env.VITE_SDP_APP_NEVERA !== '0' ? () => import('./AppNevera.jsx') : null
};
