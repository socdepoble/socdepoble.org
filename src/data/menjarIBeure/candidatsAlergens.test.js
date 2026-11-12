import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { RECEPTES_QUE_DINEM } from '../patrimoni/queDinem.js';
import DADES from './parroquiaDades.generated.json';
import { ALERGENS } from '../../utils/productes/producteUniversal.js';
import { candidatsReceptaQueDinem, candidatsVariantParroquia, carregaCandidatsParroquia, carregaCandidatsQueDinem } from './candidatsAlergens.js';

const sha = value => createHash('sha256').update(value).digest('hex');
const comprova = proposta => {
  expect(proposta.estat).toBe('pendent_validacio_humana');
  expect(proposta.aptePerInformarConsumidor).toBe(false);
  expect(proposta.absenciesAcreditades).toBe(false);
  expect(proposta.alergens.map(alergen => alergen.id)).toEqual(ALERGENS);
  for (const alergen of proposta.alergens) {
    expect(alergen.estat).toBe('pendent_validacio_humana');
    expect(['candidat', 'desconegut']).toContain(alergen.ingredient.estat);
    expect(['candidat', 'desconegut']).toContain(alergen.traca.estat);
  }
  expect(proposta.escandall.costRacioCents).toBeNull();
  expect(proposta.escandall.costTotalCents).toBeNull();
  expect(proposta.escandall.racions).toBeNull();
};

describe('candidats dels corpus literals · 149 receptes i 564 REF', () => {
  it('cobrix totes les receptes sense mutar el corpus congelat', async () => {
    const abans = sha(JSON.stringify(RECEPTES_QUE_DINEM));
    const propostes = await carregaCandidatsQueDinem();
    expect(propostes).toHaveLength(149);
    expect(new Set(propostes.map(proposta => proposta.id)).size).toBe(149);
    propostes.forEach(comprova);
    expect(sha(JSON.stringify(RECEPTES_QUE_DINEM))).toBe(abans);
    for (let i = 0; i < propostes.length; i++) {
      const fonts = propostes[i].fontsRevisades.filter(font => font.tipus === 'ingredient_literal');
      expect(fonts.map(font => font.text)).toEqual(RECEPTES_QUE_DINEM[i].ingredients.flatMap(bloc => bloc.linies));
      expect(propostes[i].font.sha256).toBe('399d2f54abdba0fb4c75f0e4d1b60744f2b19ed0bdf781ae186e5758bc86fddd');
    }
  });

  it('cobrix cada REF i distingix noms comercials d’ingredients acreditats', async () => {
    const abans = sha(JSON.stringify(DADES));
    const propostes = await carregaCandidatsParroquia();
    expect(propostes).toHaveLength(564);
    expect(new Set(propostes.map(proposta => proposta.id)).size).toBe(564);
    expect(propostes.map(proposta => proposta.font.ref)).toEqual(DADES.variants.map(variant => variant.ref));
    for (const proposta of propostes) {
      comprova(proposta);
      expect(proposta.composicioDisponible).toBe(false);
      expect(proposta.alergens.every(alergen => alergen.ingredient.estat === 'desconegut')).toBe(true);
      expect(proposta.font.sha256).toBe('3a9843712130bdcf7adeea8ab54e675b2af645b9e41a3e1953e4dd0681fc359e');
    }
    expect(propostes.filter(proposta => proposta.escandall.costManualHistoricEstat === 'pendent')).toHaveLength(528);
    expect(propostes.filter(proposta => proposta.escandall.costManualHistoricCents === null)).toHaveLength(528);
    expect(sha(JSON.stringify(DADES))).toBe(abans);
  });

  it('conserva alternatives i notes com a evidència per revisar', () => {
    const recepta = RECEPTES_QUE_DINEM.find(r => r.ingredients.some(bloc => bloc.linies.some(linia => linia.includes('coco molt'))));
    const proposta = candidatsReceptaQueDinem(recepta);
    const fruits = proposta.alergens.find(alergen => alergen.id === 'fruits-closca');
    expect(fruits.traca.evidencies.some(evidencia => evidencia.text.includes('coco molt'))).toBe(true);
    expect(proposta.fontsRevisades.filter(font => font.tipus === 'nota_literal').map(font => font.text)).toEqual(recepta.notes);
  });

  it('un cost 0 original continua pendent; cap nom genera una traça', () => {
    const producte = DADES.productes.find(p => p.handle === DADES.variants[0].handle);
    const proposta = candidatsVariantParroquia(producte, DADES.variants[0]);
    expect(proposta.escandall.costManualHistoricCents).toBeNull();
    expect(proposta.alergens.every(alergen => alergen.traca.estat === 'desconegut')).toBe(true);
    expect(() => candidatsVariantParroquia(producte, { ...DADES.variants[0], handle: 'altre' })).toThrow(TypeError);
  });
});
