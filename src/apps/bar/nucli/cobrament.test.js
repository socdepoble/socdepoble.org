// @vitest-environment node
/* El Bar · nucli/cobrament.js — invariants 2 i 4 de §A.4. */
import { describe, expect, test } from 'vitest';
import { afegeixPagament, potTancar, suggerimentsEfectiu, tanca, textNumero } from './cobrament.js';
import { afegeixProducte, creaComanda, totals } from './comanda.js';
import { llavorCarta } from './llavor.js';

const ARA = '2026-10-02T09:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
let n = 0;
const id = (prefix) => { n += 1; return `${prefix}-${n}`; };
const afig = (c, producteId, opcions = {}) => afegeixProducte(c, { producte: P(producteId), ivaPerDefecte: 10, ...opcions }, { ara: ARA, idLinia: id('l') });
/* «Dos cafès i una torrada»: 2 × 1,20 + 2,50 = 4,90 €. */
const comanda = () => afig(afig(creaComanda({ id: id('c'), tornId: 'torn-1', origen: { tipus: 'barra' }, ara: ARA }), 'cafe-sol', { quantitat: 2 }), 'torrada-tomaca');
const paga = (c, pagament) => afegeixPagament(c, pagament, { id: id('p'), ara: ARA });

function congelatEnProfunditat(valor, cami = 'tiquet') {
  if (!valor || typeof valor !== 'object') return [];
  const propis = Object.isFrozen(valor) ? [] : [cami];
  return [...propis, ...Object.entries(valor).flatMap(([clau, fill]) => congelatEnProfunditat(fill, `${cami}.${clau}`))];
}

describe('afegeixPagament (invariant 4)', () => {
  test('efectiu amb canvi: lliurar-ne més és admés i el canvi és la diferència', () => {
    const c = paga(comanda(), { metode: 'efectiu', importCents: 490, lliuratCents: 1000 });
    expect(c.pagaments[0]).toMatchObject({ metode: 'efectiu', importCents: 490, lliuratCents: 1000, canviCents: 510 });
    expect(totals(c).pendentCents).toBe(0);
  });

  test('lliurat insuficient', () => {
    expect(() => paga(comanda(), { metode: 'efectiu', importCents: 490, lliuratCents: 300 })).toThrow(expect.objectContaining({ codi: 'LLIURAT_INSUFICIENT' }));
  });

  test('la targeta no pot passar del pendent, ni l’import aplicat de l’efectiu', () => {
    expect(() => paga(comanda(), { metode: 'targeta', importCents: 491 })).toThrow(expect.objectContaining({ codi: 'PASSA_PENDENT' }));
    expect(() => paga(comanda(), { metode: 'efectiu', importCents: 500, lliuratCents: 500 })).toThrow(expect.objectContaining({ codi: 'PASSA_PENDENT' }));
    expect(() => paga(comanda(), { metode: 'targeta', importCents: 100, lliuratCents: 200 })).toThrow(expect.objectContaining({ codi: 'LLIURAT' }));
  });

  test('mixt: pagaments successius fins que el pendent arriba a 0', () => {
    let c = paga(comanda(), { metode: 'efectiu', importCents: 200, lliuratCents: 200 });
    expect(potTancar(c)).toEqual({ ok: false, motiu: 'PENDENT' });
    c = paga(c, { metode: 'targeta', importCents: 290 });
    expect(totals(c)).toMatchObject({ pagatCents: 490, pendentCents: 0 });
    expect(potTancar(c)).toEqual({ ok: true, motiu: null });
  });

  test('import zero, negatiu o amb decimals no és cap pagament', () => {
    for (const importCents of [0, -1, 1.5, '490']) {
      expect(() => paga(comanda(), { metode: 'targeta', importCents })).toThrow(expect.objectContaining({ codi: 'IMPORT' }));
    }
    expect(() => paga(comanda(), { metode: 'bizum', importCents: 100 })).toThrow(expect.objectContaining({ codi: 'METODE' }));
  });
});

describe('suggerimentsEfectiu', () => {
  test.each([
    [740, [740, 800, 1000, 2000, 5000]],
    [490, [490, 500, 1000, 2000, 5000]],
    [1000, [1000, 2000, 5000]],
    [5000, [5000, 6000]],
    [5001, [5001, 5100, 5500, 6000, 10000]],
    [1, [1, 100, 500, 1000, 2000]],
    [0, []]
  ])('%i cèntims → %j', (pendent, esperat) => {
    expect(suggerimentsEfectiu(pendent)).toEqual(esperat);
  });
});

describe('tanca (invariant 2)', () => {
  test('el tiquet és congelat en profunditat, amb número, totals i les línies marxades', () => {
    const c = paga(comanda(), { metode: 'efectiu', importCents: 490, lliuratCents: 500 });
    const tiquet = tanca(c, { numero: 42, ara: ARA });
    expect(tiquet).toMatchObject({ estat: 'tancada', tipus: 'venda', numero: 42, tancatA: ARA });
    expect(tiquet.totals).toEqual({ brutCents: 490, descomptesCents: 0, convidadesCents: 0, totalCents: 490, anullatsCents: 0, perIva: [{ ivaPercent: 10, baseCents: 445, quotaCents: 45 }] });
    expect(tiquet.linies.every((l) => l.estat === 'marxada')).toBe(true);
    expect(congelatEnProfunditat(tiquet)).toEqual([]);
    expect(() => { tiquet.linies[0].quantitat = 9; }).toThrow(TypeError);
    expect(textNumero(tiquet.numero)).toBe('Nota 0042');
    /* La comanda d'origen no queda congelada. */
    expect(Object.isFrozen(c)).toBe(false);
  });

  test('no es tanca amb pendent, ni buida, ni dues vegades', () => {
    expect(() => tanca(comanda(), { numero: 1, ara: ARA })).toThrow(expect.objectContaining({ codi: 'PENDENT' }));
    const buida = creaComanda({ id: 'c-buida', tornId: 'torn-1', origen: { tipus: 'barra' }, ara: ARA });
    expect(potTancar(buida)).toEqual({ ok: false, motiu: 'BUIDA' });
    const tiquet = tanca(paga(comanda(), { metode: 'targeta', importCents: 490 }), { numero: 1, ara: ARA });
    expect(potTancar(tiquet)).toEqual({ ok: false, motiu: 'NO_OBERTA' });
    expect(() => paga(tiquet, { metode: 'targeta', importCents: 1 })).toThrow(expect.objectContaining({ codi: 'NO_OBERTA' }));
  });

  test('cap exportació del nucli edita ni esborra un tiquet tancat', async () => {
    const moduls = await Promise.all(['./comanda.js', './cobrament.js', './tiquet.js', './divisio.js', './torn.js'].map((m) => import(m)));
    const noms = moduls.flatMap((m) => Object.keys(m));
    expect(noms.filter((nom) => /(?:esborra|edita|modifica|reinicia).*tiquet|tiquet.*(?:esborra|edita)/i.test(nom))).toEqual([]);
  });
});
