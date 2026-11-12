/**
 * model.js — Arbre Genealògic · les formes de dades i la seua llista blanca.
 *
 *   Arbre     { id, titol, malnomCasa, poble, mas, arrelId, creat, modificat }
 *   Persona   { id, arbreId, nom, cognom1, cognom2, malnom, casa, lloc, sexe,
 *               naixement, defuncio, viva, ofici, generacio, estat, fonts,
 *               notes, origen, creada, modificada }
 *   Font      { id, tipus, titol, url, arxiuId, citacio, transcripcio, consultada }
 *   Relacio   { id, arbreId, tipus, de, a, evidencia, estat, fontIds, notes, creada, modificada }
 *   EstatEntrevista { arbreId, pas, respostes, completada, modificada }
 *
 * Cada netejador construïx un objecte NOU només amb els camps coneguts
 * (el que no hi és no passa mai, tampoc __proto__), coacciona els primitius i
 * llança un TypeError amb `camp` i `clau` si alguna cosa no és vàlida. Totes
 * les funcions són pures: el temps entra per `ara` (ISO) i `anyActual`.
 * Llei: cap funció d'ací crea una relació a partir d'un cognom.
 */
import { ESTATS, GENERACIONS, SEXES, TIPUS_FONT, TIPUS_RELACIO_TOTS, VIVA } from './constants.js';
import { dataDesconeguda, netejaData } from './dates.js';
import { estatDeVincle } from './parentiu.js';
import { PASSOS_ENTREVISTA, netejaRespostes } from './passosEntrevista.js';
import { MAX_FONTS_PER_PERSONA, enter, errorCamp, objectePla, text, urlSegura } from './segur.js';

const RE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const RE_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const RE_DIA = /^\d{4}-\d{2}-\d{2}$/;
const RE_ARXIU = /^[a-z0-9-]{1,40}$/;

/** Un identificador opac: lletres, xifres, '-' i '_', de 1 a 64 caràcters (els UUID hi caben). */
export const esIdValid = (valor) => typeof valor === 'string' && RE_ID.test(valor);
/** Un instant ISO 8601 de com a molt 30 caràcters que Date.parse entén. */
export const esInstantIso = (valor) => typeof valor === 'string' && valor.length <= 30 && RE_INSTANT.test(valor) && !Number.isNaN(Date.parse(valor));

function id(valor, camp) {
  if (!esIdValid(valor)) throw errorCamp(camp);
  return valor;
}
function idONull(valor, camp) {
  if (valor === null || valor === undefined || valor === '') return null;
  return id(valor, camp);
}
function instant(valor, camp) {
  if (!esInstantIso(valor)) throw errorCamp(camp);
  return valor;
}
function deLlista(valor, llista, camp, perDefecte) {
  if (valor === undefined || valor === null) return perDefecte;
  if (!llista.includes(valor)) throw errorCamp(camp);
  return valor;
}
/* El text amb el nom del camp a l'error. */
function textDe(valor, max, camp) {
  try {
    return text(valor, max);
  } catch {
    throw errorCamp(camp);
  }
}
function exigeixObjecte(cru, camp) {
  if (!objectePla(cru)) throw errorCamp(camp);
}

/** La llista blanca d'un arbre. */
export function netejaArbre(cru) {
  exigeixObjecte(cru, 'arbre');
  return {
    id: id(cru.id, 'id'),
    titol: textDe(cru.titol, 80, 'titol'),
    malnomCasa: textDe(cru.malnomCasa, 80, 'malnomCasa'),
    poble: textDe(cru.poble, 120, 'poble'),
    mas: textDe(cru.mas, 120, 'mas'),
    arrelId: idONull(cru.arrelId, 'arrelId'),
    creat: instant(cru.creat, 'creat'),
    modificat: instant(cru.modificat, 'modificat')
  };
}

/** La llista blanca d'una font (cita documental o testimoni oral). */
export function netejaFont(cru) {
  exigeixObjecte(cru, 'font');
  const urlCrua = textDe(cru.url, 2048, 'url');
  const url = urlSegura(urlCrua);
  if (urlCrua !== '' && url === '') throw errorCamp('url', 'https');
  let arxiuId = null;
  if (cru.arxiuId !== null && cru.arxiuId !== undefined && cru.arxiuId !== '') {
    if (typeof cru.arxiuId !== 'string' || !RE_ARXIU.test(cru.arxiuId)) throw errorCamp('arxiuId');
    arxiuId = cru.arxiuId;
  }
  let consultada = null;
  if (cru.consultada !== null && cru.consultada !== undefined && cru.consultada !== '') {
    if (typeof cru.consultada !== 'string' || !RE_DIA.test(cru.consultada) || Number.isNaN(Date.parse(cru.consultada))) throw errorCamp('consultada');
    consultada = cru.consultada;
  }
  return {
    id: id(cru.id, 'id'),
    tipus: deLlista(cru.tipus, TIPUS_FONT, 'tipus', 'altra'),
    titol: textDe(cru.titol, 200, 'titol'),
    url,
    arxiuId,
    citacio: textDe(cru.citacio, 500, 'citacio'),
    transcripcio: textDe(cru.transcripcio, 4000, 'transcripcio'),
    consultada
  };
}

/**
 * La llista blanca d'una persona. Els camps absents prenen el valor per
 * defecte (sexe 'U', viva 'desconegut', estat 'falta-confirmar', naixement
 * desconegut, defunció null = no consta); un valor present però invàlid
 * llança. El camp d'eixida `privada` no es desa mai.
 */
export function netejaPersona(cru, { anyActual } = {}) {
  exigeixObjecte(cru, 'persona');
  if (cru.fonts !== undefined && cru.fonts !== null && (!Array.isArray(cru.fonts) || cru.fonts.length > MAX_FONTS_PER_PERSONA)) {
    throw errorCamp('fonts', 'maxim');
  }
  const fonts = (cru.fonts || []).map(netejaFont);
  if (new Set(fonts.map((f) => f.id)).size !== fonts.length) throw errorCamp('fonts', 'repetit');
  let naixement;
  let defuncio = null;
  try {
    naixement = netejaData(cru.naixement, { anyActual });
  } catch (error) {
    if (!Number.isSafeInteger(anyActual)) throw error;
    throw errorCamp('naixement');
  }
  if (cru.defuncio !== null && cru.defuncio !== undefined) {
    try {
      defuncio = netejaData(cru.defuncio, { anyActual });
    } catch {
      throw errorCamp('defuncio');
    }
  }
  const origen = textDe(cru.origen, 40, 'origen');
  return {
    id: id(cru.id, 'id'),
    arbreId: id(cru.arbreId, 'arbreId'),
    nom: textDe(cru.nom, 80, 'nom'),
    cognom1: textDe(cru.cognom1, 80, 'cognom1'),
    cognom2: textDe(cru.cognom2, 80, 'cognom2'),
    malnom: textDe(cru.malnom, 80, 'malnom'),
    casa: textDe(cru.casa, 80, 'casa'),
    lloc: textDe(cru.lloc, 120, 'lloc'),
    sexe: deLlista(cru.sexe, SEXES, 'sexe', 'U'),
    naixement,
    defuncio,
    viva: deLlista(cru.viva, VIVA, 'viva', 'desconegut'),
    ofici: textDe(cru.ofici, 80, 'ofici'),
    generacio: deLlista(cru.generacio === '' ? null : cru.generacio, GENERACIONS, 'generacio', null),
    estat: deLlista(cru.estat, ESTATS, 'estat', 'falta-confirmar'),
    fonts,
    notes: textDe(cru.notes, 2000, 'notes'),
    origen: origen === '' ? null : origen,
    ...(Number.isSafeInteger(cru.ordreSosa) && cru.ordreSosa >= 0 ? { ordreSosa: cru.ordreSosa } : {}),
    creada: instant(cru.creada, 'creada'),
    modificada: instant(cru.modificada, 'modificada')
  };
}

function netejaEvidencia(cru) {
  if (cru !== undefined && cru !== null && !objectePla(cru)) throw errorCamp('evidencia');
  const e = cru || {};
  return { fontEscrita: e.fontEscrita === true, memoriaOral: e.memoriaOral === true, vincleExplicit: e.vincleExplicit === true };
}

/**
 * La llista blanca d'una relació. Sentit: progenitor → `de` és el progenitor
 * i `a` el fill; padri, testimoni i vei → `de` és el padrí, el testimoni o el
 * veí i `a` la persona; parella i germa són simètriques. L'estat, si no ve,
 * és el que dona l'evidència.
 */
export function netejaRelacio(cru) {
  exigeixObjecte(cru, 'relacio');
  if (!TIPUS_RELACIO_TOTS.includes(cru.tipus)) throw errorCamp('tipus');
  const de = id(cru.de, 'de');
  const a = id(cru.a, 'a');
  if (de === a) throw errorCamp('a', 'mateixa-persona');
  const evidencia = netejaEvidencia(cru.evidencia);
  if (cru.fontIds !== undefined && cru.fontIds !== null && (!Array.isArray(cru.fontIds) || cru.fontIds.length > MAX_FONTS_PER_PERSONA)) {
    throw errorCamp('fontIds', 'maxim');
  }
  return {
    id: id(cru.id, 'id'),
    arbreId: id(cru.arbreId, 'arbreId'),
    tipus: cru.tipus,
    de,
    a,
    evidencia,
    estat: deLlista(cru.estat, ESTATS, 'estat', estatDeVincle(evidencia)),
    fontIds: [...new Set((cru.fontIds || []).map((f) => id(f, 'fontIds')))],
    notes: textDe(cru.notes, 1000, 'notes'),
    creada: instant(cru.creada, 'creada'),
    modificada: instant(cru.modificada, 'modificada')
  };
}

/** La llista blanca de l'estat de l'entrevista (una per arbre). */
export function netejaEntrevista(cru) {
  exigeixObjecte(cru, 'entrevista');
  const pas = enter(cru.pas ?? 0, { min: 0, max: PASSOS_ENTREVISTA.length });
  if (pas === null) throw errorCamp('pas');
  return {
    arbreId: id(cru.arbreId, 'arbreId'),
    pas,
    respostes: netejaRespostes(cru.respostes),
    completada: cru.completada === true,
    modificada: cru.modificada === null || cru.modificada === undefined ? null : instant(cru.modificada, 'modificada')
  };
}

/** Un arbre nou i buit. */
export function creaArbre({ id: idArbre, titol = '', ara, ...camps } = {}) {
  return netejaArbre({ malnomCasa: '', poble: '', mas: '', arrelId: null, ...camps, id: idArbre, titol, creat: ara, modificat: ara });
}

/** Una persona nova amb els valors per defecte. */
export function creaPersona({ id: idPersona, arbreId, ara, ...camps } = {}, { anyActual } = {}) {
  return netejaPersona({
    sexe: 'U', viva: 'desconegut', estat: 'falta-confirmar', naixement: dataDesconeguda(), defuncio: null, fonts: [],
    ...camps, id: idPersona, arbreId, creada: ara, modificada: ara
  }, { anyActual });
}

/** Una relació nova: l'estat el dona l'evidència (estatDeVincle). */
export function creaRelacio({ id: idRelacio, arbreId, tipus, de, a, evidencia, fontIds = [], notes = '', ara } = {}) {
  const neta = netejaEvidencia(evidencia);
  return netejaRelacio({ id: idRelacio, arbreId, tipus, de, a, evidencia: neta, estat: estatDeVincle(neta), fontIds, notes, creada: ara, modificada: ara });
}

/** L'arbre complet d'un arbre encara sense persones. */
export function arbreBuit(arbre) {
  return { arbre, persones: [], relacions: [], entrevista: null };
}

const afig = (mapa, clau, valor) => {
  if (!mapa.has(clau)) mapa.set(clau, []);
  mapa.get(clau).push(valor);
};

/**
 * Els índexs per a recórrer l'arbre: perId, progenitorsDe (fill → progenitors),
 * fillsDe (progenitor → fills) i relacionsDe (persona → relacions que la toquen).
 * Les relacions amb una punta que no és a l'arbre no entren als índexs de
 * parentiu. Les llistes van ordenades: el resultat és determinista.
 */
export function indexa(complet) {
  const persones = complet?.persones || [];
  const relacions = complet?.relacions || [];
  const perId = new Map(persones.map((p) => [p.id, p]));
  const progenitorsDe = new Map();
  const fillsDe = new Map();
  const relacionsDe = new Map();
  for (const relacio of relacions) {
    if (!perId.has(relacio.de) || !perId.has(relacio.a)) continue;
    afig(relacionsDe, relacio.de, relacio);
    afig(relacionsDe, relacio.a, relacio);
    if (relacio.tipus === 'progenitor') {
      afig(progenitorsDe, relacio.a, relacio.de);
      afig(fillsDe, relacio.de, relacio.a);
    }
  }
  for (const mapa of [progenitorsDe, fillsDe]) {
    for (const [clau, ids] of mapa) mapa.set(clau, [...new Set(ids)].sort());
  }
  return { perId, progenitorsDe, fillsDe, relacionsDe };
}
