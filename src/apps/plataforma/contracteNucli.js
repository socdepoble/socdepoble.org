/**
 * Plataforma d'Apps Enxufables · el contracte del nucli dels mòduls
 * (sdp.modul.v1, ADR-2026-12).
 *
 * Un mòdul és una app que no viatja dins del paquet: es compila a banda
 * (vite.modul.config.js), l'amfitrió el registra amb
 * window.SocDePoble.registraModul(manifest) i el seu cos es carrega només
 * quan algú l'obri (carregaModul.js). El cos no porta React ni la
 * plataforma ni Pedra Seca: els pren de SocDePoble.nucli, l'única instància
 * de la pàgina (un React doble trenca els hooks i els contexts).
 *
 * Este fitxer és PUR (cap import, cap global): el llig el nucli
 * (nucliModuls.js, que en construïx l'objecte), el carregador
 * (carregaModul.js) i el build dels mòduls (vite.modul.config.js), que hi
 * mapeja cada importació del cos.
 *
 * VERSIO_NUCLI segueix semver. Afegir una porta o un nom és un canvi menor;
 * llevar-ne o canviar-ne un és major i trenca els mòduls publicats.
 * nucliModuls.test.js vigila que l'objecte i esta llista diguen el mateix.
 *   1.0.0 · Onada 6 (261009): la Gestoria i els Tractors.
 *   1.1.0 · Onada 7 (261009): useRouter i la Pedra Seca que importen el Bar,
 *           la Nevera, Salut, el Lector i l'esquelet comú. Només s'afig: un
 *           mòdul compilat contra l'1.0 ('^1.0') continua valent.
 *   1.2.0 · Gauntlet nocturn (261016): la porta 'workspace', l'espai de
 *           treball del Bloc de notes (UniversalWorkspace i DefaultItemCard),
 *           perquè el Lector s'hi munte. Només s'afig una porta: un mòdul de
 *           '^1.0' o de '^1.1' continua valent.
 *
 * MAI hi entren el port del backend, SessionContext ni IdentitatContext
 * (Model B i Llei de l'Enxufabilitat): un mòdul només sap si té dades del
 * backend per la plataforma (useSessioApp i les capacitats del manifest).
 */

export const ESQUEMA_MODUL = 'sdp.modul.v1';
export const VERSIO_NUCLI = '1.2.0';
/* L'expressió global de l'objecte: el build dels mòduls hi penja cada porta. */
export const GLOBAL_DEL_NUCLI = 'SocDePoble.nucli';

/* Rang que un mòdul demana al seu manifest: '^<major>' o '^<major>.<menor>'. */
export const PATRO_RANG_NUCLI = /^\^(0|[1-9]\d{0,3})(?:\.(0|[1-9]\d{0,4}))?$/;

function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
}

const PEDRA_SECA = 'src/components/PedraSeca';

/* La Pedra Seca del nucli v1: tot el que importen la Gestoria (el primer
   mòdul) i els Tractors que porta (també l'Històric, amb Pestanyes i
   AccordionItem, i el Cofre, amb ControlContrasenya), i les peces de
   gràfics de les apps (Histograma i LiniaDelTemps). guardesDelModul.test.js
   ho contrasta amb l'arbre de veritat: un import nou de Pedra Seca a la
   Gestoria o a una app de la fase 1 que no siga ací el posa en roig abans
   que el build del mòdul s'ature. Cada nom nou és un canvi menor de
   VERSIO_NUCLI (l'1.1.0, Onada 7, 261009), i llevar-ne un és major:
   nucliModuls.test.js guarda els noms de l'1.0.0. Cada fitxer porta els
   seus noms; la façana (index.js) els porta tots. */
const PEDRA_SECA_V1 = Object.freeze([
  ['atoms/Boto.jsx', ['Boto']],
  ['atoms/Insignia.jsx', ['Insignia']],
  ['atoms/estats.jsx', ['Carregant', 'EstatBuit', 'Esquelet', 'Progres']],
  ['atoms/controls.jsx', ['ActionControl', 'DateTimeControl', 'IconButton']],
  ['atoms/ControlContrasenya.jsx', ['ControlContrasenya']],
  ['molecules/Alerta.jsx', ['Alerta']],
  ['organismes/Accordion.jsx', ['Accordion', 'AccordionItem']],
  ['organismes/Dialeg.jsx', ['Dialeg', 'DialegConfirmacio']],
  ['organismes/Taula.jsx', ['Taula']],
  ['organismes/formulari.jsx', ['AreaText', 'Camp', 'CampFitxer', 'CampText', 'Casella', 'GrupCamps', 'GrupOpcions', 'Interruptor', 'Selector']],
  ['organismes/PaginaApp.jsx', ['PaginaApp']],
  ['organismes/Pestanyes.jsx', ['Pestanyes']],
  ['organismes/UniversalCard.jsx', ['UniversalCard']],
  ['organismes/Histograma.jsx', ['Histograma', 'nivellHistograma']],
  ['organismes/LiniaDelTemps.jsx', ['LiniaDelTemps']],
  /* Nucli 1.1.0 (Onada 7, 261009): el Bar, la Nevera, Salut, el Lector i
     l'esquelet comú (src/apps/comu), que arrosseguen el Bar, la Nevera i el
     Lector. Només peces de pintar i funcions pures: cap toca el backend, la
     sessió ni un context de la pàgina. */
  ['composicio/index.jsx', ['Fila', 'Pila']],
  ['molecules/PillToggle.jsx', ['PillToggle']],
  ['organismes/AfegitRapid.jsx', ['AfegitRapid']],
  ['organismes/BarraResum.jsx', ['BarraResum']],
  ['organismes/DetallArticle.jsx', ['DetallArticle']],
  ['organismes/GraellaArticles.jsx', ['GraellaArticles']],
  ['organismes/GraellaTargetes.jsx', ['GraellaTargetes']],
  ['organismes/LiniesColleccio.jsx', ['LiniesColleccio']],
  ['organismes/LlistaArticles.jsx', ['LlistaArticles']],
  ['organismes/MarcColumna.jsx', ['MarcColumna']],
  ['organismes/NavegacioPeriode.jsx', ['NavegacioPeriode']],
  ['organismes/SeccionsCategoria.jsx', ['OrdenaCategories', 'SelectorCategoria']],
  ['organismes/TargetesColleccions.jsx', ['TargetesColleccions']],
  ['organismes/TeclatNumeric.jsx', ['TeclatNumeric']],
  ['organismes/UniversalTPV.jsx', ['UniversalTPV']],
  ['organismes/articles.js', ['ESTATS_ARTICLE', 'TEXTOS_ESTAT_LINIA', 'estatLinia', 'mouCategoria']]
]);

/**
 * Les portes del nucli v1. Cada porta és una clau de SocDePoble.nucli:
 *   clau   · la propietat (SocDePoble.nucli.<clau>);
 *   fonts  · els paquets o fitxers (camí des de l'arrel del repositori) que
 *            el build del mòdul hi mapeja;
 *   noms   · els noms que s'hi exposen ('*': el mòdul sencer, només React).
 */
export const PORTES_DEL_NUCLI = congela([
  { clau: 'React', fonts: ['react'], noms: '*' },
  { clau: 'jsxRuntime', fonts: ['react/jsx-runtime'], noms: ['Fragment', 'jsx', 'jsxs'] },
  /* useRouter (1.1.0, el fa servir l'esquelet comú) torna el valor del
     router de la pàgina: el camí i la consulta de l'app, navigate, la base
     dels href, si és en memòria i l'estat de l'entrada. És el que ja donen
     useLocation, useNavigate i Link (la base és a cada href pintat): cap
     dada del backend, de la sessió ni de l'amfitrió fora de la ruta. */
  {
    clau: 'router',
    fonts: ['src/app/contexts/RouterContext.jsx'],
    noms: ['Link', 'NavLink', 'Navigate', 'Route', 'Routes', 'matchPath', 'useLocation', 'useNavigate', 'useParams', 'useRouter',
      'useSearchParams']
  },
  {
    clau: 'plataforma',
    fonts: ['src/apps/plataforma/index.js'],
    noms: ['ClosaAplicacio', 'ENTITAT_PROJECTE', 'ESDEVENIMENT_NAVEGA', 'ESQUEMA_APP', 'NOMS_ICONES', 'PANELLS_ESTRET', 'VALIDADORS',
      'autoriaDe', 'coincidixRuta', 'esData', 'esIdOpac', 'esSegmentSegur', 'esSlug', 'esUuid', 'lazyRoute', 'rutaDeApp', 'titolDe',
      'useApp', 'useClosaAplicacio', 'useInterruptorsApp', 'useParametresConsulta', 'useRutaApp', 'useSessioApp', 'validaRutes',
      'validaTaulaDeClosa']
  },
  {
    clau: 'pedraSeca',
    fonts: [`${PEDRA_SECA}/index.js`, ...PEDRA_SECA_V1.map(([fitxer]) => `${PEDRA_SECA}/${fitxer}`)],
    noms: PEDRA_SECA_V1.flatMap(([, noms]) => noms).sort()
  },
  /* workspace (1.2.0, Gauntlet nocturn del 261016): l'espai de treball de
     tres columnes del Bloc de notes, perquè una app s'hi munte sense portar-ne
     una còpia. Una sola font, la façana, i dos noms: un import
     d'UniversalWorkspace.jsx o de NavGlyph.jsx no és de cap porta, i un altre
     nom de la façana (ESPAI_COMU…) la porta no l'exposa; en tots dos casos el
     build del mòdul s'atura (vite.modul.config.js).
     Com PaginaApp a la Pedra Seca, l'espai arriba al port dins de la pàgina
     (ItemMedia → useResolvedAsset resol les imatges del paquet), però el
     mòdul no en rep cap mànec ni el porta dins del cos: la porta és externa. */
  {
    clau: 'workspace',
    fonts: ['src/components/universal/workspace/index.js'],
    noms: ['DefaultItemCard', 'UniversalWorkspace']
  }
]);

/** Els noms de Pedra Seca v1 per fitxer (camí des de l'arrel del repositori). */
export const NOMS_PER_FITXER_DE_PEDRA_SECA = congela(Object.fromEntries(
  PEDRA_SECA_V1.map(([fitxer, noms]) => [`${PEDRA_SECA}/${fitxer}`, [...noms]])
));

/** La porta que servix una font (paquet o camí des de l'arrel), o null. */
export function portaDeLaFont(font) {
  return PORTES_DEL_NUCLI.find((porta) => porta.fonts.includes(font)) || null;
}

/** L'expressió global d'una porta: 'SocDePoble.nucli.<clau>'. */
export function globalDeLaPorta(porta) {
  return `${GLOBAL_DEL_NUCLI}.${porta.clau}`;
}

/** Cert si `nom` és un dels que exposa la porta. */
export function exposaElNom(porta, nom) {
  return porta.noms === '*' || porta.noms.includes(nom);
}

/**
 * Cert si la versió del nucli satisfà el rang d'un mòdul: la mateixa major i,
 * si el rang en diu una, una menor igual o més alta. Cap altra forma passa.
 */
export function nucliSatisfa(rang, versio = VERSIO_NUCLI) {
  const demanat = typeof rang === 'string' ? rang.match(PATRO_RANG_NUCLI) : null;
  const present = typeof versio === 'string' ? versio.match(/^(\d+)\.(\d+)\.(\d+)$/) : null;
  if (!demanat || !present) return false;
  if (Number(demanat[1]) !== Number(present[1])) return false;
  return demanat[2] === undefined || Number(present[2]) >= Number(demanat[2]);
}
