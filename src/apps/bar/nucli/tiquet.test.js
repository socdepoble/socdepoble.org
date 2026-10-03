// @vitest-environment node
/* El Bar · nucli/tiquet.js — devolucions enllaçades (invariants 1 i 2) i l'IVA informatiu. */
import { describe, expect, test } from 'vitest';
import { creaDevolucio, desglossaIva, importLiniaTiquet, retornatPerLinia } from './tiquet.js';
import { afegeixPagament, tanca } from './cobrament.js';
import { afegeixProducte, aplicaDescompte, convida, creaComanda, totals } from './comanda.js';
import { llavorCarta } from './llavor.js';
import { totalLinia } from './linia.js';

const ARA = '2026-10-02T10:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
let n = 0;
const nouId = (prefix = 'l') => { n += 1; return `${prefix}-${n}`; };
const afig = (c, producteId, opcions = {}) => afegeixProducte(c, { producte: P(producteId), ivaPerDefecte: 10, ...opcions }, { ara: ARA, idLinia: nouId() });

function tiquetDe(construix) {
  const c = construix(creaComanda({ id: nouId('c'), tornId: 'torn-1', origen: { tipus: 'barra' }, ara: ARA }));
  const pagada = afegeixPagament(c, { metode: 'targeta', importCents: totals(c).pendentCents }, { id: nouId('p'), ara: ARA });
  return tanca(pagada, { numero: 7, ara: ARA });
}
const retorna = (tiquet, seleccio, extra = {}) => creaDevolucio(tiquet, seleccio, {
  motiu: 'Producte en mal estat', metode: 'efectiu', id: nouId('k'), ara: ARA, numero: 8, tornId: 'torn-1', per: 'Encarregada', ...extra
});

describe('desglossaIva', () => {
  test('preu 1,00 € amb 10 % → base 0,91 i quota 0,09', () => {
    expect(desglossaIva([{ ivaPercent: 10, t: 100 }], (l) => l.t)).toEqual([{ ivaPercent: 10, baseCents: 91, quotaCents: 9 }]);
  });

  test('agrupa per tipus, de menor a major, i base + quota = total sempre', () => {
    const linies = [{ ivaPercent: 21, t: 250 }, { ivaPercent: 10, t: 130 }, { ivaPercent: 21, t: 99 }, { ivaPercent: 4, t: 0 }];
    const resultat = desglossaIva(linies, (l) => l.t);
    expect(resultat.map((g) => g.ivaPercent)).toEqual([10, 21]);
    expect(resultat.map((g) => g.baseCents + g.quotaCents)).toEqual([130, 349]);
    /* 349 × 100 / 121 = 288,43 → 288 */
    expect(resultat[1]).toEqual({ ivaPercent: 21, baseCents: 288, quotaCents: 61 });
  });

  test('en negatiu (devolucions) arrodonix simètric', () => {
    expect(desglossaIva([{ ivaPercent: 10, t: -100 }], (l) => l.t)).toEqual([{ ivaPercent: 10, baseCents: -91, quotaCents: -9 }]);
  });
});

describe('creaDevolucio (invariant 2: una correcció és un tiquet nou)', () => {
  test('un tiquet de devolució enllaçat, congelat i en negatiu', () => {
    const tiquet = tiquetDe((c) => afig(afig(c, 'cervesa-ampolla', { quantitat: 3 }), 'olives'));
    const dev = retorna(tiquet, [{ liniaId: tiquet.linies[0].id, quantitat: 2 }]);
    expect(dev).toMatchObject({ tipus: 'devolucio', tiquetOrigenId: tiquet.id, numero: 8, estat: 'tancada', motiu: 'Producte en mal estat' });
    expect(dev.totals.totalCents).toBe(-440);
    expect(dev.pagaments).toEqual([expect.objectContaining({ metode: 'efectiu', importCents: -440 })]);
    expect(dev.linies[0]).toMatchObject({ liniaOrigenId: tiquet.linies[0].id, quantitat: 2, importCents: 440 });
    expect(importLiniaTiquet(dev, dev.linies[0])).toBe(-440);
    expect(dev.totals.perIva).toEqual([{ ivaPercent: 10, baseCents: -400, quotaCents: -40 }]);
    expect(Object.isFrozen(dev.linies[0])).toBe(true);
    /* El tiquet original no canvia. */
    expect(tiquet.linies[0].quantitat).toBe(3);
  });

  test('una devolució més gran que l’original no es pot fer, tampoc sumant les ja fetes', () => {
    const tiquet = tiquetDe((c) => afig(c, 'refresc-cola', { quantitat: 2 }));
    const liniaId = tiquet.linies[0].id;
    expect(() => retorna(tiquet, [{ liniaId, quantitat: 3 }])).toThrow(expect.objectContaining({ codi: 'DEVOLUCIO_MASSA' }));
    const primera = retorna(tiquet, [{ liniaId, quantitat: 1 }]);
    expect(() => retorna(tiquet, [{ liniaId, quantitat: 2 }], { devolucionsPrevies: [primera] })).toThrow(expect.objectContaining({ codi: 'DEVOLUCIO_MASSA' }));
    const segona = retorna(tiquet, [{ liniaId, quantitat: 1 }], { devolucionsPrevies: [primera] });
    expect(retornatPerLinia(tiquet.id, [primera, segona]).get(liniaId)).toEqual({ quantitat: 2, importCents: 400 });
  });

  test('amb descompte, l’import es reparteix i l’última unitat torna el que falta: la suma quadra', () => {
    const tiquet = tiquetDe((c) => {
      const amb = afig(c, 'cafe-llet', { quantitat: 3 });
      return aplicaDescompte(amb, amb.linies[0].id, { tipus: 'percent', valor: 33, motiu: 'x' }, { ara: ARA });
    });
    const linia = tiquet.linies[0];
    const devolucions = [];
    for (let i = 0; i < 3; i += 1) devolucions.push(retorna(tiquet, [{ liniaId: linia.id, quantitat: 1 }], { devolucionsPrevies: [...devolucions] }));
    expect(devolucions.reduce((s, d) => s - d.totals.totalCents, 0)).toBe(totalLinia(linia));
  });

  test('BAR-R4 · devolucions d’una en una d’una línia d’import menut: cap import negatiu i mai més del venut', () => {
    /* «Varis» a 0,01 € × 5 amb 0,02 € de descompte: la línia val 3 cèntims. */
    const tiquetVaris = (quantitat, totalCents) => tiquetDe((c) => {
      const preuCents = Math.ceil(totalCents / quantitat);
      const amb = afig(c, 'varis', { quantitat, preuCents });
      const sobra = preuCents * quantitat - totalCents;
      return sobra > 0 ? aplicaDescompte(amb, amb.linies[0].id, { tipus: 'import', valor: sobra, motiu: 'Arrodoniment' }, { ara: ARA }) : amb;
    });
    const retornaDUnaEnUna = (tiquet) => {
      const linia = tiquet.linies[0];
      const devolucions = [];
      for (let i = 0; i < linia.quantitat; i += 1) devolucions.push(retorna(tiquet, [{ liniaId: linia.id, quantitat: 1 }], { devolucionsPrevies: [...devolucions] }));
      return devolucions.map((d) => d.linies[0].importCents);
    };
    expect(totalLinia(tiquetVaris(5, 3).linies[0])).toBe(3);
    expect(retornaDUnaEnUna(tiquetVaris(5, 3))).toEqual([1, 0, 1, 0, 1]);
    for (let quantitat = 1; quantitat <= 20; quantitat += 1) {
      for (let total = 1; total <= 40; total += 1) {
        const imports = retornaDUnaEnUna(tiquetVaris(quantitat, total));
        let acumulat = 0;
        for (const importCents of imports) {
          expect(importCents, `${quantitat} × ${total}`).toBeGreaterThanOrEqual(0);
          acumulat += importCents;
          expect(acumulat, `${quantitat} × ${total}`).toBeLessThanOrEqual(total);
        }
        expect(acumulat, `${quantitat} × ${total}`).toBe(total);
      }
    }
  });

  test('sense motiu, d’una devolució o d’una línia anul·lada o convidada a zero', () => {
    const tiquet = tiquetDe((c) => {
      const amb = afig(afig(c, 'olives'), 'cava');
      return convida(amb, amb.linies[1].id, { motiu: 'Casa', ara: ARA });
    });
    expect(() => retorna(tiquet, [{ liniaId: tiquet.linies[0].id, quantitat: 1 }], { motiu: '' })).toThrow(expect.objectContaining({ codi: 'SENSE_MOTIU' }));
    const dev = retorna(tiquet, [{ liniaId: tiquet.linies[1].id, quantitat: 1 }]);
    expect(dev.totals.totalCents).toBe(0);
    expect(Object.is(dev.pagaments[0].importCents, -0)).toBe(false);
    expect(() => retorna(dev, [{ liniaId: dev.linies[0].id, quantitat: 1 }])).toThrow(expect.objectContaining({ codi: 'TIQUET' }));
  });
});
