/**
 * La Nevera de Casa · LA TEMPORADA, la part de dades: la llista de la compra
 * creuada amb el calendari agrícola (decisió 1 del Mestre, 261003). Cap React
 * ni rellotge: el mes arriba de la vista (?mes= o el mes d'ara, a
 * Temporada.jsx). El calendari és src/utils/temporada: orientatiu i pendent de
 * revisió; el nucli i l'esquema de la Nevera no en saben res.
 *
 *   temporadaDArticle(article)               la temporada del calendari d'un article, o null
 *   grupDeTemporada(article, mes)            'plena' | 'inici' | 'final' | 'fora' | 'sense-dada'
 *   liniesPerTemporada(estat, llistaId, mes) les línies de la llista com a articles de
 *                                            la graella, amb el grup per categoria
 *   grupsDeTemporada(nomesDeTemporada)       les cinc seccions (amb el filtre, Fora
 *                                            i Sense dada no es veuen)
 *   seccionsDeTemporada()                    les tres de temporada, per al detall
 *   suggerimentsDeTemporada(estat, llistaId, mes)  el que és de temporada, per estat,
 *                                            per a posar-ho a la llista o llevar-ho
 *   esParametreMes, mesVei, nomDelMes, titolDeTemporada
 *
 * UN SOL CRITERI a les dues columnes (temporadaDArticle): només s'etiqueten
 * els articles de «Fruita i verdura» (de base o de botiga) i els propis, pel
 * seu nom; el nom d'un producte d'una altra secció no diu si és congelat o
 * elaborat. La resta va a «Sense dada de temporada», igual que el que el
 * calendari no coneix (plàtans). Un producte de tot l'any du l'estat que diu
 * el calendari (plena, inici o final): mai no és «Fora».
 * «De temporada» vol dir el mateix a tota la pantalla, el que diu el
 * calendari (esDeTemporada): plena, inici o final. El filtre del mig deixa
 * eixos tres grups, i el detall proposa eixos tres estats amb les mateixes
 * seccions.
 *
 * FRONTERA: els ajudants del mes, grupsDeTemporada i seccionsDeTemporada no
 * saben res de la Nevera; temporadaDArticle i grupDeTemporada només en coneixen la
 * forma de l'article ({ nom, categoriaId }); liniesPerTemporada i
 * suggerimentsDeTemporada llegixen l'estat amb el nucli. Tot és pur
 * (frontera.test.js ho vigila).
 */
import { ID_PROPIS, articlePerId, articlePerNom, liniesOrdenades } from '../nucli/index.js';
import { deTemporadaEn, estatEnMes, temporadaDe } from '../../../utils/temporada/index.js';

/** La secció on el nom de l'article diu si és fresc. */
const SECCIO_FRESCA = 'fruita-verdura';
const SENSE_DADA = 'sense-dada';
/** El prefix de l'id d'un suggeriment que encara no és cap article de la Nevera. */
const PREFIX_SINTETIC = 'temporada-';

/** Les seccions de «La llista per temporada», en l'ordre en què es pinten. */
export const GRUPS_TEMPORADA = Object.freeze([
  { id: 'plena', nom: 'Plena temporada', deTemporada: true },
  { id: 'inici', nom: 'Comença la temporada', deTemporada: true },
  { id: 'final', nom: 'S’acaba la temporada', deTemporada: true },
  { id: 'fora', nom: 'Fora de temporada', deTemporada: false },
  { id: SENSE_DADA, nom: 'Sense dada de temporada', deTemporada: false }
].map((grup) => Object.freeze(grup)));

const MESOS = Object.freeze([
  'gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'
]);

/** ?mes=: un mes de l'1 al 12 en la forma canònica (sense zeros, signes ni espais). */
export const esParametreMes = (valor) => typeof valor === 'string' && /^(?:[1-9]|1[0-2])$/.test(valor);

/** El mes que hi ha `pas` mesos més enllà, amb la volta de l'any: desembre + 1 és gener. */
export const mesVei = (mes, pas) => ((((mes - 1 + pas) % 12) + 12) % 12) + 1;

/** «Octubre» (cadena buida si no és un mes). */
export function nomDelMes(mes) {
  const nom = MESOS[mes - 1];
  return nom ? `${nom[0].toLocaleUpperCase('ca')}${nom.slice(1)}` : '';
}

/** «De temporada al gener», «De temporada a l’octubre». */
export function titolDeTemporada(mes) {
  const nom = MESOS[mes - 1];
  if (!nom) return 'De temporada';
  return `De temporada ${/^[aeiou]/.test(nom) ? `a l’${nom}` : `al ${nom}`}`;
}

/** La temporada del calendari d'un article ({ nom, categoriaId }): la del seu nom si és fresc o propi; si no, null. */
export function temporadaDArticle(article) {
  if (!article || (article.categoriaId !== SECCIO_FRESCA && article.categoriaId !== ID_PROPIS)) return null;
  return temporadaDe(article.nom);
}

/** El grup d'un article en un mes: el seu estat de temporada o 'sense-dada'. */
export function grupDeTemporada(article, mes) {
  return estatEnMes(temporadaDArticle(article), mes) ?? SENSE_DADA;
}

/**
 * Les línies que falten (en l'ordre de La compra) com a articles de la
 * graella: { id: articleId, nom, categoriaId: el grup, secundari:
 * l'especificació, estat: 'en-colleccio' }.
 */
export function liniesPerTemporada(estat, llistaId, mes) {
  return liniesOrdenades(estat, llistaId).map((linia) => {
    const article = articlePerId(estat, linia.articleId);
    return {
      id: linia.articleId,
      nom: article?.nom ?? linia.articleId,
      categoriaId: grupDeTemporada(article, mes),
      secundari: linia.especificacio || undefined,
      estat: 'en-colleccio'
    };
  });
}

/** Les cinc seccions { id, nom, ordre, visible }; el filtre «De temporada» amaga Fora i Sense dada. */
export function grupsDeTemporada(nomesDeTemporada = false) {
  return GRUPS_TEMPORADA.map((grup, ordre) => ({ id: grup.id, nom: grup.nom, ordre, visible: !nomesDeTemporada || grup.deTemporada }));
}

/**
 * Les seccions de «De temporada a…»: les tres de temporada del mig (Plena,
 * Comença, S'acaba), amb el mateix nom i el mateix ordre. L'estat el diu la
 * secció i la rajola no porta línia de davall: amb un nom de dues línies, la
 * línia de davall aixafava el quadre 1:1 de la marca (Pedra Seca §8).
 */
export function seccionsDeTemporada() {
  return grupsDeTemporada(true).filter((grup) => grup.visible);
}

/**
 * El que és de temporada en un mes (plena, inici i final, en l'ordre del
 * calendari), com a articles de la graella agrupats per estat. L'id de cada
 * un és el de l'article de la Nevera si n'hi ha (el de base amb el mateix id,
 * per les claus compartides, o el que es diu igual) o, si no, un id sintètic
 * ('temporada-<clau>').
 * És 'en-colleccio' si a la llista hi ha eixe article o, amb el criteri del
 * mig, una altra línia del mateix producte (un propi «Bròcoli», un producte de
 * botiga «Tomate»): llavors `articleId` és el de la línia, i el toc la lleva
 * en lloc de crear-ne una altra. Si no, `articleId` és el de l'article, o null
 * si no n'hi ha cap: el toc el crea com a propi amb el nom del calendari.
 */
export function suggerimentsDeTemporada(estat, llistaId, mes) {
  const linies = liniesOrdenades(estat, llistaId).map((linia) => linia.articleId);
  const aLaLlista = new Set(linies);
  /* La primera línia de la llista de cada clau del calendari. */
  const liniaDeClau = new Map();
  for (const articleId of linies) {
    const clau = temporadaDArticle(articlePerId(estat, articleId))?.clau;
    if (clau && !liniaDeClau.has(clau)) liniaDeClau.set(clau, articleId);
  }
  return deTemporadaEn(mes).map((temporada) => {
    const article = articlePerId(estat, temporada.clau) || articlePerNom(estat, temporada.nom);
    const enLlista = article && aLaLlista.has(article.id) ? article.id : liniaDeClau.get(temporada.clau) ?? null;
    return {
      id: article ? article.id : `${PREFIX_SINTETIC}${temporada.clau}`,
      articleId: enLlista ?? (article ? article.id : null),
      nom: article ? article.nom : temporada.nom,
      categoriaId: temporada.estat,
      estat: enLlista ? 'en-colleccio' : 'normal'
    };
  });
}
