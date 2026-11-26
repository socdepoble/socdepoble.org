/**
 * C26-2 #1 i #3 (Gauntlet c13, v1.2.26) · La font única del destí d'un producte. IDEA-365 (21:40,
 * regla 1): un producte del /mercat que també ix al /mur porta Mur + Mercat. Dades sintètiques.
 */
import { describe, expect, test } from 'vitest';
import { classificaProducte, destinsDeProducte, destinsPerDefecteDeProducte } from './destinsDeProducte.js';
import { categoriesSistemaPerPublicar } from '../../utils/publicacioSistema.js';

describe('destinsDeProducte · font única de publicar i llegir', () => {
  test('sense camp, Mur + Mercat; qui no vol eixir al Mur, només Mercat', () => {
    expect(destinsPerDefecteDeProducte({})).toEqual(['Mur', 'Mercat']);
    expect(destinsPerDefecteDeProducte(null)).toEqual(['Mur', 'Mercat']);
    expect(destinsPerDefecteDeProducte({ mostrarAlMur: false })).toEqual(['Mercat']);
    expect(destinsPerDefecteDeProducte({ ocultarDelMur: true })).toEqual(['Mercat']);
    expect(destinsDeProducte({ categoriesSistema: [] })).toEqual(['Mur', 'Mercat']);
    expect(destinsDeProducte({ categoriesSistema: ['Mercat', 7, null] })).toEqual(['Mercat']);
  });

  test('publicar a mercat i llegir el llegat donen el mateix destí, per a cada interruptor del Mur', () => {
    for (const font of [{}, { mostrarAlMur: true }, { mostrarAlMur: false }, { ocultarDelMur: true }, { ocultarDelMur: false }]) {
      expect(categoriesSistemaPerPublicar(font, 'mercat').categoriesSistema).toEqual(destinsDeProducte(font));
    }
  });

  test('classificaProducte només completa categoriesSistema: no fabrica labels ni muta la font', () => {
    const font = Object.freeze({ id: 'p', type: 'product', tag: 'oli-verge', labels: Object.freeze([{ text: 'Antiga', className: 'sdp-badge-tag' }]) });
    const resultat = classificaProducte(font);
    expect(resultat.categoriesSistema).toEqual(['Mur', 'Mercat']);
    expect(resultat.labels).toBe(font.labels);
    expect(Object.hasOwn(classificaProducte({ id: 'q' }), 'labels')).toBe(false);
    expect(Object.hasOwn(font, 'categoriesSistema')).toBe(false);
  });
});
