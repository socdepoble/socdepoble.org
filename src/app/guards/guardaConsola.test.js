import { expect, test } from 'vitest';
import { consolaDemanaSessio } from './guardaConsola.js';

/* A vitest DEV sempre és true: la branca de producció només es prova passant
   el valor. App.jsx li passa import.meta.env.DEV, que Vite substituïx per un
   literal en construir (false tant a `vite build` com al build del plugin). */

test('a `vite serve` (DEV) la Consola s’obri sense sessió', () => {
  expect(consolaDemanaSessio(true)).toBe(false);
});

test('en qualsevol build (DEV false) conserva la barrera de superadmin', () => {
  expect(consolaDemanaSessio(false)).toBe(true);
});

test('sense un true literal, tanca', () => {
  expect(consolaDemanaSessio()).toBe(true);
  for (const valor of [undefined, null, 'true', 1, '', {}]) {
    expect(consolaDemanaSessio(valor)).toBe(true);
  }
});
