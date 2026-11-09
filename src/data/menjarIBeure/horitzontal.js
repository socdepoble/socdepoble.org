import { adaptaReceptaEditorial } from './receptaEditorial.js';
import { calculaEscandall } from './escandall.js';
import { agregaMatrius, matriuAlergens, matriuDeProducte } from './allergens.js';
import { universalItemCataleg } from '../cataleg/universalItemCataleg.js';
import { ingredientDeTarifaParroquia } from './compresParroquia.js';
const clau = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('ca').replace(/[^a-z0-9]+/g, ' ').trim();
const UNITATS = Object.freeze({ g: 'g', gram: 'g', grams: 'g', kg: 'kg', quilo: 'kg', quilos: 'kg', ml: 'ml', 'mil lilitres': 'ml', l: 'l', litre: 'l', litres: 'l', cl: 'cl', u: 'u', unitat: 'u', unitats: 'u' });
export function dataISOValida(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
/** Only explicit scalar measures. Ranges and prose never become fabricated weights. */
export function mesuraIngredient(text) {
  const m = String(text).match(/^\s*(\d+(?:[.,]\d+)?)\s+(mil·lilitres|grams?|quilos?|litres?|kg|ml|cl|g|l|u|unitats?)\b\s*(?:de\s+|d[’']\s*)?(.*)$/iu);
  const compost = /[;,]|\s+i\s+|\d/u.test(m ? m[3] : String(text));
  if (!m || compost || /^\s*(?:[-–—/]|a\b|o\b)\s*\d/u.test(m[3])) return { text: String(text), quantitat: null, unitat: null, nom: String(text), estat: 'pendent', compost };
  return { text: String(text), quantitat: Number(m[1].replace(',', '.')), unitat: UNITATS[clau(m[2])], nom: m[3], estat: 'mesura-explicita' };
}
let pending;
export function validaReceptari(dades) {
  if (!Array.isArray(dades?.receptes) || !dades.receptes.length || dades.receptes.length > 1000) throw new TypeError('Receptari no vàlid.');
  const ids = new Set(), slugs = new Set();
  for (const r of dades.receptes) {
    if (!r || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(r.id || '') || ids.has(r.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug || '') || slugs.has(r.slug) || typeof r.nom !== 'string' || !r.nom.trim() || r.nom.length > 300 || !Number.isSafeInteger(r.paginaPdf) || r.paginaPdf < 1 || r.paginaPdf > 168) throw new TypeError('Identitat de recepta no vàlida.');
    for (const key of ['ingredients', 'preparacio']) if (!Array.isArray(r[key]) || r[key].length > 100 || r[key].some((v) => typeof v !== 'string' || !v.trim() || v.length > (key === 'ingredients' ? 6000 : 30000))) throw new TypeError('Text de recepta no vàlid.');
    if (r.imatgeUrl != null && !/^\/assets\/uploads\/patrimoni\/que-dinem\/p\d{3}\.webp$/.test(r.imatgeUrl)) throw new TypeError('Imatge de recepta no vàlida.');
    if (r.youtubeId != null && !/^[A-Za-z0-9_-]{11}$/.test(r.youtubeId)) throw new TypeError('Vídeo de recepta no vàlid.');
    if (r.racionsBaseProposades != null && (!Number.isSafeInteger(r.racionsBaseProposades) || r.racionsBaseProposades < 1 || r.racionsBaseProposades > 10000)) throw new TypeError('Racions proposades no vàlides.');
    ids.add(r.id); slugs.add(r.slug);
  }
  return dades;
}
function congela(v) { if (v && typeof v === 'object' && !Object.isFrozen(v)) { for (const c of Object.values(v)) congela(c); Object.freeze(v); } return v; }
export function carregaReceptes() {
  return pending ??= import('../patrimoni/queDinem.js').then(({ RECEPTES_QUE_DINEM, OBRA_QUE_DINEM }) => {
    const d = validaReceptari({ receptes: RECEPTES_QUE_DINEM.map(r => adaptaReceptaEditorial(r, OBRA_QUE_DINEM)) });
    return congela({ ...d, metadades: { fontUnica: 'src/data/patrimoni/queDinem.js', preusImportats: 0,
      ingredientsLiterals: d.receptes.filter(r => r.ingredients.length).length,
      preparacionsLiterals: d.receptes.filter(r => r.preparacio.length).length },
    items: d.receptes.map(r => universalItemCataleg({ id: r.id, tipus: 'recepta', nom: r.nom, font: r.font, dades: r })) });
  }).catch(error => { pending = null; throw error; });
}
export async function carregaConnexionsCulturals() {
  const [banc, herbari] = await Promise.all([import('../patrimoni/bancLlavors.js'), import('../patrimoni/herbariLaTorre117.js')]);
  return { llavors: [...banc.VARIETATS_CATALEG_VALENCIA, ...banc.VARIETATS_AVL_MALLORCA, ...banc.ESPECIES_ATLES_CATALUNYA], plantes: herbari.ESPECIES_HERBARI_LA_TORRE_117 };
}
/** Lexical suggestions require review; botanical identity/edibility is never asserted. */
export function candidatsCulturals(ingredients, { llavors = [], plantes = [] } = {}) {
  const text = ` ${clau(ingredients.join(' '))} `;
  const match = (name) => clau(name).split(' ').some((word) => word.length >= 4 && text.includes(` ${word} `));
  return { llavors: llavors.filter((x) => match(x.nom)).map((x) => ({ id: x.id, nom: x.nom, estat: 'candidat', motiu: 'Coincidència lèxica; cal confirmar la identitat' })),
    plantes: plantes.filter((x) => match(x.nomValencia)).map((x) => ({ id: x.id, nom: x.nomValencia, estat: 'candidat', motiu: 'Relació cultural; no acredita comestibilitat' })) };
}
/** A product choice is explicit, per ingredient; no first-ingredient reuse. */
export function escandallRecepta(recepta, { racions, racionsBase, seleccions = {}, productes = [], compresParroquia = null }) {
  if (!Number.isSafeInteger(racionsBase) || racionsBase < 1 || racionsBase > 10000) throw new RangeError('Cal indicar les racions de la recepta original.');
  const matrius = [];
  const linies = recepta.ingredients.map((txt, i) => {
    const mesura = mesuraIngredient(txt), choice = seleccions[i];
    const oferta = choice?.oferta;
    const ofertaValida = choice?.producteId === 'oferta-local' && typeof oferta?.proveidor === 'string' && oferta.proveidor.trim() && typeof oferta.referencia === 'string' && oferta.referencia.trim() && dataISOValida(oferta.data) && ['kg', 'l', 'u'].includes(oferta.unitatPreuUnitari) && oferta.baseFiscal === 'cost-final-no-deduible' && Number.isSafeInteger(oferta.preuUnitariCentims) && oferta.preuUnitariCentims >= 0;
    const producte = ofertaValida ? { ...oferta, font: oferta.proveidor, tall: oferta.data } : (choice?.producteId ? productes.find((p) => p.id === choice.producteId) : null);
    const compra = choice?.producteId === 'compra-parroquia' ? ingredientDeTarifaParroquia({ ...choice.compraParroquia, dades: compresParroquia, ivaDeductible: false }) : null;
    matrius.push(producte ? matriuDeProducte(producte) : matriuAlergens());
    const quantitat = choice && Object.hasOwn(choice, 'quantitat') ? choice.quantitat : mesura.quantitat;
    return { id: `${recepta.id}-${i}`, quantitat: mesura.compost ? null : quantitat, factorNumerador: racions, factorDenominador: racionsBase,
      unitat: choice?.unitat ?? mesura.unitat, minvaPercent: choice?.minvaPercent ?? null,
      preuCents: compra?.preuCents ?? producte?.preuUnitariCentims ?? null, quantitatCompra: compra?.quantitatCompra ?? (producte ? 1 : null),
      unitatCompra: compra?.unitatCompra ?? producte?.unitatPreuUnitari ?? null, motiu: compra?.motiu,
      font: compra?.font ?? (producte ? { font: producte.font, fila: producte.filaFont, tall: producte.tall } : null) };
  });
  return { ...calculaEscandall({ racions, linies }), alergens: agregaMatrius(matrius, false) };
}
/** Ephemeral Router state, bounded below10KB; no prices, publication or storage writes. */
export function creaEsborranyTrasllat(recepta, { racions, racionsBase, seleccions = {} }) {
  if (![racions, racionsBase].every((v) => Number.isSafeInteger(v) && v >= 1 && v <= 10000)) throw new RangeError('Revisa les racions.');
  const linies = recepta.ingredients.map((text, i) => {
    const m = mesuraIngredient(text), s = seleccions[i] || {};
    const quantitat = Object.hasOwn(s, 'quantitat') ? s.quantitat : m.quantitat;
    const unitat = s.unitat ?? m.unitat;
    if ((quantitat == null) !== (unitat == null)) throw new RangeError('Confirma quantitat i unitat abans de traslladar-les.');
    return { nom: m.nom, text, quantitat, unitat };
  });
  const draft = { v: 1, slug: recepta.slug, racions, racionsBase, linies };
  if (linies.length > 100 || new TextEncoder().encode(JSON.stringify(draft)).length > 8192) throw new RangeError('Desglossa o reduïx la llista abans de traslladar-la; màxim8KB i100ingredients.');
  if (!validaEsborranyTrasllat(draft, recepta.slug)) throw new RangeError('Revisa les quantitats i unitats abans de preparar el trasllat.');
  return draft;
}
export function validaEsborranyTrasllat(draft, slug) {
  try {
    return Boolean(draft?.v === 1 && draft.slug === slug && [draft.racions, draft.racionsBase].every((v) => Number.isSafeInteger(v) && v >= 1 && v <= 10000) && new TextEncoder().encode(JSON.stringify(draft)).length <= 8192 && Array.isArray(draft.linies) && draft.linies.length > 0 && draft.linies.length <= 100 && draft.linies.every((l) => l && typeof l === 'object' && typeof l.nom === 'string' && typeof l.text === 'string' && Object.hasOwn(l, 'quantitat') && Object.hasOwn(l, 'unitat') && ((l.quantitat == null && l.unitat == null) || (typeof l.quantitat === 'number' && Number.isFinite(l.quantitat) && l.quantitat >= 0 && l.quantitat <= 1000000 && ['g', 'kg', 'ml', 'cl', 'l', 'u'].includes(l.unitat)))));
  } catch { return false; }
}
