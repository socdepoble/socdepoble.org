/** Assisted review only. No evidence in a literal is never evidence of absence.
 * Canonical ids: producteUniversal. Annex II reference and current Commission
 * explanation: https://food.ec.europa.eu/food-safety/campaign-2026/allergies_en
 * A name or a compound ingredient is a clue, not its supplier's specification.
 * Cross-contact and sulphite concentration cannot be derived from a recipe.
 *
 * Onada R15b (RV-01) · Closed, deterministic lexicon (lexicAlergens.js), never a
 * list of loose aliases: every word of an ingredient line must be known. One
 * unknown word makes the line «no reconeguda» and the whole proposal «parcial»,
 * so every unmarked allergen reads «? Sense dada», never «absent». The method and
 * the notes are read as an additive source (they only add T, decision D-P4-16).
 * «Sense X» lowers • to T and never erases. No clock, no randomness, no network.
 */
import { ALERGENS, NOMS_ALERGENS } from './productes/producteUniversal.js';
import { ENTRADES, FRASES_BUIDES_PROSA, FRASES_MESURA, OBERTS, REFERENCIA_NO_RESOLTA, REFERENCIES, VERSIO_LEXIC } from './lexicAlergens.js';
import { AVIS_CANDIDATS_ALERGENS, ESTAT_CANDIDATS_ALERGENS, estatResumAlergen } from './textosAlergens.js';

export { AVIS_CANDIDATS_ALERGENS, ESTAT_CANDIDATS_ALERGENS, VERSIO_LEXIC };
export const FONT_ALERGENS_UE = 'https://food.ec.europa.eu/food-safety/campaign-2026/allergies_en';
export const TIPUS_FONT_ALERGENS = Object.freeze(['ingredient_literal', 'elaboracio_literal', 'nota_literal', 'nom_comercial']);

const MAX_PARAULES = 6;
const MAX_FONTS = 600;
const MAX_CARACTERS = 20000;
const PROFUNDITAT_REFERENCIES = 2;
const CLASSES_INGREDIENT = new Set(['A', 'N', 'E', 'R']);
const MESURA_ENGANXADA = /^\d+(?:g|gr|grs|kg|ml|cl|l|cc)$/;

/** NFD without diacritics, «l·l» → «ll», apostrophes and any other symbol → one space. Linear expressions only. */
export const normalitza = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('ca')
  .replace(/l[·.•‧]l/g, 'll').replace(/[’'`´]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

/** Builds the dictionary and throws when a form has two classes (a stop word can never hide an allergen). */
export function construixLexic(entrades = ENTRADES, referencies = REFERENCIES) {
  const mapa = new Map();
  const posa = (forma, entrada) => {
    const clau = normalitza(forma);
    if (!clau) throw new TypeError(`Forma buida a ${JSON.stringify(entrada.formes)}`);
    if (clau.split(' ').length > MAX_PARAULES) throw new RangeError(`Forma massa llarga: ${clau}`);
    const previa = mapa.get(clau);
    if (!previa) { mapa.set(clau, { ...entrada, marques: { ...entrada.marques }, regla: clau }); return; }
    if (previa.classe !== entrada.classe) throw new TypeError(`Conflicte de classe per «${clau}»: ${previa.classe} i ${entrada.classe}`);
    for (const [id, marca] of Object.entries(entrada.marques || {})) if (!previa.marques[id] || marca === 'I') previa.marques[id] = marca;
    previa.motiu = [previa.motiu, entrada.motiu].filter(Boolean).join(' ');
    previa.fitxa = previa.fitxa || entrada.fitxa; previa.obert = previa.obert || entrada.obert;
  };
  for (const entrada of entrades) {
    for (const id of Object.keys(entrada.marques || {})) if (!ALERGENS.includes(id)) throw new TypeError(`Al·lergen desconegut ${id}`);
    for (const forma of new Set(entrada.formes.split('|'))) posa(forma, entrada);
  }
  for (const referencia of referencies) for (const forma of referencia.formes.split('|')) {
    posa(forma, { classe: 'R', formes: referencia.formes, marques: {}, motiu: '', recepta: referencia.recepta, bloc: referencia.bloc });
  }
  return mapa;
}

let lexicPerDefecte = null;
const lexicActual = () => (lexicPerDefecte ??= construixLexic());

/** One clause: longest match first (up to 6 words), numbers skipped, unknown words kept.
 * Each match carries whether a trace marker or a negation came before it in the clause. */
export function analitzaClausula(text, lexic = lexicActual(), { prosa = false } = {}) {
  let net = normalitza(text);
  for (const re of FRASES_MESURA) net = net.replace(re, ' ');
  if (prosa) for (const re of FRASES_BUIDES_PROSA) net = net.replace(re, ' ');
  const paraules = net.split(' ').filter(Boolean);
  const coincidencies = [];
  const desconeguts = [];
  let obert = false; let traca = false; let negacio = false;
  for (let i = 0; i < paraules.length;) {
    if (/^\d+$/.test(paraules[i]) || MESURA_ENGANXADA.test(paraules[i])) { i++; continue; }
    if (OBERTS.includes(paraules[i])) { obert = true; i++; continue; }
    let trobat = null;
    for (let n = Math.min(MAX_PARAULES, paraules.length - i); n >= 1 && !trobat; n--) {
      const entrada = lexic.get(paraules.slice(i, i + n).join(' '));
      if (entrada) trobat = { entrada, n };
    }
    if (!trobat) { desconeguts.push(paraules[i]); i++; continue; }
    const { entrada, n } = trobat;
    if (entrada.classe === 'X') traca = true;
    else if (entrada.classe === 'G') negacio = true;
    else coincidencies.push({ terme: paraules.slice(i, i + n).join(' '), entrada, traca, negada: negacio });
    i += n;
  }
  const ingredients = coincidencies.filter((c) => CLASSES_INGREDIENT.has(c.entrada.classe));
  obert = obert || coincidencies.some((c) => c.entrada.obert);
  const fitxa = coincidencies.some((c) => c.entrada.fitxa || c.entrada.classe === 'E');
  const veredicte = desconeguts.length ? (ingredients.length ? 'parcial' : 'no-reconeguda')
    : ingredients.length ? 'reconeguda' : coincidencies.some((c) => c.entrada.classe === 'U') ? 'estri' : 'no-reconeguda';
  return { coincidencies, desconeguts, obert, fitxa, veredicte };
}

/* «mil.lilitres», «camamil.la»: el punt volat escrit amb punt no talla la frase. */
const clausules = (text) => String(text).replace(/l\.l/gi, 'l·l').split(/[.;:\n]/);
/* En la prosa, estes paraules nomenen la preparació mateixa («una pasta fina», «la truita», «el caldo»), no un
   ingredient nou: les línies d'ingredients ja en porten la composició. Cap altra paraula de la prosa s'ignora. */
const PROSA_DE_LA_PREPARACIO = new Set(['pasta', 'truita', 'caldo', 'brou']);

function validaFonts(id, fonts) {
  if (typeof id !== 'string' || !id.trim() || !Array.isArray(fonts) || fonts.length > MAX_FONTS
    || fonts.some((font) => !font || typeof font.text !== 'string' || typeof font.camp !== 'string'
      || !TIPUS_FONT_ALERGENS.includes(font.tipus))) {
    throw new TypeError('Cal una identitat i fonts literals amb el seu tipus i camp.');
  }
  if (fonts.some((font) => font.text.length > MAX_CARACTERS)) throw new RangeError('Una font literal passa del límit de caràcters.');
}

/* Ingredient lines are read word by word (coverage); method, notes and names only add clues. */
function llegixFonts(fonts, { lexic, resolRecepta, profunditat }) {
  const evidencies = [];
  const liniesPendents = [];
  let liniesIngredients = 0;
  const marca = (id, tipus, c, font, text, regla = c.entrada.regla, motiu = c.entrada.motiu) => evidencies.push({
    id, tipus, terme: c.terme, text, camp: font.camp, naturalesa: font.naturalesa ?? font.tipus, font: font.font ?? null, regla, motiu });
  for (const font of fonts) {
    if (font.tipus !== 'ingredient_literal') {
      for (const frase of clausules(font.text)) {
        for (const c of analitzaClausula(frase, lexic, { prosa: true }).coincidencies) {
          // A recipe named in prose is usually the dish itself; ingredient lines resolve real references.
          if (c.entrada.classe === 'R' || (font.tipus !== 'nom_comercial' && PROSA_DE_LA_PREPARACIO.has(c.terme))) continue;
          for (const id of Object.keys(c.entrada.marques || {})) marca(id, 'indici', c, font, font.text);
        }
      }
      continue;
    }
    liniesIngredients++;
    const motius = new Set(); const desconeguts = [];
    let reconeguda = false; let estri = false;
    for (const frase of clausules(font.text)) {
      const analisi = analitzaClausula(frase, lexic);
      if (analisi.veredicte === 'reconeguda' || analisi.veredicte === 'parcial') reconeguda = true;
      if (analisi.veredicte === 'estri') estri = true;
      desconeguts.push(...analisi.desconeguts);
      if (analisi.obert) motius.add('obert');
      if (analisi.fitxa) motius.add('fitxa');
      // «Farina sense gluten»: a negated mention lowers every • of that allergen in the clause to T, never erases it.
      const negats = new Set(analisi.coincidencies.filter((c) => c.negada).flatMap((c) => Object.keys(c.entrada.marques || {})));
      for (const c of analisi.coincidencies) {
        if (c.entrada.classe === 'R') {
          const sub = profunditat < PROFUNDITAT_REFERENCIES && typeof resolRecepta === 'function'
            ? resolRecepta(c.entrada.recepta, c.entrada.bloc) : null;
          if (Array.isArray(sub) && sub.length && sub.every((linia) => typeof linia === 'string')) {
            const interna = llegixFonts(sub.map((text, i) => ({ text, tipus: 'ingredient_literal', naturalesa: 'referencia',
              camp: `${font.camp}→${c.entrada.recepta}[${i}]`, font: font.font ?? null })), { lexic, resolRecepta, profunditat: profunditat + 1 });
            evidencies.push(...interna.evidencies);
            if (interna.liniesPendents.length) motius.add('fitxa');
          } else {
            for (const id of Object.keys(REFERENCIA_NO_RESOLTA.marques)) marca(id, 'traca', c, font, font.text, c.entrada.regla, REFERENCIA_NO_RESOLTA.motiu);
            motius.add('fitxa');
          }
          continue;
        }
        for (const [id, m] of Object.entries(c.entrada.marques || {})) {
          const tipus = m === 'I' && !c.traca && !c.negada && !negats.has(id) ? 'ingredient' : 'traca';
          marca(id, tipus, c, font, font.text);
        }
      }
    }
    if (desconeguts.length) motius.add('desconeguts');
    if (!reconeguda && !estri) motius.add('no-reconeguda');
    if (motius.size) liniesPendents.push({ camp: font.camp, text: font.text, motius: [...motius].sort(), desconeguts: [...new Set(desconeguts)] });
  }
  return { evidencies, liniesPendents, liniesIngredients };
}

/** All 14 are always returned. This function can only suggest; it cannot
 * publish, validate, produce a 'free from' label or promote a previous answer.
 * @param {{id:string, fonts:Array<{text:string, tipus:'ingredient_literal'|'elaboracio_literal'|'nota_literal'|'nom_comercial', camp:string, font?:object}>, resolRecepta?:(slug:string, bloc:string|null)=>string[]|null}} input
 */
export function proposaCandidatsAlergens({ id, fonts = [], resolRecepta = null }) {
  validaFonts(id, fonts);
  const { evidencies, liniesPendents, liniesIngredients } = llegixFonts(fonts, { lexic: lexicActual(), resolRecepta, profunditat: 0 });
  const cobertura = liniesIngredients === 0 ? 'sense-ingredients' : liniesPendents.length ? 'parcial' : 'completa';
  return {
    id, estat: ESTAT_CANDIDATS_ALERGENS, metode: 'lexic_tancat_v1', versioLexic: VERSIO_LEXIC,
    aptePerInformarConsumidor: false, absenciesAcreditades: false,
    revisioCompleta: false, fontNormativa: FONT_ALERGENS_UE, avis: AVIS_CANDIDATS_ALERGENS,
    cobertura, liniesPendents, desconeguts: [...new Set(liniesPendents.flatMap((linia) => linia.desconeguts))],
    alergens: ALERGENS.map(alergenId => {
      const perId = evidencies.filter(e => e.id === alergenId);
      const ingredients = perId.filter(e => e.tipus === 'ingredient');
      const traces = perId.filter(e => e.tipus === 'traca');
      const indicis = perId.filter(e => e.tipus === 'indici');
      const alergen = { id: alergenId, nom: NOMS_ALERGENS[alergenId], estat: ESTAT_CANDIDATS_ALERGENS,
        ingredient: { estat: ingredients.length ? 'candidat' : 'desconegut', simbol: ingredients.length ? '•' : null, evidencies: ingredients },
        traca: { estat: traces.length ? 'candidat' : 'desconegut', simbol: traces.length ? 'T' : null, evidencies: traces },
        indicis, requereixFitxaProveidor: true,
        ...(alergenId === 'sulfits' ? { concentracioMgKgOMgL: null, llindarDeclaracio: '>10 mg/kg o >10 mg/l de SO₂; pendent de mesura o fitxa' } : {}) };
      const proposta = estatResumAlergen(alergen);
      return { ...alergen, proposta, simbol: proposta === 'ingredient' ? '•' : proposta === 'traca' ? 'T' : '?' };
    }),
    fontsRevisades: fonts.map(font => ({ ...font })),
    comprovacionsPendents: ['Composició completa i alternatives de cada ingredient', 'Fitxes i etiquetes de proveïdors',
      'Traça i contaminació creuada de cada procés, equip i servei', 'Revisió humana dels 14 grups abans de publicar']
  };
}
