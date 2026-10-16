/* Suport de proves de la Plataforma d'Apps Enxufables: els noms del nucli
   dels mòduls per versió, escrits a mà i congelats (Onada 7, 261009). Cap
   fitxer de producció l'importa (qualitat.test.js ho vigila): el contracte
   (contracteNucli.js) no porta cap historial, que seria API nova.
   nucliModuls.test.js hi lliga el contracte: cap porta ni cap nom de
   l'1.0.0 s'ha llevat, i el que s'hi ha afegit és exactament
   NOMS_DEL_NUCLI_1_1 més NOMS_DEL_NUCLI_1_2. guardesDelModul.test.js
   comprova que cada nom de l'1.1.0 el fa servir alguna app i, des del
   Gauntlet 261016, que l'1.2.0 té ús en una app de veres (el Lector munta
   UniversalWorkspace) i que cada nom seu el fa servir una app o el mòdul de
   l'espai (__fixtures__/modulAmbEspai, l'únic amb DefaultItemCard), que
   modulDeBuild.test.jsx compila de veritat. */

const congela = (portes) => Object.freeze(Object.fromEntries(
  Object.entries(portes).map(([clau, noms]) => [clau, noms === '*' ? '*' : Object.freeze([...noms])])
));

/* L'1.0.0 (Onada 6, 261009): la Gestoria i els Tractors. Un mòdul de '^1.0'
   ja publicat compta amb cada porta i cada nom d'ací: llevar-ne un és un
   canvi major. */
export const NOMS_DEL_NUCLI_1_0 = congela({
  React: '*',
  jsxRuntime: ['Fragment', 'jsx', 'jsxs'],
  router: ['Link', 'NavLink', 'Navigate', 'Route', 'Routes', 'matchPath', 'useLocation', 'useNavigate', 'useParams', 'useSearchParams'],
  plataforma: ['ClosaAplicacio', 'ENTITAT_PROJECTE', 'ESDEVENIMENT_NAVEGA', 'ESQUEMA_APP', 'NOMS_ICONES', 'PANELLS_ESTRET', 'VALIDADORS',
    'autoriaDe', 'coincidixRuta', 'esData', 'esIdOpac', 'esSegmentSegur', 'esSlug', 'esUuid', 'lazyRoute', 'rutaDeApp', 'titolDe',
    'useApp', 'useClosaAplicacio', 'useInterruptorsApp', 'useParametresConsulta', 'useRutaApp', 'useSessioApp', 'validaRutes',
    'validaTaulaDeClosa'],
  pedraSeca: ['Accordion', 'AccordionItem', 'ActionControl', 'Alerta', 'AreaText', 'Boto', 'Camp', 'CampFitxer', 'CampText', 'Carregant',
    'Casella', 'ControlContrasenya', 'DateTimeControl', 'Dialeg', 'DialegConfirmacio', 'Esquelet', 'EstatBuit', 'GrupCamps', 'GrupOpcions',
    'Histograma', 'IconButton', 'Insignia', 'Interruptor', 'LiniaDelTemps', 'PaginaApp', 'Pestanyes', 'Progres', 'Selector', 'Taula',
    'UniversalCard', 'nivellHistograma']
});

/* El que l'1.1.0 (Onada 7, 261009) afig a l'1.0.0: el que importen el Bar,
   la Nevera, Salut, el Lector i l'esquelet comú. Cap porta nova. */
export const NOMS_DEL_NUCLI_1_1 = congela({
  router: ['useRouter'],
  pedraSeca: ['AfegitRapid', 'BarraResum', 'DetallArticle', 'ESTATS_ARTICLE', 'Fila', 'GraellaArticles', 'GraellaTargetes',
    'LiniesColleccio', 'LlistaArticles', 'MarcColumna', 'NavegacioPeriode', 'OrdenaCategories', 'Pila', 'PillToggle',
    'SelectorCategoria', 'TEXTOS_ESTAT_LINIA', 'TargetesColleccions', 'TeclatNumeric', 'UniversalTPV', 'estatLinia', 'mouCategoria']
});

/* El que l'1.2.0 (Gauntlet nocturn, 261016) afig a l'1.1.0: una porta nova,
   l'espai de treball del Bloc de notes, perquè el Lector s'hi munte. */
export const NOMS_DEL_NUCLI_1_2 = congela({
  workspace: ['DefaultItemCard', 'UniversalWorkspace']
});
