/* Icones d'al·lèrgens (ordre del Mestre, 261006) · un id de la llista
   canònica sense SVG (el registre no en té la URI): la peça hi pinta
   l'abreviatura en una pastilla, mai una imatge trencada ni un forat. El
   registre de veres, menys la icona del gluten. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { IconesAlergens } from './IconesAlergens.jsx';

vi.mock('../recursos/alergens.js', async (importOriginal) => {
  const original = await importOriginal();
  const senseGluten = Object.fromEntries(Object.entries(original.ICONES_ALERGENS).filter(([id]) => id !== 'gluten'));
  return { ...original, ICONES_ALERGENS: Object.freeze(senseGluten) };
});

afterEach(cleanup);

test('sense URI per a un id: l’abreviatura al seu lloc, i el nom no canvia', () => {
  render(<IconesAlergens alergens={['llet', 'gluten']} />);
  const peca = screen.getByRole('img', { name: 'Al·lèrgens: gluten, llet' });
  const [gluten, llet] = peca.children;
  expect(gluten.tagName).toBe('SPAN');
  expect(gluten.className).toBe('sdp-alergens__abreviatura');
  expect(gluten.textContent).toBe('GL');
  expect(gluten.dataset.alergen).toBe('gluten');
  expect(llet.tagName).toBe('IMG');
  expect(peca.querySelectorAll('img')).toHaveLength(1);
});
