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
 *
 * MAI hi entren el port del backend, SessionContext ni IdentitatContext
 * (Model B i Llei de l'Enxufabilitat): un mòdul només sap si té dades del
 * backend per la plataforma (useSessioApp i les capacitats del manifest).
 */

export const ESQUEMA_MODUL = 'sdp.modul.v1';
export const VERSIO_NUCLI = '1.0.0';
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
   Gestoria que no siga ací el posa en roig abans que el build del mòdul
   s'ature. Mentre el nucli no es publique, s'hi afig; després, cada nom nou
   és un canvi menor de VERSIO_NUCLI. Cada fitxer porta els seus noms; la
   façana (index.js) els porta tots. */
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
  ['organismes/LiniaDelTemps.jsx', ['LiniaDelTemps']]
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
  {
    clau: 'router',
    fonts: ['src/app/contexts/RouterContext.jsx'],
    noms: ['Link', 'NavLink', 'Navigate', 'Route', 'Routes', 'matchPath', 'useLocation', 'useNavigate', 'useParams', 'useSearchParams']
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
