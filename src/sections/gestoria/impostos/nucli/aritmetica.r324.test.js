// @vitest-environment node
/* R32.4 · Contraproves per les API reals; cap dada humana ni canvi de tipus fiscal.
   L'oracle calcula en enters grans i arredonix com Math.round (empat cap amunt). */
import { describe, expect, test } from 'vitest';
import { estimaIrpf130, estimaIva303, resumHisenda } from './impostos.js';
import { aplicaEscenari, estima130, estima303, estimaAny, parametresDe, quotaEscala } from './simulacio.js';
import { operacionsDelBanc } from '../../historic/nucli/operacions.js';
import { arrodoneixFraccio, proporcioCentims, sumaCentims } from '../../nucli/diners.js';

const MAX = Number.MAX_SAFE_INTEGER;
const data = { a: 2026, m: 1, d: 2 };
const factura = (extra) => ({ data, tipus: 'ingres', subtotal: 0, iva: 0, retencio: 0, ...extra });
const operacio = (extra) => ({ data, tipus: 'ingres', base: 0, iva: 0, retencio: 0, tractament: 'interior', ...extra });
const oracle = (n, d) => {
  const q = n / d;
  const r = n % d;
  return Number(q + (r * 2n >= d ? 1n : r * -2n > d ? -1n : 0n));
};
const opcions = { any: 2026, t: 1 };

describe('R32.4 · cèntims exactes als límits admesos', () => {
  test('no rebaixa els límits quan només el producte intermedi és enorme', () => {
    expect(proporcioCentims(MAX, MAX, MAX)).toBe(MAX);
    expect(sumaCentims([MAX, MAX, -MAX])).toBe(MAX);
    expect(sumaCentims([-MAX, -MAX], { minimZero: true })).toBe(0);
    for (const n of [MAX, MAX - 1, 7, 1, 0, -1, -7, -MAX]) {
      for (const d of [1, 2, 3, 100, 10000, 12100]) {
        expect(arrodoneixFraccio(BigInt(n) * 2100n, BigInt(d * 10000))).toBe(oracle(BigInt(n) * 2100n, BigInt(d * 10000)));
      }
    }
  });
  test('el 130 no perd un cèntim en un producte intermedi', () => {
    const n = 9007199254740987;
    const esperada = oracle(BigInt(n) * 20n, 100n);
    expect(estimaIrpf130({ ...opcions, factures: [factura({ subtotal: n })] }).quota).toBe(esperada);
    expect(estima130({ ...opcions, operacions: [operacio({ base: n })], parametres: parametresDe(2026, { dificilAl130: false }) }).quota).toBe(esperada);
  });

  test.each([
    [MAX, 2, -MAX], [MAX, -MAX, 2], [2, MAX, -MAX], [-MAX, -2, MAX]
  ])('les cancel·lacions d’IVA conserven els cèntims: %j', (...imports) => {
    const esperat = imports[1] === -2 ? -2 : 2;
    expect(estimaIva303({ ...opcions, factures: imports.map((iva) => factura({ iva })) }).resultat).toBe(esperat);
    expect(estima303({ ...opcions, operacions: imports.map((iva) => operacio({ iva })) }).resultat).toBe(esperat);
  });

  test('l’escala suma les fraccions exactes i arredonix una sola vegada', () => {
    const n = 9007199254740988;
    expect(quotaEscala(n, [{ fins: null, tipus: 2100 }])).toBe(oracle(BigInt(n) * 2100n, 10000n));
    expect(quotaEscala(10, [{ fins: 5, tipus: 1000 }, { fins: null, tipus: 1000 }])).toBe(1);
  });

  test('l’escenari conserva percentatges decimals admesos i l’empat negatiu vigent', () => {
    const n = 9007199254740987;
    const [r] = aplicaEscenari([operacio({ base: n })], { facturacio: -0.01 });
    expect(r.base).toBe(oracle(BigInt(n) * 9999n, 10000n));
    expect(aplicaEscenari([operacio({ base: MAX })], { facturacio: -1e-14 })[0].base).toBe(MAX - 1);
    expect(aplicaEscenari([operacio({ base: -1 })], { facturacio: -50 })[0].base).toBe(0);
  });

  test('el banc separa l’IVA amb producte intermedi exacte', () => {
    const centims = 9007199254740987;
    const r = operacionsDelBanc({ moviments: [{ data, centims, categoria: 'clients' }] }).operacions[0];
    expect(r.base).toBe(oracle(BigInt(centims) * 10000n, 12100n));
    expect(r.iva).toBe(oracle(BigInt(r.base) * 2100n, 10000n));
  });
});

describe('R32.4 · una xifra fora de rang no es publica com a resultat', () => {
  test('el 303 del Tauler avisa i no dona una xifra insegura', () => {
    const r = estimaIva303({ ...opcions, factures: [factura({ iva: MAX }), factura({ iva: 1 })] });
    expect(r).toMatchObject({ completa: false, repercutit: null, suportat: null, resultat: null });
    expect(r.falten.map((f) => f.codi)).toContain('IMPORT_FORA_DE_RANG');
  });

  test('el resum d’Hisenda avisa quan dos resultats segurs no caben junts', () => {
    const r = resumHisenda({ iva: { resultat: MAX, completa: true }, irpf: { resultat: 1, completa: true } });
    expect(r).toMatchObject({ completa: false, total: null });
    expect(r.falten.map((f) => f.codi)).toContain('IMPORT_FORA_DE_RANG');
  });

  test('el simulador i l’escenari refusen el resultat insegur explícitament', () => {
    expect(() => estima303({ ...opcions, operacions: [operacio({ iva: MAX }), operacio({ iva: 1 })] })).toThrow(expect.objectContaining({ codi: 'IMPORT_FORA_DE_RANG' }));
    expect(() => aplicaEscenari([operacio({ base: MAX })], { facturacio: 100 })).toThrow(expect.objectContaining({ codi: 'IMPORT_FORA_DE_RANG' }));
  });

  test('la simulació valida el total anual abans de deixar-lo arribar a la pantalla', () => {
    const operacions = [1, 4].map((m) => operacio({ data: { ...data, m }, iva: 4000000000000000, retencio: -1000000000000000 }));
    expect(() => estimaAny({ operacions, any: 2026 })).toThrow(expect.objectContaining({ codi: 'IMPORT_FORA_DE_RANG' }));
  });

  test('el banc no transforma en Infinity una retenció que anul·la el divisor', () => {
    expect(() => operacionsDelBanc({ moviments: [{ data, centims: 100, categoria: 'clients' }], suposits: { ivaVendes: 0, retencioVendes: 10000 } })).toThrow(expect.objectContaining({ codi: 'DIVISOR_INVALID' }));
  });

  test('els imports JSON de tipus incorrecte continuen sent desconeguts', () => {
    for (const iva of ['100', true, [], {}, null]) {
      expect(estimaIva303({ ...opcions, factures: [factura({ iva })] }).resultat).toBeNull();
    }
  });
});
