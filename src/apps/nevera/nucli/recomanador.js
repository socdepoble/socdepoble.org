/**
 * La Nevera de Casa · el RECOMANADOR de receptes (pur, determinista i
 * explicable: cap IA, cap xarxa, cap rellotge, cap atzar).
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6) · «Què puc cuinar amb el que
 * tinc?». Rep el receptari i el que hi ha al rebost, i torna cada recepta amb
 * el que se'n té, el que falta i per què va on va. Les mateixes entrades donen
 * sempre la mateixa eixida, en el mateix ordre.
 *
 *   recomana(receptes, existencies, { avui }) → [recomanació]
 *
 *   existència { ingredient, estat?, caduca? }
 *     ingredient  l'id d'un ingredient de la taula (ingredients.js)
 *     estat       'hi-ha' (per defecte) | 'se-n-acaba'. El que s'ha acabat no
 *                 és cap existència: qui crida no el passa
 *     caduca      'AAAA-MM-DD', si se sap. El Rebost de hui NO en guarda cap
 *                 (ni quantitats): el model les admet per a qui en tinga
 *   avui        'AAAA-MM-DD', el dia de qui crida (ací no hi ha rellotge).
 *               Sense, les dates de caducitat no es miren
 *
 *   recomanació {
 *     receptaId, nom, grup, obligatoris, tinc,
 *     falten        [{ id, nom, alternatives: [nom] }]  la llista de la compra
 *     tens          [id]  els ingredients que hi entren i que es tenen
 *     opcionalsTinc [id] · substitucions [{ enLlocDe: id, amb: id }]
 *     aprofita      [{ id, nom, dies, quan }]  el que caduca dins de la finestra
 *     frescos       [id] · sAcaben [id] · caducats [{ id, nom, des }]
 *     titular       «Tens 5 de 6 ingredients»
 *     frases        les raons, una per frase
 *     explicacio    el titular i les frases, en un sol text
 *   }
 *
 * LES REGLES, totes ací:
 *   · Un ingredient CADUCAT (caduca abans d'avui) no es compta mai com a
 *     tingut, i la recomanació ho diu («No es compta el que consta caducat»).
 *   · Un obligatori es té si es té ell o un dels seus substituts (`o`).
 *   · grup: 'a-punt' si no en falta cap; 'quasi' si en falten com a molt
 *     MAX_FALTEN_QUASI i se'n té algun; si no, 'lluny'.
 *   · ORDRE (estable): el grup; dins del grup, primer la recepta que gasta el
 *     que caduca abans (aprofitament: «gasta primer el que es fa malbé»);
 *     després la que menys en falta, la que més gènere fresc gasta, la de més
 *     cobertura i la que més opcionals té; a igualtat de tot, l'ordre del
 *     receptari.
 */
import { ingredientPerId, nomEnFrase } from './ingredients.js';

export const GRUPS_RECEPTA = Object.freeze(['a-punt', 'quasi', 'lluny']);
/** Els dies de marge en què un ingredient «caduca prompte» i mana en l'ordre. */
export const FINESTRA_APROFITAMENT = 7;
/** Fins a quants obligatoris poden faltar perquè la recepta siga «quasi». */
export const MAX_FALTEN_QUASI = 2;

const PATRO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIES_SETMANA = Object.freeze(['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte']);
const SENSE_PRESSA = Number.POSITIVE_INFINITY;

const esBixest = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
const diesDelMes = (a, m) => (m === 2 ? (esBixest(a) ? 29 : 28) : ([4, 6, 9, 11].includes(m) ? 30 : 31));

/**
 * Els dies que van de l'1 de gener de 1970 al dia 'AAAA-MM-DD' (calendari
 * gregorià, només aritmètica d'enters), o null si el text no és un dia que
 * existix.
 */
export function diaAbsolut(text) {
  const parts = typeof text === 'string' ? PATRO_DIA.exec(text) : null;
  if (!parts) return null;
  const a = Number(parts[1]);
  const m = Number(parts[2]);
  const d = Number(parts[3]);
  if (m < 1 || m > 12 || d < 1 || d > diesDelMes(a, m)) return null;
  /* L'any comença al març: el febrer (i el seu dia de traspàs) queda al final. */
  const any = m <= 2 ? a - 1 : a;
  const era = Math.floor(any / 400);
  const anyDeLEra = any - era * 400;
  const diaDeLAny = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1;
  const diaDeLEra = anyDeLEra * 365 + Math.floor(anyDeLEra / 4) - Math.floor(anyDeLEra / 100) + diaDeLAny;
  return era * 146097 + diaDeLEra - 719468;
}

/* «08/10» d'un dia 'AAAA-MM-DD' ja validat. */
const diaCurt = (text) => `${text.slice(8, 10)}/${text.slice(5, 7)}`;

/** Quan caduca, dit amb paraules: «hui», «demà», «dijous» (dins de la setmana) o «el 20/10». */
export function quanCaduca(dies, text) {
  if (dies === 0) return 'hui';
  if (dies === 1) return 'demà';
  if (dies >= 2 && dies <= 6) return DIES_SETMANA[(((diaAbsolut(text) + 4) % 7) + 7) % 7];
  return `el ${diaCurt(text)}`;
}

/** «a», «a i b», «a, b i c». */
export function enumera(noms) {
  if (noms.length < 2) return noms.join('');
  return `${noms.slice(0, -1).join(', ')} i ${noms[noms.length - 1]}`;
}

/*
 * El rebost per ingredient: { te, sAcaba, dies, caduca, caducat }.
 *   te       hi ha alguna existència que no ha caducat
 *   sAcaba   de tot el que no ha caducat, se n'acaba
 *   dies     els dies fins a la caducitat més pròxima del que no ha caducat (null sense data)
 *   caducat  l'última data, si TOT el que hi ha ha caducat (null si no)
 */
function rebostPerIngredient(existencies, avui) {
  const hui = diaAbsolut(avui);
  const mapa = new Map();
  for (const existencia of Array.isArray(existencies) ? existencies : []) {
    const ingredient = ingredientPerId(existencia?.ingredient);
    if (!ingredient) continue;
    const dia = hui === null ? null : diaAbsolut(existencia.caduca);
    const passat = dia !== null && dia < hui;
    const actual = mapa.get(ingredient.id) || { te: false, sAcaba: true, dies: null, caduca: null, caducat: null };
    if (passat) {
      if (!actual.caducat || existencia.caduca > actual.caducat) actual.caducat = existencia.caduca;
    } else {
      actual.te = true;
      if (existencia.estat !== 'se-n-acaba') actual.sAcaba = false;
      if (dia !== null && (actual.dies === null || dia - hui < actual.dies)) {
        actual.dies = dia - hui;
        actual.caduca = existencia.caduca;
      }
    }
    mapa.set(ingredient.id, actual);
  }
  for (const valor of mapa.values()) {
    if (valor.te) valor.caducat = null;
    else valor.sAcaba = false;
  }
  return mapa;
}

const nomDe = (id) => nomEnFrase(ingredientPerId(id));
const unics = (llista) => [...new Set(llista)];
/* La concordança del verb (correcció del refutador, 261011, R2): plural si són més d'un o si
   l'únic porta el nom en plural, que ho diu la taula (ingredient.plural), no la «s» final. */
const enPlural = (ids) => ids.length > 1 || (ids.length === 1 && ingredientPerId(ids[0]).plural);

function grupDe(tinc, falten) {
  if (falten === 0) return 'a-punt';
  return falten <= MAX_FALTEN_QUASI && tinc > 0 ? 'quasi' : 'lluny';
}

function titularDe(tinc, obligatoris) {
  if (tinc === obligatoris) return obligatoris === 1 ? 'Tens l’ingredient que cal' : `Tens els ${obligatoris} ingredients`;
  if (tinc === 0) return obligatoris === 1 ? 'No tens l’ingredient que cal' : `No tens cap dels ${obligatoris} ingredients`;
  return `Tens ${tinc} de ${obligatoris} ingredients`;
}

/* La recomanació d'una recepta sobre el rebost per ingredient. */
function recomanacioDe(recepta, rebost) {
  const tens = [];
  const opcionalsTinc = [];
  const falten = [];
  const substitucions = [];
  const caducats = [];
  let obligatoris = 0;
  for (const entrada of recepta.ingredients) {
    const candidats = [entrada.id, ...(entrada.o || [])].filter((id) => ingredientPerId(id));
    if (candidats.length === 0) continue;
    const trobat = candidats.find((id) => rebost.get(id)?.te) ?? null;
    if (!entrada.opcional) obligatoris += 1;
    if (trobat) {
      (entrada.opcional ? opcionalsTinc : tens).push(trobat);
      if (trobat !== candidats[0]) substitucions.push({ enLlocDe: candidats[0], amb: trobat });
      continue;
    }
    for (const id of candidats) {
      const des = rebost.get(id)?.caducat;
      if (des && !caducats.some((c) => c.id === id)) caducats.push({ id, nom: nomDe(id), des });
    }
    if (!entrada.opcional) falten.push({ id: candidats[0], nom: nomDe(candidats[0]), alternatives: candidats.slice(1).map(nomDe) });
  }

  const gastats = unics([...tens, ...opcionalsTinc]);
  const aprofita = gastats
    .map((id, posicio) => ({ id, posicio, ...rebost.get(id) }))
    .filter((e) => e.dies !== null && e.dies <= FINESTRA_APROFITAMENT)
    .sort((x, y) => x.dies - y.dies || x.posicio - y.posicio)
    .map((e) => ({ id: e.id, nom: nomDe(e.id), dies: e.dies, quan: quanCaduca(e.dies, e.caduca) }));
  const frescos = gastats.filter((id) => ingredientPerId(id).fresc);
  const sAcaben = gastats.filter((id) => rebost.get(id).sAcaba);

  const tinc = tens.length;
  const titular = titularDe(tinc, obligatoris);
  const frases = [];
  if (falten.length) {
    const noms = falten.map((f) => (f.alternatives.length ? `${f.nom} (o ${enumera(f.alternatives)})` : f.nom));
    frases.push(`${enPlural(falten.map((f) => f.id)) ? 'Falten' : 'Falta'}: ${enumera(noms)}.`);
  }
  for (const s of substitucions) frases.push(`Amb ${nomDe(s.amb)} en lloc de ${nomDe(s.enLlocDe)}.`);
  if (aprofita.length) frases.push(`Aprofites el que caduca abans: ${enumera(aprofita.map((e) => `${e.nom} (${e.quan})`))}.`);
  else if (frescos.length) frases.push(`Aprofites el fresc que tens: ${enumera(frescos.map(nomDe))}.`);
  if (sAcaben.length) frases.push(`${enPlural(sAcaben) ? 'Se n’acaben' : 'Se n’acaba'}: ${enumera(sAcaben.map(nomDe))}.`);
  if (caducats.length) frases.push(`No es compta el que consta caducat: ${enumera(caducats.map((c) => `${c.nom} (des del ${diaCurt(c.des)})`))}.`);
  if (opcionalsTinc.length) frases.push(`Si vols, també hi van (en tens): ${enumera(unics(opcionalsTinc).map(nomDe))}.`);

  return {
    receptaId: recepta.id,
    nom: recepta.nom,
    grup: grupDe(tinc, falten.length),
    obligatoris,
    tinc,
    falten,
    tens,
    opcionalsTinc,
    substitucions,
    aprofita,
    frescos,
    sAcaben,
    caducats,
    titular,
    frases,
    explicacio: [`${titular}.`, ...frases].join(' ')
  };
}

/**
 * Les recomanacions de tot el receptari, ordenades (vegeu la capçalera). Mai
 * llança: una recepta sense ingredients coneguts ix amb 0 de 0 i al final del
 * seu grup, i una existència d'un ingredient que la taula no coneix no compta.
 */
export function recomana(receptes, existencies, { avui } = {}) {
  const rebost = rebostPerIngredient(existencies, avui);
  const pressa = (r) => (r.aprofita.length ? r.aprofita[0].dies : SENSE_PRESSA);
  return (Array.isArray(receptes) ? receptes : [])
    .filter((recepta) => recepta && typeof recepta.id === 'string' && Array.isArray(recepta.ingredients))
    .map((recepta, posicio) => ({ r: recomanacioDe(recepta, rebost), posicio }))
    .sort((x, y) => GRUPS_RECEPTA.indexOf(x.r.grup) - GRUPS_RECEPTA.indexOf(y.r.grup)
      || (pressa(x.r) === pressa(y.r) ? 0 : pressa(x.r) - pressa(y.r))
      || x.r.falten.length - y.r.falten.length
      || y.r.frescos.length - x.r.frescos.length
      /* La cobertura tinc/obligatoris, comparada en creu (sense decimals). */
      || y.r.tinc * x.r.obligatoris - x.r.tinc * y.r.obligatoris
      || y.r.opcionalsTinc.length - x.r.opcionalsTinc.length
      || x.posicio - y.posicio)
    .map(({ r }) => r);
}

/**
 * La llista de la compra per a cuinar: els obligatoris que falten a les
 * receptes d'un grup ('quasi' per defecte: les que són a un o dos ingredients),
 * sense repetits i en l'ordre de les recomanacions.
 * @returns {Array<{ id: string, nom: string, receptes: string[] }>}
 */
export function faltaPerCuinar(recomanacions, { grup = 'quasi' } = {}) {
  const perId = new Map();
  for (const recomanacio of Array.isArray(recomanacions) ? recomanacions : []) {
    if (recomanacio.grup !== grup) continue;
    for (const falta of recomanacio.falten) {
      if (!perId.has(falta.id)) perId.set(falta.id, { id: falta.id, nom: ingredientPerId(falta.id).nom, receptes: [] });
      perId.get(falta.id).receptes.push(recomanacio.nom);
    }
  }
  return [...perId.values()];
}
