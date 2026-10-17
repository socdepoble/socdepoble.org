// @vitest-environment node
/* Pla 261016_1530, Onada 0.5 (mòdul 2) i relleu de Codex 261016_1639 (fila
   I10) · Demanat = tots els ids; fet = [FET I SEGELLAT]; traslladat = la
   resta, amb els seus ids. Amb un trasllat, es comparen conjunts d'ids. La
   Consola no mou res. */
import { describe, expect, test } from 'vitest';
import { balancDe, comparaTrasllat } from './balancGovern.js';
import { normalitzaMcr, vistaMatriu } from './matriuGovern.js';
import { normalitzaTrasllat } from './governContent.js';

const ARA = Date.parse('2026-10-16T16:00:00.000Z');
const AT = '2026-10-16T15:02:56.740108+00:00';
const fila = (id, status) => ({ id, source: 'x', requirement: `R ${id}`, status, evidence: 'e', owner: 'Codex', priority: 'P2', acceptance: 'a' });
const matriu = (files, extra = {}) => normalitzaMcr({ at: AT, baseline_head: '7a1828ca', requirements: files, ...extra });
const FILES = [fila('F04', '[FET I SEGELLAT]'), fila('F01', '[PARCIAL]'), fila('I09', '[NO FET / PENDENT]'), fila('Z1', '[GAIREBÉ]')];
const vista = (opcions = {}) => vistaMatriu(matriu(FILES), { ara: ARA, ...opcions });

describe('balancDe', () => {
  test('demanat, fet i traslladat, amb els ids en l’ordre de la matriu', () => {
    expect(balancDe(vista())).toEqual({
      demanat: ['F04', 'F01', 'I09', 'Z1'],
      fet: ['F04'],
      traslladat: ['F01', 'I09', 'Z1'],
      oberts: ['F01', 'I09', 'Z1'],
      perRevisar: []
    });
  });

  test('una matriu obsoleta no dona res per fet: el que deia fet també es trasllada, per a tornar-ho a comprovar', () => {
    const b = balancDe(vista({ head: 'deadbeef' }));
    expect(b.fet).toEqual([]);
    expect(b.traslladat).toEqual(['F04', 'F01', 'I09', 'Z1']);
    expect(b.perRevisar).toEqual(['F04']);
    // El que un trasllat ha de portar és el que la matriu mateixa no dona per fet.
    expect(b.oberts).toEqual(['F01', 'I09', 'Z1']);
  });

  test('sense matriu, null', () => {
    expect(balancDe(null)).toBeNull();
  });
});

describe('comparaTrasllat: conjunts d’ids', () => {
  const b = () => balancDe(vista());
  test('igual: porta exactament els oberts (l’ordre no compta)', () => {
    const t = normalitzaTrasllat({ at: AT, source: 'mcr.json', ids: ['Z1', 'I09', 'F01'] });
    expect(comparaTrasllat(b(), t, vista())).toEqual({ igual: true, falten: [], sobren: [], duplicats: [], mateixMoment: true });
  });
  test('falten els que es quedarien en l’oblit; sobren els que la matriu no té oberts', () => {
    const t = normalitzaTrasllat({ at: '2026-10-16T14:52:00Z', ids: ['F01', 'F04', 'X9'] });
    expect(comparaTrasllat(b(), t, vista())).toEqual({
      igual: false, falten: ['I09', 'Z1'], sobren: ['F04', 'X9'], duplicats: [], mateixMoment: false
    });
  });
  test('un id repetit al trasllat no quadra, encara que els conjunts siguen iguals', () => {
    const t = normalitzaTrasllat({ ids: ['F01', 'I09', 'Z1', 'I09'] });
    expect(comparaTrasllat(b(), t, vista())).toMatchObject({ igual: false, falten: [], sobren: [], duplicats: ['I09'], mateixMoment: null });
  });
  test('sense trasllat o sense balanç, null', () => {
    expect(comparaTrasllat(b(), null)).toBeNull();
    expect(comparaTrasllat(null, normalitzaTrasllat({ ids: [] }))).toBeNull();
  });
});
