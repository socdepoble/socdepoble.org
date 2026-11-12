/** Views over canonical literal sources, never a second recipe corpus.
 * Parroquia remains behind its existing build opt-in and dynamic loader. */
import { proposaCandidatsAlergens, resolMatriuAlergens, ESTAT_CANDIDATS_ALERGENS } from '../../utils/candidatsAlergens.js';
import { SHA256_PDF_QUE_DINEM } from './receptaEditorial.js';
import { ALERGENS_QUE_DINEM, empremtaRecepta } from './alergensQueDinem.js';

/** Les línies d'una altra recepta del llibre (o d'un dels seus blocs), per a les referències del lèxic («pilotes»,
 * «crema per farcir»). `perSlug` és receptaPerSlug: este mòdul no importa el corpus (el Bar també el carrega). */
export const resolutorDeReceptes = (perSlug) => (typeof perSlug !== 'function' ? null : (slug, bloc) => {
  const recepta = perSlug(slug);
  if (!recepta || !Array.isArray(recepta.ingredients)) return null;
  const blocs = bloc ? recepta.ingredients.filter((b) => b.titol === bloc) : recepta.ingredients;
  return blocs.length ? blocs.flatMap((b) => b.linies) : null;
});

function campLiteral(camp) {
  const [bloc, linia] = camp.slice(1).split('.');
  if (camp.startsWith('i')) return `ingredients[${bloc}].linies[${linia}]`;
  if (camp.startsWith('p')) return `preparacio[${bloc}].linies[${linia}]`;
  return `notes[${bloc}]`;
}

function fontsDeRecepta(recepta) {
  const font = { document: '/assets/uploads/patrimoni/que-dinem/llibre-que-dinem.pdf', sha256: SHA256_PDF_QUE_DINEM, pagina: recepta.pagina };
  const fonts = recepta.ingredients.flatMap((bloc, i) => bloc.linies.map((text, j) => ({ text,
    tipus: 'ingredient_literal', camp: `ingredients[${i}].linies[${j}]`, font: { ...font, bloc: bloc.titol ?? null } })));
  (recepta.preparacio ?? []).forEach((bloc, i) => (bloc?.linies ?? []).forEach((text, j) => fonts.push({ text,
    tipus: 'elaboracio_literal', camp: `preparacio[${i}].linies[${j}]`, font })));
  (recepta.notes ?? []).forEach((text, i) => fonts.push({ text, tipus: 'nota_literal', camp: `notes[${i}]`, font }));
  return { font, fonts };
}

function filaRevisada(recepta) {
  if (!Object.hasOwn(ALERGENS_QUE_DINEM, recepta.slug)) return null;
  const fila = ALERGENS_QUE_DINEM[recepta.slug];
  return empremtaRecepta(recepta) === fila[0] ? fila.slice(1) : null;
}

function marquesRevisades(recepta, perSlug) {
  const fila = filaRevisada(recepta);
  if (!fila) return null;
  const marques = [];
  for (const { camp, tipus, ids, motiu, recepta: slugReferit, campReferit } of fila) {
    const marca = { camp: campLiteral(camp), tipus, ids, motiu };
    if (slugReferit) {
      const clau = campLiteral(campReferit);
      marca.referencia = { slug: slugReferit, camp: clau };
      if (typeof perSlug === 'function') {
        const referida = perSlug(slugReferit);
        if (referida?.slug !== slugReferit || !filaRevisada(referida)) return null;
        const fontReferida = fontsDeRecepta(referida).fonts.find((font) => font.camp === clau);
        if (!fontReferida) throw new TypeError('Referència editorial sense font literal.');
        Object.assign(marca.referencia, { text: fontReferida.text, font: fontReferida.font });
      }
    }
    marques.push(marca);
  }
  return marques;
}

/** R17 · Matriu editorial per a les receptes revisades. Una fitxa alterada o externa
 * conserva la proposta assistida i els estats de dada desconeguda. */
export function candidatsReceptaQueDinem(recepta, perSlug = null) {
  if (!recepta || typeof recepta.slug !== 'string' || !Array.isArray(recepta.ingredients)) throw new TypeError('Cal la recepta literal.');
  const { font, fonts } = fontsDeRecepta(recepta);
  const id = `que-dinem:${recepta.slug}`;
  const marques = marquesRevisades(recepta, perSlug);
  const proposta = marques
    ? resolMatriuAlergens({ id, fonts, marques })
    : proposaCandidatsAlergens({ id, fonts, resolRecepta: resolutorDeReceptes(perSlug) });
  return { ...proposta, origen: 'que-dinem', font, escandall: { estat: ESTAT_CANDIDATS_ALERGENS,
    racions: null, costRacioCents: null, costTotalCents: null,
    motiu: 'El text literal no acredita racions normalitzades, rendiments, minves ni costos de compra.' } };
}

/** Product and variant from the historical snapshot, or its enriched Bar view.
 * Commercial names are hints only, never certified ingredient lists. */
export function candidatsVariantParroquia(producte, variant, fontOrigen = null) {
  if (!producte || !variant || !variant.ref || (variant.handle && producte.handle !== variant.handle)) throw new TypeError('Cal el producte i el seu REF original.');
  const font = { ...(fontOrigen ?? {}), cataleg: 'la-parroquia', handle: producte.handle, ref: variant.ref,
    fila: variant.fila ?? variant.font?.fila ?? null };
  const fonts = [{ text: producte.nom ?? '', tipus: 'nom_comercial', camp: 'producte.nom', font },
    { text: variant.nom ?? '', tipus: 'nom_comercial', camp: 'variant.nom', font }];
  // An explicit literal list, if later supplied, does not alter the commercial
  // record or invent the missing composition of the current historical CSV.
  if (Array.isArray(producte.ingredientsLiterals)) producte.ingredientsLiterals.forEach((text, i) => {
    if (typeof text === 'string') fonts.push({ text, tipus: 'ingredient_literal', camp: `ingredientsLiterals[${i}]`, font });
  });
  const proposta = proposaCandidatsAlergens({ id: `la-parroquia:${variant.ref}`, fonts });
  const cost = variant.costCentsOrigen;
  return { ...proposta, origen: 'la-parroquia', font,
    composicioDisponible: Array.isArray(producte.ingredientsLiterals) && producte.ingredientsLiterals.length > 0,
    escandall: { estat: ESTAT_CANDIDATS_ALERGENS, racions: null, costRacioCents: null, costTotalCents: null,
      costManualHistoricCents: Number.isSafeInteger(cost) && cost > 0 ? cost : null,
      costManualHistoricEstat: Number.isSafeInteger(cost) && cost > 0 ? 'informat_font_historica' : 'pendent',
      baseFiscal: 'desconeguda', motiu: 'El cost històric no és un escandall. Falten composició, quantitats, rendiments i minves.' } };
}

export async function carregaCandidatsQueDinem() {
  const { RECEPTES_QUE_DINEM, receptaPerSlug } = await import('../patrimoni/queDinem.js');
  return RECEPTES_QUE_DINEM.map((recepta) => candidatsReceptaQueDinem(recepta, receptaPerSlug));
}

export async function carregaCandidatsParroquia() {
  const { carregaCatalegParroquia } = await import('./parroquia.js');
  const dades = await carregaCatalegParroquia();
  const perHandle = new Map(dades.productes.map(producte => [producte.handle, producte]));
  const csv = dades.fonts.find(font => font.ruta.endsWith('/export_items.csv'));
  return dades.variants.map(variant => candidatsVariantParroquia(perHandle.get(variant.handle), variant,
    csv ? { document: csv.ruta, sha256: csv.sha256 } : null));
}
