// @vitest-environment node
/* El Bar · nucli/cataleg.js, ids.js, sala.js i llavor.js. */
import { describe, expect, test } from 'vitest';
import {
  ALERGENS, grupsObligatorisPendents, preuDeLinia, resolModificadors, teGrupObligatori, validaCataleg, variantDe
} from './cataleg.js';
import { nouId } from './ids.js';
import { validaSala, taulesEnOrdre } from './sala.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta, llavorSala } from './llavor.js';
import { validaIngredient } from './escandall.js';
import { mitjaAmunt } from './comu.js';

const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);

describe('validaCataleg', () => {
  test('la carta d’exemple és vàlida, els seus ingredients també, i la sala', () => {
    expect(validaCataleg(CARTA)).toEqual({ ok: true, errors: [] });
    expect(CARTA.ingredients.every((i) => validaIngredient(i).ok)).toBe(true);
    expect(validaSala(llavorSala())).toEqual({ ok: true, errors: [] });
    expect(ALERGENS).toHaveLength(14);
  });

  test('detecta ids repetits, categories i grups que no existixen, preus amb decimals i al·lèrgens inventats', () => {
    const dolenta = llavorCarta();
    dolenta.productes.push({ ...dolenta.productes[0] });
    dolenta.productes[1].categoriaId = 'bodega';
    dolenta.productes[2].grupsModificadors = ['gel'];
    dolenta.productes[3].variants[0].preuCents = 1.5;
    dolenta.productes[4].alergens = ['xocolata'];
    dolenta.productes[5].id = 'Cafè Sol';
    const { ok, errors } = validaCataleg(dolenta);
    expect(ok).toBe(false);
    for (const tros of ['id repetit', 'bodega', '«gel»', 'preuCents', 'al·lèrgens', 'slug']) {
      expect(errors.some((e) => e.includes(tros)), tros).toBe(true);
    }
  });

  test('un grup amb min > opcions o max < min no és vàlid', () => {
    const carta = llavorCarta();
    carta.grups[0].min = 4;
    carta.grups[1].max = 0;
    /* grups[0]: min de més i, per tant, max < min · grups[1]: max 0 */
    expect(validaCataleg(carta).errors.filter((e) => e.startsWith('grups'))).toHaveLength(3);
  });
});

describe('variants i modificadors', () => {
  test('la primera variant és la de defecte', () => {
    expect(variantDe(P('aigua')).id).toBe('mitjana');
    expect(variantDe(P('aigua'), 'gran').preuCents).toBe(180);
    expect(variantDe(P('aigua'), 'gerra')).toBeNull();
  });

  test('preuDeLinia suma els modificadors resolts', () => {
    const mods = resolModificadors(P('entrepa-truita'), CARTA.grups, [{ grupId: 'pa-entrepa', opcioId: 'sense-gluten' }]);
    expect(mods).toEqual([{ grupId: 'pa-entrepa', opcioId: 'sense-gluten', nomCongelat: 'Pa sense gluten', deltaCents: 50 }]);
    expect(preuDeLinia(P('entrepa-truita'), undefined, mods)).toBe(450);
  });

  test('els grups obligatoris pendents, i el diàleg menut només per a ells', () => {
    expect(teGrupObligatori(P('carajillo'), CARTA.grups)).toBe(true);
    expect(teGrupObligatori(P('cafe-llet'), CARTA.grups)).toBe(false);
    expect(grupsObligatorisPendents(P('carajillo'), CARTA.grups, [])).toEqual(['licor-carajillo']);
    expect(grupsObligatorisPendents(P('carajillo'), CARTA.grups, [{ grupId: 'licor-carajillo', opcioId: 'rom' }])).toEqual([]);
  });

  test('una opció d’un altre grup, inexistent o de més no es resol', () => {
    expect(() => resolModificadors(P('carajillo'), CARTA.grups, [{ grupId: 'llet', opcioId: 'vegetal' }])).toThrow(expect.objectContaining({ codi: 'MODIFICADORS' }));
    expect(() => resolModificadors(P('carajillo'), CARTA.grups, [{ grupId: 'licor-carajillo', opcioId: 'whisky' }])).toThrow(expect.objectContaining({ codi: 'MODIFICADORS' }));
    expect(() => resolModificadors(P('carajillo'), CARTA.grups, [
      { grupId: 'licor-carajillo', opcioId: 'rom' }, { grupId: 'licor-carajillo', opcioId: 'anis' }
    ])).toThrow(expect.objectContaining({ codi: 'MODIFICADORS' }));
  });
});

describe('llavor sintètica', () => {
  test('tot és d’exemple, amb preus enters i sense marques', () => {
    expect(CARTA.productes.length).toBeGreaterThan(20);
    for (const p of CARTA.productes) {
      expect(p.exemple, p.id).toBe(true);
      for (const v of p.variants) expect(Number.isSafeInteger(v.preuCents), p.id).toBe(true);
      expect(p.imatge).toEqual({ slug: `${p.categoriaId}-${p.id}`, estat: 'marcador' });
    }
    expect(CARTA.categories.map((c) => c.id)).toEqual(['cafeteria', 'torrades', 'entrepans', 'tapes', 'racions', 'plats-combinats',
      'postres', 'refrescs', 'cerveseria', 'vins-i-caves', 'licoreria']);
    expect(ESTABLIMENT_EXEMPLE).toMatchObject({ nom: 'El meu bar', ivaPerDefecte: 10 });
  });

  test('cada crida dona una còpia nova: editar-la no toca la llavor', () => {
    const una = llavorCarta();
    una.productes[0].nom = 'Canviat';
    expect(llavorCarta().productes[0].nom).toBe('Cafè sol');
  });

  test('les taules van per zona, fila i columna', () => {
    expect(taulesEnOrdre(llavorSala()).map((t) => t.id)).toEqual(['t1', 't2', 't3', 't4', 't5', 't6', 'terrassa-1', 'terrassa-2', 'terrassa-3', 'terrassa-4']);
  });
});

describe('ids i arrodoniments', () => {
  test('nouId: prefix, moment en base 36 i quatre caràcters, ordenable i opac', () => {
    const fix = () => 0.5;
    expect(nouId('c', '2026-10-02T08:15:00.000Z', fix)).toMatch(/^c-[a-z0-9]{8}-iiii$/);
    const abans = nouId('c', '2026-10-02T08:15:00.000Z', fix);
    const despres = nouId('c', '2026-10-02T08:15:01.000Z', fix);
    expect(abans < despres).toBe(true);
    expect(() => nouId('C', '2026-10-02T08:15:00.000Z')).toThrow(TypeError);
    expect(() => nouId('c', 'ahir')).toThrow(TypeError);
    const ids = new Set(Array.from({ length: 200 }, () => nouId('l', '2026-10-02T08:15:00.000Z')));
    expect(ids.size).toBeGreaterThan(190);
  });

  test('mitjaAmunt arrodonix a la meitat lluny de zero, sempre amb enters', () => {
    expect([mitjaAmunt(10000, 110), mitjaAmunt(5, 2), mitjaAmunt(-5, 2), mitjaAmunt(4, 3), mitjaAmunt(0, 7)]).toEqual([91, 3, -3, 1, 0]);
    expect(() => mitjaAmunt(1.5, 2)).toThrow(RangeError);
  });
});
