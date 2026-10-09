/* Suport de proves de la Plataforma d'Apps Enxufables: el manifest d'una app
   de prova que modulDeBuild.test.jsx compila com a mòdul (vite.modul.config.js).
   Cap fitxer de producció l'importa (qualitat.test.js ho vigila). La mateixa
   forma que src/apps/<id>/manifest.js: dada pura amb el literal de compilació. */
export default {
  schema: 'sdp.app.v1',
  id: 'modul-de-prova',
  titol: { ca: 'Mòdul de Prova', es: 'Módulo de Prueba' },
  icona: 'Puzzle',
  entrades: [
    { slug: 'inici', titol: { ca: 'Inici' }, icona: 'LayoutGrid' }
  ],
  entradaPerDefecte: 'inici',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: false,
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_MODUL_DE_PROVA === '1' ? () => import('./AppModulDeProva.jsx') : null
};
