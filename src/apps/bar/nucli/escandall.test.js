// @vitest-environment node
/* El Bar · nucli/escandall.js — cost per ració, minva, µ€, food cost i PVP suggerit. */
import { describe, expect, test } from 'vitest';
import {
  costDeVenda, costEscandall, costUnitariMicro, escandallDe, foodCostPermil, pvpSuggerit, textPermil, validaIngredient
} from './escandall.js';
import { llavorCarta } from './llavor.js';

const ingredient = (canvis = {}) => ({ id: 'farina', nom: 'Farina', unitatBase: 'g', formatCompra: { quantitat: 1000, preuCents: 100 }, minvaPercent: 0, alergens: [], ...canvis });

describe('costUnitariMicro', () => {
  test('µ€ per unitat base: 1 cèntim = 10 000 µ€', () => {
    expect(costUnitariMicro(ingredient())).toBe(1000);
  });

  test('ingredients barats (l’oli per ml) no es perden en l’arrodoniment', () => {
    /* 6,00 € el litre → 0,6 cèntims el ml → 6000 µ€ */
    expect(costUnitariMicro(ingredient({ id: 'oli', unitatBase: 'ml', formatCompra: { quantitat: 1000, preuCents: 600 } }))).toBe(6000);
    /* 1,99 € per 3 kg → 0,0663… cèntims el g → 663 µ€ (663,33 arrodonit) */
    expect(costUnitariMicro(ingredient({ formatCompra: { quantitat: 3000, preuCents: 199 } }))).toBe(663);
  });

  test('un ingredient dolent no té cost', () => {
    expect(validaIngredient(ingredient({ minvaPercent: 91 })).ok).toBe(false);
    expect(() => costUnitariMicro(ingredient({ formatCompra: { quantitat: 0, preuCents: 100 } }))).toThrow(expect.objectContaining({ codi: 'INGREDIENT' }));
  });
});

describe('costEscandall', () => {
  const ingredients = [
    ingredient(),
    ingredient({ id: 'creilles', nom: 'Creïlles', formatCompra: { quantitat: 1000, preuCents: 100 }, minvaPercent: 90 })
  ];

  test('minva del 0 %: el que es posa al plat és el que es compra', () => {
    const r = costEscandall({ racions: 1, ingredients: [{ ingredientId: 'farina', quantitat: 250 }], altresCostosCents: 0 }, ingredients);
    expect(r.costRacioCents).toBe(25);
    expect(r.linies[0]).toMatchObject({ quantitatBruta: 250, costMicro: 250000 });
  });

  test('minva del 90 %: cal comprar deu vegades el que va al plat', () => {
    const r = costEscandall({ racions: 1, ingredients: [{ ingredientId: 'creilles', quantitat: 100 }], altresCostosCents: 0 }, ingredients);
    expect(r.linies[0]).toMatchObject({ quantitatBruta: 1000, costMicro: 1000000 });
    expect(r.costRacioCents).toBe(100);
  });

  test('les racions dividixen i els altres costos s’hi sumen', () => {
    const r = costEscandall({ racions: 4, ingredients: [{ ingredientId: 'farina', quantitat: 1000 }], altresCostosCents: 20 }, ingredients);
    /* (100 + 20) / 4 = 30 */
    expect(r.costRacioCents).toBe(30);
  });

  test('l’escandall de la llavor: entrepà de truita', () => {
    const carta = llavorCarta();
    const escandall = carta.escandalls.find((e) => e.id === 'entrepa-truita');
    /* pa 60 + ous 2 × 25 + oli 20 ml × 0,6 + creïlles 150 g / 0,8 × 0,1 + altres 10 = 60 + 50 + 12 + 18,75 + 10 */
    expect(costEscandall(escandall, carta.ingredients).costRacioCents).toBe(151);
  });

  test('un ingredient que no existix o una quantitat dolenta llancen', () => {
    expect(() => costEscandall({ racions: 1, ingredients: [{ ingredientId: 'sal', quantitat: 1 }] }, ingredients)).toThrow(expect.objectContaining({ codi: 'INGREDIENT' }));
    expect(() => costEscandall({ racions: 0, ingredients: [] }, ingredients)).toThrow(expect.objectContaining({ codi: 'ESCANDALL' }));
    expect(() => costEscandall({ racions: 1, ingredients: [{ ingredientId: 'farina', quantitat: 0.5 }] }, ingredients)).toThrow(expect.objectContaining({ codi: 'ESCANDALL' }));
  });
});

describe('food cost i PVP suggerit', () => {
  test('food cost sobre el preu sense IVA, en per mil', () => {
    /* PVP 4,40 € amb 10 % → 4,00 € net; cost 1,20 € → 30,0 % */
    expect(foodCostPermil(120, 440, 10)).toBe(300);
    expect(textPermil(foodCostPermil(151, 400, 10))).toBe('41,5 %');
    expect(foodCostPermil(100, 0, 10)).toBeNull();
  });

  test('pvpSuggerit arrodonit cap amunt al pas', () => {
    /* 1,51 € × 1,10 / 0,30 = 5,5366… → 5,60 € */
    expect(pvpSuggerit(151, 30, 10)).toBe(560);
    expect(pvpSuggerit(151, 30, 10, 50)).toBe(600);
    expect(pvpSuggerit(120, 30, 10)).toBe(440);
    expect(pvpSuggerit(0, 30, 10)).toBe(0);
    expect(() => pvpSuggerit(100, 0, 10)).toThrow(expect.objectContaining({ codi: 'OBJECTIU' }));
  });
});

describe('costDeVenda (BAR-R6: el cost que es congela a la línia venuda)', () => {
  const carta = llavorCarta();
  const P = (id) => carta.productes.find((p) => p.id === id);
  const escandall = (id) => carta.escandalls.find((e) => e.id === id);

  test('l’escandall del producte, de la seua variant o el manual de la variant', () => {
    expect(costDeVenda(carta, P('entrepa-truita'))).toEqual({ escandall: escandall('entrepa-truita'), costCents: 151 });
    expect(costDeVenda(carta, P('cafe-llet'), 'tassa').costCents).toBe(costEscandall(escandall('cafe-llet'), carta.ingredients).costRacioCents);
    /* L'escandall del cafè amb llet és de la tassa: el got no en té ni porta cost manual. */
    expect(costDeVenda(carta, P('cafe-llet'), 'got')).toEqual({ escandall: null, costCents: null });
    expect(costDeVenda(carta, P('aigua'), 'gran')).toEqual({ escandall: null, costCents: 50 });
    expect(costDeVenda(carta, P('calamars'))).toEqual({ escandall: null, costCents: null });
  });

  test('una variant que nomena el seu escandall; un escandall que no es pot calcular no té cost', () => {
    const ambNom = { ...carta, productes: carta.productes.map((p) => (p.id === 'cafe-llet'
      ? { ...p, variants: p.variants.map((v) => (v.id === 'got' ? { ...v, escandallId: 'cafe-llet' } : v)) } : p)) };
    expect(escandallDe(ambNom, ambNom.productes.find((p) => p.id === 'cafe-llet'), 'got')).toBe(escandall('cafe-llet'));
    const trencada = { ...carta, ingredients: carta.ingredients.filter((i) => i.id !== 'ous') };
    expect(costDeVenda(trencada, P('entrepa-truita'))).toEqual({ escandall: escandall('entrepa-truita'), costCents: null });
  });
});

describe('R32.4: l’escandall conserva cèntims i comprova el resultat final', () => {
  test('deu formats complets costen deu preus, sense acumular l’arrodoniment del cost unitari', () => {
    const farina = ingredient({ formatCompra: { quantitat: 3000, preuCents: 199 } });
    expect(costUnitariMicro(farina)).toBe(663);
    const resultat = costEscandall({ racions: 1, ingredients: [{ ingredientId: 'farina', quantitat: 30000 }] }, [farina]);
    expect(resultat.costTotalMicro).toBe(19900000);
    expect(resultat.costRacioCents).toBe(1990);
  });

  test('preu, quantitat i minva es combinen abans d’arredonir a micro-euros', () => {
    const mitja = (n, d) => Number((n * 2n + d) / (d * 2n));
    for (const [preu, format, quantitat, minva] of [[199, 3000, 30000, 0], [1, 3, 30000, 0], [199, 3000, 7500, 20], [600, 1000, 20, 0], [100, 1000, 100, 90]]) {
      const i = ingredient({ formatCompra: { quantitat: format, preuCents: preu }, minvaPercent: minva });
      const costMicro = mitja(BigInt(preu) * 10000n * BigInt(quantitat) * 100n, BigInt(format) * BigInt(100 - minva));
      expect(costEscandall({ racions: 1, ingredients: [{ ingredientId: 'farina', quantitat }] }, [i]).linies[0].costMicro).toBe(costMicro);
    }
  });

  test('els productes intermedis grans no rebutgen resultats públics segurs', () => {
    const i = ingredient({ formatCompra: { quantitat: 1000000, preuCents: 1000000000000 } });
    expect(costUnitariMicro(i)).toBe(10000000000);
    expect(costEscandall({ racions: 1, ingredients: [{ ingredientId: 'farina', quantitat: 1 }] }, [i]))
      .toMatchObject({ costRacioCents: 1000000, costTotalMicro: 10000000000 });
    expect(foodCostPermil(100000000000, 1000000000000, 10)).toBe(110);
    expect(pvpSuggerit(81883629588554, 100, 10, 1)).toBe(90071992547410);
    expect(pvpSuggerit(0, 100, 10, Number.MAX_SAFE_INTEGER)).toBe(0);
  });

  test('cap PVP ni cost públic fora del rang segur es publica', () => {
    expect(() => pvpSuggerit(81883629588554, 1, 10, 4503599627370496))
      .toThrow(expect.objectContaining({ codi: 'IMPORT' }));
    expect(() => costEscandall({ racions: 1, ingredients: [], altresCostosCents: Number.MAX_SAFE_INTEGER }, []))
      .toThrow(expect.objectContaining({ codi: 'IMPORT' }));
  });
});
