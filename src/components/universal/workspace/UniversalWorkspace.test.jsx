import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria (inert) la columna esquerra.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const model = {
  status: 'ready',
  presentation: { list: 'notes' },
  navigationGroups: [
    { id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-mercat', label: 'Mercat' }] },
    { id: 'categories', label: 'CATEGORIES', options: [{ id: 'cat_Sistema', label: 'Sistema' }] },
    { id: 'tags', label: 'ETIQUETES', options: [{ id: 'tag_Tutorial', label: 'Tutorial' }] }
  ],
  items: [{
    id: 'n1',
    categoryIds: ['f-mur'],
    title: 'Bloc de notes',
    subtitle: '25/04/26',
    excerpt: "El teu estudi d'escriptura privat",
    image: '/assets/portada.webp',
    updatedAt: '2026-04-25T09:00:00Z'
  }]
};

function renderWorkspace() {
  return render(
    <UniversalWorkspace
      model={model}
      className="sdp-bloc"
      labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
      renderDetail={() => null}
    />
  );
}

test('la capçalera CARPETES plega el grup sense etiqueta i els altres grups són acordions', () => {
  renderWorkspace();
  const nav = screen.getByRole('navigation', { name: 'CARPETES' });

  const carpetes = screen.getByRole('button', { name: 'CARPETES' });
  expect(carpetes.getAttribute('aria-expanded')).toBe('true');
  expect(within(nav).getByRole('menuitem', { name: 'Mur' })).toBeTruthy();

  fireEvent.click(carpetes);
  expect(carpetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('menuitem', { name: 'Mur' })).toBeNull();
  // Els altres grups no es veuen afectats
  expect(within(nav).getByRole('menuitem', { name: 'Sistema' })).toBeTruthy();

  const etiquetes = screen.getByRole('button', { name: 'ETIQUETES' });
  expect(etiquetes.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(etiquetes);
  expect(etiquetes.getAttribute('aria-expanded')).toBe('false');
  expect(within(nav).queryByRole('menuitem', { name: 'Tutorial' })).toBeNull();
  expect(within(nav).getByRole('menuitem', { name: 'Sistema' })).toBeTruthy();
});

test('la targeta de nota mostra miniatura, títol, data i entradeta', () => {
  const { container } = renderWorkspace();
  const card = container.querySelector('.sdp-bloc-list--notes .sdp-nota-fitxa');
  expect(card).toBeTruthy();
  expect(card.querySelector('img.sdp-gestor-fitxa__imatge')?.getAttribute('src')).toBe('/assets/portada.webp');
  expect(card.querySelector('.sdp-nota-fitxa__titol')?.textContent).toBe('Bloc de notes');
  expect(card.querySelector('time.sdp-nota-fitxa__data')?.textContent).toBe('25/04/26');
  expect(card.querySelector('.sdp-nota-fitxa__entradeta')?.textContent).toBe("El teu estudi d'escriptura privat");
  expect(container.querySelector('.app-grid-page')?.classList.contains('sdp-bloc')).toBe(true);
});
