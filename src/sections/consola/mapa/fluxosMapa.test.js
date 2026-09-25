import { describe, expect, test } from 'vitest';
import {
  MAX_PASSOS, camiDe, encaixa, enllacosDelMapa, cadenesDelMapa, suggerimentsDelMapa, puntsDeTrobada, fluxosDelMapa
} from './fluxosMapa.js';

const n = (id, tipus) => ({ id, tipus, font: null, atributs: {} });
const a = (de, cap, tipus, confianca = 'declarat') => ({ de, a: cap, tipus, confianca, evidencia: '.agents/protocolledge.json' });

/* Tres rutes que es passen la faena per l'Escriptori, dues skills que es
   criden de veres i una menció de prosa que no ha d'encadenar mai. */
const MAPA = Object.freeze({
  nodes: [
    n('ruta:pla', 'ruta'), n('ruta:auditoria', 'ruta'), n('ruta:acta', 'ruta'),
    n('document:_wiki/04_escriptori', 'document'), n('document:_wiki/04_escriptori/plans', 'document'),
    n('document:_wiki/10_actes', 'document'), n('document:AGENTS.md', 'document'),
    n('skill:a', 'skill'), n('skill:b', 'skill'), n('skill:c', 'skill'),
    n('script:npm:porta', 'script'), n('script:tooling/x.mjs', 'script')
  ],
  arestes: [
    a('ruta:pla', 'document:_wiki/04_escriptori/plans', 'escriu'),
    a('ruta:pla', 'document:AGENTS.md', 'llig'),
    a('ruta:auditoria', 'document:_wiki/04_escriptori', 'llig'),
    a('ruta:auditoria', 'document:_wiki/04_escriptori', 'escriu'),
    a('ruta:acta', 'document:_wiki/04_escriptori', 'llig'),
    a('ruta:acta', 'document:_wiki/10_actes', 'escriu'),
    a('skill:a', 'skill:b', 'crida'),
    a('skill:b', 'skill:c', 'crida', 'inferit'),
    // Els scripts no són peces encadenables: npm no és un flux de treball.
    a('script:npm:porta', 'script:tooling/x.mjs', 'crida')
  ],
  tasques: [],
  avisos: [],
  salut: []
});

describe('camins i encaix', () => {
  test('el camí d’un document ix del seu id; el d’una skill, del nom', () => {
    expect(camiDe(n('document:_wiki/10_actes', 'document'))).toBe('_wiki/10_actes');
    expect(camiDe(n('plantilla:_wiki/03_actuar/plantilles/acta.md', 'plantilla'))).toBe('_wiki/03_actuar/plantilles/acta.md');
    expect(camiDe({ id: 'skill:a', tipus: 'skill', font: '.agents/skills/a/SKILL.md' })).toBe('.agents/skills/a/SKILL.md');
  });

  test('encaixa el mateix camí i una carpeta que conté l’altre, en els dos sentits', () => {
    expect(encaixa('_wiki/04_escriptori', '_wiki/04_escriptori')).toBe(true);
    expect(encaixa('_wiki/04_escriptori/plans', '_wiki/04_escriptori')).toBe(true);
    expect(encaixa('_wiki/04_escriptori/', '_wiki/04_escriptori/plans')).toBe(true);
    expect(encaixa('_wiki/04_escriptori_vell', '_wiki/04_escriptori')).toBe(false);
    expect(encaixa('_wiki/10_actes', '_wiki/04_escriptori')).toBe(false);
  });
});

describe('enllaços entre peces', () => {
  test('escriure el que un altre llig enllaça; la crida declarada també; la prosa i els scripts no', () => {
    const claus = enllacosDelMapa(MAPA).map((e) => `${e.de}>${e.a}:${e.via}`).sort();
    expect(claus).toEqual([
      'ruta:auditoria>ruta:acta:fitxer',
      'ruta:pla>ruta:acta:fitxer',
      'ruta:pla>ruta:auditoria:fitxer',
      'skill:a>skill:b:crida'
    ]);
  });

  test('l’enllaç per fitxer diu què deixa l’un i què llig l’altre', () => {
    const e = enllacosDelMapa(MAPA).find((x) => x.de === 'ruta:pla' && x.a === 'ruta:auditoria');
    expect(e).toMatchObject({ via: 'fitxer', deixa: '_wiki/04_escriptori/plans', llig: '_wiki/04_escriptori', confianca: 'declarat' });
  });

  test('un enllaç val el que val la seua aresta més feble', () => {
    const mapa = {
      ...MAPA,
      arestes: [a('ruta:pla', 'document:AGENTS.md', 'escriu', 'derivat'), a('ruta:acta', 'document:AGENTS.md', 'llig')]
    };
    expect(enllacosDelMapa(mapa)).toEqual([expect.objectContaining({ de: 'ruta:pla', a: 'ruta:acta', confianca: 'derivat' })]);
  });
});

describe('cadenes', () => {
  test('la més llarga per origen, sense les que ja conté una altra', () => {
    const cadenes = cadenesDelMapa(MAPA).map((c) => c.passos.map((p) => p.id));
    expect(cadenes).toEqual([
      ['ruta:pla', 'ruta:auditoria', 'ruta:acta'],
      ['skill:a', 'skill:b']
    ]);
  });

  test('cada pas porta l’enllaç amb l’anterior; el primer, cap', () => {
    const [cadena] = cadenesDelMapa(MAPA);
    expect(cadena.passos[0].enllac).toBeNull();
    expect(cadena.passos[1].enllac.via).toBe('fitxer');
    expect(cadena.passos[2].enllac.de).toBe('ruta:auditoria');
    expect(cadena.confianca).toBe('declarat');
  });

  test('un cicle no repetix peces ni penja el càlcul, i cap cadena passa del màxim', () => {
    const ids = Array.from({ length: 8 }, (_, i) => `ruta:r${i}`);
    const mapa = {
      nodes: [...ids.map((id) => n(id, 'ruta')), ...ids.map((_, i) => n(`document:f${i}`, 'document'))],
      arestes: ids.flatMap((id, i) => [
        a(id, `document:f${i}`, 'escriu'),
        a(ids[(i + 1) % ids.length], `document:f${i}`, 'llig')
      ]),
      tasques: [], avisos: [], salut: []
    };
    const cadenes = cadenesDelMapa(mapa);
    expect(cadenes.length).toBeGreaterThan(0);
    for (const c of cadenes) {
      const passos = c.passos.map((p) => p.id);
      expect(new Set(passos).size).toBe(passos.length);
      expect(passos.length).toBeLessThanOrEqual(MAX_PASSOS);
    }
  });

  test('sense enllaços no hi ha cap cadena', () => {
    expect(cadenesDelMapa({ ...MAPA, arestes: [] })).toEqual([]);
  });
});

describe('suggeriments i punts de trobada', () => {
  test('la prosa només suggerix: les arestes inferides entre peces encadenables', () => {
    expect(suggerimentsDelMapa(MAPA).map((s) => `${s.de}>${s.a}`)).toEqual(['skill:b>skill:c']);
  });

  test('cada lloc diu qui hi escriu i qui el llig', () => {
    const punts = puntsDeTrobada(MAPA);
    const escriptori = punts.find((p) => p.node.id === 'document:_wiki/04_escriptori');
    expect(escriptori.escriuen).toEqual(['ruta:auditoria']);
    expect(escriptori.lligen).toEqual(['ruta:acta', 'ruta:auditoria']);
    const actes = punts.find((p) => p.node.id === 'document:_wiki/10_actes');
    expect(actes).toMatchObject({ escriuen: ['ruta:acta'], lligen: [] });
    expect(punts[0].node.id).toBe('document:_wiki/04_escriptori');
  });

  test('fluxosDelMapa ho junta tot', () => {
    const f = fluxosDelMapa(MAPA);
    expect(f.cadenes).toHaveLength(2);
    expect(f.suggeriments).toHaveLength(1);
    expect(f.punts.length).toBeGreaterThan(0);
  });
});
