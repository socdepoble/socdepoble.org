// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { afegeixProducte, aplicaDescompte, creaComanda, totals } from './comanda.js';
import { afegeixPagament, tanca } from './cobrament.js';
import { parteixLinia, totalLinia } from './linia.js';
import { creaDevolucio } from './tiquet.js';
import { llavorCarta } from './llavor.js';

const ARA = '2026-11-16T00:00:00.000Z';
const MAXIM = Number.MAX_SAFE_INTEGER;
const producte = (preu) => ({ ...llavorCarta().productes[0], preuObert: true, ivaPercent: 10, preu });
const buida = () => creaComanda({ id: 'c-r324', tornId: 't-r324', origen: { tipus: 'barra' }, ara: ARA });
const ven = (preuCents, quantitat = 1) => afegeixProducte(buida(), {
  producte: producte(preuCents), preuCents, quantitat
}, { idLinia: 'l-r324', ara: ARA });

describe('R32.4: límits segurs en el recorregut real del compte', () => {
  test('l’IVA de tot el marge segur es desglossa sense multiplicar en coma flotant', () => {
    const comanda = ven(MAXIM);
    const t = totals(comanda);
    const base = Number((BigInt(MAXIM) * 100n * 2n + 110n) / 220n);
    expect(t.totalCents).toBe(MAXIM);
    expect(t.perIva).toEqual([{ ivaPercent: 10, baseCents: base, quotaCents: MAXIM - base }]);
    const pagada = afegeixPagament(comanda, { metode: 'efectiu', importCents: MAXIM, lliuratCents: MAXIM }, { id: 'p-r324', ara: ARA });
    expect(tanca(pagada, { numero: 1, ara: ARA }).pagaments[0].canviCents).toBe(0);
  });

  test('el descompte, la divisió i les devolucions conserven els cèntims grans', () => {
    const comanda = aplicaDescompte(ven(90_000_000_000_000, 99), 'l-r324', {
      tipus: 'percent', valor: 80, motiu: 'Prova'
    }, { ara: ARA });
    const t = totals(comanda);
    expect(t.totalCents).toBe(1_782_000_000_000_000);
    const [resta, part] = parteixLinia(comanda.linies[0], 77, 'l-part');
    expect(totalLinia(resta) + totalLinia(part)).toBe(t.totalCents);
    const tiquet = tanca(afegeixPagament(comanda, { metode: 'targeta', importCents: t.totalCents }, {
      id: 'p-r324', ara: ARA
    }), { numero: 1, ara: ARA });
    const opcions = { motiu: 'Prova', metode: 'targeta', ara: ARA, tornId: 't-r324' };
    const primera = creaDevolucio(tiquet, [{ liniaId: 'l-r324', quantitat: 77 }], { ...opcions, id: 'd-1', numero: 2 });
    const ultima = creaDevolucio(tiquet, [{ liniaId: 'l-r324', quantitat: 22 }], {
      ...opcions, id: 'd-2', numero: 3, devolucionsPrevies: [primera]
    });
    expect(primera.totals.totalCents + ultima.totals.totalCents).toBe(-t.totalCents);
  });

  test('afegir una línia o agrupar unitats refusa imports fora del marge abans de persistir', () => {
    expect(() => ven(MAXIM, 2)).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
    const comanda = ven(MAXIM);
    expect(() => afegeixProducte(comanda, { producte: producte(MAXIM), preuCents: MAXIM }, {
      idLinia: 'l-2', ara: ARA
    })).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
    expect(comanda.linies[0].quantitat).toBe(1);
    expect(comanda.linies).toHaveLength(1);
  });
});
