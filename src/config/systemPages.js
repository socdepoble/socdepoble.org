/**
 * Claus de PAGE_COPY que la interfície necessita per a pintar-se.
 *
 * Viuen ací, i no dins dels components, perquè node les puga importar sense
 * JSX: la frontissa de contingut (tooling/gates/frontissa-contingut.mjs) en
 * deriva les claus obligatòries. L'incident del 24-09 va nàixer d'un canvi de
 * nom (`wikidepoble` → `skills`): el Mur va descartar la targeta en silenci i
 * la portada de la Wiki es va quedar sense text, i cap porta ho va dir.
 *
 * Mòdul de dades pures: sense imports, perquè node el puga carregar tal qual.
 */

/**
 * Ordre del Mestre (261007) · L'acció gran d'una pàgina del sistema: el botó
 * blau que la seua targeta (Mur i Calendari) porta en lloc de les etiquetes i
 * que la seua pàgina repetix davall de l'H1. Una sola font per a les dues
 * (accioDeLaPagina). `text` és un parell [clau i18n, reserva en valencià],
 * com AVISOS_XAT_CORPORATIU i TEXTOS_PORTES; `desti`, una ruta de l'app.
 */
const ANAR_AL_XAT = Object.freeze({
  id: 'anar-al-xat',
  text: Object.freeze(['section.xat.anarAlXat', 'Anar al xat']),
  desti: '/xat'
});

/* Onada 8 (261009; requeriments 261009_1300, punt 2) · La Consola i el
   Cervell són pàgines del sistema, no plugins: la seua targeta i la seua
   pàgina porten el botó gran cap a l'eina, com El Xat. Les rutes són
   literals perquè este mòdul no importa res; systemPages.test.js les
   confronta amb RUTA_CONSOLA i amb les pàgines de la Consola. Fora de
   desenvolupament, /consola demana el rol de superadmin (App.jsx,
   RutaConsola).
   Pendent de decisió (MarIA o el Mestre) · Esta porta no mira l'entorn. Quan
   eren plugins, la revisió P7-A deixava inert el seu «Obrir» fora de
   desenvolupament (useDestiDelPlugin), perquè les dades de la Consola
   (/__iaia/*) només les servix `vite serve`. Cap ordre ho ha derogat. */
const OBRIR_CONSOLA = Object.freeze({
  id: 'obrir-consola',
  text: Object.freeze(['section.consola.obrir', 'Obrir la Consola']),
  desti: '/consola'
});
const OBRIR_CERVELL = Object.freeze({
  id: 'obrir-cervell',
  text: Object.freeze(['section.cervell.obrir', 'Obrir el Cervell']),
  desti: '/consola/explorador'
});

/**
 * Pàgines de sistema que el Mur barreja amb les publicacions.
 * Ordre del Mestre (261007) · «El Xat» viu a /page/xat (PageDetailSection,
 * sense ruta nova) i porta l'acció «Anar al xat» cap a /xat.
 * Ordre del Mestre (261007) · «Drets d'autor» viu a /page/drets-autor
 * (PageDetailSection, sense ruta nova ni component propi): la pàgina on porta
 * l'enllaç del copyright de totes les targetes i capçaleres (RUTA_DRETS_AUTOR).
 * Onada 8 (261009; requeriments 261009_1300, punt 2) · «Consola Termodinàmica»
 * i «El Cervell» ja no són plugins del Panell: viuen a /page/consola i
 * /page/cervell (PageDetailSection, sense ruta nova), darrere de Disseny, i
 * porten el seu botó «Obrir…» cap a l'eina. El Panell pinta les tres a
 * «Maquinària i Sistema» amb la targeta del Mur (ControlSection.jsx).
 */
export const SYSTEM_PAGES = Object.freeze([
  { key: 'projecte', isAvis: false, href: '/projecte' },
  { key: 'wikidepoble', isAvis: false, href: '/wikidepoble' },
  { key: 'constitucio', isAvis: false, href: '/constitucio' },
  { key: 'roadmap', isAvis: false, href: '/roadmap' },
  { key: 'notes', isAvis: false, href: '/notes' },
  { key: 'disseny', isAvis: false, href: '/disseny' },
  { key: 'consola', isAvis: false, href: '/page/consola', accio: OBRIR_CONSOLA },
  { key: 'cervell', isAvis: false, href: '/page/cervell', accio: OBRIR_CERVELL },
  { key: 'versions', isAvis: false, href: '/versions' },
  { key: 'legal', isAvis: false, href: '/legal' },
  { key: 'xat', isAvis: false, href: '/page/xat', accio: ANAR_AL_XAT },
  { key: 'drets-autor', isAvis: false, href: '/page/drets-autor' }
].map((page) => Object.freeze(page)));

/**
 * Ordre del Mestre (261007) · On porta el copyright d'una targeta
 * (UniversalCard) i de la capçalera d'una pàgina (PageFrame): SEMPRE a la
 * pàgina «Drets d'autor», siga quin siga el text («CC BY-NC-SA 4.0…»,
 * «© Pepet»…). Una sola font: la ruta de la seua entrada de SYSTEM_PAGES.
 */
export const RUTA_DRETS_AUTOR = SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor').href;

/**
 * Ordre del Mestre (261007) · La porta de l'acció gran d'una pàgina del
 * sistema ({ id, verb, desti, varietat }, la forma de PortesTargeta.jsx), o
 * null si la pàgina no en té. `t` és el traductor de la interfície; sense,
 * la reserva en valencià. Pur: la targeta i la pàgina la pinten amb
 * PortaDePagina, la mateixa porta.
 */
export function accioDeLaPagina(clau, t) {
  const pagina = SYSTEM_PAGES.find((candidata) => candidata.key === clau);
  if (!pagina?.accio) return null;
  const [clauText, reserva] = pagina.accio.text;
  const verb = typeof t === 'function' ? t(clauText, reserva) : reserva;
  return { id: pagina.accio.id, verb: verb || reserva, desti: pagina.accio.desti, varietat: 'primari' };
}

/**
 * Portades amb clau pròpia. La Wiki i `disseny` (DesignSection.jsx, amb el nom
 * literal) lligen primer el pageCopy del contingut carregat i PAGE_COPY només
 * de reserva (ordre del Mestre, 261001: la pàgina i la seua targeta diuen la
 * mateixa data); `consola` la lligen l'element de la Wiki que la incrusta, de
 * la mateixa manera, i la ruta /consola, encara de PAGE_COPY directament.
 */
export const COVER_PAGE_KEYS = Object.freeze({
  wiki: 'wikidepoble',
  disseny: 'disseny',
  consola: 'consola'
});
