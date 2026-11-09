// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { llavorLaParroquia, llavorLaParroquiaR14 } from './laParroquia.js';
import { validaCataleg } from '../nucli/cataleg.js';
import { afegeixProducte, creaComanda } from '../nucli/comanda.js';
import { costDeVenda } from '../nucli/escandall.js';
import { imatgeDe } from '../vistes/vestits.js';

describe('La Parròquia R14 · real seed in the sales engine', () => {
  test('canonical B5 also contains cocktails while both administrative open items remain identifiable', async () => {
    const { carta } = await llavorLaParroquiaR14();
    expect(validaCataleg(carta)).toEqual({ ok: true, errors: [] });
    expect(carta.categories.filter((c) => c.codi)).toHaveLength(10);
    expect(carta.categories).toHaveLength(11);
    expect(carta.productes.filter((p) => p.categoriaOrigenId === 'combinats')).toHaveLength(9);
    expect(carta.productes.filter((p) => p.categoriaOrigenId === 'combinats').every((p) => p.categoriaId === 'licoreria' && p.categoriaHostaleria === 'B5')).toBe(true);
    expect(carta.productes.filter((p) => p.categoriaId === 'altres')).toHaveLength(2);
    expect(llavorLaParroquia().carta.categories).toHaveLength(12);
  });

  test('real full/half/montadito variants keep unique REF and their individual sale price', async () => {
    const { carta } = await llavorLaParroquiaR14();
    const producte = carta.productes.find((p) => p.variants.some((v) => v.nom === 'Entrepà sencer') && p.variants.some((v) => v.nom === 'Montadito'));
    expect(producte).toBeTruthy();
    const preus = [];
    for (const variant of producte.variants) {
      const comanda = creaComanda({ id: 'comanda-font', tornId: 'torn-font', origen: { tipus: 'barra' }, per: 'Cambrer', ara: '2026-11-08T10:00:00Z' });
      const nova = afegeixProducte(comanda, { producte, varianteId: variant.id, ivaPerDefecte: 10 }, { idLinia: 'linia-font', ara: '2026-11-08T10:00:00Z' });
      expect(nova.linies[0]).toMatchObject({ varianteId: variant.id, preuUnitariCents: variant.preuCents });
      expect(variant.font.ref).toBe(variant.ref);
      preus.push(variant.preuCents);
    }
    expect(new Set(preus).size).toBeGreaterThan(1);
  });

  test('cost is that of the selected Malibú serving, not its bottle; zero placeholders remain unknown', async () => {
    const { carta } = await llavorLaParroquiaR14();
    const malibu = carta.productes.find((p) => p.id === 'b5-malibu');
    expect(costDeVenda(carta, malibu, 'copa').costCents).toBe(200);
    expect(costDeVenda(carta, malibu, 'botella').costCents).toBe(1800);
    const bombo = carta.productes.find((p) => p.id === 'bombo');
    expect(bombo.variants[0]).toMatchObject({ costCentsOrigen: 0, costEstat: 'pendent' });
    expect(costDeVenda(carta, bombo).costCents).toBeNull();
    expect(carta.grupsPendents).toHaveLength(13);
    expect(carta.grups).toEqual([]);
    expect(carta.productes.every((p) => p.alergensEstat === 'pendent')).toBe(true);
    expect(carta.productes.flatMap((p) => p.variants).every((v) => v.costBaseFiscal === 'desconegut')).toBe(true);
  });

  test('canonical regrouping preserves the existing photo paths', () => {
    expect(imatgeDe({ categoriaId: 'licoreria', categoriaOrigenId: 'combinats', imatge: { estat: 'definitiva', slug: 'calimotxo' } }, { slug: 'la-parroquia' }))
      .toBe('/assets/uploads/empresa/la-parroquia/bar/combinats/calimotxo.webp');
  });

  test('the same allergen cannot be simultaneously present, trace or absent', async () => {
    const { carta } = await llavorLaParroquiaR14();
    const producte = carta.productes[0];
    producte.alergens = ['llet'];
    producte.tracesAlergens = ['llet'];
    expect(validaCataleg(carta).ok).toBe(false);
    producte.tracesAlergens = ['gluten'];
    producte.alergensAbsents = ['ous'];
    expect(validaCataleg(carta).ok).toBe(true);
    producte.tracesAlergens = ['al·lergen-inventat'];
    expect(validaCataleg(carta).ok).toBe(false);
  });
});
