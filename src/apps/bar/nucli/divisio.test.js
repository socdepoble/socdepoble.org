// @vitest-environment node
/* El Bar · nucli/divisio.js — invariants 5 i 6 de §A.4. */
import { describe, expect, test } from 'vitest';
import { divideixPerLinies, partsIguals, planPartsIguals } from './divisio.js';
import { afegeixProducte, aplicaDescompte, creaComanda, totals } from './comanda.js';
import { afegeixPagament } from './cobrament.js';
import { llavorCarta } from './llavor.js';

const ARA = '2026-10-02T13:30:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
let n = 0;
const nouId = (prefix = 'l') => { n += 1; return `${prefix}-${n}`; };
const afig = (c, producteId, opcions = {}) => afegeixProducte(c, { producte: P(producteId), ivaPerDefecte: 10, ...opcions }, { ara: ARA, idLinia: nouId() });
const taula = () => creaComanda({ id: nouId('c'), tornId: 'torn-1', origen: { tipus: 'taula', taulaId: 't3' }, ara: ARA, per: 'Cambrer 2' });

describe('partsIguals (invariant 6)', () => {
  test('partsIguals(1000, 3) = [334, 333, 333]', () => {
    expect(partsIguals(1000, 3)).toEqual([334, 333, 333]);
  });

  test('sempre sumen exactament el total, i els cèntims sobrants van a les primeres parts', () => {
    for (let t = 0; t < 2000; t += 37) {
      for (let parts = 1; parts <= 12; parts += 1) {
        const resultat = partsIguals(t, parts);
        expect(resultat.reduce((a, b) => a + b, 0)).toBe(t);
        expect(resultat).toHaveLength(parts);
        expect(Math.max(...resultat) - Math.min(...resultat)).toBeLessThanOrEqual(1);
        expect([...resultat].sort((a, b) => b - a)).toEqual(resultat);
      }
    }
  });

  test('rebutja parts i imports que no són enters vàlids', () => {
    expect(() => partsIguals(1000, 0)).toThrow(expect.objectContaining({ codi: 'PARTS' }));
    expect(() => partsIguals(1000, 51)).toThrow(expect.objectContaining({ codi: 'PARTS' }));
    expect(() => partsIguals(10.5, 2)).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
  });

  test('el pla és del pendent: el que ja s’ha pagat no es torna a repartir', () => {
    let c = afig(afig(taula(), 'plat-del-dia', { quantitat: 3 }), 'aigua', { varianteId: 'gran', quantitat: 2 });
    c = afegeixPagament(c, { metode: 'targeta', importCents: 1000 }, { id: 'p-1', ara: ARA });
    expect(planPartsIguals(c, 3)).toEqual([{ part: 1, importCents: 787 }, { part: 2, importCents: 787 }, { part: 3, importCents: 786 }]);
  });
});

describe('divideixPerLinies (invariant 5)', () => {
  test('naix una filla amb el mateix origen i la suma es conserva', () => {
    let c = afig(afig(taula(), 'cafe-llet', { quantitat: 4 }), 'croquetes');
    c = aplicaDescompte(c, c.linies[0].id, { tipus: 'percent', valor: 15, motiu: 'x' }, { ara: ARA });
    const abans = totals(c).totalCents;
    const { mare, filla } = divideixPerLinies(c, [{ liniaId: c.linies[0].id, quantitat: 1 }], { idNova: 'c-filla', ara: ARA, nouIdLinia: () => nouId() });
    expect(filla).toMatchObject({ id: 'c-filla', origen: { tipus: 'taula', taulaId: 't3' }, tornId: 'torn-1', atesPer: 'Cambrer 2', estat: 'oberta' });
    expect(totals(mare).totalCents + totals(filla).totalCents).toBe(abans);
    expect(filla.linies.map((l) => [l.producteId, l.quantitat])).toEqual([['cafe-llet', 1]]);
  });

  test('una comanda amb pagaments no deixa que la mare quede per davall del pagat', () => {
    let c = afig(taula(), 'calamars');
    c = afegeixPagament(c, { metode: 'efectiu', importCents: 500 }, { id: 'p-2', ara: ARA });
    expect(() => divideixPerLinies(c, [{ liniaId: c.linies[0].id }], { idNova: 'c-f2', ara: ARA, nouIdLinia: () => nouId() }))
      .toThrow(expect.objectContaining({ codi: 'PAGAT_SUPERA' }));
  });
});
