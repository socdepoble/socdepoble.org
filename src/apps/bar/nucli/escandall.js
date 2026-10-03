/**
 * El Bar · nucli/escandall.js — cost per ració, food cost i PVP suggerit
 * (disseny del Bar §A.3 i §A.5). Tot en enters.
 *
 *   ingredient { id, nom, unitatBase: 'g' | 'ml' | 'u', formatCompra: { quantitat, preuCents },
 *                minvaPercent (0-90), alergens, proveidor? }
 *   escandall  { id, producteId, varianteId?, racions ≥ 1, ingredients: [{ ingredientId, quantitat }],
 *                altresCostosCents, objectiuFoodCostPercent? (30) }
 *
 * Els ingredients barats (l'oli per ml) costen fraccions de cèntim: el cost
 * unitari va en micro-euros (1 cèntim = 10 000 µ€) i només es passa a
 * cèntims al final, arrodonint a la meitat cap amunt.
 * La minva vol dir que de cada unitat comprada se n'aprofita (100 − minva) %:
 * per a posar `quantitat` neta al plat, cal comprar quantitat / (1 − minva).
 */
import { errorBar, esSlug, mitjaAmunt, sostre } from './comu.js';
import { variantDe } from './cataleg.js';

export const UNITATS_BASE = Object.freeze(['g', 'ml', 'u']);
export const MICRO_PER_CENT = 10000;
export const OBJECTIU_PER_DEFECTE = 30;
const MAX_MINVA = 90;

const exigeix = (condicio, codi, missatge) => {
  if (!condicio) throw errorBar(codi, missatge);
};

/** Valida un ingredient. @returns {{ ok, errors }} */
export function validaIngredient(ingredient) {
  const errors = [];
  if (!esSlug(ingredient?.id)) errors.push('id: slug');
  if (!(typeof ingredient?.nom === 'string' && ingredient.nom.trim())) errors.push('nom');
  if (!UNITATS_BASE.includes(ingredient?.unitatBase)) errors.push('unitatBase: g | ml | u');
  const format = ingredient?.formatCompra;
  if (!(Number.isSafeInteger(format?.quantitat) && format.quantitat > 0)) errors.push('formatCompra.quantitat: enter > 0 en unitat base');
  if (!(Number.isSafeInteger(format?.preuCents) && format.preuCents >= 0)) errors.push('formatCompra.preuCents: cèntims ≥ 0');
  if (!(Number.isSafeInteger(ingredient?.minvaPercent) && ingredient.minvaPercent >= 0 && ingredient.minvaPercent <= MAX_MINVA)) errors.push('minvaPercent: enter de 0 a 90');
  return { ok: errors.length === 0, errors };
}

/** µ€ per unitat base d'un ingredient: preu del format × 10 000 / quantitat del format. */
export function costUnitariMicro(ingredient) {
  const { ok, errors } = validaIngredient(ingredient);
  exigeix(ok, 'INGREDIENT', `Ingredient no vàlid: ${errors.join('; ')}`);
  return mitjaAmunt(ingredient.formatCompra.preuCents * MICRO_PER_CENT, ingredient.formatCompra.quantitat);
}

/**
 * El cost d'una ració.
 * @returns {{ costRacioCents: number, costTotalMicro: number, linies: Array<{ ingredientId, nom, quantitat, quantitatBruta, costMicro }> }}
 */
export function costEscandall(escandall, ingredients) {
  exigeix(escandall && Number.isSafeInteger(escandall.racions) && escandall.racions >= 1, 'ESCANDALL', 'Les racions són un enter ≥ 1.');
  exigeix(Array.isArray(escandall.ingredients), 'ESCANDALL', 'Cal la llista d’ingredients.');
  const altres = escandall.altresCostosCents ?? 0;
  exigeix(Number.isSafeInteger(altres) && altres >= 0, 'ESCANDALL', 'Els altres costos són cèntims ≥ 0.');
  const perId = new Map((ingredients || []).map((i) => [i.id, i]));
  const linies = escandall.ingredients.map(({ ingredientId, quantitat }) => {
    const ingredient = perId.get(ingredientId);
    exigeix(ingredient, 'INGREDIENT', `L'ingredient «${String(ingredientId)}» no existix.`);
    exigeix(Number.isSafeInteger(quantitat) && quantitat > 0, 'ESCANDALL', 'La quantitat de cada ingredient és un enter > 0 en unitat base.');
    const aprofitat = 100 - ingredient.minvaPercent;
    const unitari = costUnitariMicro(ingredient);
    return {
      ingredientId,
      nom: ingredient.nom,
      quantitat,
      quantitatBruta: mitjaAmunt(quantitat * 100, aprofitat),
      costMicro: mitjaAmunt(unitari * quantitat * 100, aprofitat)
    };
  });
  const costTotalMicro = linies.reduce((total, l) => total + l.costMicro, 0) + altres * MICRO_PER_CENT;
  return {
    costRacioCents: mitjaAmunt(costTotalMicro, escandall.racions * MICRO_PER_CENT),
    costTotalMicro,
    linies
  };
}

/**
 * L'escandall d'una variant: el que nomena la variant (`escandallId`) o el del
 * producte que no és d'una altra variant. null si no en té.
 */
export function escandallDe(carta, producte, varianteId) {
  const escandalls = carta?.escandalls || [];
  const variant = variantDe(producte, varianteId);
  if (variant?.escandallId) return escandalls.find((e) => e.id === variant.escandallId) || null;
  return escandalls.find((e) => e.producteId === producte?.id && (!e.varianteId || !variant || e.varianteId === variant.id)) || null;
}

/**
 * El cost en cèntims d'una unitat venuda (BAR-R6): el de l'escandall si en té
 * (null si l'escandall no es pot calcular), o el manual de la variant. El
 * mateix càlcul per a la carta i per a la línia que es ven.
 * @returns {{ escandall: object | null, costCents: number | null }}
 */
export function costDeVenda(carta, producte, varianteId) {
  const escandall = escandallDe(carta, producte, varianteId);
  if (escandall) {
    try {
      return { escandall, costCents: costEscandall(escandall, carta.ingredients).costRacioCents };
    } catch {
      return { escandall, costCents: null };
    }
  }
  const cost = variantDe(producte, varianteId)?.costCents;
  return { escandall: null, costCents: Number.isSafeInteger(cost) ? cost : null };
}

/**
 * Food cost en per mil sobre el preu SENSE IVA: cost / (pvp × 100 / (100 + iva)).
 * null si el PVP és 0.
 */
export function foodCostPermil(costCents, pvpCents, ivaPercent) {
  exigeix(Number.isSafeInteger(costCents) && costCents >= 0, 'IMPORT', 'El cost és cèntims ≥ 0.');
  exigeix(Number.isSafeInteger(pvpCents) && pvpCents >= 0, 'IMPORT', 'El PVP és cèntims ≥ 0.');
  exigeix(Number.isSafeInteger(ivaPercent) && ivaPercent >= 0 && ivaPercent <= 100, 'IVA', 'L’IVA és un enter de 0 a 100.');
  if (pvpCents === 0) return null;
  return mitjaAmunt(costCents * 1000 * (100 + ivaPercent), pvpCents * 100);
}

/**
 * El PVP (amb IVA) perquè el food cost siga l'objectiu, arrodonit cap amunt
 * al pas (10 cèntims per defecte): pvp = cost × (100 + iva) / objectiu.
 */
export function pvpSuggerit(costCents, objectiuPercent = OBJECTIU_PER_DEFECTE, ivaPercent = 10, pasCents = 10) {
  exigeix(Number.isSafeInteger(costCents) && costCents >= 0, 'IMPORT', 'El cost és cèntims ≥ 0.');
  exigeix(Number.isSafeInteger(objectiuPercent) && objectiuPercent >= 1 && objectiuPercent <= 100, 'OBJECTIU', 'L’objectiu és un percentatge d’1 a 100.');
  exigeix(Number.isSafeInteger(ivaPercent) && ivaPercent >= 0 && ivaPercent <= 100, 'IVA', 'L’IVA és un enter de 0 a 100.');
  exigeix(Number.isSafeInteger(pasCents) && pasCents >= 1, 'PAS', 'El pas és un enter de cèntims ≥ 1.');
  return sostre(costCents * (100 + ivaPercent), objectiuPercent * pasCents) * pasCents;
}

/** Text d'un per mil com a percentatge amb un decimal: 284 → «28,4 %». */
export function textPermil(permil) {
  if (!Number.isSafeInteger(permil)) return '—';
  return `${Math.floor(permil / 10)},${permil % 10} %`;
}
