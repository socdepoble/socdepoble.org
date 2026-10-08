import { expect, test } from 'vitest';
import { consolaDemanaSessio } from './guardaConsola.js';

/* A vitest DEV és true per defecte. La funció rep el valor perquè les dues
   branques es proven passant-lo, sense doblar l'entorn. Neteja 261007 (prompt
   261007_1628, peça D) · No «sempre»: vi.stubEnv('DEV', false) el canvia, i
   ConsolaSection.produccio.test.jsx ho fa per a provar la Consola fora de DEV.
   App.jsx li passa import.meta.env.DEV, que Vite substituïx per un literal en
   construir (false tant a `vite build` com al build del plugin). */

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
