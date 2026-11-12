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
import { createHash } from 'node:crypto';
import { RECEPTES_QUE_DINEM, receptaPerSlug } from '../patrimoni/queDinem.js';
import { ALERGENS } from '../../utils/productes/producteUniversal.js';
import { analitzaClausula, construixLexic, normalitza, proposaCandidatsAlergens, VERSIO_LEXIC } from '../../utils/candidatsAlergens.js';
import { LLENGUES_ALERGENS, TEXTOS_ALERGENS, TEXTOS_MATRIU_RECEPTARI, vesteixCandidatsAlergens } from '../../utils/textosAlergens.js';
import { candidatsReceptaQueDinem, resolutorDeReceptes } from './candidatsAlergens.js';

const matriu = (recepta) => candidatsReceptaQueDinem(recepta, receptaPerSlug);
const proposta = (recepta) => {
  const { id, fontsRevisades } = matriu(recepta);
  return proposaCandidatsAlergens({ id, fonts: fontsRevisades, resolRecepta: resolutorDeReceptes(receptaPerSlug) });
};
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

describe('R17 · matriu dels ingredients declarats de «Què dinem?»', () => {
  test('el literal de les 149 fitxes correspon a la transcripció revisada', () => {
    const literals = RECEPTES_QUE_DINEM.map((r) => [r.slug, r.pagina, r.ingredients, r.preparacio, r.notes]);
    const hash = createHash('sha256').update(JSON.stringify(literals)).digest('hex');
    expect(hash).toBe('51d37fb9db9cc81aa2c8671f45157c728a1c395e3860b4cf022d706ae83059e2');
  });

  test('149 × 14 amb font literal per a cada marca i només tres estats en les cinc llengües', () => {
    const totals = { '•': 0, T: 0, '—': 0 };
    for (const recepta of RECEPTES_QUE_DINEM) {
      const p = matriu(recepta);
      expect(p.metode).toBe('matriu_receptari_r17');
      expect(p.absenciesAcreditades).toBe(false);
      expect(p.aptePerInformarConsumidor).toBe(false);
      expect(p.alergens.map((a) => a.id)).toEqual(ALERGENS);
      const fonts = new Map(p.fontsRevisades.map((f) => [f.camp, f]));
      for (const a of p.alergens) {
        const cites = [...a.ingredient.evidencies, ...a.traca.evidencies];
        expect(cites.length > 0).toBe(a.simbol !== '—');
        for (const cita of cites) {
          expect(cita.text).toBe(fonts.get(cita.camp).text);
          expect(cita.font).toMatchObject({ pagina: recepta.pagina, sha256: p.font.sha256 });
          if (cita.referencia) expect(cita.referencia.font.pagina).toBe(receptaPerSlug(cita.referencia.slug).pagina);
        }
        expect(Object.hasOwn(totals, a.simbol)).toBe(true);
        totals[a.simbol]++;
      }
      for (const llengua of LLENGUES_ALERGENS) {
        const v = vesteixCandidatsAlergens(p, llengua);
        expect(v.files.map((f) => f.simbol)).toEqual(p.alergens.map((a) => a.simbol));
        expect(v.textCobertura).toBe(TEXTOS_MATRIU_RECEPTARI[llengua].completa);
      }
    }
    // Auditoria R18: +11 T per les receptes de les notes (P0) i +9 T perquè la matriu conserve els senyals del lèxic (P1).
    expect(totals).toEqual({ '•': 161, T: 195, '—': 1730 });
  });

  test.each([
    ['caragols-amb-tomaca', 'molluscs', '•'],
    ['arros-melos-de-peix', 'crustacis', '•'],
    ['fideua', 'ous', 'T'],
    ['arros-blanc', 'ous', 'T'],
    ['coca-de-batre', 'peix', 'T'],
    ['coca-de-batre', 'gluten', 'T'],
    ['fabiola-de-coco', 'fruits-closca', 'T'],
    ['mandonguilles-de-carn', 'fruits-closca', 'T'],
    ['vi-de-cirer', 'sulfits', 'T'],
    ['aigua-sal', 'sulfits', 'T'],
    ['pa-rustic', 'soja', 'T'],
    ['bescuit-d-ametla', 'gluten', '—'],
    ['mantegades', 'llet', '—'],
    ['olla-de-carn', 'peix', '—'],
    ['carinyitos', 'gluten', '—']
  ])('%s · %s = %s', (slug, id, simbol) => {
    expect(alergen(matriu(receptaPerSlug(slug)), id).simbol).toBe(simbol);
  });

  /* Auditoria R18 (P0) · Una altra recepta copiada a les notes de la fitxa: la fitxa pública la mostra, i el panell
     no pot dir «—» d'un al·lergen que hi apareix. Es marca T amb el motiu `receptaDeNota`. */
  test.each([
    ['pa-rustic', ['llet', 'soja', 'sulfits']],
    ['amanida-de-tomaca-all-i-tonyina', ['mostassa', 'sulfits']],
    ['arros-amb-conill', ['fruits-closca', 'gluten', 'sulfits']],
    ['llucets-passats-per-farina-i-fregits', ['llet']],
    ['sopa-d-alls', ['api', 'soja', 'sulfits']]
  ])('recepta de les notes · %s → T amb motiu', (slug, ids) => {
    const p = matriu(receptaPerSlug(slug));
    const files = vesteixCandidatsAlergens(p).files;
    for (const id of ids) {
      expect([slug, id, alergen(p, id).simbol]).toEqual([slug, id, 'T']);
      expect(files.find((f) => f.id === id).evidencies.map((e) => e.motiu)).toContain(TEXTOS_MATRIU_RECEPTARI.ca.motius.receptaDeNota);
    }
  });

  test('cada motiu de la matriu té text en les cinc llengües', () => {
    const motius = Object.keys(TEXTOS_MATRIU_RECEPTARI.ca.motius);
    for (const llengua of LLENGUES_ALERGENS) expect(Object.keys(TEXTOS_MATRIU_RECEPTARI[llengua].motius)).toEqual(motius);
  });

  /* Auditoria R18 (P1) · RV-01 sobre la superfície que veu el veí: cap senyal «•» o «T» del lèxic queda en «—» a la
     matriu, llevat de les excepcions declarades ací amb el seu motiu. Una excepció nova o una que ja no cal fan fallar.
     Cada excepció és un mot que el lèxic llig de manera genèrica i que la mateixa fitxa resol. */
  const ADOB_DECLARAT = 'L’adob es compon a la mateixa nota (oli, vinagre, all, mostassa, pebre i sal); no és cap barreja comercial.';
  const LICOR_PROPI = '«Licor» nomena la mateixa beguda de la fitxa, que no porta cap licor de crema, d’ou ni d’ametla.';
  const EXCLOSOS = {
    'amanida-de-tomaca-all-i-tonyina:api': ADOB_DECLARAT,
    'amanida-de-tomaca-all-i-tonyina:sesam': ADOB_DECLARAT,
    'esclata-sangs-torrats:gluten': '«Fesols tendres» és llegum fresc; el motiu del llegum sec no s’hi aplica.',
    'blat-picat:api': '«Totes les verdures restants» remet a la llista d’ingredients de la fitxa, que no porta api.',
    'potatge:api': 'La línia «Verdures: …» és una llista tancada i no porta api (el julivert no és api).',
    'olla-de-carn:peix': '«Peixet» és un tall de vedella, com diu la mateixa línia.',
    'cocotets-de-tomaca-o-de-verdura:api': '«La verdura» és el farciment d’espinacs i bledes que declara la fitxa.',
    'fabiola-de-coco:llet': '«Pastís» nomena la mateixa fabiola; el greix és sagí (mantega de porc).',
    'bescuit-d-ametla:gluten': '«Bescuit» nomena el mateix bescuit d’ametla, i la llista d’ingredients no porta farina.',
    'carquinyols-de-bescuit:llet': '«Bescuit» nomena la mateixa pasta de la fitxa, i cap ingredient és lacti.',
    'pastissos-de-nadal:llet': 'La «mantega» de la nota és mantega de porc (sagí), i «pastissos» nomena el mateix dolç.',
    'pastissos-de-nadal:fruits-closca': '«Nou» és el numeral («total, nou»), no el fruit.',
    'cafe-licor:ous': LICOR_PROPI,
    'cafe-licor:llet': LICOR_PROPI,
    'cafe-licor:fruits-closca': LICOR_PROPI,
    'licor-de-salvia:ous': LICOR_PROPI,
    'licor-de-salvia:llet': LICOR_PROPI,
    'licor-de-salvia:fruits-closca': LICOR_PROPI
  };
  test('la matriu conserva cada senyal • o T del lèxic, llevat de les excepcions declarades', () => {
    const perdudes = [];
    for (const recepta of RECEPTES_QUE_DINEM) {
      const lex = proposta(recepta);
      const mat = matriu(recepta);
      for (const id of ALERGENS) {
        if (['•', 'T'].includes(alergen(lex, id).simbol) && alergen(mat, id).simbol === '—') perdudes.push(`${recepta.slug}:${id}`);
      }
    }
    expect(perdudes.filter((clau) => !Object.hasOwn(EXCLOSOS, clau))).toEqual([]);
    expect(Object.keys(EXCLOSOS).filter((clau) => !perdudes.includes(clau))).toEqual([]);
  });

  test('vincula la línia de les pilotes i la del seu ingredient a les dues pàgines reals', () => {
    const p = matriu(receptaPerSlug('fesols-estofats'));
    const [cita] = alergen(p, 'ous').ingredient.evidencies;
    expect(cita.text).toBe('4 pilotes de dacsa (de facedura)');
    expect(cita.referencia).toMatchObject({ slug: 'olleta-murera', text: '2 ous', font: { pagina: 90 } });
    expect(vesteixCandidatsAlergens(p).files.find((f) => f.id === 'ous').evidencies.map((e) => e.text)).toEqual([cita.text, cita.referencia.text]);
  });

  test('un literal alterat o una referència revisada canviada torna al lèxic sense absències', () => {
    const pa = structuredClone(receptaPerSlug('pa-rustic'));
    pa.ingredients[0].linies.push('2 ous');
    const modificada = matriu(pa);
    expect(modificada.metode).toBe('lexic_tancat_v1');
    expect(alergen(modificada, 'ous').simbol).toBe('•');
    expect(alergen(modificada, 'peix').simbol).toBe('?');

    const depend = candidatsReceptaQueDinem(receptaPerSlug('fesols-estofats'), (slug) => {
      const referida = structuredClone(receptaPerSlug(slug));
      referida.ingredients[1].linies[1] = '2 nous';
      return referida;
    });
    expect(depend.metode).toBe('lexic_tancat_v1');
    expect(alergen(depend, 'ous').simbol).toBe('?');
    expect(alergen(depend, 'fruits-closca').simbol).toBe('•');
  });

  test('la marca de pinyons remet al producte envasat i els sulfits al llindar pendent', () => {
    const p = matriu(receptaPerSlug('mandonguilles-de-carn'));
    const fila = vesteixCandidatsAlergens(p).files.find((f) => f.id === 'fruits-closca');
    expect(fila.evidencies[0]).toMatchObject({ text: 'Pinyonets', motiu: TEXTOS_MATRIU_RECEPTARI.ca.motius.pinyons });
    const sulfits = alergen(matriu(receptaPerSlug('vi-de-cirer')), 'sulfits');
    expect(sulfits.concentracioMgKgOMgL).toBeNull();
    expect(sulfits.llindarDeclaracio).toContain('>10 mg/kg o >10 mg/l de SO₂');
  });
});
