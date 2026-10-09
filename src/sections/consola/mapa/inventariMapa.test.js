import { describe, expect, test } from 'vitest';
import {
  CODIS_AMB_REPARACIO, CODIS_CENS, codisReparats, esForaDeCens, esFrontmatterInvalid, esOrfena, esSenseDisparador,
  ordreReparacio, resumInventari, semaforDe, skillsDelInventari
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

/* Onada 6 (requisit 8: «segons la seua gravetat») · Derogat «3 avisos o
   més, roig; 1 o 2, ambre» (LLINDAR_ROIG): el semàfor mira la gravetat. */
describe('semàfor de l’inventari (03_inventari_skills.md)', () => {
  test('un avís alt, roig; només mitjans o baixos, ambre; cap, verd', () => {
    const de = (...severitats) => severitats.map((s) => avis('skill:x', 'orfe', s));
    expect(semaforDe([])).toBe('verd');
    expect(semaforDe(undefined)).toBe('verd');
    expect(semaforDe(de('baixa'))).toBe('ambre');
    expect(semaforDe(de('mitjana', 'mitjana', 'mitjana', 'mitjana'))).toBe('ambre');
    expect(semaforDe(de('alta'))).toBe('roig');
    expect(semaforDe(de('baixa', 'alta'))).toBe('roig');
    // Una severitat desconeguda no es pot dir bona.
    expect(semaforDe(de('rara'))).toBe('ambre');
  });

  test('cada skill porta el seu semàfor, i les roges van primer', () => {
    const mapa = { ...MAPA, avisos: [...MAPA.avisos, avis('skill:sdp-workflow', 'fora-segell', 'alta')] };
    expect(skillsDelInventari(mapa).map((s) => [s.nom, s.semafor])).toEqual([
      ['sdp-workflow', 'roig'], ['wiki-busca-skills', 'ambre']
    ]);
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
    // Onada 6 · el filtre «Frontmatter invàlid».
    expect(esFrontmatterInvalid(ambCodis('frontmatter-invalid'))).toBe(true);
    expect(esFrontmatterInvalid(ambCodis('orfe'))).toBe(false);
  });
});

/* Onada 6 (requisit 11) · «Copiar l'ordre de reparació»: la Consola només la copia. */
describe('ordreReparacio', () => {
  const skillAmb = (nom, ...codis) => ({ id: `skill:${nom}`, nom, avisos: codis.map((c) => avis(`skill:${nom}`, c)) });

  /* Correcció de l'Onada 6 (revisió adversarial: «pot enganyar») · cada línia
     diu quin avís repara; el segell només es diagnostica (sense --update): el
     resegellat passa per l'executor amb lease. Derogat: npm run porta:segella:update. */
  test('l’ordre exacta per a cada codi amb reparació mecànica, sense repetir, i quin avís repara', () => {
    expect(CODIS_AMB_REPARACIO).toEqual(['fora-cataleg-claude', 'fora-segell', 'segell-divergent', 'fora-index']);
    expect(ordreReparacio(skillAmb('sdp-pedra-seca', 'fora-cataleg-claude')))
      .toBe('ln -s ../../.agents/skills/sdp-pedra-seca .claude/skills/sdp-pedra-seca  # repara fora-cataleg-claude');
    expect(ordreReparacio(skillAmb('x', 'fora-segell', 'segell-divergent', 'fora-index'))).toBe([
      'node tooling/gates/segella.mjs  # diagnòstic de fora-segell i segell-divergent; el segell nou, amb executor-mutacio i lease',
      'npm run skills:index  # repara fora-index'
    ].join('\n'));
    expect(ordreReparacio(skillAmb('x', 'segell-divergent')))
      .toBe('node tooling/gates/segella.mjs  # diagnòstic de segell-divergent; el segell nou, amb executor-mutacio i lease');
    // Cap ordre no torna a segellar a cegues.
    expect(ordreReparacio(skillAmb('x', ...CODIS_AMB_REPARACIO))).not.toMatch(/--update|segella:update/);
  });

  test('una skill roja per una causa sense ordre només copia la que en té, i ho diu', () => {
    const roja = skillAmb('core-higiene-escriptori', 'frontmatter-invalid', 'contracte-absent', 'fora-cataleg-claude');
    expect(ordreReparacio(roja)).toBe('ln -s ../../.agents/skills/core-higiene-escriptori .claude/skills/core-higiene-escriptori  # repara fora-cataleg-claude');
    expect(codisReparats(roja)).toEqual(['fora-cataleg-claude']);
    expect(codisReparats(skillAmb('x', 'orfe'))).toEqual([]);
  });

  test('sense cap avís amb reparació mecànica, cap ordre', () => {
    expect(ordreReparacio(skillAmb('x', 'frontmatter-invalid', 'orfe', 'disparador-decoratiu'))).toBeNull();
    expect(ordreReparacio(skillAmb('x'))).toBeNull();
    expect(ordreReparacio(null)).toBeNull();
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
      total: 2, netes: 1, roges: 0, ambres: 1, orfenes: 1, foraDeCens: 0, senseDisparador: 0, frontmatterInvalid: 0
    });
  });

  /* Onada 6 · amb el semàfor de la gravetat, la b (un sol avís alt) és la roja
     i va primer; la a (tres mitjans), ambre. Els recomptes no canvien. */
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
      noms: ['b', 'a', 'c'],
      total: 3, netes: 1, roges: 1, ambres: 1, orfenes: 1, foraDeCens: 2, senseDisparador: 1, frontmatterInvalid: 0
    });
  });

  test('sense skills, tot a zero', () => {
    expect(xifres(MAPA_BUIT)).toEqual({
      noms: [], total: 0, netes: 0, roges: 0, ambres: 0, orfenes: 0, foraDeCens: 0, senseDisparador: 0, frontmatterInvalid: 0
    });
  });
});
