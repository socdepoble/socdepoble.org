import { describe, expect, it } from 'vitest';
import { ALERGENS } from './productes/producteUniversal.js';
import { ESTAT_CANDIDATS_ALERGENS, proposaCandidatsAlergens } from './candidatsAlergens.js';

const propostaDe = (text, tipus = 'ingredient_literal') => proposaCandidatsAlergens({ id: 'mostra', fonts: [{ text, tipus, camp: 'literal' }] });
const alergenDe = (proposta, id) => proposta.alergens.find(alergen => alergen.id === id);

describe('candidats d’al·lèrgens · evidència literal, sense absències inferides', () => {
  it.each([
    ['gluten', 'Farina de blat'], ['crustacis', 'Gambes'], ['ous', '2 ous'], ['peix', 'Bacallà'],
    ['cacauets', 'Cacauets'], ['soja', 'Tofu de soja'], ['llet', 'Llet condensada'],
    ['fruits-closca', 'Ametla molta'], ['api', 'Un tros d’api'], ['mostassa', 'Mostassa'],
    ['sesam', 'Sèsam'], ['sulfits', 'Diòxid de sofre i sulfits'], ['tramussos', 'Tramussos'], ['molluscs', 'Calamars']
  ])('conserva el literal per al grup %s i no el valida', (id, text) => {
    const proposta = propostaDe(text);
    expect(proposta.estat).toBe(ESTAT_CANDIDATS_ALERGENS);
    expect(proposta.aptePerInformarConsumidor).toBe(false);
    expect(proposta.absenciesAcreditades).toBe(false);
    expect(proposta.alergens.map(alergen => alergen.id)).toEqual(ALERGENS);
    const alergen = alergenDe(proposta, id);
    expect(alergen.ingredient).toMatchObject({ estat: 'candidat', simbol: '•' });
    expect(alergen.ingredient.evidencies[0].text).toBe(text);
    expect(alergen.traca).toMatchObject({ estat: 'desconegut', simbol: null, evidencies: [] });
  });

  it.each(['Pot contindre traces de llet', 'Puede contener huevo', 'May contain peanuts'])('distingix T en «%s»', text => {
    const proposta = propostaDe(text);
    expect(proposta.alergens.some(alergen => alergen.traca.simbol === 'T')).toBe(true);
    expect(proposta.alergens.every(alergen => alergen.ingredient.simbol === null)).toBe(true);
  });

  it('una declaració de traces no es convertix en ingredient', () => {
    const proposta = propostaDe('Llet; pot contindre traces de soja i ous');
    expect(alergenDe(proposta, 'llet').ingredient.estat).toBe('candidat');
    expect(alergenDe(proposta, 'llet').traca.estat).toBe('desconegut');
    expect(alergenDe(proposta, 'soja').traca.estat).toBe('candidat');
    expect(alergenDe(proposta, 'ous').ingredient.estat).toBe('desconegut');
  });

  it('un nom comercial és un indici separat de la composició', () => {
    const llet = alergenDe(propostaDe('Cafè amb llet', 'nom_comercial'), 'llet');
    expect(llet.indicis).toHaveLength(1);
    expect(llet.ingredient).toMatchObject({ estat: 'desconegut', simbol: null });
  });

  it.each(['Sense llet', 'Sin gluten', 'Gluten free from label', 'Sense ous ni llet', 'Aigua i oli', ''])('«%s» no acredita cap absència', text => {
    const proposta = propostaDe(text);
    expect(proposta.absenciesAcreditades).toBe(false);
    expect(proposta.revisioCompleta).toBe(false);
    expect(JSON.stringify(proposta)).not.toContain('absent');
  });

  it.each([
    ['fruits-closca', 'Nous moscades'], ['fruits-closca', 'Nuez moscada'],
    ['llet', 'Llet de coco'], ['llet', 'Leche de almendra'], ['peix', 'Peixet de vedella'],
    ['ous', 'Costelletes de bou'], ['fruits-closca', 'Pinyons']
  ])('evita confondre %s amb «%s»', (id, text) => {
    expect(alergenDe(propostaDe(text), id).ingredient.estat).toBe('desconegut');
  });

  it('no certifica els sulfits ni el llindar per la paraula vi', () => {
    const sulfits = alergenDe(propostaDe('Un got de vi'), 'sulfits');
    expect(sulfits.ingredient.estat).toBe('candidat');
    expect(sulfits.concentracioMgKgOMgL).toBeNull();
    expect(sulfits.llindarDeclaracio).toContain('>10 mg/kg');
  });

  it('no muta fonts ni accepta fonts sense naturalesa declarada', () => {
    const fonts = Object.freeze([Object.freeze({ text: 'Ous', tipus: 'ingredient_literal', camp: 'ingredient[0]' })]);
    expect(proposaCandidatsAlergens({ id: 'mostra', fonts }).fontsRevisades[0]).toEqual(fonts[0]);
    expect(() => proposaCandidatsAlergens({ id: 'mostra', fonts: [{ text: 'Ous', camp: 'ingredient' }] })).toThrow(TypeError);
    expect(() => proposaCandidatsAlergens({ id: '', fonts: [] })).toThrow(TypeError);
  });
});

/* Onada R15b (RV-01) · Lèxic tancat: les formes reals del llibre (singulars i plurals valencians) i cobertura per paraula. */
describe('candidats d’al·lèrgens · lèxic tancat i cobertura (RV-01)', () => {
  it.each([
    ['cacauets', 'Cacaus'], ['cacauets', '1 quilo de cacau'], ['molluscs', 'Clòtxines'], ['molluscs', '1 clòtxina'],
    ['molluscs', 'Petxines'], ['molluscs', 'Tellines'], ['molluscs', 'Polpets'], ['molluscs', 'Un pop'], ['molluscs', 'Cloïssa'],
    ['molluscs', 'Escopinya'], ['molluscs', 'Navalles'], ['crustacis', 'Gambetes'], ['crustacis', 'Llagostí'], ['crustacis', 'Llagosta'],
    ['crustacis', 'Escamarlà'], ['peix', 'Aladroc'], ['peix', 'Mero'], ['peix', 'Llucets'], ['gluten', 'Fideus grossos per a fideuà'],
    /* Formes que el motor anterior ja reconeixia (verificació R15b): el lèxic tancat no les pot perdre. */
    ['peix', 'Moll'], ['peix', 'Molls'], ['peix', 'Boquerons'], ['peix', 'Bacallaret'], ['molluscs', 'Sepias'],
    ['fruits-closca', 'Pecanes'], ['sulfits', 'Sulfito']
  ])('%s · «%s» és «•»', (id, text) => {
    const proposta = propostaDe(text);
    expect(alergenDe(proposta, id)).toMatchObject({ proposta: 'ingredient', simbol: '•' });
    expect(proposta.cobertura).toBe('completa');
  });

  it('una paraula desconeguda fa la línia pendent i la proposta parcial; els no marcats queden «?», mai absents', () => {
    const proposta = propostaDe('Un grapat de gambotes de Xàbia');
    expect(proposta.cobertura).toBe('parcial');
    expect(proposta.desconeguts).toEqual(['gambotes', 'xabia']);
    expect(proposta.liniesPendents).toEqual([{ camp: 'literal', text: 'Un grapat de gambotes de Xàbia', motius: ['desconeguts', 'no-reconeguda'], desconeguts: ['gambotes', 'xabia'] }]);
    expect(proposta.alergens.every(alergen => alergen.simbol === '?' && alergen.proposta === 'desconegut')).toBe(true);
  });

  it('«sense» rebaixa • a T i no l’esborra; una traça declarada és T', () => {
    expect(alergenDe(propostaDe('Farina sense gluten'), 'gluten')).toMatchObject({ proposta: 'traca', simbol: 'T' });
    expect(alergenDe(propostaDe('Sense llet'), 'llet')).toMatchObject({ proposta: 'traca', simbol: 'T' });
    expect(alergenDe(propostaDe('Pa sense sal'), 'gluten')).toMatchObject({ proposta: 'ingredient', simbol: '•' });
  });

  it('l’elaboració i les notes només afigen indicis (T), sense comptar paraules desconegudes', () => {
    const proposta = proposaCandidatsAlergens({ id: 'mostra', fonts: [
      { text: 'Arròs', tipus: 'ingredient_literal', camp: 'ingredients[0]' },
      { text: 'Afegiu-hi les gambes pelades i remeneu-ho sense parar.', tipus: 'elaboracio_literal', camp: 'preparacio[0]' },
      { text: 'Es pot acompanyar amb allioli.', tipus: 'nota_literal', camp: 'notes[0]' }
    ] });
    expect(proposta.cobertura).toBe('completa');
    expect(alergenDe(proposta, 'crustacis')).toMatchObject({ proposta: 'traca', simbol: 'T' });
    expect(alergenDe(proposta, 'crustacis').ingredient.estat).toBe('desconegut');
    expect(alergenDe(proposta, 'ous')).toMatchObject({ proposta: 'traca', simbol: 'T' });
  });

  it('una recepta del llibre citada als ingredients es resol amb les seues línies; sense resoldre, T i parcial', () => {
    const fonts = [{ text: '2 pilotes de carn', tipus: 'ingredient_literal', camp: 'ingredients[0]' }];
    const resolta = proposaCandidatsAlergens({ id: 'mostra', fonts, resolRecepta: () => ['Pa ratllat', '2 ous'] });
    expect(alergenDe(resolta, 'ous').simbol).toBe('•');
    expect(alergenDe(resolta, 'gluten').simbol).toBe('•');
    const senseResoldre = proposaCandidatsAlergens({ id: 'mostra', fonts });
    expect(senseResoldre.cobertura).toBe('parcial');
    expect(['ous', 'gluten', 'llet'].map(id => alergenDe(senseResoldre, id).simbol)).toEqual(['T', 'T', 'T']);
  });

  it('un nom de producte sense ingredients és «sense-ingredients» i només dona indicis', () => {
    const proposta = propostaDe('Cacauets salats', 'nom_comercial');
    expect(proposta.cobertura).toBe('sense-ingredients');
    expect(alergenDe(proposta, 'cacauets')).toMatchObject({ proposta: 'traca', simbol: 'T' });
    expect(alergenDe(proposta, 'cacauets').ingredient.estat).toBe('desconegut');
  });

  it('rebutja fonts massa llargues en lloc de retallar-les', () => {
    expect(() => propostaDe('a'.repeat(20001))).toThrow(RangeError);
  });
});
