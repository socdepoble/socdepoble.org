/**
 * El Bar · nucli/cataleg.js — la carta: categories, productes, variants,
 * grups de modificadors i al·lèrgens (disseny del Bar §A.3 i §A.5).
 *
 *   carta { categories, productes, grups, ingredients, escandalls }
 *   categoria  { id (slug), nom, ordre, icona?, visible }
 *   producte   { id (slug), nom, categoriaId, variants[≥1], grupsModificadors[],
 *                ivaPercent?, alergens[], imatge: { slug, estat }, reposaNevera,
 *                desti, preuObert, actiu, ordre, exemple,
 *                canals?: { cartaDigital: boolean, perEmportar: boolean } }
 *   variant    { id, nom, preuCents (PVP amb IVA), ml?, costCents?, escandallId? }
 *   grup       { id, nom, min, max, opcions: [{ id, nom, deltaCents ≥ 0 }] }
 * Una carta importada de Loyverse (nucli/loyverse.js) porta, a més, el
 * `handle` del producte i el `ref` de cada variant: només per a traçar-los
 * en una importació nova; la validació no els mira.
 *
 * La primera variant és la de defecte. `min = 1, max = 1` vol dir elecció
 * obligatòria (el diàleg menut de la caixa). Els al·lèrgens són els 14 del
 * Reglament (UE) 1169/2011: informatius, els manté el bar. La llista
 * (ALERGENS, NOMS_ALERGENS) i la seua validació (validaAlergens: cada id dels
 * 14, sense repetits) són del contracte comú del producte
 * (utils/productes/producteUniversal.js, ordre del Mestre, 261006): ací
 * només es reexporten, amb els mateixos valors i en el mateix ordre.
 *
 * Els dos canals (ordre del Mestre, 261006): «a la carta digital» i «per
 * emportar». El contracte és el del producte universal
 * (utils/productes/producteUniversal.js): sense `canals`, el producte és als
 * dos, i la carta d'ara no canvia. La caixa no mira els canals.
 */
import { ALERGENS, NOMS_ALERGENS, esDelCanal, validaAlergens, validaCanals } from '../../../utils/productes/producteUniversal.js';
import { errorBar, esSlug, textNet } from './comu.js';

/* Els 14 al·lèrgens i els seus noms: els del contracte comú, reexportats perquè cap import del Bar es trenque. */
export { ALERGENS, NOMS_ALERGENS };

export const DESTINS = Object.freeze(['barra', 'cuina']);
export const ESTATS_IMATGE = Object.freeze(['marcador', 'definitiva']);

const MAX_NOM_PRODUCTE = 60;
const MAX_NOM = 40;

const esEnterEntre = (valor, minim, maxim) => Number.isSafeInteger(valor) && valor >= minim && valor <= maxim;
const esText = (valor, maxim) => typeof valor === 'string' && valor.trim() !== '' && valor.length <= maxim;

function idsRepetits(llista, on, errors) {
  const vistos = new Set();
  for (const element of llista) {
    if (vistos.has(element?.id)) errors.push(`${on}: id repetit «${element.id}»`);
    vistos.add(element?.id);
  }
}

function validaCategories(categories, errors) {
  if (!Array.isArray(categories)) { errors.push('categories: ha de ser una llista'); return new Set(); }
  idsRepetits(categories, 'categories', errors);
  categories.forEach((c, i) => {
    const on = `categories[${i}]`;
    if (!esSlug(c?.id)) errors.push(`${on}: l'id ha de ser un slug`);
    if (!esText(c?.nom, MAX_NOM)) errors.push(`${on}: cal un nom de fins a ${MAX_NOM} caràcters`);
    if (!Number.isSafeInteger(c?.ordre)) errors.push(`${on}: l'ordre ha de ser un enter`);
    if (typeof c?.visible !== 'boolean') errors.push(`${on}: visible ha de ser booleà`);
    if (c?.icona !== undefined && !(typeof c.icona === 'string' && /^[A-Z][A-Za-z]{1,30}$/.test(c.icona))) errors.push(`${on}: la icona és un nom de lucide`);
  });
  return new Set(categories.map((c) => c?.id));
}

function validaGrups(grups, errors) {
  if (!Array.isArray(grups)) { errors.push('grups: ha de ser una llista'); return new Set(); }
  idsRepetits(grups, 'grups', errors);
  grups.forEach((g, i) => {
    const on = `grups[${i}]`;
    if (!esSlug(g?.id)) errors.push(`${on}: l'id ha de ser un slug`);
    if (!esText(g?.nom, MAX_NOM)) errors.push(`${on}: cal un nom`);
    if (!Array.isArray(g?.opcions) || g.opcions.length === 0) { errors.push(`${on}: cal almenys una opció`); return; }
    idsRepetits(g.opcions, `${on}.opcions`, errors);
    g.opcions.forEach((o, j) => {
      if (!esSlug(o?.id)) errors.push(`${on}.opcions[${j}]: l'id ha de ser un slug`);
      if (!esText(o?.nom, MAX_NOM)) errors.push(`${on}.opcions[${j}]: cal un nom`);
      if (!esEnterEntre(o?.deltaCents, 0, 100000)) errors.push(`${on}.opcions[${j}]: deltaCents ha de ser un enter ≥ 0`);
    });
    if (!esEnterEntre(g.min, 0, g.opcions.length)) errors.push(`${on}: min ha de ser un enter entre 0 i el nombre d'opcions`);
    if (!esEnterEntre(g.max, 1, g.opcions.length) || g.max < g.min) errors.push(`${on}: max ha de ser un enter ≥ 1, ≥ min i ≤ opcions`);
  });
  return new Set(grups.map((g) => g?.id));
}

function validaVariants(p, on, errors) {
  if (!Array.isArray(p.variants) || p.variants.length === 0) { errors.push(`${on}: cal almenys una variant`); return; }
  idsRepetits(p.variants, `${on}.variants`, errors);
  p.variants.forEach((v, j) => {
    const onV = `${on}.variants[${j}]`;
    if (!esSlug(v?.id)) errors.push(`${onV}: l'id ha de ser un slug`);
    if (!esText(v?.nom, MAX_NOM)) errors.push(`${onV}: cal un nom`);
    if (!esEnterEntre(v?.preuCents, 0, 10000000)) errors.push(`${onV}: preuCents ha de ser un enter ≥ 0`);
    if (v?.costCents !== undefined && !esEnterEntre(v.costCents, 0, 10000000)) errors.push(`${onV}: costCents ha de ser un enter ≥ 0`);
    if (v?.ml !== undefined && !esEnterEntre(v.ml, 1, 100000)) errors.push(`${onV}: ml ha de ser un enter positiu`);
    if (v?.escandallId !== undefined && !esSlug(v.escandallId)) errors.push(`${onV}: escandallId ha de ser un slug`);
  });
}

function validaProductes(productes, categories, grups, errors) {
  if (!Array.isArray(productes)) { errors.push('productes: ha de ser una llista'); return; }
  idsRepetits(productes, 'productes', errors);
  productes.forEach((p, i) => {
    const on = `productes[${i}]`;
    if (!p || typeof p !== 'object') { errors.push(`${on}: ha de ser un objecte`); return; }
    if (!esSlug(p.id)) errors.push(`${on}: l'id ha de ser un slug`);
    if (!esText(p.nom, MAX_NOM_PRODUCTE)) errors.push(`${on}: cal un nom de fins a ${MAX_NOM_PRODUCTE} caràcters`);
    if (!categories.has(p.categoriaId)) errors.push(`${on}: la categoria «${String(p.categoriaId)}» no existix`);
    validaVariants(p, on, errors);
    if (!Array.isArray(p.grupsModificadors)) errors.push(`${on}: grupsModificadors ha de ser una llista`);
    else for (const id of p.grupsModificadors) if (!grups.has(id)) errors.push(`${on}: el grup «${String(id)}» no existix`);
    if (p.ivaPercent !== undefined && !esEnterEntre(p.ivaPercent, 0, 100)) errors.push(`${on}: ivaPercent ha de ser un enter de 0 a 100`);
    for (const error of validaAlergens(p.alergens)) errors.push(`${on}.${error}`);
    if (!p.imatge || !esSlug(p.imatge.slug) || !ESTATS_IMATGE.includes(p.imatge.estat)) errors.push(`${on}: imatge { slug, estat: marcador | definitiva }`);
    for (const camp of ['reposaNevera', 'preuObert', 'actiu', 'exemple']) {
      if (typeof p[camp] !== 'boolean') errors.push(`${on}: ${camp} ha de ser booleà`);
    }
    if (!DESTINS.includes(p.desti)) errors.push(`${on}: desti barra | cuina`);
    if (!Number.isSafeInteger(p.ordre)) errors.push(`${on}: l'ordre ha de ser un enter`);
    for (const error of validaCanals(p.canals)) errors.push(`${on}.${error}`);
  });
}

/**
 * Valida la carta sencera.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validaCataleg(carta) {
  const errors = [];
  if (!carta || typeof carta !== 'object') return { ok: false, errors: ['la carta ha de ser un objecte'] };
  const categories = validaCategories(carta.categories, errors);
  const grups = validaGrups(carta.grups, errors);
  validaProductes(carta.productes, categories, grups, errors);
  return { ok: errors.length === 0, errors };
}

/**
 * La carta d'un canal ('carta-digital' | 'emportar'): els productes actius
 * que hi són, en l'ordre de la carta. Un canal desconegut no en té cap.
 * Torna una llista nova i no toca la carta. Si la categoria es mostra o no,
 * ho decidix la vista.
 */
export function cartaDelCanal(carta, canal) {
  return (carta?.productes || [])
    .filter((p) => p?.actiu === true && esDelCanal(p, canal))
    .sort((a, b) => a.ordre - b.ordre);
}

/** La variant d'un producte (la primera si no se'n diu cap). */
export function variantDe(producte, varianteId) {
  const variants = producte?.variants || [];
  if (varianteId === undefined || varianteId === null) return variants[0] || null;
  return variants.find((v) => v.id === varianteId) || null;
}

/** Els grups de modificadors d'un producte, en el seu ordre. */
export function grupsDe(producte, grups) {
  const perId = new Map((grups || []).map((g) => [g.id, g]));
  return (producte?.grupsModificadors || []).map((id) => perId.get(id)).filter(Boolean);
}

/** Té un grup d'elecció obligatòria (min ≥ 1): el toc obri el diàleg menut. */
export function teGrupObligatori(producte, grups) {
  return grupsDe(producte, grups).some((g) => g.min >= 1);
}

/**
 * Les opcions triades, comprovades i congelades:
 *   opcions [{ grupId, opcioId }] → [{ grupId, opcioId, nomCongelat, deltaCents }]
 * Llança si un grup no és del producte, si l'opció no existix o si un grup
 * passa del seu màxim.
 */
export function resolModificadors(producte, grups, opcions = []) {
  if (!Array.isArray(opcions)) throw errorBar('MODIFICADORS', 'Les opcions han de ser una llista.');
  const delProducte = new Map(grupsDe(producte, grups).map((g) => [g.id, g]));
  const perGrup = new Map();
  const resolts = opcions.map(({ grupId, opcioId }) => {
    const grup = delProducte.get(grupId);
    if (!grup) throw errorBar('MODIFICADORS', `El grup «${String(grupId)}» no és d'este producte.`);
    const opcio = grup.opcions.find((o) => o.id === opcioId);
    if (!opcio) throw errorBar('MODIFICADORS', `L'opció «${String(opcioId)}» no és del grup «${grup.nom}».`);
    perGrup.set(grupId, (perGrup.get(grupId) || 0) + 1);
    if (perGrup.get(grupId) > grup.max) throw errorBar('MODIFICADORS', `«${grup.nom}» admet com a màxim ${grup.max}.`);
    return { grupId, opcioId, nomCongelat: opcio.nom, deltaCents: opcio.deltaCents };
  });
  return resolts;
}

/** Els grups obligatoris que encara no tenen prou opcions triades. */
export function grupsObligatorisPendents(producte, grups, opcions = []) {
  const triades = new Map();
  for (const { grupId } of opcions || []) triades.set(grupId, (triades.get(grupId) || 0) + 1);
  return grupsDe(producte, grups).filter((g) => (triades.get(g.id) || 0) < g.min).map((g) => g.id);
}

/**
 * El preu unitari d'una línia: el PVP de la variant més els modificadors.
 * `modificadors`: els resolts ({ deltaCents }) o les opcions crues amb `grups`.
 */
export function preuDeLinia(producte, varianteId, modificadors = []) {
  const variant = variantDe(producte, varianteId);
  if (!variant) throw errorBar('VARIANT', 'Esta variant no és del producte.');
  return variant.preuCents + modificadors.reduce((total, m) => total + (Number.isSafeInteger(m?.deltaCents) ? m.deltaCents : 0), 0);
}

/** L'IVA d'un producte: el seu o el de l'establiment. */
export function ivaDe(producte, ivaPerDefecte) {
  return Number.isSafeInteger(producte?.ivaPercent) ? producte.ivaPercent : ivaPerDefecte;
}

/** Nom curt de la variant per a la línia, només si el producte en té més d'una. */
export function nomVariant(producte, variant) {
  return (producte?.variants?.length || 0) > 1 ? textNet(variant?.nom, MAX_NOM) : null;
}
