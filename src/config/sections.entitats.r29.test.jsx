/**
 * Onada R29 · R29-RUT-07 · /entitats/:id (l'àlies que emeten les connexions
 * d'una entitat; App.jsx el pinta amb la mateixa fitxa que /empresa/:id) encén
 * Pobles a les dues barres, com /empresa/:id: dins d'una jerarquia la barra
 * no queda sense element actiu (contracte T27). Les dues barres d'App.jsx
 * passen `matchPaths={section.subrutes}` a NavLink; esta prova fa el mateix
 * amb la dada real de sections.js.
 */
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrowserRouter, NavLink } from '../app/contexts/RouterContext.jsx';
import { SECTIONS } from './sections.js';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

const pobles = SECTIONS.find((section) => section.id === 'pobles');

function entrada(url) {
  window.history.replaceState(null, '', url);
  render(
    <BrowserRouter>
      <NavLink to={pobles.path} matchPaths={pobles.subrutes} className="nav-item">Pobles</NavLink>
    </BrowserRouter>
  );
  const enllac = screen.getByRole('link', { name: 'Pobles' });
  return { ariaCurrent: enllac.getAttribute('aria-current'), active: enllac.classList.contains('active') };
}

test.each([
  ['/entitats/org-1', 'l’àlies d’una entitat'],
  ['/empresa/org-1', 'la mateixa fitxa per la ruta de sempre'],
])('%s encén Pobles (%s)', (url) => {
  expect(entrada(url)).toEqual({ ariaCurrent: 'page', active: true });
});

test('un veí de nom de /entitats no l’encén', () => {
  expect(entrada('/entitatsx/org-1')).toEqual({ ariaCurrent: null, active: false });
});

test('cap altra secció no declara /entitats', () => {
  const altres = SECTIONS.filter((section) => section.id !== 'pobles')
    .flatMap((section) => [section.path, ...(section.subrutes || [])]);
  expect(altres).not.toContain('/entitats');
});
