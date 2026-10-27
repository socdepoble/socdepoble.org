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
 * L'acció gran d'una pàgina del sistema: la porta blava cap a la seua eina
 * (accioDeLaPagina). `text` és un parell [clau i18n, reserva en valencià],
 * com AVISOS_XAT_CORPORATIU i TEXTOS_PORTES; `desti`, una ruta de l'app.
 *
 * Ordre del Mestre (261007) · El botó de la targeta (Mur i Calendari), en
 * lloc de les etiquetes, i el de la pàgina, davall de l'H1, són la mateixa
 * porta. Continua vigent, sencera, per a El Xat.
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Per a
 * la Consola i el Cervell, eixa ordre queda derogada a la TARGETA: perd el
 * botó i porta Categoria i Etiqueta (les `labels` de PAGE_COPY). A la seua
 * PÀGINA, el botó va dalt i al final (decisió M2): dins del bloc blanc de
 * l'H1 i repetit després del cos, com les pàgines de Publicar. Ho diuen dues
 * marques de dades del descriptor, i cap de les dues ix al retorn
 * d'accioDeLaPagina:
 *  · `targeta: true` · la targeta també porta el botó (accioDeLaTargeta);
 *  · `final: true` · la pàgina el repetix després del cos (accioAlFinal).
 */
const ANAR_AL_XAT = Object.freeze({
  id: 'anar-al-xat',
  text: Object.freeze(['section.xat.anarAlXat', 'Anar al xat']),
  desti: '/xat',
  targeta: true
});

/* Onada 8 (261009; requeriments 261009_1300, punt 2) · La Consola i el
   Cervell són pàgines del sistema, no plugins: la seua pàgina porta el botó
   gran cap a l'eina. Les rutes són literals perquè este mòdul no importa
   res; systemPages.test.js les confronta amb RUTA_CONSOLA i amb les pàgines
   de la Consola. Fora de desenvolupament, /consola demana el rol de
   superadmin (App.jsx, RutaConsola).
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
   Derogat de l'Onada 8 que la seua targeta porte el botó «com El Xat»: sense
   `targeta`, la targeta pinta les etiquetes; amb `final`, la pàgina repetix
   el botó després dels sis paràgrafs.
   Pendent de decisió (MarIA o el Mestre) · Esta porta no mira l'entorn. Quan
   eren plugins, la revisió P7-A deixava inert el seu «Obrir» fora de
   desenvolupament (useDestiDelPlugin), perquè les dades de la Consola
   (/__iaia/*) només les servix `vite serve`. Cap ordre ho ha derogat. */
const OBRIR_CONSOLA = Object.freeze({
  id: 'obrir-consola',
  text: Object.freeze(['section.consola.obrir', 'Obrir la Consola']),
  desti: '/consola',
  final: true
});
const OBRIR_CERVELL = Object.freeze({
  id: 'obrir-cervell',
  text: Object.freeze(['section.cervell.obrir', 'Obrir el Cervell']),
  desti: '/consola/explorador',
  final: true
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
 * la seua pàgina porta el botó «Obrir…» cap a l'eina.
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
 * Derogat de l'Onada 8 que el Panell de Control pinte les tres (Consola,
 * Cervell i Disseny) a «Maquinària i Sistema»: ixen del Panell i les seues
 * targetes viuen només al Mur (i al Calendari i incrustades), sense botó i
 * amb Categoria i Etiqueta.
 * Ordre del Mestre (261026_2126; prompt i pla 261026_2130, tasca 1; P1-38) ·
 * «Descàrregues i Aplicacions» viu a /page/descarregues (PageDetailSection,
 * sense component propi) i la seua targeta ix al Mur com les germanes.
 * /descarregues n'és l'adreça curta (App.jsx, una redirecció) i la porta el
 * botó «Descarrega l'App» de l'accés sense sessió del Xat (AccesAlXat). Sense
 * acció gran: el prompt diu `accio: null`, i ometre-la és el mateix
 * (accioDeclarada torna null), com Drets d'autor.
 * Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 de Gemini i G5-01 de
 * Codex) · Dins de l'app nativa no hi és: ni la targeta ni la pàgina. Nomena
 * Android, Google Play i l'APK, i la regla 2.3.10 de l'App Store no admet
 * noms d'altres plataformes dins de l'app; amagar només el botó no bastava.
 * Ho diu la marca `nomesWeb` del descriptor (esPaginaVisible).
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
  { key: 'drets-autor', isAvis: false, href: '/page/drets-autor' },
  { key: 'descarregues', isAvis: false, href: '/page/descarregues', nomesWeb: true }
].map((page) => Object.freeze(page)));

/**
 * Ordre del Mestre (261027) · Si la pàgina del sistema `clau` es mostra: una
 * pàgina `nomesWeb` no ix dins de l'app nativa (ni al Mur, ni al Calendari,
 * ni per la seua ruta). Pur: qui crida diu si és l'app nativa (esAppNativa,
 * config/origenPublic.js), perquè este mòdul no importa res. Una clau que no
 * és de SYSTEM_PAGES no la decidix ací: es mostra.
 */
export function esPaginaVisible(clau, { nativa = false } = {}) {
  if (!nativa) return true;
  return SYSTEM_PAGES.find((pagina) => pagina.key === clau)?.nomesWeb !== true;
}

/**
 * Ordre del Mestre (261007) · On porta el copyright d'una targeta
 * (UniversalCard) i de la capçalera d'una pàgina (PageFrame): SEMPRE a la
 * pàgina «Drets d'autor», siga quin siga el text («CC BY-NC-SA 4.0…»,
 * «© Pepet»…). Una sola font: la ruta de la seua entrada de SYSTEM_PAGES.
 */
export const RUTA_DRETS_AUTOR = SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor').href;

/* El descriptor de l'acció que declara una pàgina del sistema, o null. */
const accioDeclarada = (clau) => SYSTEM_PAGES.find((candidata) => candidata.key === clau)?.accio ?? null;

/**
 * Ordre del Mestre (261007) · La porta de l'acció gran d'una PÀGINA del
 * sistema ({ id, verb, desti, varietat }, la forma de PortesTargeta.jsx), o
 * null si la pàgina no en té (hui en tenen El Xat, la Consola i el Cervell).
 * `t` és el traductor de la interfície; sense, la reserva en valencià. Pur:
 * la pàgina la pinta amb PortaDePagina davall de l'H1. Les marques `targeta`
 * i `final` del descriptor no ixen al retorn.
 */
export function accioDeLaPagina(clau, t) {
  const accio = accioDeclarada(clau);
  if (!accio) return null;
  const [clauText, reserva] = accio.text;
  const verb = typeof t === 'function' ? t(clauText, reserva) : reserva;
  return { id: accio.id, verb: verb || reserva, desti: accio.desti, varietat: 'primari' };
}

/**
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · La
 * porta que la TARGETA d'una pàgina del sistema porta en lloc de les
 * etiquetes (Mur, Calendari, targeta incrustada i catàleg): la mateixa
 * d'accioDeLaPagina, però només si el descriptor la declara per a la targeta
 * (`targeta: true`; hui, només El Xat, ordre del 261007). Si no, null: la
 * targeta pinta les seues etiquetes. Pur.
 */
export function accioDeLaTargeta(clau, t) {
  return accioDeclarada(clau)?.targeta === true ? accioDeLaPagina(clau, t) : null;
}

/**
 * Onada 10 (261010; pla 261010_1121; decisió M2 del Mestre del 261010) ·
 * true quan la pàgina repetix el seu botó després del cos, dins de
 * div.sdp-pagina-accio, a més del de davall de l'H1 (`final: true`; hui, la
 * Consola i el Cervell). false en la resta, també sense acció. Pur.
 */
export function accioAlFinal(clau) {
  return accioDeclarada(clau)?.final === true;
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
