import { describe, expect, test } from 'vitest';
import {
  CODIS_CENS, LLINDAR_ROIG, esForaDeCens, esOrfena, esSenseDisparador, resumInventari, semaforDe, skillsDelInventari
} from './inventariMapa.js';

const n = (id, tipus, atributs = {}) => ({ id, tipus, font: null, atributs });
const avis = (node, codi, severitat = 'mitjana') => ({ node, codi, severitat, evidencia: null });
const MAPA_BUIT = Object.freeze({ nodes: [], arestes: [], tasques: [], avisos: [], salut: [] });

/* Les skills del Mapa real del 25-09 (vistesMapa.test.jsx): una del nucli
   sense avisos i una òrfena; l'avís d'una tasca no és de l'inventari. */
const MAPA = Object.freeze({
  ...MAPA_BUIT,
  nodes: [
    n('agent:claude-code', 'agent'), n('skill:sdp-workflow', 'skill', { core: true }),
    n('skill:wiki-busca-skills', 'skill'), n('tasca:reflex-daemon', 'tasca')
  ],
  avisos: [avis('skill:wiki-busca-skills', 'orfe'), avis('tasca:reflex-daemon', 'tasca-morta', 'alta')]
});

describe('semàfor de l’inventari (03_inventari_skills.md)', () => {
  test('3 avisos o més, roig; 1 o 2, ambre; cap, verd', () => {
    expect(LLINDAR_ROIG).toBe(3);
    expect([0, 1, 2, 3, 7].map(semaforDe)).toEqual(['verd', 'ambre', 'ambre', 'roig', 'roig']);
  });
});

describe('skillsDelInventari', () => {
  test('només les skills, cadascuna amb els seus avisos; més avisos primer i, a igualtat, per nom', () => {
    const mapa = {
      ...MAPA,
      nodes: [...MAPA.nodes, n('skill:core-identitat', 'skill'), n('skill:a-nova', 'skill')],
      avisos: [...MAPA.avisos, avis('skill:a-nova', 'orfe'), avis('skill:a-nova', 'fora-index')]
    };
    expect(skillsDelInventari(mapa).map((s) => [s.nom, s.avisos.map((a) => a.codi)])).toEqual([
      ['a-nova', ['orfe', 'fora-index']],
      ['wiki-busca-skills', ['orfe']],
      ['core-identitat', []],
      ['sdp-workflow', []]
    ]);
    // Conserva el node sencer: la taula en llig els atributs.
    expect(skillsDelInventari(mapa).find((s) => s.id === 'skill:sdp-workflow').atributs.core).toBe(true);
  });

  test('un Mapa sense skills no té inventari', () => {
    expect(skillsDelInventari(MAPA_BUIT)).toEqual([]);
  });
});

describe('predicats dels filtres i de la coberta', () => {
  const ambCodis = (...codis) => ({ avisos: codis.map((c) => avis('skill:x', c)) });

  test('òrfena, fora d’algun cens i sense disparador útil, pels codis del compilador', () => {
    expect(esOrfena(ambCodis('orfe'))).toBe(true);
    expect(esOrfena(ambCodis('fora-index'))).toBe(false);
    expect(CODIS_CENS).toEqual(['fora-index', 'fora-cataleg-claude', 'fora-segell', 'skill-fantasma']);
    expect(Object.isFrozen(CODIS_CENS)).toBe(true);
    for (const codi of CODIS_CENS) expect(esForaDeCens(ambCodis(codi)), codi).toBe(true);
    expect(esForaDeCens(ambCodis('orfe', 'pes'))).toBe(false);
    expect(esSenseDisparador(ambCodis('disparador-decoratiu'))).toBe(true);
    expect(esSenseDisparador(ambCodis('orfe'))).toBe(false);
    expect(esOrfena(ambCodis())).toBe(false);
  });
});

describe('resumInventari', () => {
  const xifres = (mapa) => {
    const { skills, ...resta } = resumInventari(mapa);
    return { noms: skills.map((s) => s.nom), ...resta };
  };

  test('el Mapa real: una skill neta i una òrfena en ambre', () => {
    expect(xifres(MAPA)).toEqual({
      noms: ['wiki-busca-skills', 'sdp-workflow'],
      total: 2, netes: 1, roges: 0, ambres: 1, orfenes: 1, foraDeCens: 0, senseDisparador: 0
    });
  });

  test('l’exemple del Mestre: les categories se solapen i no sumen el total', () => {
    const mapa = {
      ...MAPA_BUIT,
      nodes: [n('skill:a', 'skill'), n('skill:b', 'skill'), n('skill:c', 'skill')],
      avisos: [
        avis('skill:a', 'orfe'), avis('skill:a', 'fora-index'), avis('skill:a', 'disparador-decoratiu'),
        avis('skill:b', 'fora-segell', 'alta')
      ]
    };
    expect(xifres(mapa)).toEqual({
      noms: ['a', 'b', 'c'],
      total: 3, netes: 1, roges: 1, ambres: 1, orfenes: 1, foraDeCens: 2, senseDisparador: 1
    });
  });

  test('sense skills, tot a zero', () => {
    expect(xifres(MAPA_BUIT)).toEqual({
      noms: [], total: 0, netes: 0, roges: 0, ambres: 0, orfenes: 0, foraDeCens: 0, senseDisparador: 0
    });
  });
});
