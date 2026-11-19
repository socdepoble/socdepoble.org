/**
 * Notícies del Poble (el Lector RSS, a l'estil de Feedly) · manifest sdp.app.v1.
 *
 * Onada R32.10 · Camp declaratiu `avisBeta: 'general'` i internacionalització
 * completa del manifest en les 5 llengües oficials (ca, es, en, eu, gl).
 */
export default {
  schema: 'sdp.app.v1',
  id: 'lector',
  titol: {
    ca: 'Lector de notícies',
    es: 'Lector de noticias',
    en: 'News Reader',
    eu: 'Albiste-irakurgailua',
    gl: 'Lector de novas'
  },
  icona: 'BookOpen',
  entrades: [
    { slug: 'noticies', titol: { ca: 'Notícies', es: 'Noticias', en: 'News', eu: 'Albisteak', gl: 'Novas' }, icona: 'Inbox' }
  ],
  entradaPerDefecte: 'noticies',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: false,
  avisBeta: 'general',
  carrega: import.meta.env.VITE_SDP_APP_LECTOR !== '0' ? () => import('./AppLector.jsx') : null
};
