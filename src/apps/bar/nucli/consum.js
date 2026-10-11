/**
 * El Bar · nucli/consum.js — el consum TEÒRIC d'ingredients d'un torn: el que
 * les vendes han gastat del rebost del bar segons els escandalls de la carta.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: el lligam TPV → Rebost, «una
 * venda descompta estoc si l'article té composició») · El Bar no porta cap
 * magatzem d'existències: ací no es descompta res de cap lloc. Es calcula
 * QUÈ caldria descomptar, que és la meitat del lligam que es pot fer sense
 * inventar un estoc, i ix al full del tancament («Consum d'ingredients»).
 *
 *   consumDeVendes(tiquets, carta) → { ingredients, senseEscandall }
 *     ingredients     [{ ingredientId, nom, unitatBase, quantitat, quantitatBruta }]
 *                     per nom. `quantitat` és la neta que ha anat al plat;
 *                     `quantitatBruta`, la que cal haver comprat amb la minva
 *                     de l'ingredient (com costEscandall)
 *     senseEscandall  [{ producteId, nom, unitats }]  el venut que no té
 *                     escandall, o que el té trencat: no se'n sap el consum
 *
 * LES REGLES:
 *   · Només els tiquets TANCATS de VENDA i les línies que compten (les
 *     anul·lades, no). Una devolució NO torna res al rebost: el plat ja s'ha
 *     fet. (La llista de reposició de la nevera sí que resta devolucions: és
 *     una altra pregunta.)
 *   · L'escandall és el de la carta D'ARA (escandallDe, el mateix que el cost
 *     de la línia): la línia venuda en congela el cost, no la composició. Si
 *     la carta ha canviat des de la venda, el consum és el de la carta nova.
 *   · Un escandall de N racions gasta quantitat/N per unitat venuda. De cada
 *     parella escandall-ingredient es calculen la neta (unitats × quantitat /
 *     N) i la bruta (la mateixa quantitat exacta, dividida pel que
 *     s'aprofita): cada una s'arrodoneix UNA sola vegada, a la meitat cap
 *     amunt, en la unitat base (g, ml, u), i la bruta mai es fa des de la neta
 *     ja arrodonida. Tot en enters. Si un ingredient ix en dos escandalls, se
 *     sumen els dos arrodonits (un arrodoniment per parella, no per ingredient).
 *   · Un escandall amb un ingredient que no existix o no és vàlid no es conta
 *     a mitges: el producte va a `senseEscandall`.
 *   · La variant venuda ha de ser encara a la carta: una variant esborrada
 *     no agafa l'escandall d'una altra; va a `senseEscandall`.
 *
 * EL QUE NO CONTA (límits coneguts, correcció del refutador, 261011, T4):
 *   · ELS MODIFICADORS NO GASTEN RES. «Beguda vegetal» en lloc de llet, o «pa
 *     sense gluten», canvien el preu de la línia però l'escandall és del
 *     producte o de la variant: el consum ix amb l'ingredient de l'escandall.
 *   · «CONSUM» ÉS BRUT I «PER PRODUCTE» ÉS NET. La fulla «Per producte» del
 *     tancament resta les devolucions (unitats venudes menys tornades); esta
 *     no, perquè el plat tornat ja s'ha cuinat. Les unitats d'un producte a les
 *     dues fulles poden no coincidir, i no és cap error.
 */
import { mitjaAmunt } from './comu.js';
import { escandallDe, validaIngredient } from './escandall.js';
import { compta } from './linia.js';

const esVendaTancada = (tiquet) => Boolean(tiquet) && tiquet.estat === 'tancada' && tiquet.tipus === 'venda' && Array.isArray(tiquet.linies);

/* L'escandall es pot calcular sencer: racions, quantitats i ingredients vàlids. */
function esCalculable(escandall, ingredients) {
  return Number.isSafeInteger(escandall.racions) && escandall.racions >= 1 && Array.isArray(escandall.ingredients)
    && escandall.ingredients.every(({ ingredientId, quantitat }) => Number.isSafeInteger(quantitat) && quantitat > 0
      && validaIngredient(ingredients.get(ingredientId)).ok);
}

/**
 * @param {object[]} tiquets  els tiquets del torn (vendes i devolucions)
 * @param {{ productes: object[], ingredients?: object[], escandalls?: object[] }} carta
 */
export function consumDeVendes(tiquets, carta) {
  const productes = new Map((carta?.productes || []).map((p) => [p.id, p]));
  const ingredients = new Map((carta?.ingredients || []).map((i) => [i.id, i]));
  /* Les unitats venudes de cada escandall, i les del que no en té. */
  const perEscandall = new Map();
  const sense = new Map();
  for (const tiquet of Array.isArray(tiquets) ? tiquets : []) {
    if (!esVendaTancada(tiquet)) continue;
    for (const linia of tiquet.linies) {
      if (!compta(linia) || !Number.isSafeInteger(linia.quantitat) || linia.quantitat < 1) continue;
      const producte = productes.get(linia.producteId);
      /* La variant venuda ha de ser encara a la carta: si no, escandallDe (pensat per a la
         carta, on una variant desconeguda vol dir «la del producte») agafaria l'escandall
         d'una altra variant (correcció del refutador, 261011, T4). */
      const teVariant = Boolean(producte) && (producte.variants || []).some((v) => v.id === linia.varianteId);
      const escandall = teVariant ? escandallDe(carta, producte, linia.varianteId) : null;
      if (escandall && esCalculable(escandall, ingredients)) {
        const actual = perEscandall.get(escandall.id) || { escandall, unitats: 0 };
        perEscandall.set(escandall.id, { escandall, unitats: actual.unitats + linia.quantitat });
      } else {
        const actual = sense.get(linia.producteId) || { producteId: linia.producteId, nom: linia.nomCongelat, unitats: 0 };
        sense.set(linia.producteId, { ...actual, unitats: actual.unitats + linia.quantitat });
      }
    }
  }
  const consum = new Map();
  for (const { escandall, unitats } of perEscandall.values()) {
    for (const { ingredientId, quantitat } of escandall.ingredients) {
      const ingredient = ingredients.get(ingredientId);
      const neta = mitjaAmunt(unitats * quantitat, escandall.racions);
      const actual = consum.get(ingredientId) || { ingredientId, nom: ingredient.nom, unitatBase: ingredient.unitatBase, quantitat: 0, quantitatBruta: 0 };
      consum.set(ingredientId, {
        ...actual,
        quantitat: actual.quantitat + neta,
        /* Des de la quantitat exacta (unitats × quantitat / racions), no des de la neta ja arrodonida. */
        quantitatBruta: actual.quantitatBruta + mitjaAmunt(unitats * quantitat * 100, escandall.racions * (100 - ingredient.minvaPercent))
      });
    }
  }
  const perNom = (a, b) => a.nom.localeCompare(b.nom, 'ca') || (a.id < b.id ? -1 : 1);
  return {
    ingredients: [...consum.values()].sort((a, b) => perNom({ nom: a.nom, id: a.ingredientId }, { nom: b.nom, id: b.ingredientId })),
    senseEscandall: [...sense.values()].sort((a, b) => perNom({ nom: a.nom, id: a.producteId }, { nom: b.nom, id: b.producteId }))
  };
}
