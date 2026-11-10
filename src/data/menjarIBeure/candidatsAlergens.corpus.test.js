/* Onada R15b (RV-01, P0) · Zero falsos negatius al panell públic de les 149 receptes de «Què dinem?».
   · Els casos crítics de DISSENY_PUNT4 §6.1 (inclosos els de R14: cacaus, clòtxines, gambes) i els que la revisió
     de R15b va trobar sense marca (gambetes, polpets, aladroc, mero, llucets, l'elaboració de #52, l'allioli de #61).
   · Exhaustivitat: es recorren totes les línies d'ingredients; tota paraula que el lèxic no coneix fa la recepta
     «parcial», la línia surt al panell i cada al·lergen sense marca diu «? Sense dada» (en les 5 llengües), mai «absent».
   · Sentinelles independents del lèxic: una arrel d'al·lergen al text de la recepta (ingredients, elaboració o notes)
     sempre dona una marca («•» o «T»). Si el lèxic perd una forma, esta prova falla.
   · Instantània lligada a VERSIO_LEXIC: canviar el lèxic obliga a revisar-la. */
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { RECEPTES_QUE_DINEM, receptaPerSlug } from '../patrimoni/queDinem.js';
import { ALERGENS } from '../../utils/productes/producteUniversal.js';
import { analitzaClausula, construixLexic, normalitza, VERSIO_LEXIC } from '../../utils/candidatsAlergens.js';
import { LLENGUES_ALERGENS, TEXTOS_ALERGENS, vesteixCandidatsAlergens } from '../../utils/textosAlergens.js';
import { candidatsReceptaQueDinem } from './candidatsAlergens.js';

const proposta = (recepta) => candidatsReceptaQueDinem(recepta, receptaPerSlug);
const PROPOSTES = RECEPTES_QUE_DINEM.map((recepta) => [recepta, proposta(recepta)]);
const alergen = (p, id) => p.alergens.find((a) => a.id === id);

const CASOS_CRITICS = [
  ['cacaus-fregits', 'cacauets'], ['cacaus-torrats', 'cacauets'], ['clotxines-al-vapor', 'molluscs'],
  ['arros-melos-de-peix', 'molluscs'], ['petxines-fregides', 'molluscs'], ['caragols-amb-tomaca', 'molluscs'],
  ['lluc-amb-gambes', 'crustacis'], ['carxofes-amb-gambes', 'crustacis'], ['fideua', 'crustacis'],
  ['pa-rustic', 'gluten'], ['allioli', 'ous'], ['formatge-blanquet', 'llet'], ['vi-de-nous', 'fruits-closca']
];
/* La revisió de R15b (RV-01): «•» quan ho diu una línia d'ingredients, «T» quan només ho diuen l'elaboració o la nota. */
const CASOS_REVISIO = [
  ['alberginies-farcides-al-forn', 'crustacis', '•'], ['polpets-amb-ceba-i-tomaca', 'molluscs', '•'],
  ['mandonguilles-d-aladroc', 'peix', '•'], ['aladroc-fregit', 'peix', '•'], ['aladroc-amb-vinagre', 'peix', '•'],
  ['mero-torrat', 'peix', '•'], ['llucets-passats-per-farina-i-fregits', 'peix', '•'], ['lluc-amb-gambes', 'peix', '•'],
  ['lluc-amb-gambes', 'crustacis', '•'], ['fideua', 'peix', '•'], ['arros-melos-de-peix', 'crustacis', 'T'], ['fideua', 'ous', 'T']
];

/* Arrels dels 14 grups, escrites a banda del lèxic (sobre el text normalitzat). */
const SENTINELLES = {
  gluten: /\b(?:farin\w*|blat|pa|fideu\w*|macarr\w*|galet\w*|neul\w*|semol\w*|ordi|civada|espelta|cervesa|malta|coca|coques|bescuit|bunyol\w*|xurros?|magdalen\w*|mon[ae]s?|rosquet\w*|canelon\w*|espaguet\w*|croquet\w*|beixamel|arrebossa\w*)\b/,
  crustacis: /\b(?:gamb\w*|llagost\w*|escamarl\w*|crancs?|crustac\w*|galer[ae]s?|cigal\w*|bogavant|langost\w*)\b/,
  ous: /\b(?:ous?|rovells?|clares?|maonesa|mahonesa|maionesa|allioli|flan)\b/,
  peix: /\b(?:peix\w*|tonyina|bacall\w*|maire|aladroc\w*|anxov\w*|sardin\w*|lluc\w*|emperador|mero|capella|capellans|salmo|moixama|verat|sorell|rap|orada|llobarro|surimi|gul[ae]s?)\b/,
  cacauets: /\bcacau\w*/,
  soja: /\b(?:soja|soia|tofu)\b/,
  llet: /\b(?:llet|formatg\w*|nata|iogurts?|mantega|beixamel|quallada|brossat|mantecado|flan)\b/,
  'fruits-closca': /\b(?:ametl\w*|avellan\w*|nous?|anacard\w*|festuc\w*|pistatx\w*|macadamia|torro)\b/,
  api: /\b(?:api|apit)\b/,
  mostassa: /\bmostass\w*/,
  sesam: /\b(?:sesam|tahin\w*)\b/,
  sulfits: /\b(?:vi|vins|vinagr\w*|cava|vermut|conyac|most|panses|sulfit\w*)\b/,
  tramussos: /\b(?:tramus\w*|llobins?)\b/,
  molluscs: /\b(?:clotxin\w*|musclos?|petxin\w*|tellin\w*|cloiss\w*|calamar\w*|sepi\w*|polp\w*|pops?|caragol\w*|cargol\w*|ostr[ae]s?|navall\w*|escopiny\w*|xipiro\w*|mollusc\w*)\b/
};
/* Excepcions documentades al lèxic (DISSENY_PUNT4 §5.2): la nou moscada és espècia, la mantega de porc és sagí i, a
   la prosa, «de nou» és un adverbi; els «motles de magdalena» són un estri. */
const EXCEPCIONS = [/\bnous? moscad\w*/g, /\bmantega de porc\b/g, /\bmotles? de magdalen\w*/g];
const EXCEPCIONS_PROSA = [/\bde (?:bell )?nou\b/g];
function foratsDe(recepta, p) {
  const textos = [
    ...recepta.ingredients.flatMap((bloc) => bloc.linies).map((text) => [text, false]),
    ...recepta.preparacio.flatMap((bloc) => bloc.linies).map((text) => [text, true]),
    ...recepta.notes.map((text) => [text, true])
  ];
  const forats = [];
  for (const [text, prosa] of textos) {
    const net = neteja(text, prosa);
    for (const [id, re] of Object.entries(SENTINELLES)) {
      if (re.test(net) && alergen(p, id).simbol === '?') forats.push(`${recepta.numero} ${recepta.slug} · ${id} · ${text.slice(0, 80)}`);
    }
  }
  return forats;
}
const neteja = (text, prosa) => [...EXCEPCIONS, ...(prosa ? EXCEPCIONS_PROSA : [])]
  .reduce((acc, re) => acc.replace(re, ' '), normalitza(String(text).replace(/l\.l/gi, 'l·l')));

describe('RV-01 · cap fals negatiu a les 149 receptes', () => {
  test('el corpus i la versió del lèxic que fixa esta instantània', () => {
    expect(RECEPTES_QUE_DINEM).toHaveLength(149);
    expect(VERSIO_LEXIC).toBe('lexic-alergens-v2');
    const cobertura = PROPOSTES.reduce((acc, [, p]) => ({ ...acc, [p.cobertura]: (acc[p.cobertura] ?? 0) + 1 }), {});
    expect(cobertura).toEqual({ completa: 115, parcial: 34 });
    expect([...new Set(PROPOSTES.flatMap(([, p]) => p.desconeguts))].sort()).toEqual(['perellons', 'visolets', 'vitets']);
  });

  test.each(CASOS_CRITICS)('cas crític %s → «•» %s', (slug, id) => {
    expect(alergen(proposta(receptaPerSlug(slug)), id).simbol).toBe('•');
  });

  test.each(CASOS_REVISIO)('revisió R15b: %s → %s «%s»', (slug, id, simbol) => {
    expect(alergen(proposta(receptaPerSlug(slug)), id).simbol).toBe(simbol);
  });

  test('exhaustivitat: tota línia amb una paraula desconeguda fa la recepta parcial i deixa «? Sense dada» (5 llengües)', () => {
    let liniesDesconegudes = 0;
    for (const [recepta, p] of PROPOSTES) {
      const linies = recepta.ingredients.flatMap((bloc) => bloc.linies);
      expect(p.fontsRevisades.filter((f) => f.tipus === 'ingredient_literal').map((f) => f.text)).toEqual(linies);
      for (const linia of linies) {
        const analisis = linia.replace(/l\.l/gi, 'l·l').split(/[.;:\n]/).map((frase) => analitzaClausula(frase));
        const desconeguts = analisis.flatMap((a) => a.desconeguts);
        const senseIngredient = analisis.every((a) => a.veredicte === 'no-reconeguda');
        if (!desconeguts.length && !senseIngredient) continue;
        liniesDesconegudes++;
        expect([recepta.slug, p.cobertura]).toEqual([recepta.slug, 'parcial']);
        const pendent = p.liniesPendents.find((l) => l.text === linia);
        expect([recepta.slug, linia, Boolean(pendent)]).toEqual([recepta.slug, linia, true]);
        for (const paraula of desconeguts) expect(pendent.desconeguts).toContain(paraula);
        for (const llengua of LLENGUES_ALERGENS) {
          const vestit = vesteixCandidatsAlergens(p, llengua);
          expect(vestit.pendents).toContain(linia);
          for (const fila of vestit.files.filter((f) => f.estat === 'desconegut')) {
            expect([recepta.slug, llengua, fila.id, fila.text]).toEqual([recepta.slug, llengua, fila.id, TEXTOS_ALERGENS[llengua].desconegut]);
          }
        }
      }
    }
    expect(liniesDesconegudes).toBe(4);
  });

  test('cap recepta amb cobertura completa té una línia pendent, i cap fila no és mai «absent»', () => {
    for (const [recepta, p] of PROPOSTES) {
      if (p.cobertura === 'completa') expect([recepta.slug, p.liniesPendents]).toEqual([recepta.slug, []]);
      expect(p.alergens.map((a) => a.id)).toEqual(ALERGENS);
      for (const a of p.alergens) {
        expect(['ingredient', 'traca', 'desconegut']).toContain(a.proposta);
        expect(['•', 'T', '?']).toContain(a.simbol);
      }
      expect(JSON.stringify(p.alergens)).not.toMatch(/"absent"|absencia validada/i);
      expect(p.absenciesAcreditades).toBe(false);
    }
  });

  test('sentinelles: una arrel d’al·lergen a la recepta sempre dona una marca', () => {
    expect(PROPOSTES.flatMap(([recepta, p]) => foratsDe(recepta, p))).toEqual([]);
  });

  test('sonda: les sentinelles veuen un forat quan el lèxic no coneix la paraula', () => {
    const sonda = { numero: 0, slug: 'sonda', pagina: 1, ingredients: [{ titol: null, linies: ['Un grapat de gambotes'] }], preparacio: [], notes: [] };
    const p = candidatsReceptaQueDinem(sonda);
    expect(p.cobertura).toBe('parcial');
    expect(alergen(p, 'crustacis').simbol).toBe('?');
    expect(foratsDe(sonda, p)).toEqual(['0 sonda · crustacis · Un grapat de gambotes']);
  });

  test('la mateixa entrada dona la mateixa proposta, i el motor no té rellotge, atzar ni xarxa', () => {
    const r = receptaPerSlug('lluc-amb-gambes');
    expect(JSON.stringify(proposta(r))).toBe(JSON.stringify(proposta(r)));
    for (const fitxer of ['src/utils/candidatsAlergens.js', 'src/utils/lexicAlergens.js', 'src/utils/textosAlergens.js']) {
      const codi = readFileSync(fitxer, 'utf8');
      expect([fitxer, /\bDate\b|Math\.random|\bfetch\s*\(|\bimport\s*\(/.test(codi)]).toEqual([fitxer, false]);
    }
  });

  test('el lèxic no admet que una paraula buida amague un al·lergen', () => {
    expect(() => construixLexic([{ classe: 'S', formes: 'gamba', marques: {} }, { classe: 'A', formes: 'gamba', marques: { crustacis: 'I' } }], []))
      .toThrow(/Conflicte de classe/);
    expect(() => construixLexic([{ classe: 'A', formes: 'gamba', marques: { marisc: 'I' } }], [])).toThrow(TypeError);
  });
});
