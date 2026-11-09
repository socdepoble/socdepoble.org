/** La Parròquia: historical source catalogue. Data loads on demand, never at startup. */
import { universalItemCataleg } from '../cataleg/universalItemCataleg.js';
export const CATEGORIES_HOSTALERIA = Object.freeze([
  { codi: 'B1', id: 'cafeteria', nom: 'Cafeteria', emoji: '☕️', icona: 'Coffee' },
  { codi: 'B2', id: 'refrescs', nom: 'Refrescos', emoji: '🥤', icona: 'CupSoda' },
  { codi: 'B3', id: 'cerveseria', nom: 'Cerveseria', emoji: '🍺', icona: 'Beer' },
  { codi: 'B4', id: 'vins-i-caves', nom: 'Celler', emoji: '🍷', icona: 'Wine' },
  { codi: 'B5', id: 'licoreria', nom: 'Licoreria', emoji: '🥃', icona: 'Martini' },
  { codi: 'M1', id: 'plats-combinats', nom: 'Plats', emoji: '🍽️', icona: 'UtensilsCrossed' },
  { codi: 'M2', id: 'entrepans', nom: 'Entrepans', emoji: '🥖', icona: 'Sandwich' },
  { codi: 'M3', id: 'torrades', nom: 'Torrades', emoji: '🍞', icona: 'Wheat' },
  { codi: 'M4', id: 'tapes', nom: 'Tapes', emoji: '🍢', icona: 'Utensils' },
  { codi: 'M5', id: 'postres', nom: 'Postres i Gelats', emoji: '🍎', icona: 'IceCreamCone' }
].map(Object.freeze));

/* Preserve the existing build opt-in for the business's purchase costs.
   Sanejament R15 (PRIV-06) · El repositori porta la instantània sense costos de compra
   (parroquiaDades.generated.json: cap preuPackCents, recarrecEquivalenciaPercent ni cellesOrigen).
   La completa (parroquiaDades.privat.json, fora de git, de tooling/menjarIBeure/importaParroquia.py)
   es llig en DEV o amb l'opt-in només si és al disc: la glob no falla quan no hi és. */
const importaDades = import.meta.env.DEV || import.meta.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA === '1'
  ? () => (Object.values(import.meta.glob('./parroquiaDades.privat.json'))[0] ?? (() => import('./parroquiaDades.generated.json')))()
  : null;

/** Els camps de compra que només porta la instantània completa (local). */
export const CAMPS_PRIVATS_TARIFA = Object.freeze(['cellesOrigen', 'preuPackCents', 'recarrecEquivalenciaPercent']);

export const catalegParroquiaDisponible = () => Boolean(importaDades);

/** A new copy per consumer: editing a recipe cannot mutate another loaded catalogue. */
export async function carregaCatalegParroquia() {
  if (!importaDades) throw new Error('La carta històrica de La Parròquia no està inclosa en este build.');
  const { default: dades } = await importaDades();
  return structuredClone(dades);
}

const clauNom = (nom) => String(nom ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ca').replace(/\s+/g, ' ').trim();

/** Exact category and name, with accent/whitespace equivalence only. No inferred recipe match. */
export function tarifesDeProducte(dades, producte) {
  return (dades?.tarifes || []).filter((tarifa) => tarifa.categoria === producte.categoria && clauNom(tarifa.nom) === clauNom(producte.nom));
}

/**
 * Add provenance to an already parsed Bar seed. The old import and image map
 * remain readable. B5C belongs to B5, while the two open administrative items
 * stay in Altres instead of inventing an eleventh hospitality category.
 */
export function enriqueixCartaParroquia(carta, dades) {
  const perHandle = new Map(dades.productes.map((p) => [p.handle, p]));
  const perRef = new Map(dades.variants.map((v) => [v.ref, v]));
  const categories = CATEGORIES_HOSTALERIA.map((c, ordre) => ({ ...c, ordre, visible: true }));
  if (carta.productes.some((p) => !perHandle.get(p.handle)?.categoria)) {
    categories.push({ id: 'altres', nom: 'Altres', ordre: categories.length, visible: true, administrativa: true });
  }
  const productes = carta.productes.map((producte) => {
    const origen = perHandle.get(producte.handle);
    if (!origen) throw new Error('La carta i la instantània de La Parròquia no corresponen.');
    const categoria = CATEGORIES_HOSTALERIA.find((c) => c.codi === origen.categoria);
    const tarifes = tarifesDeProducte(dades, origen);
    return {
      ...producte,
      categoriaOrigenId: producte.categoriaId,
      categoriaId: categoria?.id || 'altres',
      categoriaHostaleria: categoria?.codi || null,
      variants: producte.variants.map((variant) => {
        const ref = perRef.get(variant.ref);
        if (!ref || ref.handle !== producte.handle) throw new Error('Una variant no correspon al seu REF original.');
        return { ...variant, font: { cataleg: 'la-parroquia', fila: ref.fila, ref: ref.ref },
          costCentsOrigen: ref.costCentsOrigen, costEstat: ref.costCentsOrigen > 0 ? 'informat' : 'pendent', costBaseFiscal: 'desconegut' };
      }),
      grupsModificadorsPendents: [...origen.grupsModificadorsOrigen],
      alergensEstat: 'pendent',
      font: { cataleg: 'la-parroquia', fila: origen.fila, handle: origen.handle },
      comptabilitatOrigen: tarifes.map((t) => ({ ...t })),
    };
  });
  return { ...carta, categories, productes, grupsPendents: structuredClone(dades.grupsModificadors),
    font: { cataleg: 'la-parroquia', naturalesa: dades.naturalesa, fonts: structuredClone(dades.fonts) } };
}

/** Same product identity and real CSV provenance in the common catalogue envelope. */
export function itemsCatalegCartaParroquia(carta) {
  const csv = carta.font?.fonts?.find((font) => font.ruta.endsWith('/export_items.csv'));
  if (!csv) throw new Error('Falta la procedència CSV de la carta.');
  return carta.productes.map((producte) => universalItemCataleg({ id: producte.id, tipus: 'producte', nom: producte.nom,
    font: { document: csv.ruta, sha256: csv.sha256, fila: producte.font.fila, handle: producte.handle },
    dades: { categoriaHostaleria: producte.categoriaHostaleria, categoriaId: producte.categoriaId,
      variants: structuredClone(producte.variants), grupsModificadorsPendents: [...producte.grupsModificadorsPendents],
      alergensEstat: producte.alergensEstat, fontAlergens: producte.fontAlergens || null } }));
}
