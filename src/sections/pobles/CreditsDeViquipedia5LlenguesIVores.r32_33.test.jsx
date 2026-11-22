import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { CreditsDeViquipedia } from './CreditsDeViquipedia.jsx';
import { dataLlegible, midaDeFotoCommons } from './creditsDeViquipediaModel.js';
import { textosFontsTerritorials } from './i18nFontsTerritorials.js';

afterEach(cleanup);

describe('Onada R32.33 · Pobles · blindatge P1 dataLlegible / midaDeFotoCommons i <dt> en 5 llengues', () => {
  test('dataLlegible no llanca mai RangeError ni inventa 1970 davant null, NaN, fora de rang o locale invalid', () => {
    for (const invalid of [null, undefined, '', 'invalid', NaN, Infinity, -Infinity, 1e20, -1e20]) {
      expect(() => dataLlegible(invalid, 'ca-ES')).not.toThrow();
      expect(dataLlegible(invalid, 'ca-ES')).toBe('');
    }
    const msValid = Date.UTC(2026, 9, 30, 12, 0, 0);
    expect(() => dataLlegible(msValid, 'locale_invalid_$$$')).not.toThrow();
    expect(dataLlegible(msValid, 'locale_invalid_$$$').length).toBeGreaterThan(0);
  });

  test('midaDeFotoCommons evita divisio per zero i dimensions NaN quan falten mides valides', () => {
    expect(midaDeFotoCommons(null)).toEqual({});
    expect(midaDeFotoCommons({ amplada: 0, alcada: 0 })).toEqual({});
    expect(midaDeFotoCommons({ amplada: NaN, alcada: 400 })).toEqual({});
    expect(midaDeFotoCommons({ amplada: 1920, alcada: 1080 })).toEqual({ width: 960, height: 540 });
  });

  test.each([
    ['ca', 'ca-ES'],
    ['es', 'es-ES'],
    ['en', 'en-GB'],
    ['eu', 'eu-ES'],
    ['gl', 'gl-ES'],
  ])('CreditsDeViquipedia en %s (%s) tradueix les etiquetes de dades i tolera mides/dates extremes', (codi, locale) => {
    const etq = textosFontsTerritorials(codi);
    const entrada = {
      llegitEl: 1e20,
      dto: {
        population: '720 hab',
        population_year: 2025,
        elevation: 788,
        area: 36.5,
        gentilici: 'torruts',
        lat: 38.6,
        lng: -0.41,
        imatges: {
          hero: {
            src: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Exemple.jpg',
            fitxer: 'Exemple.jpg',
            amplada: 0,
            alcada: 0,
            autor: 'Autora',
            llicencia: 'CC BY-SA 4.0',
          },
        },
      },
    };
    const { container } = render(<CreditsDeViquipedia entrada={entrada} ambFotos locale={locale} />);
    const termes = [...container.querySelectorAll('dt')].map((dt) => dt.textContent);
    expect(termes).toEqual([etq.poblacio, etq.altitud, etq.superficie, etq.gentilici, etq.coordenades]);
    const img = container.querySelector('img');
    expect(img.hasAttribute('width')).toBe(false);
    expect(img.hasAttribute('height')).toBe(false);
    expect(container.textContent).not.toContain('NaN');
  });
});
