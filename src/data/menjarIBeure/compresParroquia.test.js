// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { carregaCatalegParroquia } from './parroquia.js';
import { costCopaDeTarifaParroquia, ingredientDeTarifaParroquia, tarifesCompraParroquia } from './compresParroquia.js';
import { calculaEscandall, costConsum } from './escandall.js';

const FONT = { ruta: 'La Parròquia - Llistat de preus.xlsx', sha256: 'a'.repeat(64) };
const dadesProva = { fonts: [FONT], tarifes: [{ full: 'Begudes de prova', fila: 7, nom: 'Pack de prova', categoria: 'B2', preuPackCents: 100, unitatsPack: 3 }] };
const PUBLICA = JSON.parse(readFileSync('src/data/menjarIBeure/parroquiaDades.generated.json', 'utf8'));
const PRIVADA = 'src/data/menjarIBeure/parroquiaDades.privat.json';
const base = { dades: dadesProva, tarifaId: 'parroquia-preus-1-7', quantitatPerUnitat: 0.33, unitat: 'l', ivaPercent: 10, ivaDeductible: true, recarrecEquivalencia: false };

describe('Actual source purchase rows and explicit formats', () => {
  test('316 actual source tariffs have unique stable IDs and retain workbook sheet/row/hash', async () => {
    const dades = await carregaCatalegParroquia();
    const tarifes = tarifesCompraParroquia(dades);
    expect(tarifes).toHaveLength(316);
    expect(new Set(tarifes.map((t) => t.id)).size).toBe(316);
    const bombo = tarifes.find((t) => t.nom === 'Bombó');
    expect(bombo).toMatchObject({ id: 'parroquia-preus-1-7', unitatsPack: 1 });
    expect(bombo.font).toMatchObject({ fila: 7 });
    expect(bombo.font.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  /* Sanejament R15 (PRIV-06) · La instantània del repositori no porta el preu de compra del pack:
     la calculadora el demana, amb la font i la data, i aleshores calcula igual. */
  test('public snapshot: no historical pack price, so the purchase waits for a typed price with its source', () => {
    const bombo = tarifesCompraParroquia(PUBLICA).find((t) => t.nom === 'Bombó');
    expect(bombo).not.toHaveProperty('preuPackCents');
    const args = { ...base, dades: PUBLICA, tarifaId: bombo.id, quantitatPerUnitat: 1, unitat: 'u' };
    expect(ingredientDeTarifaParroquia(args)).toMatchObject({ estat: 'pendent', motiu: 'Falta el preu base del pack, en cèntims enters.' });
    expect(ingredientDeTarifaParroquia({ ...args, preuPackCents: 40 }).estat).toBe('pendent');
    const compra = ingredientDeTarifaParroquia({ ...args, preuPackCents: 40, fontPreu: 'Factura de prova F-2, 2026-11-09' });
    expect(compra).toMatchObject({ estat: 'preparat', preuCents: 40, quantitatCompra: 1, unitatCompra: 'u', costBaseFiscal: 'base-cost-deduccions' });
    expect(compra.font).toContain('Begudes - La Parròquia, fila 7');
    expect(compra.font).toContain(bombo.font.sha256);
    expect(compra.font).toContain('preu revisat: Factura de prova F-2, 2026-11-09');
  });

  test('local complete snapshot (if on disk): the historical pack price prepares the purchase as before', async (context) => {
    if (!existsSync(PRIVADA)) { context.skip(); return; }
    const dades = await carregaCatalegParroquia();
    const bombo = tarifesCompraParroquia(dades).find((t) => t.nom === 'Bombó');
    expect(bombo).toMatchObject({ id: 'parroquia-preus-1-7', preuPackCents: 40, unitatsPack: 1 });
    const compra = ingredientDeTarifaParroquia({ ...base, dades, tarifaId: bombo.id, quantitatPerUnitat: 1, unitat: 'u' });
    expect(compra).toMatchObject({ estat: 'preparat', preuCents: 40, quantitatCompra: 1, unitatCompra: 'u', costBaseFiscal: 'base-cost-deduccions' });
    expect(compra.font).toContain('Begudes - La Parròquia, fila 7');
    expect(compra.font).toContain(bombo.font.sha256);
  });

  test('whole-pack precision survives decimal contents and a recipe consumes the whole pack for exactly its original cost', () => {
    const compra = ingredientDeTarifaParroquia(base);
    expect(compra).toMatchObject({ estat: 'preparat', preuCents: 100, quantitatCompra: 0.99, costUnitatCents: 33 });
    const recepta = calculaEscandall({ racions: 3, linies: [{ ...compra, id: 'beguda', quantitat: 990, unitat: 'ml', minvaPercent: 0 }] });
    expect(recepta).toMatchObject({ estat: 'complet', costTotalCents: 100, costRacioCents: 33 });
    expect(costConsum({ ...compra, quantitat: 990, unitat: 'ml', minvaPercent: 0 })).toBe(100);
  });

  test('tax regime is explicit and equivalence surcharge adds only when elected', () => {
    expect(ingredientDeTarifaParroquia({ ...base, ivaDeductible: undefined }).estat).toBe('pendent');
    expect(ingredientDeTarifaParroquia({ ...base, ivaPercent: undefined }).estat).toBe('pendent');
    expect(ingredientDeTarifaParroquia({ ...base, ivaDeductible: false, recarrecEquivalencia: true })).toMatchObject({ preuCents: 111, ivaCents: 10, recarrecCents: 1, costBaseFiscal: 'cost-final-no-deduible' });
    expect(ingredientDeTarifaParroquia({ ...base, ivaDeductible: true, recarrecEquivalencia: true }).estat).toBe('pendent');
  });

  test('missing content/unit/price and unconfirmed zero remain pending, never become free ingredients', () => {
    expect(ingredientDeTarifaParroquia({ ...base, quantitatPerUnitat: undefined }).estat).toBe('pendent');
    expect(ingredientDeTarifaParroquia({ ...base, unitat: undefined }).estat).toBe('pendent');
    expect(ingredientDeTarifaParroquia({ ...base, preuPackCents: null }).estat).toBe('pendent');
    const zero = { ...base, preuPackCents: 0, fontPreu: 'Factura de prova, lot A, 2026-11-08' };
    expect(ingredientDeTarifaParroquia(zero).estat).toBe('pendent');
    expect(ingredientDeTarifaParroquia({ ...zero, zeroConfirmat: true })).toMatchObject({ estat: 'preparat', preuCents: 0, zeroConfirmat: true });
  });

  test('manual price overrides require their own actual source and retain original workbook lineage', () => {
    expect(ingredientDeTarifaParroquia({ ...base, preuPackCents: 200 }).estat).toBe('pendent');
    const compra = ingredientDeTarifaParroquia({ ...base, preuPackCents: 200, fontPreu: 'Factura de prova F-1, 2026-11-08' });
    expect(compra).toMatchObject({ estat: 'preparat', preuCents: 200, fontOrigen: FONT });
    expect(compra.font).toContain('Factura de prova F-1');
  });

  test('copa math uses full-pack cost/volume, avoiding repeated rounded bottle prices, with explicit minva', () => {
    const args = { ...base, volumBotellaCl: 33, volumCopaCl: 33, minvaPercent: 0 };
    expect(costCopaDeTarifaParroquia(args)).toMatchObject({ estat: 'preparat', costCopaCents: 33, compra: { preuCents: 100, quantitatCompra: 99, unitatCompra: 'cl' } });
    expect(costCopaDeTarifaParroquia({ ...args, volumCopaCl: 99 })).toMatchObject({ costCopaCents: 100 });
    expect(costCopaDeTarifaParroquia({ ...args, volumCopaCl: 99, minvaPercent: 10 })).toMatchObject({ costCopaCents: 111 });
    expect(costCopaDeTarifaParroquia({ ...args, minvaPercent: undefined }).estat).toBe('pendent');
  });
});
