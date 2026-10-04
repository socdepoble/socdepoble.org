// @vitest-environment node
/* Identitat legal · el titular: persona o entitat, id opac i àmbit, i el
   conjunt multititular. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { esIdOpac } from './guardes.js';
import { creaTitular, esTitular, nouIdOpac, titularsDeLAmbit, validaTitular, validaTitulars } from './titular.js';

const tros = (...parts) => parts.join('');
const codis = (errors) => errors.map((e) => e.codi);

const LLAR = { id: 'tit_prova_llar', tipus: 'persona', ambit: 'LLAR', alies: 'Casa de prova' };
const ACTIVITAT = { id: 'tit_prova_activitat', tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Activitat de prova', persona: 'tit_prova_llar' };
const ENTITAT = { id: 'tit_prova_entitat', tipus: 'entitat', ambit: 'ENTITAT', alies: 'Associació de prova', formaJuridica: 'associacio', representants: ['tit_prova_llar'] };

describe('nouIdOpac', () => {
  test('setze bytes fan 32 lletres, sense cap xifra, darrere del prefix', () => {
    const bytes = Uint8Array.from({ length: 16 }, (_, i) => i * 17);
    const id = nouIdOpac('tit', bytes);
    expect(id).toBe('tit_aabbccddeeffgghhiijjkkllmmnnoopp');
    expect(id).toMatch(/^tit_[a-p]{32}$/);
    expect(esIdOpac(id)).toBe(true);
  });

  test('refusa un prefix que no són lletres i massa pocs bytes', () => {
    expect(() => nouIdOpac('t1', new Uint8Array(16))).toThrow(TypeError);
    expect(() => nouIdOpac('tit', new Uint8Array(8))).toThrow(TypeError);
    expect(() => nouIdOpac('tit', [1, 2, 3])).toThrow(TypeError);
  });
});

describe('creaTitular', () => {
  test('una persona en l’àmbit de la llar, congelada i sense cap identificador', () => {
    const t = creaTitular({ ...LLAR, alies: '  Casa de prova ' });
    expect(t).toEqual({
      schema: 'sdp.gestoria.titular.v1', id: 'tit_prova_llar', tipus: 'persona', ambit: 'LLAR', alies: 'Casa de prova',
      formaJuridica: null, persona: null, representants: []
    });
    expect(Object.isFrozen(t)).toBe(true);
    expect(esTitular(t)).toBe(true);
  });

  test('l’activitat apunta a la llar de la mateixa persona', () => {
    expect(creaTitular(ACTIVITAT).persona).toBe('tit_prova_llar');
  });

  test('l’entitat porta forma jurídica i representants, sense repetits', () => {
    const t = creaTitular({ ...ENTITAT, representants: ['tit_prova_llar', 'tit_prova_llar'] });
    expect(t.formaJuridica).toBe('associacio');
    expect(t.representants).toEqual(['tit_prova_llar']);
  });

  test('els àmbits van lligats al tipus', () => {
    expect(codis(validaTitular({ ...LLAR, ambit: 'ENTITAT' }))).toEqual(['AMBIT_INVALID']);
    expect(codis(validaTitular({ ...ENTITAT, ambit: 'LLAR' }))).toEqual(['AMBIT_INVALID']);
    expect(codis(validaTitular({ ...LLAR, tipus: 'robot' }))).toEqual(['TIPUS_INVALID']);
  });

  test('cada camp, al seu lloc', () => {
    expect(codis(validaTitular({ ...ACTIVITAT, persona: undefined }))).toEqual(['ID_INVALID']);
    expect(codis(validaTitular({ ...LLAR, persona: 'tit_prova_altra' }))).toEqual(['CAMP_SOBRANT']);
    expect(codis(validaTitular({ ...LLAR, formaJuridica: 'associacio' }))).toEqual(['CAMP_SOBRANT']);
    expect(codis(validaTitular({ ...ENTITAT, formaJuridica: 'club' }))).toEqual(['FORMA_INVALIDA']);
    expect(codis(validaTitular({ ...ENTITAT, persona: 'tit_prova_llar' }))).toEqual(['CAMP_SOBRANT']);
    expect(codis(validaTitular({ ...ENTITAT, representants: 'tit_prova_llar' }))).toEqual(['REPRESENTANTS_INVALIDS']);
  });

  test('cap número d’identitat ni cap compte entra al titular', () => {
    expect(codis(validaTitular({ ...LLAR, nif: tros('1234', '5678', 'Z') }))).toEqual(['CAMP_DESCONEGUT']);
    expect(codis(validaTitular({ ...LLAR, alies: tros('Casa ', '1234', '5678', 'Z') }))).toEqual(['IDENTIFICADOR_PERSONAL']);
    expect(codis(validaTitular({ ...LLAR, alies: tros('Compte ES91 ', '2100 0418 ', '4502 0005 1332') }))).toEqual(['IDENTIFICADOR_PERSONAL']);
    expect(codis(validaTitular({ ...LLAR, id: tros('tit_', '1234', '5678', 'z') }))).toEqual(['ID_INVALID']);
  });

  test('un titular invàlid llança TITULAR_INVALID amb tots els detalls', () => {
    let error;
    try { creaTitular({ ...LLAR, alies: '', ambit: 'ENTITAT' }); } catch (e) { error = e; }
    expect(error.codi).toBe('TITULAR_INVALID');
    expect(codis(error.detalls)).toEqual(['CAMP_OBLIGATORI', 'AMBIT_INVALID']);
    expect(codis(validaTitular(null))).toEqual(['TITULAR_INVALID']);
  });
});

describe('multititular', () => {
  const titulars = [creaTitular(LLAR), creaTitular(ACTIVITAT), creaTitular(ENTITAT)];

  test('la persona autònoma i l’associació conviuen, cadascuna en el seu àmbit', () => {
    expect(validaTitulars(titulars)).toEqual([]);
    expect(titularsDeLAmbit(titulars, 'LLAR').map((t) => t.id)).toEqual(['tit_prova_llar']);
    expect(titularsDeLAmbit(titulars, 'ACTIVITAT').map((t) => t.id)).toEqual(['tit_prova_activitat']);
    expect(titularsDeLAmbit(titulars, 'ENTITAT').map((t) => t.id)).toEqual(['tit_prova_entitat']);
    expect(() => titularsDeLAmbit(titulars, 'CASA')).toThrow(RangeError);
  });

  test('l’activitat sense llar i el representant que no és una persona del conjunt', () => {
    const orfe = creaTitular({ ...ACTIVITAT, persona: 'tit_prova_absent' });
    const malRepresentada = creaTitular({ ...ENTITAT, id: 'tit_prova_entitat_dos', representants: ['tit_prova_entitat'] });
    expect(codis(validaTitulars([creaTitular(LLAR), orfe, creaTitular(ENTITAT), malRepresentada]))).toEqual(['PERSONA_ABSENT', 'REPRESENTANT_ABSENT']);
  });

  test('ids repetits i objectes que no venen de creaTitular', () => {
    expect(codis(validaTitulars([creaTitular(LLAR), creaTitular(LLAR), { ...LLAR }]))).toEqual(['ID_REPETIT', 'TITULAR_INVALID']);
    expect(codis(validaTitulars('no'))).toEqual(['TITULARS_INVALIDS']);
  });
});
