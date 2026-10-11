/**
 * La Nevera de Casa · LES RECEPTES, la part de dades: el que hi ha a «A casa»
 * creuat amb el receptari de llavor. Cap React ni rellotge.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: «que l'estructura del Rebost
 * siga capaç de fer recomanacions de receptes basades en els ingredients
 * existents») · El recomanador és del nucli (recomanador.js); ací només es
 * traduïx l'estat de la Nevera a existències i les recomanacions a les formes
 * de l'esquelet comú (articles i línies).
 *
 *   existenciesDeCasa(estat)             el que consta a «A casa» com a ingredients
 *   recomanacionsDeCasa(estat)           el receptari ordenat pel recomanador
 *   seccionsDeReceptes()                 les tres seccions: tot, falta poc, falta més
 *   receptesVestides(recomanacions)      les receptes com a articles de la graella
 *   articleDIngredient(estat, id)        l'article de la Nevera d'un ingredient, o null
 *   liniesQueFalten(estat, llistaId, r)  el que cal comprar per a cuinar, en línies
 *   faltaDeRecepta(estat, llistaId, r)   el que falta d'UNA recepta i no és a la llista
 *   textosDeRecepta(recepta)             els ingredients, dits amb paraules
 *
 * EL QUE EL REBOST SAP, I RES MÉS: de cada article seguit, si «n'hi ha», «se
 * n'acaba» o «s'ha acabat» (nucli/nevera.js). No hi ha quantitats ni dates de
 * caducitat, i per això ací no es passa cap dia d'«avui»: el recomanador
 * ordena pel que falta i pel gènere fresc, i les seues regles de caducitat
 * (provades al nucli) esperen el dia que el Rebost en guarde.
 *   · «N'hi ha» i «Se n'acaba» són existències; «S'ha acabat», no.
 *   · Un article de base o propi és un ingredient només si el seu nom sencer és
 *     una forma de la taula (ingredients.js); un producte de botiga, només si
 *     el seu id és a la taula explícita de productes (ingredientDArticle).
 *
 * FRONTERA: només importa la porta del nucli; tot és pur (frontera.test.js).
 */
import {
  RECEPTES, articlePerId, articlesDe, faltaPerCuinar, ingredientDArticle, ingredientPerId, llistaPerId, nomEnFrase, receptaPerId, recomana
} from '../nucli/index.js';

/** Les seccions de «Receptes», en l'ordre en què es pinten (els grups del recomanador). */
export const SECCIONS_RECEPTES = Object.freeze([
  { id: 'a-punt', nom: 'Ho tens tot' },
  { id: 'quasi', nom: 'Et falta poc' },
  { id: 'lluny', nom: 'Et falta més' }
].map((seccio) => Object.freeze(seccio)));

/** El que consta a «A casa» com a existències del recomanador: [{ ingredient, estat }]. */
export function existenciesDeCasa(estat) {
  const existencies = [];
  for (const entrada of estat.casa) {
    if (entrada.estat === 'acabat') continue;
    const ingredient = ingredientDArticle(articlePerId(estat, entrada.articleId));
    if (ingredient) existencies.push({ ingredient: ingredient.id, estat: entrada.estat });
  }
  return existencies;
}

/** El receptari de llavor ordenat pel recomanador amb el que hi ha a «A casa». */
export function recomanacionsDeCasa(estat) {
  return recomana(RECEPTES, existenciesDeCasa(estat));
}

/** Les tres seccions { id, nom, ordre, visible }. */
export function seccionsDeReceptes() {
  return SECCIONS_RECEPTES.map((seccio, ordre) => ({ id: seccio.id, nom: seccio.nom, ordre, visible: true }));
}

/**
 * Les recomanacions com a articles de la graella: el nom del plat, què és
 * (subtítol) i l'explicació del recomanador a la línia de davall.
 */
export function receptesVestides(recomanacions) {
  return recomanacions.map((recomanacio) => ({
    id: recomanacio.receptaId,
    nom: recomanacio.nom,
    categoriaId: recomanacio.grup,
    subtitol: receptaPerId(recomanacio.receptaId)?.resum,
    secundari: recomanacio.explicacio,
    estat: 'normal'
  }));
}

/**
 * L'article de la Nevera que és este ingredient: primer el de base i després
 * un de propi (articlesDe en dona l'ordre, i no porta productes de botiga:
 * afegir el que falta posa sempre l'article genèric, mai una marca); null si
 * no n'hi ha cap.
 */
export function articleDIngredient(estat, ingredientId) {
  return articlesDe(estat).find((article) => ingredientDArticle(article)?.id === ingredientId) || null;
}

/* Els ingredients que ja són a la llista (per l'article de cada línia: de base, propi o de botiga). */
function ingredientsALaLlista(estat, llistaId) {
  const llista = llistaPerId(estat, llistaId);
  const ids = new Set();
  for (const linia of llista ? llista.linies : []) {
    const ingredient = ingredientDArticle(articlePerId(estat, linia.articleId));
    if (ingredient) ids.add(ingredient.id);
  }
  return ids;
}

/* Una línia de l'esquelet per a un ingredient que falta. `articleId` és l'article de la Nevera
   que el posarà a la llista, o null si encara no n'hi ha cap (es crearà com a propi, pel nom). */
function liniaDIngredient(estat, ingredientId, detall) {
  const ingredient = ingredientPerId(ingredientId);
  return {
    id: ingredient.id,
    articleId: articleDIngredient(estat, ingredient.id)?.id ?? null,
    nom: ingredient.nom,
    detall
  };
}

/**
 * «Cal comprar per a cuinar»: els ingredients que falten a les receptes que
 * són a un o dos ingredients («Et falta poc») i que encara no són a la llista,
 * amb les receptes que desbloquegen a la línia de davall.
 */
export function liniesQueFalten(estat, llistaId, recomanacions) {
  const jaHiSon = ingredientsALaLlista(estat, llistaId);
  return faltaPerCuinar(recomanacions)
    .filter((falta) => !jaHiSon.has(falta.id))
    .map((falta) => liniaDIngredient(estat, falta.id, `Per a: ${falta.receptes.join(', ')}`));
}

/** El que falta d'una recepta (els obligatoris) i encara no és a la llista, en línies. */
export function faltaDeRecepta(estat, llistaId, recomanacio) {
  const jaHiSon = ingredientsALaLlista(estat, llistaId);
  return (recomanacio ? recomanacio.falten : [])
    .filter((falta) => !jaHiSon.has(falta.id))
    .map((falta) => liniaDIngredient(estat, falta.id, undefined));
}

const ambQuantitat = (entrada) => {
  const nom = nomEnFrase(ingredientPerId(entrada.id));
  const alternatives = entrada.o.map((id) => nomEnFrase(ingredientPerId(id)));
  return `${alternatives.length ? `${nom} o ${alternatives.join(' o ')}` : nom} (${entrada.quantitat})`;
};

/**
 * Els ingredients d'una recepta, dits amb paraules, per al detall:
 * { ingredients, opcionals (o null), nota }.
 */
export function textosDeRecepta(recepta) {
  if (!recepta) return null;
  const obligatoris = recepta.ingredients.filter((entrada) => !entrada.opcional).map(ambQuantitat);
  const opcionals = recepta.ingredients.filter((entrada) => entrada.opcional).map(ambQuantitat);
  return {
    ingredients: `Per a ${recepta.racions} racions: ${obligatoris.join('; ')}.`,
    opcionals: opcionals.length ? `Si en tens, també: ${opcionals.join('; ')}.` : null,
    nota: 'Receptari orientatiu: les quantitats són aproximades i cada casa el fa a la seua manera.'
  };
}
