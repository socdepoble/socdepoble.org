/* Suport de proves de la Plataforma d'Apps Enxufables: el manifest de l'app
   de prova que modulDeBuild.test.jsx compila com a mòdul per a provar la
   porta 'workspace' del nucli 1.2.0 (261016). Cap fitxer de producció
   l'importa (qualitat.test.js ho vigila). La mateixa forma que
   src/apps/<id>/manifest.js: dada pura amb el literal de compilació. */
export default {
  schema: 'sdp.app.v1',
  id: 'modul-amb-espai',
  titol: { ca: 'Mòdul amb Espai', es: 'Módulo con Espacio' },
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
  carrega: import.meta.env.DEV || import.meta.env.VITE_SDP_APP_MODUL_AMB_ESPAI === '1' ? () => import('./AppModulAmbEspai.jsx') : null
};
