/**
 * Temporada · la temporalitat agrícola de fruites i hortalisses (API pública).
 *
 * Decisió del Mestre (261003): creuar la llista de la compra amb el calendari
 * agrícola i etiquetar cada producte amb la seua temporalitat. Este mòdul és
 * la part que no sap res de cap pantalla: rep un nom de producte (de la Nevera,
 * de Mercadona o escrit a mà) i un mes, i diu en quin moment de la temporada
 * és. El poden importar la Nevera i el Calendari per igual; cap dels dos el
 * necessita per a funcionar.
 *
 *   temporadaDe(nom)          → temporada | null
 *   estatTemporada(nom, mes)  → 'plena' | 'inici' | 'final' | 'fora' | null
 *   esDeTemporada(nom, mes)   → boolean (plena, inici o final)
 *   deTemporadaEn(mes)        → [temporada + { estat }], plena › inici › final
 *   estatEnMes(temporada, mes), tramsDeMesos(mesos), esMes(mes)
 *   TEMPORADES, ESTATS_TEMPORADA
 *   creaCalendari(entrades)   → la mateixa API sobre unes altres dades
 *
 * temporada = { clau, nom, tipus, mesos, plens, estats, sinonims }, congelada:
 *   mesos, plens  els mesos 1–12 en ordre; plens ⊆ mesos
 *   estats        els dotze estats, de gener (estats[0]) a desembre
 * El mes és SEMPRE un enter de 1 (gener) a 12 (desembre) que posa qui crida:
 * ací no hi ha rellotge. Un mes que no ho és torna null (o [] o false).
 *
 * EL CASAMENT D'UN NOM (temporadaDe):
 *   1. el nom es partix en paraules normalitzades (paraules.js) i se salten
 *      les de davant: «Mitja síndria», «Ram de tomaques», xifres i unitats;
 *   2. la primera que queda és el nucli del nom i ha de començar un sinònim:
 *      «Tomaca fregida» comença per tomaca, «Suc de taronja» no comença per
 *      cap fruita. Guanya el sinònim més llarg: «Meló d'Alger» és síndria,
 *      «All tendre» no és all. Una paraula d'ALIENES ací torna null;
 *   3. si darrere del sinònim hi ha una marca de producte no fresc
 *      (MARQUES_NO_FRESC: fregit, congelat, en conserva, amb…), torna null.
 *      Els noms de NO_SON_MARQUES («amanida») no són marca.
 * Els elaborats no tenen temporada. Si el dubte és entre etiquetar malament i
 * no etiquetar, no s'etiqueta.
 *
 * L'ESTAT D'UN MES dins de la temporada que no és plena: 'inici' si la plena
 * més pròxima ve després i 'final' si ja ha passat, sense eixir de la
 * temporada; a la mateixa distància, 'final'.
 */
import { ALIENES, DAVANT_DEL_NOM, FRUITES, HORTALISSES, MARQUES_NO_FRESC, NO_SON_MARQUES } from './dades.js';
import { arrel, paraules } from './paraules.js';

export const ESTATS_TEMPORADA = Object.freeze(['plena', 'inici', 'final', 'fora']);
const ORDRE_EN_TEMPORADA = Object.freeze({ plena: 0, inici: 1, final: 2 });
const EN_TEMPORADA = new Set(Object.keys(ORDRE_EN_TEMPORADA));
const DOTZE = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const CLAU = /^[a-z0-9][a-z0-9-]{0,63}$/;
const TRAM = /^(\d{1,2})(?:-(\d{1,2}))?$/;
const XIFRA = /^\d+$/;

/** true si el valor és un mes: un enter de 1 a 12. */
export const esMes = (mes) => Number.isInteger(mes) && mes >= 1 && mes <= 12;

/* El mes de la volta: 13 → 1, 0 → 12. */
const gira = (mes) => ((((mes - 1) % 12) + 12) % 12) + 1;

/* Les paraules del casament, ja normalitzades (les marques, per l'arrel). */
const SALTABLES = new Set(DAVANT_DEL_NOM.flatMap(paraules));
const PARAULES_ALIENES = new Set(ALIENES.flatMap(paraules));
const NO_MARQUES = new Set(NO_SON_MARQUES.flatMap(paraules).map(arrel));
const MARQUES = new Set(MARQUES_NO_FRESC.flatMap(paraules).map(arrel).flatMap((a) => (
  /* El participi valencià: congelat → congelad (congelada, congelades). */
  /[aiu]t$/.test(a) ? [a, `${a.slice(0, -1)}d`] : [a]
)).filter((a) => !NO_MARQUES.has(a)));

/**
 * Els mesos d'un text de dades.js ('10-6', '3-6,9-11') o d'una llista de
 * números, en ordre i sense repetits; null si alguna peça no és un mes.
 */
function mesosDe(valor) {
  if (Array.isArray(valor)) return valor.every(esMes) ? DOTZE.filter((mes) => valor.includes(mes)) : null;
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const dins = new Set();
  for (const peca of valor.split(',')) {
    const trobat = TRAM.exec(peca.trim());
    if (!trobat) return null;
    const inici = Number(trobat[1]);
    const fi = trobat[2] === undefined ? inici : Number(trobat[2]);
    if (!esMes(inici) || !esMes(fi)) return null;
    let mes = inici;
    dins.add(mes);
    while (mes !== fi) {
      mes = gira(mes + 1);
      dins.add(mes);
    }
  }
  return DOTZE.filter((mes) => dins.has(mes));
}

/* Els dotze estats d'una temporada, de gener a desembre. */
function estatsDeLAny(mesos, plens) {
  const dins = new Set(mesos);
  const plena = new Set(plens);
  /* Els passos fins a la plena més pròxima en un sentit, sense eixir de la temporada. */
  const passos = (mes, sentit) => {
    for (let pas = 1; pas < 12; pas += 1) {
      const altre = gira(mes + sentit * pas);
      if (!dins.has(altre)) return Infinity;
      if (plena.has(altre)) return pas;
    }
    return Infinity;
  };
  return DOTZE.map((mes) => {
    if (plena.has(mes)) return 'plena';
    if (!dins.has(mes)) return 'fora';
    return passos(mes, 1) < passos(mes, -1) ? 'inici' : 'final';
  });
}

/* Els mesos d'un tram [inici, fi] de tramsDeMesos, amb la volta de l'any. */
function mesosDelTram([inici, fi]) {
  const llista = [inici];
  let mes = inici;
  while (mes !== fi) {
    mes = gira(mes + 1);
    llista.push(mes);
  }
  return llista;
}

/*
 * Una entrada de dades com a temporada congelada, o null si no és vàlida.
 * Vàlida: clau, nom i tipus de text, mesos i plens que són mesos, plens dins
 * de mesos i almenys un mes ple a cada tram seguit de temporada (sense plena,
 * un tram no sabria on comença ni on acaba).
 */
function compila(entrada) {
  if (!entrada || typeof entrada !== 'object') return null;
  const { clau, nom, tipus } = entrada;
  if (typeof clau !== 'string' || !CLAU.test(clau) || typeof nom !== 'string' || !nom.trim()) return null;
  if (typeof tipus !== 'string' || !tipus.trim()) return null;
  const mesos = mesosDe(entrada.mesos);
  const plens = mesosDe(entrada.plens);
  if (!mesos || !plens || !plens.length || plens.some((mes) => !mesos.includes(mes))) return null;
  if (tramsDeMesos(mesos).some((tram) => !mesosDelTram(tram).some((mes) => plens.includes(mes)))) return null;
  const sinonims = (Array.isArray(entrada.sinonims) ? entrada.sinonims : []).filter((s) => typeof s === 'string' && s.trim());
  return Object.freeze({
    clau,
    nom: nom.trim(),
    tipus,
    mesos: Object.freeze(mesos),
    plens: Object.freeze(plens),
    estats: Object.freeze(estatsDeLAny(mesos, plens)),
    sinonims: Object.freeze(sinonims)
  });
}

/* Les frases (nom i sinònims) en arrels, indexades per la primera arrel. */
function indexa(temporades) {
  const perPrimera = new Map();
  const vistes = new Set();
  for (const temporada of temporades) {
    for (const text of [temporada.nom, ...temporada.sinonims]) {
      const arrels = paraules(text).map(arrel);
      const frase = arrels.join(' ');
      /* La mateixa frase en dues temporades: mana la primera. */
      if (!arrels.length || vistes.has(frase)) continue;
      vistes.add(frase);
      if (!perPrimera.has(arrels[0])) perPrimera.set(arrels[0], []);
      perPrimera.get(arrels[0]).push(Object.freeze({ arrels: Object.freeze(arrels), temporada }));
    }
  }
  return perPrimera;
}

/* El casament d'un nom (pas a pas, a la capçalera). */
function casa(nom, perPrimera) {
  const llista = paraules(nom);
  let nucli = 0;
  while (nucli < llista.length && (SALTABLES.has(llista[nucli]) || XIFRA.test(llista[nucli]))) nucli += 1;
  if (nucli === llista.length || PARAULES_ALIENES.has(llista[nucli])) return null;
  const arrels = llista.map(arrel);
  let millor = null;
  for (const frase of perPrimera.get(arrels[nucli]) || []) {
    if (millor && frase.arrels.length <= millor.arrels.length) continue;
    if (frase.arrels.every((a, i) => arrels[nucli + i] === a)) millor = frase;
  }
  if (!millor) return null;
  return arrels.slice(nucli + millor.arrels.length).some((a) => MARQUES.has(a)) ? null : millor.temporada;
}

/** L'estat d'una temporada (de temporadaDe o de TEMPORADES) en un mes; null si no n'hi ha. */
export function estatEnMes(temporada, mes) {
  const estats = temporada?.estats;
  return esMes(mes) && Array.isArray(estats) && estats.length === 12 ? estats[mes - 1] : null;
}

/**
 * Els trams seguits d'una llista de mesos, [inici, fi] amb la volta de l'any,
 * per a dir-ho amb paraules («d'octubre a juny»): [10, 11, 12, 1] → [[10, 1]];
 * l'any sencer és [[1, 12]]. Ordenats pel mes d'inici; el que no és mes no compta.
 */
export function tramsDeMesos(mesos) {
  const dins = new Set((Array.isArray(mesos) ? mesos : []).filter(esMes));
  if (dins.size === 12) return [[1, 12]];
  const trams = [];
  for (const mes of DOTZE) {
    if (!dins.has(mes) || dins.has(gira(mes - 1))) continue;
    let fi = mes;
    while (dins.has(gira(fi + 1))) fi = gira(fi + 1);
    trams.push([mes, fi]);
  }
  return trams;
}

/**
 * La mateixa API sobre unes altres dades: [{ clau, nom, tipus, mesos, plens,
 * sinonims }], amb els mesos com a dades.js ('10-6') o com a llista de números.
 * Les entrades que no són vàlides (vegeu compila: també un tram de temporada
 * sense cap mes ple) o que repetixen una clau no hi entren; mai no llança i no
 * toca les entrades.
 */
export function creaCalendari(entrades) {
  const claus = new Set();
  const temporades = Object.freeze((Array.isArray(entrades) ? entrades : []).map(compila).filter((temporada) => {
    if (!temporada || claus.has(temporada.clau)) return false;
    claus.add(temporada.clau);
    return true;
  }));
  const perPrimera = indexa(temporades);
  const temporadaDe = (nom) => casa(nom, perPrimera);
  const estatTemporada = (nom, mes) => (esMes(mes) ? estatEnMes(temporadaDe(nom), mes) : null);
  const esDeTemporada = (nom, mes) => EN_TEMPORADA.has(estatTemporada(nom, mes));
  const deTemporadaEn = (mes) => {
    if (!esMes(mes)) return [];
    return temporades
      .map((temporada, posicio) => ({ temporada, posicio, estat: temporada.estats[mes - 1] }))
      .filter(({ estat }) => estat !== 'fora')
      .sort((a, b) => ORDRE_EN_TEMPORADA[a.estat] - ORDRE_EN_TEMPORADA[b.estat] || a.posicio - b.posicio)
      .map(({ temporada, estat }) => Object.freeze({ ...temporada, estat }));
  };
  return Object.freeze({ temporades, temporadaDe, estatTemporada, esDeTemporada, deTemporadaEn });
}

/* El calendari de dades.js: primer les fruites i després les hortalisses. */
const CALENDARI = creaCalendari([
  ...FRUITES.map((entrada) => ({ ...entrada, tipus: 'fruita' })),
  ...HORTALISSES.map((entrada) => ({ ...entrada, tipus: 'hortalissa' }))
]);

/** Totes les temporades del calendari, congelades i en l'ordre de dades.js. */
export const TEMPORADES = CALENDARI.temporades;
export const { temporadaDe, estatTemporada, esDeTemporada, deTemporadaEn } = CALENDARI;
