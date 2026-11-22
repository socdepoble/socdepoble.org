/**
 * i18nConsolaA11y.js — Diccionari modular d'accessibilitat (a11y) de la Consola
 * en les 5 llengües oficials (ca, es, en, eu, gl).
 *
 * Quan la llengua és 'ca' (per defecte), totes les funcions retornen idènticament
 * byte a byte les cadenes originals en valencià.
 * Llig l'idioma de IdiomaConsolaContext, que proveïx ConsolaSection a partir de l'estat d'UI.
 */
import { createContext, useContext } from 'react';
/* v1.2.19 · fusió · Sense reserva al context d'UI. El kit llegia useUIActionsOpcional de UIContext, que les proves de
   la Consola simulen sense eixa exportació (314 fallades); llegir UIActionsContext d'objectesDeContext.js trencava la
   regla de propietaris (objectesDeContext.test.jsx: només l'importen els .jsx del seu context). La llengua la proveïxen
   ConsolaSection (la ruta /consola) i ConsolaIncrustada (l'element Consola de la Wiki i la pàgina node-zero; Gauntlet R2,
   L3R2-01): sense proveïdor, el diccionari parla valencià, com abans de R32.32. */

export const CODIS_IDIOMA_CONSOLA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export function codiIdiomaConsola(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return CODIS_IDIOMA_CONSOLA.includes(codi) ? codi : 'ca';
}

export const IdiomaConsolaContext = createContext(null);

export function useIdiomaConsola(idiomaProp) {
  const deConsola = useContext(IdiomaConsolaContext);
  if (idiomaProp) return codiIdiomaConsola(idiomaProp);
  return codiIdiomaConsola(deConsola || 'ca');
}

const EST = Object.freeze({
  botiguesIVerificadors: Object.freeze({
    ca: 'Botigues i verificadors',
    es: 'Tiendas y verificadores',
    en: 'Stores and verifiers',
    eu: 'Dendak eta egiaztatzaileak',
    gl: 'Tendas e verificadores'
  }),
  paginesConsola: Object.freeze({
    ca: 'Pàgines de la Consola',
    es: 'Páginas de la Consola',
    en: 'Console pages',
    eu: 'Kontsolaren orriak',
    gl: 'Páxinas da Consola'
  }),
  canalsEmpaquetatsTaxonomia: Object.freeze({
    ca: 'Canals, empaquetats i taxonomia',
    es: 'Canales, empaquetados y taxonomía',
    en: 'Channels, packages and taxonomy',
    eu: 'Kanalak, paketeak eta taxonomia',
    gl: 'Canles, empaquetados e taxonomía'
  }),
  paginesGovern: Object.freeze({
    ca: 'Pàgines del govern del Mestre',
    es: 'Páginas del gobierno del Mestre',
    en: 'Mestre governance pages',
    eu: 'Mestrearen gobernu-orriak',
    gl: 'Páxinas do goberno do Mestre'
  }),
  paginaEmpaquetatsNav: Object.freeze({
    ca: 'Pàgina dels empaquetats',
    es: 'Página de los empaquetados',
    en: 'Packages page',
    eu: 'Paketeen orria',
    gl: 'Páxina dos empaquetados'
  }),
  estatCadaCanal: Object.freeze({
    ca: 'Estat de cada canal',
    es: 'Estado de cada canal',
    en: 'Status of each channel',
    eu: 'Kanal bakoitzaren egoera',
    gl: 'Estado de cada canle'
  }),
  passosPublicacio: Object.freeze({
    ca: 'Passos de la publicació',
    es: 'Pasos de la publicación',
    en: 'Publication steps',
    eu: 'Argitalpenaren urratsak',
    gl: 'Pasos da publicación'
  }),
  panellNoTrobat: Object.freeze({
    ca: 'Panell no trobat',
    es: 'Panel no encontrado',
    en: 'Panel not found',
    eu: 'Panela ez da aurkitu',
    gl: 'Panel non atopado'
  }),
  veureFonts: Object.freeze({
    ca: 'Veure fonts',
    es: 'Ver fuentes',
    en: 'View sources',
    eu: 'Ikusi iturriak',
    gl: 'Ver fontes'
  }),
  llegintLaXifra: Object.freeze({
    ca: 'Llegint la xifra…',
    es: 'Leyendo la cifra…',
    en: 'Reading figure…',
    eu: 'Zifra irakurtzen…',
    gl: 'Lendo a cifra…'
  }),
  xifraNoTrobada: Object.freeze({
    ca: 'Xifra no trobada',
    es: 'Cifra no encontrada',
    en: 'Figure not found',
    eu: 'Zifra ez da aurkitu',
    gl: 'Cifra non atopada'
  }),
  detallDeLaPeca: Object.freeze({
    ca: 'Detall de la peça',
    es: 'Detalle de la pieza',
    en: 'Piece detail',
    eu: 'Piezaren xehetasuna',
    gl: 'Detalle da peza'
  }),
  filtresDelGraf: Object.freeze({
    ca: 'Filtres del graf',
    es: 'Filtros del grafo',
    en: 'Graph filters',
    eu: 'Grafoaren iragazkiak',
    gl: 'Filtros do grafo'
  }),
  estatPerDins: Object.freeze({
    ca: 'Estat per dins, el més greu primer',
    es: 'Estado interno, el más grave primero',
    en: 'Internal status, most severe first',
    eu: 'Barne-egoera, larriena lehenik',
    gl: 'Estado interno, o máis grave primeiro'
  }),
  quinsProblemesHiHa: Object.freeze({
    ca: 'Quins problemes hi ha',
    es: 'Qué problemas hay',
    en: 'Detected issues',
    eu: 'Zein arazo dauden',
    gl: 'Que problemas hai'
  })
});

const VERBS_DECISIO = Object.freeze({
  validat: Object.freeze({
    ca: 'Valida',
    es: 'Validar',
    en: 'Validate',
    eu: 'Baliozkotu',
    gl: 'Validar'
  }),
  certificat: Object.freeze({
    ca: 'Certifica',
    es: 'Certificar',
    en: 'Certify',
    eu: 'Ziurtatu',
    gl: 'Certificar'
  }),
  retornat: Object.freeze({
    ca: 'Retorna amb nota',
    es: 'Devolver con nota',
    en: 'Return with note',
    eu: 'Itzuli oharrarekin',
    gl: 'Devolver con nota'
  })
});

const PLANTILLES = Object.freeze({
  artefactesDe: (c, nom) => ({
    ca: `Artefactes de ${nom}, el més recent primer`,
    es: `Artefactos de ${nom}, el más reciente primero`,
    en: `Artifacts for ${nom}, newest first`,
    eu: `${nom} artefaktuak, berriena lehenik`,
    gl: `Artefactos de ${nom}, o máis recente primeiro`
  }[c]),
  veureFontsRebut: (c, quan, n) => ({
    ca: `Veure les fonts del rebut de ${quan} (${n === 1 ? '1 font' : `${n} fonts`})`,
    es: `Ver fuentes del recibo de ${quan} (${n === 1 ? '1 fuente' : `${n} fuentes`})`,
    en: `View sources for receipt from ${quan} (${n === 1 ? '1 source' : `${n} sources`})`,
    eu: `Ikusi iturriak: ${quan} agiriko ${n === 1 ? 'iturri 1' : `${n} iturri`}`,
    gl: `Ver fontes do recibo de ${quan} (${n === 1 ? '1 fonte' : `${n} fontes`})`
  }[c]),
  evidenciesRecompta: (c, n) => ({
    ca: `${n} evidències`,
    es: `${n} evidencias`,
    en: `${n} evidence items`,
    eu: `${n} ebidentzia`,
    gl: `${n} evidencias`
  }[c]),
  verbDecisio: (c, decisio) => VERBS_DECISIO[decisio]?.[c] ?? String(decisio ?? ''),
  verbDecisioAria: (c, decisio, id) => `${VERBS_DECISIO[decisio]?.[c] ?? String(decisio ?? '')} ${id}`
});

export function tca(idioma, clau, ...args) {
  const c = codiIdiomaConsola(idioma);
  if (Object.prototype.hasOwnProperty.call(EST, clau)) {
    return EST[clau][c];
  }
  const fn = PLANTILLES[clau];
  return typeof fn === 'function' ? fn(c, ...args) : String(clau ?? '');
}
