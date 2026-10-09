import { cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { fixaBaseRecursos } from '../config/assetResolver';
import { DEFAULT_AUTHOR } from './universal/UniversalUtils.js';
import fontBrandMark from './BrandMark.jsx?raw';
import BrandMark from './BrandMark.jsx';

afterEach(() => { cleanup(); fixaBaseRecursos('/'); });

/* Onada 8 (261009) · Els logotips de la barra són els PNG de public/ (985x256).
   El blanc, per a la barra negra (variant light, la de sempre); el negre, per a
   un fons clar (variant dark). Abans eren imports d'SVG, i el negre arribava
   amb import() darrere d'una reserva transparent (Onada 7): un camí no pesa al
   tros d'entrada i es pinta en el primer render. */
const BLANC = '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png';
const NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png';
const PAQUET = 'https://wp.example/wp-content/plugins/soc-de-poble/dist';

const marca = (vista) => within(vista.container).getByRole('img', { name: 'Sóc de Poble' });
/* Tots els atributs de l'<img>, en l'ordre del DOM: el render d'abans, atribut per atribut. */
const atributs = (img) => [...img.attributes].map(({ name, value }) => [name, value]);
const ESPERATS = (src) => [
  ['class', 'mobileBrandMark'], ['src', src], ['alt', 'Sóc de Poble'], ['width', '300'], ['height', '78'], ['fetchpriority', 'high']
];

test('la marca light és el PNG blanc, atribut per atribut com abans, també sense variant', () => {
  for (const props of [{ variant: 'light' }, {}]) {
    const img = marca(render(<BrandMark {...props} className="mobileBrandMark" />));
    expect(atributs(img)).toEqual(ESPERATS(BLANC));
    cleanup();
  }
});

test('la marca dark és el PNG negre des del primer render, i la variant pot anar i tornar', () => {
  const vista = render(<BrandMark variant="dark" className="mobileBrandMark" />);
  expect(atributs(marca(vista))).toEqual(ESPERATS(NEGRE));
  vista.rerender(<BrandMark variant="light" className="mobileBrandMark" />);
  expect(atributs(marca(vista))).toEqual(ESPERATS(BLANC));
  vista.rerender(<BrandMark variant="dark" className="mobileBrandMark" />);
  expect(atributs(marca(vista))).toEqual(ESPERATS(NEGRE));
});

test('amb la base de l’amfitrió (el paquet de WordPress), els dos logotips penjen del paquet', () => {
  fixaBaseRecursos(PAQUET);
  expect(marca(render(<BrandMark className="mobileBrandMark" />)).getAttribute('src')).toBe(`${PAQUET}${BLANC}`);
  cleanup();
  expect(marca(render(<BrandMark variant="dark" className="mobileBrandMark" />)).getAttribute('src')).toBe(`${PAQUET}${NEGRE}`);
});

test('són els mateixos fitxers que el logotip de pàgina: el blanc és el fosc, i el negre, el clar', () => {
  expect(DEFAULT_AUTHOR.logo.fosc).toBe(BLANC);
  expect(DEFAULT_AUTHOR.logo.clar).toBe(NEGRE);
});

/* El que fa baixar el tros d'entrada: cap logotip importat (ni estàtic ni amb
   import()). Al paquet de WordPress Vite inlinaria el fitxer dins del tros. */
test('el font: cap import de cap imatge, cap import() i cap estil en línia', () => {
  expect(fontBrandMark).not.toMatch(/^\s*import\s[^\n]*\.(?:svg|png)['"]/m);
  expect(fontBrandMark).not.toMatch(/\bimport\(\s*['"`]/);
  expect(/\sstyle=[{"]/.test(fontBrandMark)).toBe(false);
});
